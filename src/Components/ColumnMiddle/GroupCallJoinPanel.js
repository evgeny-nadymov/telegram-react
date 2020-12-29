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
import './GroupCallJoinPanel.css';
import CallStore, { ERROR_CALL, LOG_CALL } from '../../Stores/CallStore';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';
import { getStream } from '../../Calls/Utils';
import { showAlert } from '../../Actions/Client';
import LStore from '../../Stores/LocalizationStore';

class GroupCallJoinPanel extends React.Component {
    constructor(props) {
        super(props);

        const { chatId } = props;
        const { currentGroupCall } = CallStore;
        const call = currentGroupCall && currentGroupCall.chatId === chatId ? currentGroupCall : null;

        this.state = { call };
    }

    componentDidMount() {
        CallStore.on('clientUpdateGroupCall', this.handleClientUpdateGroupCall);
        CallStore.on('updateGroupCall', this.handleClientUpdateGroupCall);
    }

    componentWillUnmount() {
        CallStore.off('clientUpdateGroupCall', this.handleClientUpdateGroupCall);
        CallStore.off('updateGroupCall', this.handleClientUpdateGroupCall);
    }

    handleClientUpdateGroupCall = update => {
        const { chatId } = this.props;

        const { currentGroupCall } = CallStore;
        const call = currentGroupCall && currentGroupCall.chatId === chatId ? currentGroupCall : null;

        this.setState({ call });
    };

    handleJoin = async () => {
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
        const { t } = this.props;
        const { call } = this.state;
        if (call) return null;

        return (
            <div className='group-call-join-panel' onClick={this.handleJoin}>
                <div className='group-call-join-panel-content'>
                    <div className='group-call-join-panel-title'>{t('VoipGroupVoiceChat')}</div>
                    <div className='group-call-join-panel-subtitle'>{t('MembersTalkingNobody')}</div>
                </div>
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