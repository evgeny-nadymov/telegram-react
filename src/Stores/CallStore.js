/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventEmitter from './EventEmitter';
import LocalConferenceDescription from '../Calls/LocalConferenceDescription';
import { canManageVoiceChats, getChatTitle } from '../Utils/Chat';
import { getUserFullName } from '../Utils/User';
import { getStream, parseSdp } from '../Calls/Utils';
import { showAlert, showLeaveVoiceChatAlert } from '../Actions/Client';
import LStore from './LocalizationStore';
import UserStore from './UserStore';
import TdLibController from '../Controllers/TdLibController';

export function LOG_CALL(str, ...data) {
    console.log('[call] ' + str, ...data);
}

export function ERROR_CALL(str, ...data) {
    console.error('[call] ' + str, ...data);
}

class CallStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.currentGroupCall = null;
        this.items = new Map();
        this.participants = new Map();
        this.panelOpened = false;
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateChatVoiceChat': {
                this.emit('updateChatVoiceChat', update);
                break;
            }
            case 'updateGroupCall': {
                const { group_call } = update;
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

                const { user_id, is_muted } = participant;
                participants.set(user_id, participant);

                // mute stream on updateGroupCallParticipant, unmute can be done only on UI user action
                if (user_id === UserStore.getMyId() && is_muted) {
                    const { currentGroupCall } = this;
                    if (currentGroupCall) {
                        const { groupCallId, stream } = currentGroupCall;
                        if (stream && group_call_id === groupCallId) {
                            const audioTracks = stream.getAudioTracks();
                            if (audioTracks.length > 0) {
                                audioTracks[0].enabled = false;
                            }
                        }
                    }
                }

                this.emit('updateGroupCallParticipant', update);
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

                if (this.panelOpened && !this.currentGroupCall) {
                    TdLibController.clientUpdate({
                        '@type': 'clientUpdateGroupCallPanel',
                        opened: false
                    });
                }

                this.emit('clientUpdateGroupCall', update);
                break;
            }
            case 'clientUpdateGroupCallConnectionState': {
                this.emit('clientUpdateGroupCallConnectionState', update);
                break;
            }
            case 'clientUpdateGroupCallPanel': {
                this.panelOpened = update.opened;
                this.emit('clientUpdateGroupCallPanel', update);
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
        return this.items.get(callId);
    }

    set(call) {
        this.items.set(call.id, call);
    }

    playSound(sound) {
        try {
            const audio = new Audio(sound);
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

    async startGroupCall(chatId) {
        let { currentGroupCall } = this;
        LOG_CALL('startGroupCall', currentGroupCall);
        if (currentGroupCall) {
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
        LOG_CALL('startGroupCallInternal start', chatId);
        const groupCallId = await TdLibController.send({
            '@type': 'createVoiceChat',
            chat_id: chatId
        });
        LOG_CALL('startGroupCallInternal finish', chatId, groupCallId);
    }

    async joinGroupCall(chatId, groupCallId, muted = true, rejoin = false) {
        LOG_CALL(`joinGroupCall chatId=${chatId} id=${groupCallId} muted=${muted} rejoin=${rejoin}`);
        const groupCall = this.get(groupCallId);
        if (!groupCall) {
            LOG_CALL('joinGroupCall getGroupCall', groupCallId);
            TdLibController.send({ '@type': 'getGroupCall', group_call_id: groupCallId });
        }

        let stream = null;
        try {
            stream = await getStream({ audio: true, video: false }, muted);
        } catch (e) {
            ERROR_CALL('joinGroupCall getStream error', e);
            showAlert({
                title: LStore.getString('AppName'),
                message: LStore.getString('VoipNeedMicPermission'),
                ok: LStore.getString('OK')
            });
        }
        if (!stream) return;

        let { currentGroupCall } = this;
        LOG_CALL('joinGroupCall has another', groupCallId, currentGroupCall);
        if (currentGroupCall && !rejoin) {
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
                        this.joinGroupCallInternal(chatId, groupCallId, stream, muted, rejoin);
                    }
                }
            });

            return;
        }

        await this.joinGroupCallInternal(chatId, groupCallId, stream, muted, rejoin);
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

    async joinGroupCallInternal(chatId, groupCallId, stream, muted, rejoin = false) {
        LOG_CALL('joinGroupCallInternal start', groupCallId);
        const connection = new RTCPeerConnection(null);
        connection.ontrack = event => {
            LOG_CALL('conn.ontrack', event);
            this.onTrack(event);
        };
        connection.onicecandidate = event => {
            // LOG_CALL('conn.onicecandidate', event);
        };
        connection.oniceconnectionstatechange = event => {
            LOG_CALL(`conn.oniceconnectionstatechange = ${connection.iceConnectionState}`, connection);

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
                    this.hangUp(groupCallId);
                    break;
                }
                case 'failed': {
                    this.hangUp(groupCallId);
                    break;
                }
                case 'new': {
                    break;
                }
            }
        };
        connection.ondatachannel = event => {
            // LOG_CALL(`conn.ondatachannel = ${connection.iceConnectionState}`);
        };
        if (stream) {
            stream.getTracks().forEach(track => {
                connection.addTrack(track, stream);
            });
        }

        let { currentGroupCall } = this;
        if (currentGroupCall && rejoin) {
            currentGroupCall.stream = stream;
            currentGroupCall.connection = connection;
            LOG_CALL('joinGroupCallInternal update currentGroupCall', groupCallId, currentGroupCall);
        } else {
            currentGroupCall = {
                chatId,
                groupCallId,
                stream,
                connection,
            }
            this.setCurrentGroupCall(currentGroupCall);
            LOG_CALL('joinGroupCallInternal set currentGroupCall', groupCallId, currentGroupCall);
        }

        const offerOptions = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 0,
        };
        const offer = await connection.createOffer(offerOptions);
        await connection.setLocalDescription(offer);
        const clientInfo = parseSdp(offer.sdp);
        const { ufrag, pwd, hash, setup, fingerprint, source } = clientInfo;
        const signSource = source << 0;

        if (!rejoin) {
            this.startConnectingSound(connection);
        }

        const request = {
            '@type': 'joinGroupCall',
            group_call_id: groupCallId,
            payload: {
                '@type': 'groupCallPayload',
                ufrag,
                pwd,
                fingerprints: [{ '@type': 'groupCallPayloadFingerprint', hash, setup: 'active', fingerprint }]
            },
            source: signSource,
            is_muted: muted
        };

        LOG_CALL('joinGroupCall', request);
        let result = null;
        try {
            result = await TdLibController.send(request);
            LOG_CALL(`joinGroupCall result connectionState=${connection.iceConnectionState}`, result);
        } catch (e) {
            ERROR_CALL('joinGroupCall error', e);
        }

        if (!result) {
            LOG_CALL('joinGroupCallInternal abort 0');
            this.closeConnectionAndStream(connection, stream);
            return;
        }
        if (connection.iceConnectionState !== 'new') {
            LOG_CALL(`joinGroupCallInternal abort 1 connectionState=${connection.iceConnectionState}`);
            this.closeConnectionAndStream(connection, stream);
            return;
        }
        if (this.currentGroupCall !== currentGroupCall) {
            LOG_CALL('joinGroupCallInternal abort 2', this.currentGroupCall, currentGroupCall);
            this.closeConnectionAndStream(connection, stream);
            return;
        }
        if (currentGroupCall.connection !== connection) {
            LOG_CALL('joinGroupCallInternal abort 3');
            this.closeConnectionAndStream(connection, stream);
            return;
        }

        const description = new LocalConferenceDescription();
        description.onSsrcs = () => {
            // LOG_CALL('desc.onSsrcs');
        };

        await TdLibController.send({
            '@type': 'loadGroupCallParticipants',
            group_call_id: groupCallId,
            limit: 5000
        });

        const participants = Array.from(this.participants.get(groupCallId).values())
        const meParticipant = participants.filter(x => x.source === signSource)[0];
        const otherParticipants = participants.filter(x => x.source !== signSource);
        // LOG_CALL('participants', [participants, meParticipant, otherParticipants]);

        const data1 = {
            transport: this.getTransport(result),
            ssrcs: [{ ssrc: meParticipant.source >>> 0, isMain: meParticipant.source === signSource, name: getUserFullName(meParticipant.user_id) }]
        };

        description.updateFromServer(data1);
        const sdp1 = description.generateSdp(true);

        await connection.setRemoteDescription({
            type: 'answer',
            sdp: sdp1,
        });

        const data2 = {
            transport: this.getTransport(result),
            ssrcs: participants.map(x => ({ ssrc: x.source >>> 0, isMain: x.source === signSource, name: getUserFullName(x.user_id) }))
        };

        description.updateFromServer(data2);
        const sdp2 = description.generateSdp();

        await connection.setRemoteDescription({
            type: 'offer',
            sdp: sdp2,
        });
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);

        LOG_CALL('joinGroupCallInternal stop', groupCallId);
    }

    async hangUp(groupCallId, discard = false, rejoin = false) {
        LOG_CALL(`hangUp start id=${groupCallId} discard=${discard} rejoin=${rejoin}`);
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;
        if (currentGroupCall.groupCallId !== groupCallId) return;

        if (!rejoin) {
            this.setCurrentGroupCall(null);
            this.stopConnectingSound(null);
        }

        const { connection, stream } = currentGroupCall;
        this.closeConnectionAndStream(connection, stream);

        document.getElementById('players').innerHTML = '';

        if (discard) {
            LOG_CALL(`hangUp discard id=${groupCallId}`);
            await TdLibController.send({
                '@type': 'discardGroupCall',
                group_call_id: groupCallId
            });
            return;
        }

        const groupCall = this.get(groupCallId);
        if (groupCall && groupCall.is_joined) {
            LOG_CALL(`hangUp leave id=${groupCallId}`);
            await TdLibController.send({
                '@type': 'leaveGroupCall',
                group_call_id: groupCallId
            });
            return;
        }

        LOG_CALL(`hangUp join payload=null id=${groupCallId}`);
        await TdLibController.send({
            '@type': 'joinGroupCall',
            group_call_id: groupCallId,
            payload: null
        });
    }

    closeConnectionAndStream(connection, stream) {
        try {
            if (connection) {
                connection.close();
            }
        } catch (e) {
            LOG_CALL('hangUp error 1', e);
        }

        try {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
        } catch (e) {
            LOG_CALL('hangUp error 2', e);
        }
    }

    async leaveGroupCall(chatId, groupCallId) {
        LOG_CALL('leaveGroupCall', chatId, groupCallId);
        const manageVoiceCalls = canManageVoiceChats(chatId);
        if (manageVoiceCalls) {
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

    getTransport(response) {
        const { payload, candidates } = response;

        const { ufrag, pwd, fingerprints } = payload;

        return {
            ufrag,
            pwd,
            fingerprints,
            candidates
        };
    }

    tryAddTrack(event) {
        const stream = event.streams[0];
        const endpoint = stream.id.substring(6);

        const players = document.getElementById('players');
        if (!players) return;

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
            audio.autoplay = true;
            audio.controls = true;
            audio.srcObject = stream;
            audio.volume = 1.0;
            players.appendChild(audio);
            audio.play();
        }
    }

    onTrack(event) {
        this.tryAddTrack(event);
    }

    isMuted() {
        const { currentGroupCall } = this;
        if (!currentGroupCall) return true;

        const { groupCallId, stream } = currentGroupCall;
        if (!stream) return true;

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
            return !audioTracks[0].enabled;
        }

        return true;
    }

    changeMuted(muted) {
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;

        const { groupCallId, stream } = currentGroupCall;
        if (!stream) return;

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].enabled = !muted;
        }

        TdLibController.send({
            '@type': 'toggleGroupCallParticipantIsMuted',
            group_call_id: groupCallId,
            user_id: UserStore.getMyId(),
            is_muted: muted
        });
    }
}

const store = new CallStore();
window.call = store;
export default store;
