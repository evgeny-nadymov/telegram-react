/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventEmitter from './EventEmitter';
import LocalConferenceDescription from '../Calls/LocalConferenceDescription';
import P2PEncryptor from '../Calls/P2P/P2PEncryptor';
import StreamManager from '../Calls/StreamManager';
import { canManageVoiceChats, getChatTitle } from '../Utils/Chat';
import { closeCallPanel, closeGroupCallPanel, openCallPanel } from '../Actions/Call';
import { getUserFullName } from '../Utils/User';
import { fromTelegramSource, getStream, getTransport, parseSdp, toTelegramSource } from '../Calls/Utils';
import { showAlert, showLeaveVoiceChatAlert } from '../Actions/Client';
import { throttle } from '../Utils/Common';
import { p2pParseCandidate, p2pParseSdp, P2PSdpBuilder } from '../Calls/P2P/P2PSdpBuilder';
import { GROUP_CALL_AMPLITUDE_ANALYSE_INTERVAL_MS, GROUP_CALL_PARTICIPANTS_LOAD_LIMIT } from '../Constants';
import AppStore from './ApplicationStore';
import LStore from './LocalizationStore';
import UserStore from './UserStore';
import TdLibController from '../Controllers/TdLibController';

const JOIN_TRACKS = true;
export const TG_CALLS_SDP_STRING = true;

export function LOG_CALL(str, ...data) {
    // return;
    console.log('[call]' + str, ...data);
}

export function ERROR_CALL(str, ...data) {
    console.error('[call]' + str, ...data);
}

export function LOG_P2P_CALL(str, ...data) {
    // return;
    console.log('[call][p2p]' + str, ...data);
}

export function ERROR_P2P_CALL(str, ...data) {
    console.error('[call][p2p]' + str, ...data);
}

class CallStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();

        this.updateGroupCallParticipants = throttle(this.updateGroupCallParticipants, 1000);
    }

    reset = () => {
        this.currentGroupCall = null;
        this.groupItems = new Map();
        this.items = new Map();

        this.mediaState = new Map();
        this.participants = new Map();
        this.groupCallPanelOpened = false;
        this.callPanelOpened = false;
        this.animated = true;
    };

    onUpdate = async update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                const { authorization_state } = update;
                if (!authorization_state) break;

                switch (authorization_state['@type']) {
                    case 'authorizationStateLoggingOut': {
                        const { currentGroupCall } = this;
                        if (currentGroupCall) {
                            const { groupCallId } = currentGroupCall;
                            if (groupCallId) {
                                const groupCall = this.get(groupCallId);
                                if (groupCall && groupCall.is_joined) {
                                    await this.hangUp(groupCallId, false, false);
                                }
                            }
                        }

                        this.reset();
                        break;
                    }
                }

                this.emit('updateAuthorizationState', update);
                break;
            }
            case 'updateCall': {
                LOG_P2P_CALL('[update] updateCall', update);
                const { call } = update;

                const { id, state, is_video } = call;
                const prevCall = this.p2pGet(id)
                this.p2pSet(call);

                if (this.p2pCallsEnabled) {
                    if (call) {
                        if (!prevCall) {
                            this.p2pSetMediaState(id, 'input', {
                                '@type': 'MediaState',
                                muted: false,
                                videoState: is_video ? 'active' : 'inactive',
                                lowBattery: false
                            });
                        }

                        switch (state['@type']) {
                            case 'callStateDiscarded': {
                                closeCallPanel();
                                this.p2pHangUp(id);
                                break;
                            }
                            case 'callStateError': {
                                const { error } = state;
                                if (error) {
                                    const { code, message } = error;
                                    if (code === 403 && message === 'USER_PRIVACY_RESTRICTED') {
                                        const { user_id } = call;
                                        showAlert({
                                            title: LStore.getString('VoipFailed'),
                                            message: LStore.replaceTags(LStore.formatString('CallNotAvailable', getUserFullName(user_id, null))),
                                            ok: LStore.getString('OK')
                                        });
                                    }
                                }

                                closeCallPanel();
                                this.p2pHangUp(id);
                                break;
                            }
                            case 'callStateExchangingKeys': {
                                break;
                            }
                            case 'callStateHangingUp': {
                                closeCallPanel();
                                break;
                            }
                            case 'callStatePending': {
                                openCallPanel(id);
                                break;
                            }
                            case 'callStateReady': {
                                if (prevCall && prevCall.state['@type'] !== 'callStateReady') {
                                    this.p2pJoinCall(id);
                                }

                                break;
                            }
                        }
                    }
                }

                this.emit('updateCall', update);
                break;
            }
            case 'updateChatVoiceChat': {
                LOG_CALL('[update] updateChatVoiceChat', update);
                const { chat_id, voice_chat_group_call_id } = update;
                if (AppStore.getChatId() === chat_id && voice_chat_group_call_id) {
                    const groupCall = this.get(voice_chat_group_call_id);
                    if (!groupCall) {
                        TdLibController.send({
                            '@type': 'getGroupCall',
                            group_call_id: voice_chat_group_call_id
                        });
                    }
                }

                this.emit('updateChatVoiceChat', update);
                break;
            }
            case 'updateGroupCall': {
                const { group_call } = update;
                LOG_CALL('[update] updateGroupCall', group_call);
                const prevGroupCall = this.get(group_call.id);

                this.set(group_call);

                const { need_rejoin, is_joined } = group_call;
                const { currentGroupCall } = this;
                if (currentGroupCall && currentGroupCall.groupCallId === group_call.id) {
                    if (need_rejoin) {
                        this.rejoinGroupCall();
                    } else if (prevGroupCall && prevGroupCall.is_joined && !is_joined) {
                        this.hangUp(currentGroupCall.groupCallId);
                    }
                }

                this.emit('updateGroupCall', update);
                break;
            }
            case 'updateGroupCallParticipant': {
                const { group_call_id, participant } = update;

                let participants = this.participants.get(group_call_id);
                if (!participants) {
                    participants = new Map();
                    this.participants.set(group_call_id, participants);
                }

                const { user_id, is_muted_for_all_users, is_muted_for_current_user, order } = participant;
                const isMuted = is_muted_for_all_users || is_muted_for_current_user;
                const prevParticipant = participants.get(user_id);

                participants.set(user_id, participant);

                // mute stream on updateGroupCallParticipant, unmute can be done only on UI user action
                if (user_id === UserStore.getMyId() && isMuted) {
                    const { currentGroupCall } = this;
                    if (currentGroupCall) {
                        const { groupCallId, streamManager } = currentGroupCall;
                        if (group_call_id === groupCallId) {
                            const audioTracks = streamManager.inputStream.getAudioTracks();
                            if (audioTracks.length > 0) {
                                audioTracks[0].enabled = false;
                            }
                        }
                    }
                }

                LOG_CALL('[update] updateGroupCallParticipant', !prevParticipant || prevParticipant.order === '0' && participant.order !== '0' || prevParticipant.order !== '0' && participant.order === '0', prevParticipant, participant);
                // no information before || join group call || leave group call
                if (!prevParticipant || prevParticipant.order === '0' && participant.order !== '0' || prevParticipant.order !== '0' && participant.order === '0') {
                    this.updateGroupCallParticipants(group_call_id);
                }

                this.emit('updateGroupCallParticipant', update);
                break;
            }
            case 'updateNewCallSignalingData': {
                const { call_id, data } = update;

                try {
                    const { currentCall } = this;
                    if (currentCall) {
                        const { encryptor, decryptor } = currentCall;
                        if (encryptor) {
                            const decryptedData = encryptor.decryptFromBase64(data);

                            const base64 = decryptor.encryptToBase64(data);
                            LOG_P2P_CALL('[update][base64] updateNewCallSignalingData', update, { key: encryptor.keyBase64, data, base64, decryptedData });

                            const signalingData = JSON.parse(decryptedData);

                            // LOG_P2P_CALL('[update] updateNewCallSignalingData', update, signalingData);
                            // const signalingData = JSON.parse(atob(data));
                            if (this.p2pCallsEnabled) {
                                this.p2pApplyCallSignalingData(call_id, signalingData);
                            }
                        }
                    }
                } catch (e) {
                    ERROR_P2P_CALL('[update] updateNewSignalingData parse', update, e);
                }

                this.emit('updateNewCallSignalingData', update);
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateGroupCall': {
                this.currentGroupCall = update.call;

                if (this.groupCallPanelOpened && !this.currentGroupCall) {
                    closeGroupCallPanel();
                }

                this.emit('clientUpdateGroupCall', update);
                break;
            }
            case 'clientUpdateGroupCallAmplitude': {
                const { amplitudes } = update;

                const { currentGroupCall } = this;
                if (currentGroupCall) {
                    const { isSpeakingMap, groupCallId, meSignSource } = currentGroupCall;

                    for (let i = 0; i < amplitudes.length; i++) {
                        const { type, source, value } = amplitudes[i];

                        let telegramSource = null;
                        switch (type) {
                            case 'input': {
                                telegramSource = toTelegramSource(source);
                                break;
                            }
                            case 'output': {
                                telegramSource = meSignSource;
                                break;
                            }
                        }

                        let params = isSpeakingMap.get(source);
                        if (!params) {
                            params = { isSpeaking: false, speakingTimer: null, cancelSpeakingTimer: null };
                            isSpeakingMap.set(source, params);
                        }

                        const isSpeaking = value > 0.2;
                        if (isSpeaking !== params.isSpeaking) {
                            params.isSpeaking = isSpeaking;
                            if (isSpeaking) {
                                clearTimeout(params.cancelSpeakingTimer);
                                params.speakingTimer = setTimeout(() => {
                                    if (params.isSpeaking) {
                                        TdLibController.send({
                                            '@type': 'setGroupCallParticipantIsSpeaking',
                                            source: toTelegramSource(source),
                                            group_call_id : groupCallId,
                                            is_speaking : true
                                        });
                                    }
                                }, 150);
                            } else {
                                clearTimeout(params.cancelSpeakingTimer);
                                params.cancelSpeakingTimer = setTimeout(() => {
                                    if (!params.isSpeaking) {
                                        TdLibController.send({
                                            '@type': 'setGroupCallParticipantIsSpeaking',
                                            source: toTelegramSource(source),
                                            group_call_id: groupCallId,
                                            is_speaking: false
                                        });
                                    }
                                }, 1000);
                            }
                        }
                    }
                }

                this.emit('clientUpdateGroupCallAmplitude', update);
                break;
            }
            case 'clientUpdateGroupCallConnectionState': {
                this.emit('clientUpdateGroupCallConnectionState', update);
                break;
            }
            case 'clientUpdateGroupCallPanel': {
                this.groupCallPanelOpened = update.opened;
                this.emit('clientUpdateGroupCallPanel', update);
                break;
            }
            case 'clientUpdateCallPanel': {
                this.callPanelOpened = update.opened;
                this.emit('clientUpdateCallPanel', update);
                break;
            }
            case 'clientUpdateCallMediaState': {
                this.emit('clientUpdateCallMediaState', update);
                break;
            }
            case 'clientUpdateCallMediaActive': {
                this.emit('clientUpdateCallMediaActive', update);
                break;
            }
            default:
                break;
        }
    };

    addTdLibListener = () => {
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    assign(source1, source2) {
        this.set(Object.assign({}, source1, source2));
    }

    get(callId) {
        return this.groupItems.get(callId);
    }

    set(call) {
        this.groupItems.set(call.id, call);
    }

    playSound(sound) {
        try {
            this.audio = this.audio || new Audio();
            const { audio } = this;

            audio.src = sound;
            audio.play();
        } catch (e) {
            ERROR_CALL('playSound', sound, e);
        }
    }

    startConnectingSound(connection) {
        this.stopConnectingSound(null);

        setTimeout(() => {
            const { currentGroupCall } = this;
            if (currentGroupCall && currentGroupCall.connection === connection && (connection.iceConnectionState === 'checking' || connection.iceConnectionState === 'new')) {
                const audio = new Audio('sounds/group_call_connect.mp3');
                audio.loop = true;
                audio.connection = connection;

                this.connectionAudio = audio;

                audio.play();
            }
        }, 2500);
    }

    stopConnectingSound(connection) {
        const { connectionAudio } = this;
        if (!connectionAudio) return;
        if (connection && connectionAudio.connection !== connection) return;

        this.connectionAudio = null;
        connectionAudio.pause();
    }

    async updateGroupCallParticipants(groupCallId) {
        LOG_CALL(`updateGroupCallParticipants id=${groupCallId}`);
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;
        if (currentGroupCall.groupCallId !== groupCallId) return;

        const { transport, meSignSource, connection, description, handleUpdateGroupCallParticipants } = currentGroupCall;
        if (!handleUpdateGroupCallParticipants) return;
        if (!transport) return;
        if (!meSignSource) return;
        if (!description) return;

        if (currentGroupCall.updatingSdp) {
            LOG_CALL(`updateGroupCallParticipants id=${groupCallId} cancel`, currentGroupCall.updatingSdp);
            return
        }

        const ts = new Date().getMilliseconds();

        try {
            LOG_CALL(`updateGroupCallParticipants id=${groupCallId} updateSdp start`, ts);
            currentGroupCall.updatingSdp = true;

            let participants = Array.from(this.participants.get(groupCallId).values()).filter(x => x.order !== '0');
            if (!participants.some(x => x.user_id === UserStore.getMyId())) {
                participants = [{ '@type': 'groupCallParticipantMe', source: currentGroupCall.meSignSource, user_id: UserStore.getMyId() }, ...participants];
            }
            const ssrcs = participants.map(x => ({
                ssrc: fromTelegramSource(x.source),
                isMain: x.source === currentGroupCall.meSignSource,
                name: getUserFullName(x.user_id),
                userId: x.user_id
            }));
            LOG_CALL(`updateGroupCallParticipants id=${groupCallId} ssrcs`, participants, ssrcs);
            const data = {
                transport,
                ssrcs
            };

            description.updateFromServer(data);
            const sdp = description.generateSdp();

            LOG_CALL(`[conn][updateGroupCallParticipants][sdp] setRemoteDescription participantsCount=${participants.length} signaling=${connection.signalingState} ice=${connection.iceConnectionState} gathering=${connection.iceGatheringState} connection=${connection.connectionState}`, sdp);
            await connection.setRemoteDescription({
                type: 'offer',
                sdp,
            });

            LOG_CALL(`[conn][updateGroupCallParticipants] createAnswer id=${groupCallId}`, ts);
            const answer = await connection.createAnswer();
            LOG_CALL(`[conn][updateGroupCallParticipants][sdp] createAnswer setLocalDescription id=${groupCallId}`, ts, answer.sdp);
            await connection.setLocalDescription(answer);
        } finally {
            LOG_CALL(`updateGroupCallParticipants id=${groupCallId} updateSdp finish`, ts);
            currentGroupCall.updatingSdp = false;
        }
    }

    async startGroupCall(chatId) {
        let { currentCall, currentGroupCall } = this;
        LOG_CALL('startGroupCall', currentCall, currentGroupCall);
        if (currentCall) {
            const { callId } = currentCall;
            const call = this.p2pGet(callId);
            if (call) {
                showAlert({
                    title: LStore.getString('VoipOngoingAlertTitle'),
                    message: LStore.replaceTags(LStore.formatString('VoipOngoingAlert2', getUserFullName(call.user_id, null), getChatTitle(chatId))),
                    ok: LStore.getString('OK'),
                    cancel: LStore.getString('Cancel'),
                    onResult: async result => {
                        if (result) {
                            currentCall = this.currentCall;
                            if (currentCall) {
                                await this.p2pHangUp(currentCall.callId, true);
                            }
                            await this.startGroupCallInternal(chatId);
                        }
                    }
                });
            }

            return;
        } else if (currentGroupCall) {
            const { chatId: oldChatId } = currentGroupCall;

            showAlert({
                title: LStore.getString('VoipOngoingChatAlertTitle'),
                message: LStore.replaceTags(LStore.formatString('VoipOngoingChatAlert', getChatTitle(oldChatId), getChatTitle(chatId))),
                ok: LStore.getString('OK'),
                cancel: LStore.getString('Cancel'),
                onResult: async result => {
                    if (result) {
                        currentGroupCall = this.currentGroupCall;
                        if (currentGroupCall) {
                            await this.hangUp(currentGroupCall.groupCallId);
                        }
                        await this.startGroupCallInternal(chatId);
                    }
                }
            });

            return;
        }

        await this.startGroupCallInternal(chatId);
    }

    async startGroupCallInternal(chatId) {
        LOG_CALL('[tdweb] createVoiceChat', chatId);
        const groupCallId = await TdLibController.send({
            '@type': 'createVoiceChat',
            chat_id: chatId
        });
        LOG_CALL('[tdweb] createVoiceChat result', groupCallId);
    }

    async joinGroupCall(chatId, groupCallId, muted = true, rejoin = false) {
        if (!this.audio) {
            this.audio = new Audio()
            this.audio.play();
        }

        LOG_CALL(`joinGroupCall chatId=${chatId} id=${groupCallId} muted=${muted} rejoin=${rejoin}`);
        const groupCall = this.get(groupCallId);
        if (!groupCall) {
            LOG_CALL('[tdweb] getGroupCall id=' + groupCallId);
            TdLibController.send({ '@type': 'getGroupCall', group_call_id: groupCallId });
        }

        let { currentGroupCall, currentCall } = this;
        let streamManager = null;
        try {
            if (rejoin) {
                streamManager = currentGroupCall.streamManager;
            } else {
                const constraints = {
                    audio: true,
                    video: false
                };
                const stream = await getStream(constraints, muted);

                streamManager = new StreamManager(GROUP_CALL_AMPLITUDE_ANALYSE_INTERVAL_MS);
                streamManager.addTrack(stream, 'input');
            }
        } catch (e) {
            ERROR_CALL('joinGroupCall getStream error', e);
            showAlert({
                title: LStore.getString('AppName'),
                message: LStore.getString('VoipNeedMicPermission'),
                ok: LStore.getString('OK')
            });
        }
        if (!streamManager || !streamManager.inputStream) return;

        LOG_CALL('joinGroupCall has another', groupCallId, currentCall, currentGroupCall);
        if (!rejoin) {
            if (currentCall) {
                const { callId } = currentCall;
                const call = this.p2pGet(callId);
                if (call) {
                    const { user_id } = call;

                    showAlert({
                        title: LStore.getString('VoipOngoingAlertTitle'),
                        message: LStore.replaceTags(LStore.formatString('VoipOngoingAlert2', getUserFullName(user_id, null), getChatTitle(chatId))),
                        ok: LStore.getString('OK'),
                        cancel: LStore.getString('Cancel'),
                        onResult: async result => {
                            if (result) {
                                currentCall = this.currentCall;
                                if (currentCall) {
                                    this.p2pHangUp(currentCall.callId, true);
                                }
                                this.joinGroupCallInternal(chatId, groupCallId, streamManager, muted, rejoin);
                            }
                        }
                    });

                    return;
                }
            } else if (currentGroupCall) {
                const { chatId: oldChatId } = currentGroupCall;

                showAlert({
                    title: LStore.getString('VoipOngoingChatAlertTitle'),
                    message: LStore.replaceTags(LStore.formatString('VoipOngoingChatAlert', getChatTitle(oldChatId), getChatTitle(chatId))),
                    ok: LStore.getString('OK'),
                    cancel: LStore.getString('Cancel'),
                    onResult: async result => {
                        if (result) {
                            currentGroupCall = this.currentGroupCall;
                            if (currentGroupCall) {
                                this.hangUp(currentGroupCall.groupCallId);
                            }
                            this.joinGroupCallInternal(chatId, groupCallId, streamManager, muted, rejoin);
                        }
                    }
                });

                return;
            }
        }

        await this.joinGroupCallInternal(chatId, groupCallId, streamManager, muted, rejoin);
    }

    setCurrentGroupCall(call) {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateGroupCall',
            call
        });
    }

    async rejoinGroupCall() {
        const { currentGroupCall } = this;
        LOG_CALL('rejoinGroupCall', currentGroupCall);
        if (!currentGroupCall) return;

        const { chatId, groupCallId } = currentGroupCall;

        this.hangUp(groupCallId, false, true);
        this.joinGroupCall(chatId, groupCallId, this.isMuted(), true);
    }

    async joinGroupCallInternal(chatId, groupCallId, streamManager, muted, rejoin = false) {
        LOG_CALL('joinGroupCallInternal start', groupCallId);
        LOG_CALL('[conn] ctor');

        const connection = new RTCPeerConnection(null);
        connection.ontrack = event => {
            LOG_CALL('[conn] ontrack', event);
            this.onTrack(event);
        };
        connection.onsignalingstatechange = event => {
            LOG_CALL('[conn] onsignalingstatechange', connection.signalingState);
        };
        connection.onconnectionstatechange = event => {
            LOG_CALL('[conn] onconnectionstatechange', connection.connectionState);
        };
        connection.onnegotiationneeded = event => {
            LOG_CALL('[conn] onnegotiationneeded', connection.signalingState);
            this.startNegotiation(muted, rejoin);
        };
        connection.onicecandidate = event => {
            LOG_CALL('[conn] onicecandidate', event);
        };
        connection.oniceconnectionstatechange = event => {
            LOG_CALL(`[conn] oniceconnectionstatechange = ${connection.iceConnectionState}`);

            TdLibController.clientUpdate({
                '@type': 'clientUpdateGroupCallConnectionState',
                state: connection.iceConnectionState,
                groupCallId
            });

            if (connection.iceConnectionState !== 'checking') {
                this.stopConnectingSound(connection);
            }

            switch (connection.iceConnectionState) {
                case 'checking': {
                    break;
                }
                case 'closed': {
                    this.hangUp(groupCallId);
                    break;
                }
                case 'completed': {
                    break;
                }
                case 'connected': {
                    const { currentGroupCall } = this;
                    if (currentGroupCall && currentGroupCall.connection === connection && !currentGroupCall.joined) {
                        currentGroupCall.joined = true;
                        this.playSound('sounds/group_call_start.mp3');
                    }
                    break;
                }
                case 'disconnected': {
                    break;
                }
                case 'failed': {
                    //TODO: replace with ICE restart
                    this.hangUp(groupCallId);
                    // connection.restartIce();
                    break;
                }
                case 'new': {
                    break;
                }
            }
        };
        connection.ondatachannel = event => {
            LOG_CALL(`[conn] ondatachannel`);
        };

        if (streamManager.inputStream) {
            streamManager.inputStream.getTracks().forEach(track => {
                LOG_CALL('[conn] addTrack', track);
                connection.addTrack(track, streamManager.inputStream);
            });
        }

        let { currentGroupCall } = this;
        if (currentGroupCall && rejoin) {
            currentGroupCall.connection = connection;
            currentGroupCall.handleUpdateGroupCallParticipants = false;
            currentGroupCall.updatingSdp = false;
            LOG_CALL('joinGroupCallInternal update currentGroupCall', groupCallId, currentGroupCall);
        } else {
            currentGroupCall = {
                chatId,
                groupCallId,
                connection,
                handleUpdateGroupCallParticipants: false,
                updatingSdp: false,
                streamManager,
                isSpeakingMap: new Map()
            }
            this.setCurrentGroupCall(currentGroupCall);
            LOG_CALL('joinGroupCallInternal set currentGroupCall', groupCallId, currentGroupCall);
        }
    }

    startNegotiation = async (isMuted, rejoin) => {
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;

        const { connection, groupCallId, streamManager } = currentGroupCall;
        if (!connection) return;

        const offerOptions = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 0,
        };
        let offer = await connection.createOffer(offerOptions);
        LOG_CALL('[conn][joinGroupCallInternal][sdp] setLocalDescription', offer.sdp);
        await connection.setLocalDescription(offer);
        let clientInfo = parseSdp(offer.sdp);
        let { ufrag, pwd, hash, setup, fingerprint, source } = clientInfo;
        LOG_CALL('[conn][joinGroupCallInternal] clientInfo', clientInfo);


        // offer = await connection.createOffer(offerOptions);
        // LOG_CALL('[conn][joinGroupCallInternal][sdp] setLocalDescription', offer.sdp);
        // await connection.setLocalDescription(offer);
        // clientInfo = parseSdp(offer.sdp);
        // LOG_CALL('[conn][joinGroupCallInternal] clientInfo', clientInfo);

        currentGroupCall.meSignSource = toTelegramSource(source);

        if (!rejoin) {
            this.startConnectingSound(connection);
        }

        // this.participants.set(currentGroupCall.groupCallId, new Map());
        const request = {
            '@type': 'joinGroupCall',
            group_call_id: groupCallId,
            payload: {
                '@type': 'groupCallPayload',
                ufrag,
                pwd,
                fingerprints: [{ '@type': 'groupCallPayloadFingerprint', hash, setup: 'active', fingerprint }]
            },
            source: currentGroupCall.meSignSource,
            is_muted: isMuted
        };

        let result = null;
        try {
            LOG_CALL(`[tdweb] joinGroupCall id=${groupCallId}`, request);
            result = await TdLibController.send(request);
            LOG_CALL('[tdweb] joinGroupCall result', result);
        } catch (e) {
            ERROR_CALL('[tdweb] joinGroupCall error', e);
        }

        if (!result) {
            LOG_CALL('joinGroupCallInternal abort 0');
            this.closeConnectionAndStream(connection, streamManager);
            return;
        }

        const transport = getTransport(result);
        this.currentGroupCall.transport = transport;

        if (connection.iceConnectionState !== 'new') {
            LOG_CALL(`joinGroupCallInternal abort 1 connectionState=${connection.iceConnectionState}`);
            this.closeConnectionAndStream(connection, streamManager);
            return;
        }
        if (this.currentGroupCall !== currentGroupCall) {
            LOG_CALL('joinGroupCallInternal abort 2', this.currentGroupCall, currentGroupCall);
            this.closeConnectionAndStream(connection, streamManager);
            return;
        }
        if (currentGroupCall.connection !== connection) {
            LOG_CALL('joinGroupCallInternal abort 3');
            this.closeConnectionAndStream(connection, streamManager);
            return;
        }

        const description = new LocalConferenceDescription();
        description.onSsrcs = () => { };

        currentGroupCall.description = description

        LOG_CALL(`[tdweb] loadGroupCallParticipants limit=${GROUP_CALL_PARTICIPANTS_LOAD_LIMIT}`);
        const r1 = await TdLibController.send({
            '@type': 'loadGroupCallParticipants',
            group_call_id: groupCallId,
            limit: GROUP_CALL_PARTICIPANTS_LOAD_LIMIT
        });
        LOG_CALL(`[tdweb] loadGroupCallParticipants result`, r1);

        LOG_CALL(`[tdweb] loadGroupCallParticipants limit=${GROUP_CALL_PARTICIPANTS_LOAD_LIMIT}`);
        const r2 = await TdLibController.send({
            '@type': 'loadGroupCallParticipants',
            group_call_id: groupCallId,
            limit: GROUP_CALL_PARTICIPANTS_LOAD_LIMIT
        });
        LOG_CALL(`[tdweb] loadGroupCallParticipants result`, r2);

        let meParticipant = null;
        const participants = this.participants.get(groupCallId);
        if (participants) {
            meParticipant = participants.get(UserStore.getMyId());
        }

        if (meParticipant && meParticipant.source !== currentGroupCall.meSignSource) {
            LOG_CALL('[fix] meParticipant', meParticipant.source, currentGroupCall.meSignSource);
            meParticipant = { ...meParticipant, ...{ source: currentGroupCall.meSignSource } };
            this.participants.get(groupCallId).set(UserStore.getMyId(), meParticipant);
        }

        if (!meParticipant) {
            meParticipant = {
                '@type': 'groupCallParticipantMe',
                user_id: UserStore.getMyId(),
                source: currentGroupCall.meSignSource,
                can_be_muted: true,
                can_be_unmuted: true,
                can_unmute_self: true,
                is_muted_for_all_users: true,
                is_muted_for_current_user: false,
                is_speaking: false,
                order: Number
            };
        }

        const data1 = {
            transport,
            ssrcs: [{
                ssrc: fromTelegramSource(meParticipant.source),
                isMain: true,
                name: getUserFullName(meParticipant.user_id),
                user_id: meParticipant.user_id
            }]
        };

        description.updateFromServer(data1);
        const sdp1 = description.generateSdp(true);

        LOG_CALL(`[conn][joinGroupCallInternal][sdp] setRemoteDescription signaling=${connection.signalingState} ice=${connection.iceConnectionState} gathering=${connection.iceGatheringState} connection=${connection.connectionState}`, sdp1);
        await connection.setRemoteDescription({
            type: 'answer',
            sdp: sdp1,
        });

        // setTimeout(async () => {
        currentGroupCall.handleUpdateGroupCallParticipants = true;
        await this.updateGroupCallParticipants(groupCallId);
        // }, 2500);

        // const data2 = {
        //     transport,
        //     ssrcs: participants.map(x => ({
        //         ssrc: x.source >>> 0,
        //         isMain: x.source === currentGroupCall.meSignSource,
        //         name: getUserFullName(x.user_id)
        //     }))
        // };
        //
        // description.updateFromServer(data2);
        // const sdp2 = description.generateSdp();
        //
        // await connection.setRemoteDescription({
        //     type: 'offer',
        //     sdp: sdp2,
        // });
        // const answer = await connection.createAnswer();
        // await connection.setLocalDescription(answer);

        LOG_CALL('joinGroupCallInternal stop', groupCallId);
    }

    async hangUp(groupCallId, discard = false, rejoin = false) {
        LOG_CALL(`hangUp start id=${groupCallId} discard=${discard} rejoin=${rejoin}`);
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;
        if (currentGroupCall.groupCallId !== groupCallId) return;

        const { connection, streamManager } = currentGroupCall;
        if (!rejoin) {
            this.setCurrentGroupCall(null);
            this.stopConnectingSound(null);
        }

        this.closeConnectionAndStream(connection, rejoin ? null : streamManager);

        if (JOIN_TRACKS) {
            document.getElementById('group-call-player').innerHTML = '';
        } else {
            document.getElementById('players').innerHTML = '';
        }

        if (!rejoin) {
            if (discard) {
                LOG_CALL(`[tdweb] discardGroupCall id=${groupCallId}`);
                await TdLibController.send({
                    '@type': 'discardGroupCall',
                    group_call_id: groupCallId
                });
                return;
            }

            const groupCall = this.get(groupCallId);
            if (groupCall && groupCall.is_joined) {
                LOG_CALL(`[tdweb] leaveGroupCall id=${groupCallId}`);
                await TdLibController.send({
                    '@type': 'leaveGroupCall',
                    group_call_id: groupCallId
                });
                return;
            }

            LOG_CALL(`[tdweb] id=${groupCallId} payload=null`);
            await TdLibController.send({
                '@type': 'joinGroupCall',
                group_call_id: groupCallId,
                payload: null
            });
        }
    }

    closeConnectionAndStream(connection, streamManager) {
        try {
            if (connection) {
                LOG_CALL('[conn][closeConnectionAndStream] close');
                connection.close();
            }
        } catch (e) {
            LOG_CALL('hangUp error 1', e);
        }

        try {
            if (streamManager) {
                streamManager.inputStream.getTracks().forEach(t => {
                    t.stop();
                    streamManager.removeTrack(t);
                });
            }
        } catch (e) {
            LOG_CALL('hangUp error 2', e);
        }

        try {
            if (streamManager) {
                streamManager.outputStream.getTracks().forEach(t => {
                    t.stop();
                    streamManager.removeTrack(t);
                });
            }
        } catch (e) {
            LOG_CALL('hangUp error 3', e);
        }
    }

    async leaveGroupCall(chatId, groupCallId, forceDiscard = false) {
        LOG_CALL('leaveGroupCall', chatId, groupCallId);
        const manageVoiceCalls = canManageVoiceChats(chatId);
        if (manageVoiceCalls) {
            if (forceDiscard) {
                this.playSound('sounds/group_call_end.mp3');
                await this.hangUp(groupCallId, true);
                return;
            }

            showLeaveVoiceChatAlert({
                onResult: async result => {
                    LOG_CALL('leaveGroupCall result', result);
                    if (!result) return;

                    this.playSound('sounds/group_call_end.mp3');
                    await this.hangUp(groupCallId, result.discard);
                }
            });
            return;
        }

        this.playSound('sounds/group_call_end.mp3');
        await this.hangUp(groupCallId);
    }

    removeTrack(track, streamManager, endpoint, stream) {
        if (JOIN_TRACKS) {
            streamManager.removeTrack(track);

            const player = document.getElementById('group-call-player');
            if (!player) return;

            const tags = player.getElementsByTagName('audio');
            const audio = tags.length > 0 ? tags[0] : null;
            if (!audio) return;

            audio.srcObject = streamManager.outputStream;
        } else {
            const players = document.getElementById('players');
            if (!players) return;

            for (let audio of players.getElementsByTagName('audio')) {
                if (audio.e === endpoint && audio.srcObject === stream) {
                    players.removeChild(audio);
                    break;
                }
            }
        }
    }

    tryAddTrack(event) {
        const { streams, track } = event;

        const stream = streams[0];
        const endpoint = stream.id.substring(6);
        track.e = endpoint;

        if (JOIN_TRACKS) {
            if (!track) return;

            const { currentGroupCall } = this;
            if (!currentGroupCall) return;

            const { streamManager, meSignSource } = currentGroupCall;
            if (!streamManager) return;

            const player = document.getElementById('group-call-player');
            if (!player) return;

            const tags = player.getElementsByTagName('audio');
            let audio = tags.length > 0 ? tags[0] : null;

            track.onended = () => {
                LOG_CALL('[track] onended');
                this.removeTrack(track, streamManager, endpoint, stream);
            }

            streamManager.addTrack(stream, 'output');

            if (!audio) {
                audio = document.createElement('audio');
                audio.e = endpoint;
                audio.autoplay = true;
                audio.srcObject = streamManager.outputStream;
                audio.volume = 1.0;
                if (typeof audio.sinkId !== 'undefined') {
                    const { outputDeviceId } = currentGroupCall;
                    if (outputDeviceId) {
                        audio.setSinkId(outputDeviceId);
                    }
                }

                player.appendChild(audio);
                // audio.play();
            } else {
                audio.srcObject = streamManager.outputStream;
            }
        } else {
            const players = document.getElementById('players');
            if (!players) return;

            if (track) {
                track.onended = () => {
                    LOG_CALL('conn.track.onended');
                    this.removeTrack(track, null, endpoint, stream);
                }
            }

            let handled;
            for (let audio of players.getElementsByTagName('audio')) {
                if (audio.e === endpoint) {
                    audio.srcObject = stream;
                    handled = true;
                    break;
                }
            }

            if (!handled) {
                const audio = document.createElement('audio');
                audio.e = endpoint;
                audio.autoplay = true;
                audio.srcObject = stream;
                audio.volume = 1.0;

                const { currentGroupCall } = this;
                if (currentGroupCall) {
                    const participants = this.participants.get(currentGroupCall.groupCallId);
                    if (participants) {
                        const participant = Array.from(participants.values()).find(x => x.source === toTelegramSource(Number.parseInt(endpoint, 10)));
                        if (participant) {
                            audio.dataset.userId = participant.user_id;
                        }
                    }

                    if (typeof audio.sinkId !== 'undefined') {
                        const { outputDeviceId } = currentGroupCall;
                        if (outputDeviceId) {
                            audio.setSinkId(outputDeviceId);
                        }
                    }
                }
                audio.dataset.source = endpoint;

                players.appendChild(audio);
                audio.play();
            }
        }
    }

    replaceOutputDevice(deviceId) {
        if (JOIN_TRACKS) {
            const player = document.getElementById('group-call-player');
            if (player) {
                for (let audio of player.getElementsByTagName('audio')) {
                    if (typeof audio.sinkId !== 'undefined') {
                        audio.setSinkId(deviceId);
                    }
                }
            }

            const p2pPlayer = document.getElementById('call-output-video');
            if (p2pPlayer) {
                if (typeof p2pPlayer.sinkId !== 'undefined') {
                    p2pPlayer.setSinkId(deviceId);
                }
            }
        } else {
            const players = document.getElementById('players');
            if (!players) return;

            for (let audio of players.getElementsByTagName('audio')) {
                if (typeof audio.sinkId !== 'undefined') {
                    audio.setSinkId(deviceId);
                }
            }
        }
    }

    setOutputDeviceId(deviceId) {
        const { currentGroupCall, currentCall } = this;
        if (currentGroupCall) {
            currentGroupCall.outputDeviceId = deviceId;
        } else if (currentCall) {
            currentCall.outputDeviceId = deviceId;
        }

        this.replaceOutputDevice(deviceId);
    }

    getOutputDeviceId() {
        const { currentGroupCall, currentCall } = this;
        if (!currentGroupCall && !currentCall) return null;

        if (JOIN_TRACKS) {
            const player = document.getElementById('group-call-player');
            if (player) {
                for (let audio of player.getElementsByTagName('audio')) {
                    if (typeof audio.sinkId !== 'undefined') {
                        return audio.sinkId;
                    }
                }
            }

            const p2pPlayer = document.getElementById('call-output-video');
            if (p2pPlayer) {
                if (typeof p2pPlayer.sinkId !== 'undefined') {
                    return p2pPlayer.sinkId;
                }
            }
        } else {
            const players = document.getElementById('players');
            if (!players) return null;

            for (let audio of players.getElementsByTagName('audio')) {
                if (typeof audio.sinkId !== 'undefined') {
                    return audio.sinkId;
                }
            }
        }

        return null;
    }

    async replaceInputAudioDevice(stream) {
        const { currentGroupCall, currentCall } = this;
        if (currentGroupCall) {
            const { connection, streamManager } = currentGroupCall;
            if (!connection) return;

            const { inputStream } = streamManager;

            // const videoTrack = stream.getVideoTracks()[0];
            // const sender = pc.getSenders().find(function(s) {
            //     return s.track.kind == videoTrack.kind;
            // });
            // sender.replaceTrack(videoTrack);

            const audioTrack = stream.getAudioTracks()[0];
            const sender2 = connection.getSenders().find(x => {
                return x.track.kind === audioTrack.kind;
            });
            const oldTrack = sender2.track;
            await sender2.replaceTrack(audioTrack);

            oldTrack.stop();
            streamManager.replaceInputAudio(stream, oldTrack);
        } else if (currentCall) {
            const { connection, inputStream } = currentCall;
            if (!connection) return;
            if (!inputStream) return;

            // // const videoTrack = stream.getVideoTracks()[0];
            // // const sender = pc.getSenders().find(function(s) {
            // //     return s.track.kind == videoTrack.kind;
            // // });
            // // sender.replaceTrack(videoTrack);

            const audioTrack = stream.getAudioTracks()[0];
            const sender2 = connection.getSenders().find(x => {
                return x.track.kind === audioTrack.kind;
            });
            const oldTrack = sender2.track;
            await sender2.replaceTrack(audioTrack);

            oldTrack.stop();
            inputStream.removeTrack(oldTrack);
            inputStream.addTrack(audioTrack);
            // streamManager.replaceInputAudio(stream, oldTrack);
        }
    }

    async replaceInputVideoDevice(stream) {
        const { currentGroupCall, currentCall } = this;
        if (currentGroupCall) {
            // const { connection, streamManager } = currentGroupCall;
            // if (!connection) return;
            //
            // const { inputStream } = streamManager;
            //
            // // const videoTrack = stream.getVideoTracks()[0];
            // // const sender = pc.getSenders().find(function(s) {
            // //     return s.track.kind == videoTrack.kind;
            // // });
            // // sender.replaceTrack(videoTrack);
            //
            // const audioTrack = stream.getAudioTracks()[0];
            // const sender2 = connection.getSenders().find(x => {
            //     return x.track.kind === audioTrack.kind;
            // });
            // const oldTrack = sender2.track;
            // await sender2.replaceTrack(audioTrack);
            //
            // oldTrack.stop();
            // streamManager.replaceInputAudio(stream, oldTrack);
        } else if (currentCall) {
            const { callId, connection, inputStream } = currentCall;
            if (!connection) return;
            if (!inputStream) return;

            const videoTrack = stream.getVideoTracks()[0];
            const mediaState = this.p2pGetMediaState(callId, 'input');
            if (mediaState && mediaState.videoState === 'inactive') {
                videoTrack.enabled = false;
            }

            const sender = connection.getSenders().find(function(s) {
                return s.track.kind == videoTrack.kind;
            });
            const oldTrack = sender.track;
            sender.replaceTrack(videoTrack);

            oldTrack.stop();
            inputStream.removeTrack(oldTrack);
            inputStream.addTrack(videoTrack);
        }
    }

    async setInputAudioDeviceId(deviceId, stream) {
        const { currentGroupCall, currentCall } = this;
        if (currentGroupCall) {
            await this.replaceInputAudioDevice(stream);
        } else if (currentCall) {
            await this.replaceInputAudioDevice(stream);
        }
    }

    async setInputVideoDeviceId(deviceId, stream) {
        const { currentGroupCall, currentCall } = this;
        if (currentGroupCall) {
            await this.replaceInputVideoDevice(stream);
        } else if (currentCall) {
            await this.replaceInputVideoDevice(stream);
        }
    }

    getInputAudioDeviceId() {
        const { currentGroupCall, currentCall } = this;

        let connection = null;
        if (currentGroupCall) {
            connection = currentGroupCall.connection;
        } else if (currentCall) {
            connection = currentCall.connection;
        }
        if (!connection) return null;

        let deviceId = null
        connection.getSenders().forEach(s => {
            const { track } = s;
            if (track && track.kind === 'audio') {
                const settings = track.getSettings();
                if (settings) {
                    deviceId = settings.deviceId;
                }
            }
        });

        return deviceId;
    }

    getInputVideoDeviceId() {
        const { currentGroupCall, currentCall } = this;

        let connection = null;
        if (currentGroupCall) {
            connection = currentGroupCall.connection;
        } else if (currentCall) {
            connection = currentCall.connection;
        }
        if (!connection) return null;

        let deviceId = null
        connection.getSenders().forEach(s => {
            const { track } = s;
            if (track && track.kind === 'video') {
                const settings = track.getSettings();
                if (settings) {
                    deviceId = settings.deviceId;
                }
            }
        });

        return deviceId;
    }

    onTrack(event) {
        this.tryAddTrack(event);
    }

    isMuted() {
        const { currentGroupCall } = this;
        if (!currentGroupCall) return true;

        const { groupCallId, streamManager } = currentGroupCall;
        if (!streamManager) return true;

        const audioTracks = streamManager.inputStream.getAudioTracks();
        if (audioTracks.length > 0) {
            return !audioTracks[0].enabled;
        }

        return true;
    }

    changeMuted(muted) {
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;

        const { groupCallId, streamManager } = currentGroupCall;
        if (!streamManager) return;

        const audioTracks = streamManager.inputStream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].enabled = !muted;
        }

        LOG_CALL(`[tdweb] toggleGroupCallParticipantIsMuted id=${groupCallId} user_id=${UserStore.getMyId()} is_muted=${muted}`, this.get(groupCallId));
        TdLibController.send({
            '@type': 'toggleGroupCallParticipantIsMuted',
            group_call_id: groupCallId,
            user_id: UserStore.getMyId(),
            is_muted: muted
        });
    }

    changeUserMuted(userId, muted) {
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;

        const { groupCallId, connection } = currentGroupCall;
        if (!connection) return;

        if (UserStore.getMyId() === userId) {
            connection.getSenders().forEach(s => {
                const { track } = s;
                if (track && track.kind === 'audio') {
                    track.enabled = !muted;
                }
            });
        }

        LOG_CALL(`[tdweb] toggleGroupCallParticipantIsMuted id=${groupCallId} user_id=${UserStore.getMyId()} is_muted=${muted}`, this.get(groupCallId));
        TdLibController.send({
            '@type': 'toggleGroupCallParticipantIsMuted',
            group_call_id: groupCallId,
            user_id: userId,
            is_muted: muted
        });
    }

    toggleMuteNewParticipants(groupCallId, mute) {
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;

        const { groupCallId: currentGroupCallId } = currentGroupCall;
        if (groupCallId !== currentGroupCallId) return;

        LOG_CALL('toggleMuteNewParticipants', groupCallId, mute);
        TdLibController.send({
            '@type': 'toggleGroupCallMuteNewParticipants',
            group_call_id: groupCallId,
            mute_new_participants: mute
        });
    }

    setGroupCallParticipantVolumeLevel(groupCallId, userId, volume) {
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;

        const { groupCallId: currentGroupCallId } = currentGroupCall;
        if (groupCallId !== currentGroupCallId) return;

        LOG_CALL('setGroupCallParticipantVolumeLevel', groupCallId, userId, volume);
        TdLibController.send({
            '@type': 'setGroupCallParticipantVolumeLevel',
            group_call_id: groupCallId,
            user_id: userId,
            volume_level: volume
        });
    }

    p2pGet(callId) {
        return this.items.get(callId);
    }

    p2pSet(call) {
        this.items.set(call.id, call);
    }

    get p2pCallsEnabled() {
        return TdLibController.calls;
    }

    p2pGetProtocol() {
        return {
            '@type': 'callProtocol',
            udp_p2p: true,
            udp_reflector: true,
            min_layer: 92,
            max_layer: 92,
            library_versions: ['4.0.0']
        };
    }

    async p2pStartCall(userId, isVideo) {
        LOG_P2P_CALL('p2pStartCall', userId, isVideo);

        let { currentCall, currentGroupCall } = this;
        if (currentCall) {
            const { callId } = currentCall;
            const call = this.p2pGet(callId);
            if (call) {
                showAlert({
                    title: LStore.getString('VoipOngoingAlertTitle'),
                    message: LStore.replaceTags(LStore.formatString('VoipOngoingAlert', getUserFullName(call.user_id, null), getUserFullName(userId, null))),
                    ok: LStore.getString('OK'),
                    cancel: LStore.getString('Cancel'),
                    onResult: async result => {
                        if (result) {
                            currentCall = this.currentCall;
                            if (currentCall) {
                                await this.p2pHangUp(currentCall.callId, true);
                            }
                            await this.p2pStartCallInternal(userId, isVideo);
                        }
                    }
                });
            }

            return;
        } else if (currentGroupCall) {
            const { chatId: oldChatId } = currentGroupCall;

            showAlert({
                title: LStore.getString('VoipOngoingChatAlertTitle'),
                message: LStore.replaceTags(LStore.formatString('VoipOngoingChatAlert2', getChatTitle(oldChatId), getUserFullName(userId, null))),
                ok: LStore.getString('OK'),
                cancel: LStore.getString('Cancel'),
                onResult: async result => {
                    if (result) {
                        currentGroupCall = this.currentGroupCall;
                        if (currentGroupCall) {
                            await this.hangUp(currentGroupCall.groupCallId);
                        }
                        await this.p2pStartCallInternal(userId, isVideo);
                    }
                }
            });

            return;
        }

        await this.p2pStartCallInternal(userId, isVideo);
    }

    p2pStartCallInternal(userId, isVideo) {
        LOG_P2P_CALL('p2pStartCallInternal', userId, isVideo);

        const fullInfo = UserStore.getFullInfo(userId);
        if (!fullInfo) return;

        const { can_be_called, has_private_calls, supports_video_calls } = fullInfo;
        LOG_P2P_CALL('p2pStartCallInternal fullInfo', fullInfo, can_be_called, has_private_calls, supports_video_calls);

        const protocol = this.p2pGetProtocol();
        LOG_P2P_CALL('[tdlib] createCall', userId, protocol, isVideo, supports_video_calls);
        TdLibController.send({
            '@type': 'createCall',
            user_id: userId,
            protocol,
            is_video: isVideo && supports_video_calls
        });
    }

    p2pAcceptCall(callId) {
        LOG_P2P_CALL('p2pAcceptCall', callId);

        const call = this.p2pGet(callId);
        if (!call) return;

        let { currentCall, currentGroupCall } = this;
        if (currentCall) {
            const { callId: prevCallId } = currentCall;
            const prevCall = this.p2pGet(prevCallId);
            if (prevCall) {
                showAlert({
                    title: LStore.getString('VoipOngoingAlertTitle'),
                    message: LStore.replaceTags(LStore.formatString('VoipOngoingAlert', getUserFullName(prevCall.user_id, null), getUserFullName(call.user_id, null))),
                    ok: LStore.getString('OK'),
                    cancel: LStore.getString('Cancel'),
                    onResult: async result => {
                        if (result) {
                            currentCall = this.currentCall;
                            if (currentCall) {
                                await this.p2pHangUp(currentCall.callId, true);
                            }
                            await this.p2pAcceptCallInternal(callId);
                        }
                    }
                });

                return;
            }
        } else if (currentGroupCall) {
            const { chatId: oldChatId } = currentGroupCall;

            showAlert({
                title: LStore.getString('VoipOngoingChatAlertTitle'),
                message: LStore.replaceTags(LStore.formatString('VoipOngoingChatAlert2', getChatTitle(oldChatId), getUserFullName(call.user_id, null))),
                ok: LStore.getString('OK'),
                cancel: LStore.getString('Cancel'),
                onResult: async result => {
                    if (result) {
                        currentGroupCall = this.currentGroupCall;
                        if (currentGroupCall) {
                            await this.hangUp(currentGroupCall.groupCallId);
                        }
                        await this.p2pAcceptCallInternal(callId);
                    }
                }
            });

            return;
        }

        this.p2pAcceptCallInternal(callId);
    }

    async p2pAcceptCallInternal(callId) {
        LOG_P2P_CALL('p2pAcceptCallInternal', callId);

        const protocol = this.p2pGetProtocol();
        LOG_P2P_CALL('[tdlib] acceptCall', callId, protocol);
        TdLibController.send({
            '@type': 'acceptCall',
            call_id: callId,
            protocol
        });
    }

    p2pSendCallSignalingData(callId, str) {
        const { currentCall } = this;
        if (currentCall) {
            const { encryptor } = currentCall;
            if (encryptor) {
                const data = encryptor.encryptToBase64(str);

                LOG_P2P_CALL('[tdlib] sendCallSignalingData', callId, str);
                TdLibController.send({
                    '@type': 'sendCallSignalingData',
                    call_id: callId,
                    data
                });
            }
        }
    }

    p2pGetConfiguration(state){
        if (!state) return null;

        const { servers, allow_p2p } = state;

        const iceServers = [];
        servers.forEach(x => {
            const { ip_address, ipv6_address, port, type } = x;
            switch (type['@type']) {
                case 'callServerTypeTelegramReflector': {
                    break;
                }
                case 'callServerTypeWebrtc': {
                    const { username, password: credential, supports_turn, supports_stun } = type;
                    const urls = [];
                    if (supports_turn) {
                        if (ip_address) {
                            urls.push(`turn:${ip_address}:${port}`);
                        }
                        if (ipv6_address) {
                            urls.push(`turn:[${ipv6_address}]:${port}`);
                        }

                    } else if (supports_stun) {
                        if (ip_address) {
                            urls.push(`stun:${ip_address}:${port}`);
                        }
                        if (ipv6_address) {
                            urls.push(`stun:[${ipv6_address}]:${port}`);
                        }
                    }

                    if (urls.length > 0) {
                        iceServers.push({
                            urls,
                            username,
                            credential
                        });
                    }
                    break;
                }
            }
        });

        return {
            iceServers,
            iceTransportPolicy: allow_p2p ? 'all' : 'relay'
        };
    }

    p2pCreateChannel(connection) {
        const channel = connection.createDataChannel('data', {
            id: 0,
            negotiated: true
        });
        channel.onmessage = e => {
            LOG_P2P_CALL('[channel] onmessage', e);
            const { data } = e;
            this.p2pApplyCallDataChannelData(JSON.parse(data));
        };
        channel.onopen = () => {
            const { currentCall } = this;
            if (!currentCall) return;

            const { callId } = currentCall;

            const mediaState = this.p2pGetMediaState(callId, 'input');
            if (!mediaState) return;

            this.p2pSendMediaState(callId, mediaState);
        };

        return channel;
    }

    async p2pJoinCall(callId) {
        LOG_P2P_CALL('p2pJoinCall', callId);

        const call = this.p2pGet(callId);
        if (!call) return;

        const { id, state, is_outgoing } = call;
        if (!state) return;
        if (state['@type'] !== 'callStateReady') return;

        const { encryption_key } = state;

        const outputStream = new MediaStream();

        const configuration = this.p2pGetConfiguration(state);
        LOG_P2P_CALL('p2pJoinCall configuration', configuration);
        if (!configuration) return;

        const connection = new RTCPeerConnection(configuration);
        connection.oniceconnectionstatechange = event => {
            LOG_P2P_CALL('[conn] oniceconnectionstatechange', connection.iceConnectionState);
        };
        connection.onnegotiationneeded = event => {
            LOG_P2P_CALL('[conn][InitialSetup] onnegotiationneeded', connection.signalingState);
            this.p2pStartNegotiation(id);
        }
        connection.onicecandidate = event => {
            const { candidate } = event;
            LOG_P2P_CALL('[conn] onicecandidate', candidate);
            if (candidate && candidate.candidate) {
                this.p2pSendIceCandidate(id, candidate);
            }
        };
        connection.ontrack = event => {
            const { track } = event;
            LOG_P2P_CALL('[conn] ontrack', track);
            outputStream.addTrack(track);
            const video = document.getElementById('call-output-video');
            if (video) {
                video.srcObject = outputStream;
            }

            track.onmute = () => {
                LOG_P2P_CALL('[track] onmute', track);
            };
            track.onunmute = () => {
                LOG_P2P_CALL('[track] onunmute', track);
            };
        };

        this.currentCall = {
            callId: id,
            connection,
            inputStream: null,
            outputStream,
            encryptor: new P2PEncryptor(is_outgoing, encryption_key),
            decryptor: new P2PEncryptor(!is_outgoing, encryption_key)
        };
        LOG_P2P_CALL('p2pJoinCall currentCall', this.currentCall);

        const mediaState = this.p2pGetMediaState(id, 'input');

        const inputStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        if (mediaState && mediaState.videoState === 'inactive') {
            inputStream.getVideoTracks().forEach(x => {
                x.enabled = false;
            });
        }

        this.currentCall.inputStream = inputStream;

        const inputVideo = document.getElementById('call-input-video');
        if (inputVideo) {
            inputVideo.srcObject = inputStream;
        }

        this.p2pAppendInputStream(inputStream);
        const { offerReceived } = this.currentCall;
        if (offerReceived) {
            console.log('[InitialSetup] after p2pAppendInputStream');
            this.currentCall.offerReceived = false;

            const answer = await connection.createAnswer();

            console.log('[sdp] local', answer.type, answer.sdp);
            await connection.setLocalDescription(answer);

            const initialSetup = p2pParseSdp(answer.sdp);
            initialSetup['@type'] = 'InitialSetup';

            console.log('[InitialSetup] send 2');
            this.p2pSendInitialSetup(callId, initialSetup);
        }
    }

    /// https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
    p2pStartNegotiation = async id => {
        const { currentCall } = this;
        LOG_P2P_CALL('[InitialSetup] p2pStartNegotiation', currentCall);
        if (!currentCall) return;

        const { callId, connection, offerReceived } = currentCall;
        if (callId !== id) return;
        if (!connection) return;

        const call = this.p2pGet(callId)
        if (!call) return;

        const { is_outgoing } = call;
        if (!connection.localDescription && !connection.remoteDescription && !is_outgoing) return;
        // if (!is_outgoing) return;

        LOG_P2P_CALL('[InitialSetup] p2pStartNegotiation 1', offerReceived);
        if (offerReceived) {
            currentCall.offerReceived = false;

            const answer = await connection.createAnswer();

            console.log('[sdp] local', answer.type, answer.sdp);
            await connection.setLocalDescription(answer);

            const initialSetup = p2pParseSdp(answer.sdp);
            initialSetup['@type'] = 'InitialSetup';

            console.log('[InitialSetup] send 2');
            this.p2pSendInitialSetup(callId, initialSetup);
        } else {
            let offer = await connection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            console.log('[sdp] local', offer.sdp);
            await connection.setLocalDescription(offer);

            const initialSetup = p2pParseSdp(offer.sdp);
            initialSetup['@type'] = 'InitialSetup';
            currentCall.offerSent = true;

            console.log('[InitialSetup] send 0');
            this.p2pSendInitialSetup(callId, initialSetup);
        }
    };

    async p2pAddIceCandidate(connection, candidate) {
        LOG_P2P_CALL('[candidate] start', candidate);
        try {
            // if (!candidate.address) return;
            await connection.addIceCandidate(candidate);
            LOG_P2P_CALL('[candidate] add', candidate);
        } catch (e) {
            LOG_P2P_CALL('[candidate] error', candidate, e);
        }
    }

    p2pAppendInputStream(inputStream) {
        LOG_P2P_CALL('[InitialSetup] p2pAppendInputStream start', inputStream);
        const { currentCall } = this;
        if (!currentCall) return;

        const { connection } = currentCall;
        if (!connection) return;

        currentCall.channel = this.p2pCreateChannel(connection);

        const senders = connection.getSenders();
        if (senders.some(x => x.track)) return;

        inputStream && inputStream.getAudioTracks().forEach(x => {
            connection.addTrack(x, inputStream);
        });
        inputStream && inputStream.getVideoTracks().forEach(x => {
            connection.addTrack(x, inputStream);
        });
        LOG_P2P_CALL('[InitialSetup] p2pAppendInputStream stop', inputStream);
    }

    async p2pApplyCallDataChannelData(data) {
        if (!data) return;

        const { currentCall } = this;
        LOG_P2P_CALL('p2pApplyCallDataChannelData', currentCall, data);
        if (!currentCall) {
            ERROR_P2P_CALL('p2pApplyCallDataChannelData 0');
            return;
        }

        const { callId } = currentCall;

        const type = data['@type'] || data.type;
        switch (type) {
            case 'media': {
                const { kind, isMuted } = data;
                if (kind === 'audio') {
                    currentCall.audioIsMuted = isMuted;
                } else if (kind === 'video') {
                    currentCall.videoIsMuted = isMuted;
                }

                break;
            }
            case 'MediaState': {
                this.p2pSetMediaState(callId, 'output', data);
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateCallMediaState',
                    callId,
                    type: 'output',
                    mediaState: data
                });
                break;
            }
        }
    }

    async p2pApplyCallSignalingData(callId, data) {
        if (!data) return;

        const { currentCall } = this;
        LOG_P2P_CALL('p2pApplyCallSignalingData', currentCall, data);
        if (!currentCall) {
            ERROR_P2P_CALL('p2pApplyCallSignalingData 0');
            return;
        }
        if (currentCall.callId !== callId) {
            ERROR_P2P_CALL('p2pApplyCallSignalingData 1');
            return;
        }

        const { connection } = currentCall;
        if (!connection) {
            ERROR_P2P_CALL('p2pApplyCallSignalingData 2');
            return;
        }

        const call = this.p2pGet(callId);
        if (!call) {
            return;
        }

        const { is_outgoing } = call;

        let type = data['@type'] || data.type;
        switch (type) {
            case 'InitialSetup': {
                console.log('[sdp] InitialSetup', data);
                const isAnswer = currentCall.offerSent;
                currentCall.offerSent = false;

                let description = data;
                description = {
                    type: isAnswer ? 'answer' : 'offer',
                    sdp: isAnswer ?
                        P2PSdpBuilder.generateAnswer(data) :
                        P2PSdpBuilder.generateOffer(data)
                }

                console.log('[sdp] remote', description.type, description.sdp)
                await connection.setRemoteDescription(description);

                if (currentCall.candidates) {
                    currentCall.candidates.forEach(x => {
                        this.p2pAddIceCandidate(connection, x);
                    });
                    currentCall.candidates = [];
                }

                if (!isAnswer) {
                    const { inputStream } = currentCall;
                    if (inputStream) {
                        const answer = await connection.createAnswer();

                        const initialSetup = p2pParseSdp(answer.sdp);
                        initialSetup['@type'] = 'InitialSetup';

                        // if (initialSetup.video) {
                        //     if (initialSetup.video.rtpExtensions) {
                        //         initialSetup.video.rtpExtensions.push({ id: 13, uri: 'urn:3gpp:video-orientation' });
                        //         console.log('[InitialSetup] push', initialSetup);
                        //
                        //         answer.sdp = P2PSdpBuilder.generateAnswer(initialSetup);
                        //     }
                        // }

                        console.log('[sdp] local', answer.type, answer.sdp);
                        await connection.setLocalDescription(answer);

                        console.log('[InitialSetup] send 1');
                        this.p2pSendInitialSetup(callId, initialSetup);
                    } else {
                        console.log('[InitialSetup] offerReceived=true');
                        currentCall.offerReceived = true;
                    }
                }
                break;
            }
            case 'answer':
            case 'offer':{
                let description = data;
                description = {
                    type,
                    sdp: type === 'offer' ?
                        P2PSdpBuilder.generateOffer(data) :
                        P2PSdpBuilder.generateAnswer(data)
                }

                // LOG_P2P_CALL('[generate] ', data, description.type, description.sdp);
                await connection.setRemoteDescription(description);
                if (currentCall.candidates) {
                    currentCall.candidates.forEach(x => {
                        this.p2pAddIceCandidate(connection, x);
                        // LOG_P2P_CALL('[candidate] add postpone', x);
                        // connection.addIceCandidate(x);
                    });
                    currentCall.candidates = [];
                }

                if (type === 'offer') {
                    const answer = await connection.createAnswer();
                    await connection.setLocalDescription(answer);

                    LOG_P2P_CALL('2 try invoke p2pAppendInputStream', inputStream, is_outgoing);
                    const { inputStream } = currentCall;
                    if (inputStream && !is_outgoing) {
                        this.p2pAppendInputStream(inputStream);
                    }

                    this.p2pSendSdp(callId, answer);
                }
                break;
            }
            case 'candidate': {
                let candidate = data;
                candidate = P2PSdpBuilder.generateCandidate(candidate.candidate);
                candidate.sdpMLineIndex = data.sdpMLineIndex;
                candidate.sdpMid = data.sdpMid;

                if (candidate) {
                    const iceCandidate = new RTCIceCandidate(candidate);
                    if (!connection.remoteDescription) {
                        currentCall.candidates = currentCall.candidates || [];
                        LOG_P2P_CALL('[candidate] postpone', iceCandidate);
                        currentCall.candidates.push(iceCandidate);
                    } else {
                        await this.p2pAddIceCandidate(connection, iceCandidate);
                        // LOG_P2P_CALL('[candidate] add', iceCandidate);
                        // await connection.addIceCandidate(iceCandidate);
                    }
                }
                break;
            }
            case 'Candidates': {
                const candidates = [];
                let candidate = data;
                data.candidates.forEach(x => {
                    candidate = P2PSdpBuilder.generateCandidate(x);
                    candidate.sdpMLineIndex = 0;

                    candidates.push(candidate);
                });

                if (candidates.length > 0) {
                    candidates.forEach(async x => {
                        const iceCandidate = new RTCIceCandidate(x);
                        if (!connection.remoteDescription) {
                            currentCall.candidates = currentCall.candidates || [];
                            LOG_P2P_CALL('[candidate] postpone', iceCandidate);
                            currentCall.candidates.push(iceCandidate);
                        } else {
                            await this.p2pAddIceCandidate(connection, iceCandidate);
                            // LOG_P2P_CALL('[candidate] add', iceCandidate);
                            // await connection.addIceCandidate(iceCandidate);
                        }
                    });
                }
                break;
            }
            case 'media': {
                const { kind, isMuted } = data;
                if (kind === 'audio') {
                    currentCall.audioIsMuted = isMuted;
                } else if (kind === 'video') {
                    currentCall.videoIsMuted = isMuted;
                }

                break;
            }
        }
    }

    p2pSendDataChannelData(data) {
        const { currentCall } = this;
        if (!currentCall) return;

        const { channel } = currentCall;
        if (!channel) return;
        if (channel.readyState !== 'open') return;

        channel.send(data);
    }

    p2pSendMediaIsMuted(callId, kind, isMuted) {
        LOG_P2P_CALL('p2pSendMediaIsMuted', callId, kind, isMuted);

        this.p2pSendDataChannelData(JSON.stringify({ type: 'media', kind, isMuted }));
    }

    p2pSendMediaState(callId, mediaState) {
        LOG_P2P_CALL('p2pSendMediaState', callId, mediaState);

        this.p2pSendDataChannelData(JSON.stringify(mediaState));
    }

    p2pSendIceCandidate(callId, iceCandidate) {
        LOG_P2P_CALL('p2pSendIceCandidate', callId, iceCandidate);
        let { candidate, sdpMLineIndex } = iceCandidate;
        if (sdpMLineIndex !== 0) {
            return;
        }

        candidate = p2pParseCandidate(candidate);
        this.p2pSendCallSignalingData(callId, JSON.stringify({ '@type': 'Candidates', candidates: [candidate] }));
    }

    p2pSendInitialSetup(callId, initialSetup) {
        LOG_P2P_CALL('p2pSendInitialSetup', callId, initialSetup);

        this.p2pSendCallSignalingData(callId, JSON.stringify(initialSetup));
    }

    p2pSendSdp(callId, sdpData) {
        LOG_P2P_CALL('p2pSendSdp', callId, sdpData);

        const { type, sdp } = sdpData;
        const sdpInfo = p2pParseSdp(sdp);
        sdpInfo['@type'] = type;

        this.p2pSendCallSignalingData(callId, JSON.stringify(sdpInfo));
    }

    p2pHangUp(callId, discard = false) {
        const { currentCall } = this;
        LOG_P2P_CALL('hangUp', callId, currentCall);

        if (currentCall && currentCall.callId === callId) {
            const { connection, inputStream, outputStream, screenStream } = currentCall;
            this.p2pCloseConnectionAndStream(connection, inputStream, outputStream, screenStream);

            this.currentCall = null;
        }

        if (discard) {
            const inputMediaState = this.p2pGetMediaState(callId, 'input');
            const outputMediaState = this.p2pGetMediaState(callId, 'output');

            const call = this.p2pGet(callId);

            const isVideo = inputMediaState && inputMediaState.videoState === 'active'
                || outputMediaState && outputMediaState.videoState === 'active'
                || call && call.is_video;
            LOG_P2P_CALL('[tdlib] discardCall', callId, isVideo);

            TdLibController.send({
                '@type': 'discardCall',
                call_id: callId,
                is_disconnected: false,
                duration: 0,
                is_video: isVideo,
                connection_id: 0
            });
        }
    }

    async p2pStartScreenSharing() {
        const { currentCall } = this;
        if (!currentCall) return;

        const { callId, connection } = currentCall;
        if (!connection) return;

        const options = {
            video: { cursor: 'always' },
            audio: false
        };

        const screenStream = await navigator.mediaDevices.getDisplayMedia(options);

        let replaced = false;
        connection.getSenders().forEach(x => {
            if (x.track.kind === 'video') {
                x.replaceTrack(screenStream.getVideoTracks()[0]);
                replaced = true;
            }
        });
        if (!replaced) {
            connection.addTrack(screenStream.getVideoTracks()[0], screenStream);
        }

        const inputVideo = document.getElementById('call-input-video');
        if (inputVideo) {
            inputVideo.srcObject = screenStream;
        }

        const inputMediaState = this.p2pGetMediaState(callId, 'input');
        if (inputMediaState && inputMediaState.videoState !== 'active') {
            this.p2pVideoEnabled(true);
        }

        currentCall.screenStream = screenStream;
    }

    async p2pStopScreenSharing() {
        const { currentCall } = this;
        if (!currentCall) return;

        const { connection, inputStream, screenStream } = currentCall;
        if (!connection) return;
        if (!screenStream) return;

        const videoTracks = inputStream.getVideoTracks();
        const videoTrack = videoTracks.length > 0 ? videoTracks[0] : null

        connection.getSenders().forEach(x => {
            if (x.track.kind === 'video') {
                x.replaceTrack(videoTrack);
            }
        })

        screenStream.getTracks().forEach(x => {
            x.stop();
        });

        const inputVideo = document.getElementById('call-input-video');
        if (inputVideo) {
            inputVideo.srcObject = inputStream;
        }

        currentCall.screenStream = null;

        if (!videoTrack || videoTrack.readyState !== 'live') {
            this.p2pVideoEnabled(false);
        }
    }

    p2pCloseConnectionAndStream(connection, inputStream, outputStream, screenStream) {
        LOG_P2P_CALL('[conn] p2pCloseConnectionAndStream', connection, inputStream, outputStream);
        try {
            if (outputStream) {
                outputStream.getTracks().forEach(t => {
                    t.stop();
                });
            }
        } catch (e) {
            LOG_P2P_CALL('hangUp error 0', e);
        }

        try {
            if (inputStream) {
                inputStream.getTracks().forEach(t => {
                    t.stop();
                })
            }
        } catch (e) {
            LOG_P2P_CALL('hangUp error 1', e);
        }

        try {
            if (screenStream) {
                screenStream.getTracks().forEach(t => {
                    t.stop();
                })
            }
        } catch (e) {
            LOG_P2P_CALL('hangUp error 2', e);
        }

        try {
            if (connection) {
                connection.close();
            }
        } catch (e) {
            LOG_P2P_CALL('hangUp error 3', e);
        }
    }

    p2pAudioEnabled(enabled) {
        const { currentCall } = this;
        if (!currentCall) return;

        const { connection, callId } = currentCall;
        if (!connection) return;

        const senders = connection.getSenders();
        senders.forEach(x => {
            const { track } = x;
            if (track && track.kind === 'audio') {
                track.enabled = enabled;
            }
        });

        const mediaState = this.p2pGetMediaState(callId, 'input');
        const nextMediaState = { ...mediaState, ...{ muted: !enabled } };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateCallMediaState',
            callId,
            type: 'input',
            mediaState: nextMediaState
        });
        this.p2pSetMediaState(callId, 'input', nextMediaState);
        this.p2pSendMediaState(callId, nextMediaState);
    }

    async p2pVideoEnabled(enabled) {
        const { currentCall } = this;
        if (!currentCall) return;

        const { connection, callId } = currentCall;
        if (!connection) return;

        const senders = connection.getSenders();
        senders.forEach(x => {
            const { track } = x;
            if (track && track.kind === 'video') {
                track.enabled = enabled;
            }
        });

        const mediaState = this.p2pGetMediaState(callId, 'input');
        const nextMediaState = { ...mediaState, ...{ videoState: enabled ? 'active' : 'inactive' } };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateCallMediaState',
            callId,
            type: 'input',
            mediaState: nextMediaState
        });
        this.p2pSetMediaState(callId, 'input', nextMediaState);
        this.p2pSendMediaState(callId, nextMediaState);
    }

    p2pSetMediaState(callId, type, state) {
        let s = this.mediaState.get(callId);
        if (!s) {
            s = { };
            this.mediaState.set(callId, s);
        }

        s[type] = state;
    }

    p2pGetMediaState(callId, type) {
        let s = this.mediaState.get(callId);
        if (!s) return null;

        return s[type];
    }
}

const store = new CallStore();
window.call = store;
export default store;
