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
import TdLibController from '../Controllers/TdLibController';

export function LOG_CALL(str, ...data) {
    console.log('[call] ' + str, data);
}

export function ERROR_CALL(str, ...data) {
    console.error('[call] ' + str, data);
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

                const { user_id } = participant;
                participants.set(user_id, participant);

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

                this.emit('clientUpdateGroupCall', update);
                break;
            }
            case 'clientUpdateGroupCallConnectionState': {
                this.emit('clientUpdateGroupCallConnectionState', update);
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
        LOG_CALL('joinGroupCall', groupCallId, muted);

        let stream = null;
        try {
            stream = await getStream({ audio: true, video: false }, muted);
        } catch (e) {
            ERROR_CALL('getStream', e);
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

        const muted = true;
        this.hangUp(groupCallId, false, true);
        this.joinGroupCall(chatId, groupCallId, muted, true);
    }

    async joinGroupCallInternal(chatId, groupCallId, stream, muted, rejoin = false) {
        LOG_CALL('joinGroupCallInternal start', groupCallId);
        const connection = new RTCPeerConnection(null);
        connection.ontrack = event => {
            // LOG_CALL('conn.ontrack', event);
            this.onTrack(event);
        };
        connection.onicecandidate = event => {
            // LOG_CALL('conn.onicecandidate', event);
        };
        connection.oniceconnectionstatechange = event => {
            LOG_CALL(`conn.oniceconnectionstatechange = ${connection.iceConnectionState}`, connection, connection.getSenders(), connection.getReceivers());

            TdLibController.clientUpdate({
                '@type': 'clientUpdateGroupCallConnectionState',
                state: connection.iceConnectionState,
                groupCallId
            });

            if (connection.iceConnectionState === 'disconnected') {
                this.hangUp(groupCallId);
            }
        };
        connection.ondatachannel = event => {
            // LOG_CALL(`conn.ondatachannel = ${connection.iceConnectionState}`);
        };
        if (stream) {
            stream.getTracks().forEach((track) => {
                // LOG_CALL('conn.addTrack', [track, stream]);
                connection.addTrack(track, stream);
            });
        }

        if (this.currentGroupCall && rejoin) {
            this.currentGroupCall.stream = stream;
            this.currentGroupCall.connection = connection;
            LOG_CALL('joinGroupCallInternal update current', groupCallId, this.currentGroupCall);
        } else {
            this.setCurrentGroupCall({
                chatId,
                groupCallId,
                stream,
                connection,
            });
            LOG_CALL('joinGroupCallInternal set current', groupCallId, this.currentGroupCall);
        }

        // LOG_CALL('conn', connection);
        const offerOptions = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 0,
        };
        const offer = await connection.createOffer(offerOptions);
        // LOG_CALL('conn.setLocalDescription offer', offer, offer.sdp);

        await connection.setLocalDescription(offer);

        const clientInfo = parseSdp(offer.sdp);
        // LOG_CALL('clientInfo', clientInfo);

        const { ufrag, pwd, hash, setup, fingerprint, source } = clientInfo;
        const signSource = source << 0;

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

        // LOG_CALL('joinGroupCallInternal request', request);
        const result = await TdLibController.send(request);
        // LOG_CALL('joinGroupCallInternal result', result);

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
        // LOG_CALL('data1', data1);

        description.updateFromServer(data1);
        const sdp1 = description.generateSdp(true);

        // LOG_CALL('conn.setRemoteDescription answer', sdp1);
        await connection.setRemoteDescription({
            type: 'answer',
            sdp: sdp1,
        });

        const data2 = {
            transport: this.getTransport(result),
            ssrcs: participants.map(x => ({ ssrc: x.source >>> 0, isMain: x.source === signSource, name: getUserFullName(x.user_id) }))
        };
        // LOG_CALL('data2', data2);

        description.updateFromServer(data2);
        const sdp2 = description.generateSdp();
        // LOG_CALL('conn.setRemoteDescription offer', sdp2);

        await connection.setRemoteDescription({
            type: 'offer',
            sdp: sdp2,
        });

        const answer = await connection.createAnswer();
        // LOG_CALL('conn.setLocalDescription answer', [answer, answer.sdp]);
        await connection.setLocalDescription(answer);

        // const clientInfo2 = parseSdp(answer.sdp);

        LOG_CALL('joinGroupCallInternal finish', groupCallId);
    }

    async hangUp(groupCallId, discard = false, rejoin = false) {
        LOG_CALL('hangUp', groupCallId, discard);
        const { currentGroupCall } = this;
        if (!currentGroupCall) return;
        if (currentGroupCall.groupCallId !== groupCallId) return;

        if (!rejoin) {
            this.setCurrentGroupCall(null);
        }

        const { connection, stream } = currentGroupCall;

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

        document.getElementById('players').innerHTML = '';

        if (discard) {
            LOG_CALL('hangUp discard', groupCallId);
            await TdLibController.send({
                '@type': 'discardGroupCall',
                group_call_id: groupCallId
            });
        } else {
            const groupCall = this.get(groupCallId);
            LOG_CALL('hangUp leave', groupCallId, groupCall && groupCall.is_joined);
            if (groupCall && groupCall.is_joined) {
                await TdLibController.send({
                    '@type': 'leaveGroupCall',
                    group_call_id: groupCallId
                });
            }
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

                    if (result.discard) {
                        await this.hangUp(groupCallId, true);
                    } else {
                        await this.hangUp(groupCallId);
                    }
                }
            });
            return;
        }

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
            audio.autoplay = 'true';
            audio.controls = 'controls';
            audio.srcObject = stream;
            audio.volume = 1.0;
            players.appendChild(audio);
            audio.play();
        }
    }

    onTrack(event) {
        this.tryAddTrack(event);
    }
}

const store = new CallStore();
window.call = store;
export default store;
