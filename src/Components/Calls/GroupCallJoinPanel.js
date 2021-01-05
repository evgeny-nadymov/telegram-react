/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import GroupCallJoinPanelSubtitle from './GroupCallJoinPanelSubtitle';
import GroupCallRecentParticipants from './GroupCallRecentParticipants';
import { getStream } from '../../Calls/Utils';
import { showAlert } from '../../Actions/Client';
import CallStore, { ERROR_CALL, LOG_CALL } from '../../Stores/CallStore';
import ChatStore from '../../Stores/ChatStore';
import LStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './GroupCallJoinPanel.css';

class GroupCallJoinPanel extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId } = props;
        const { prevChatId } = state;

        if (prevChatId !== chatId) {
            const chat = ChatStore.get(chatId);

            let groupCallId = 0;
            if (chat) {
                const { voice_chat_group_call_id } = chat;
                groupCallId = voice_chat_group_call_id;
            }

            const { currentGroupCall } = CallStore;
            const isCurrent = currentGroupCall && currentGroupCall.chatId === chatId;

            return {
                prevChatId: chatId,
                groupCallId,
                isCurrent
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { isCurrent, groupCallId } = this.state;

        if (nextState.groupCallId !== groupCallId) {
            return true;
        }

        if (nextState.isCurrent !== isCurrent) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        CallStore.on('clientUpdateGroupCall', this.handleClientUpdateGroupCall);
        CallStore.on('updateGroupCall', this.handleUpdateGroupCall);
    }

    componentWillUnmount() {
        CallStore.off('clientUpdateGroupCall', this.handleClientUpdateGroupCall);
        CallStore.off('updateGroupCall', this.handleUpdateGroupCall);
    }

    handleUpdateGroupCall = update => {
        const { group_call } = update;

        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const { voice_chat_group_call_id } = chat;
        if (group_call && group_call.id !== voice_chat_group_call_id) return;

        this.setState({
            groupCallId: group_call ? group_call.id : 0
        });
    };

    handleClientUpdateGroupCall = update => {
        const { chatId } = this.props;

        const { currentGroupCall } = CallStore;
        const isCurrent = currentGroupCall && currentGroupCall.chatId === chatId;

        this.setState({ isCurrent });
    };

    handleJoin = async () => {
        const { chatId } = this.props;
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
        LOG_CALL('groupCall', groupCall);
        if (!groupCall) return;

        const { is_joined } = groupCall;
        if (is_joined) return;

        const muted = true;
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

        await CallStore.joinGroupCall(chatId, voice_chat_group_call_id, stream, muted);
    };

    render() {
        const { chatId, t } = this.props;
        if (!chatId) return null;

        const { groupCallId, isCurrent } = this.state;
        if (!groupCallId) return null;
        if (isCurrent) return null;

        return (
            <div className='group-call-join-panel' onClick={this.handleJoin}>
                <div className='group-call-join-panel-content'>
                    <div className='group-call-join-panel-title'>{t('VoipGroupVoiceChat')}</div>
                    <GroupCallJoinPanelSubtitle id={groupCallId}/>
                </div>
                <GroupCallRecentParticipants id={groupCallId}/>
                <Button className='group-call-join-panel-button' variant='contained' color='primary' disableElevation>
                    {t('VoipChatJoin')}
                </Button>
            </div>
        );
    }
}

GroupCallJoinPanel.propTypes = {
    chatId: PropTypes.number
};

export default withTranslation()(GroupCallJoinPanel);