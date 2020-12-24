/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BlockIcon from '../../Assets/Icons/Block';
import BroomIcon from '../../Assets/Icons/Broom';
import DeleteIcon from '../../Assets/Icons/Delete';
import GroupIcon from '../../Assets/Icons/Group';
import LocalConferenceDescription from '../../Calls/LocalConferenceDescription';
import MoreVertIcon from '../../Assets/Icons/More';
import UnpinIcon from '../../Assets/Icons/PinOff';
import UserIcon from '../../Assets/Icons/User';
import { canClearHistory, canDeleteChat, getViewInfoTitle, isPrivateChat, getDeleteChatTitle, hasOnePinnedMessage, canSwitchBlocked, getChatSender } from '../../Utils/Chat';
import { clearHistory, leaveChat } from '../../Actions/Chat';
import { getUserFullName } from '../../Utils/User';
import { parseSdp } from '../../Calls/Utils';
import { requestBlockSender, unblockSender } from '../../Actions/Message';
import { requestUnpinMessage } from '../../Actions/Client';
import AppStore from '../../Stores/ApplicationStore';
import CallStore from '../../Stores/CallStore';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './MainMenuButton.css';

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.tracks = [];
        this.audios = [];
        this.participants = [];

        this.state = {
            anchorEl: null
        };
    }

    handleButtonClick = async event => {
        const { currentTarget: anchorEl } = event;

        const chatId = AppStore.getChatId();
        const chat = await TdLibController.send({ '@type': 'getChat', chat_id: chatId });
        ChatStore.set(chat);

        this.setState({ anchorEl });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleChatInfo = () => {
        this.handleMenuClose();
        setTimeout(() => this.props.openChatDetails(), 150);
    };

    handleClearHistory = () => {
        this.handleMenuClose();

        clearHistory(AppStore.getChatId());
    };

    handleDeleteChat = () => {
        this.handleMenuClose();

        leaveChat(AppStore.getChatId());
    };

    handleUnpin = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();

        const media = MessageStore.getMedia(chatId);
        if (!media) return false;

        const { pinned } = media;
        if (!pinned) return false;
        if (pinned.length !== 1) return false;

        requestUnpinMessage(chatId, pinned[0].id);
    };

    handleSwitchBlocked = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const sender = getChatSender(chatId);
        const { is_blocked } = chat;
        if (is_blocked) {
            unblockSender(sender);
        } else {
            requestBlockSender(sender);
        }
    };

    handleGroupCall = async () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { voice_chat_group_call_id } = chat;
        let groupCall = CallStore.get(voice_chat_group_call_id);
        if (!groupCall) {
            groupCall = await TdLibController.send({
                '@type': 'getGroupCall',
                group_call_id: voice_chat_group_call_id
            });
        }
        console.log('[call] groupCall', groupCall);
        if (!groupCall) return;

        const { is_joined } = groupCall;
        if (is_joined) {
            this.leaveGroupCall(voice_chat_group_call_id);
        } else {
            const stream = await navigator.mediaDevices.getUserMedia ({ audio: true, video: false });
            stream.getTracks().forEach(x => {
                x.onmute = x => {
                    console.log('[call] track.onmute', x);
                };
                x.onunmute = x => {
                    console.log('[call] track.onunmute', x);
                };

                x.enabled = false;
            });

            this.stream = stream;
            console.log('[call] getUserMedia result', stream);
            this.joinGroupCall(voice_chat_group_call_id, stream);
        }

        // await TdLibController.send({
        //     '@type': 'loadGroupCallParticipants',
        //     group_call_id: voice_chat_group_call_id,
        //     limit: 5000
        // })
    }

    async leaveGroupCall(groupCallId) {
        console.log('[call] leaveGroupCall', groupCallId);
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }

        let groupCall = CallStore.get(groupCallId);
        if (groupCall && groupCall.is_joined) {
            await TdLibController.send({
                '@type': 'leaveGroupCall',
                group_call_id: groupCallId
            });
        }
    }

    async joinGroupCall(groupCallId, stream) {
        const connection = new RTCPeerConnection(null);
        this.connection = connection;
        connection.ontrack = event => {
            console.log('[call] conn.ontrack', event);
            this.onTrack(event);
        };
        connection.onicecandidate = event => {
            console.log('[call] conn.onicecandidate', event);
        };
        connection.oniceconnectionstatechange = event => {
            console.log(`[call] conn.oniceconnectionstatechange = ${connection.iceConnectionState}`, connection, connection.getSenders(), connection.getReceivers());
            if (connection.iceConnectionState === 'disconnected') {
                this.leaveGroupCall(groupCallId);
            }
        };
        connection.ondatachannel = event => {
            console.log(`[call] conn.ondatachannel = ${connection.iceConnectionState}`);
        };
        if (stream) {
            stream.getTracks().forEach((track) => {
                console.log('[call] conn.addTrack', [track, stream]);
                connection.addTrack(track, stream);
            });
        }
        console.log('[call] conn', connection);
        const offerOptions = {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 0,
        };
        const offer = await connection.createOffer(offerOptions);
        console.log('[call] conn.setLocalDescription offer', offer, offer.sdp);

        await connection.setLocalDescription(offer);

        const clientInfo = parseSdp(offer.sdp);
        console.log('[call] clientInfo', clientInfo);

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
            is_muted: true
        };

        console.log('[call] joinGroupCall request', request);
        const result = await TdLibController.send(request);
        console.log('[call] joinGroupCall result', result);

        const description = new LocalConferenceDescription();
        description.onSsrcs = () => { console.log('[call] desc.onSsrcs'); };

        await TdLibController.send({
            '@type': 'loadGroupCallParticipants',
            group_call_id: groupCallId,
            limit: 5000
        });

        const participants = Array.from(CallStore.participants.get(groupCallId).values())
        const meParticipant = participants.filter(x => x.source === signSource)[0];
        const otherParticipants = participants.filter(x => x.source !== signSource);
        console.log('[call] participants', [participants, meParticipant, otherParticipants]);

        const data1 = {
            transport: this.getTransport(result),
            ssrcs: [{ ssrc: meParticipant.source >>> 0, isMain: meParticipant.source === signSource, name: getUserFullName(meParticipant.user_id) }]
        };
        console.log('[call] data1', data1);

        description.updateFromServer(data1);
        const sdp1 = description.generateSdp(true);

        console.log('[call] conn.setRemoteDescription answer', sdp1);
        await connection.setRemoteDescription({
            type: 'answer',
            sdp: sdp1,
        });

        const data2 = {
            transport: this.getTransport(result),
            ssrcs: participants.map(x => ({ ssrc: x.source >>> 0, isMain: x.source === signSource, name: getUserFullName(x.user_id) }))
        };
        console.log('[call] data2', data2);

        description.updateFromServer(data2);
        const sdp2 = description.generateSdp();
        console.log('[call] conn.setRemoteDescription offer', sdp2);

        await connection.setRemoteDescription({
            type: 'offer',
            sdp: sdp2,
        });

        const answer = await connection.createAnswer();
        console.log('[call] conn.setLocalDescription answer', [answer, answer.sdp]);
        await connection.setLocalDescription(answer);

        const clientInfo2 = parseSdp(answer.sdp);
        console.log('[call] clientInfo 2', clientInfo2);
    }

    getTransport(responce) {
        const { payload, candidates } = responce;

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

        const { audios } = this;

        let handled;
        for (let audio of audios) {
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
            document.getElementById('players').appendChild(audio);
            audios.push(audio);
            audio.play();
        }

        // this.tracks.push(event);
    }

    onTrack(event) {
        this.tryAddTrack(event);
    }

    render() {
        const { t } = this.props;
        const { anchorEl } = this.state;

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { is_blocked, voice_chat_group_call_id } = chat;

        const clearHistory = canClearHistory(chatId);
        const deleteChat = canDeleteChat(chatId);
        const deleteChatTitle = getDeleteChatTitle(chatId, t);
        const unpinMessage = hasOnePinnedMessage(chatId);
        const switchBlocked = canSwitchBlocked(chatId);

        const groupCall = CallStore.get(voice_chat_group_call_id);

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    aria-label='Menu'
                    onClick={this.handleButtonClick}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}>
                    { Boolean(voice_chat_group_call_id) && (
                        <MenuItem onClick={this.handleGroupCall}>
                            <ListItemIcon>
                            </ListItemIcon>
                            <ListItemText primary={groupCall && groupCall.is_joined ? t('VoipGroupLeave') : t('VoipChatJoin')} />
                        </MenuItem>
                    )}
                    <MenuItem onClick={this.handleChatInfo}>
                        <ListItemIcon>
                            {isPrivateChat(chatId) ? <UserIcon /> : <GroupIcon />}
                        </ListItemIcon>
                        <ListItemText primary={getViewInfoTitle(chatId, t)} />
                    </MenuItem>
                    {clearHistory && (
                        <MenuItem onClick={this.handleClearHistory}>
                            <ListItemIcon>
                                <BroomIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('ClearHistory')} />
                        </MenuItem>
                    )}
                    {deleteChat && deleteChatTitle && (
                        <MenuItem onClick={this.handleDeleteChat}>
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText primary={deleteChatTitle} />
                        </MenuItem>
                    )}
                    {unpinMessage && (
                        <MenuItem onClick={this.handleUnpin}>
                            <ListItemIcon>
                                <UnpinIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('UnpinMessageAlertTitle')} />
                        </MenuItem>
                    )}
                    {switchBlocked && (
                        <MenuItem onClick={this.handleSwitchBlocked}>
                            <ListItemIcon>
                                <BlockIcon />
                            </ListItemIcon>
                            <ListItemText primary={is_blocked ? t('Unblock') : t('BlockContact')} />
                        </MenuItem>
                    )}
                </Menu>
            </>
        );
    }
}

export default withTranslation()(MainMenuButton);
