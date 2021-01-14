/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ChatStore from '../../Stores/ChatStore';
import './GroupCallStatus.css';

class GroupCallStatus extends React.Component {
    state = {
        isEmpty: true,
        hasGroupCall: false
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { hasGroupCall, isEmpty } = this.state;

        if (nextState.hasGroupCall !== hasGroupCall) {
            return true;
        }

        if (nextState.isEmpty !== isEmpty) {
            return true;
        }

        return false;
    }

    static getDerivedStateFromProps(props, state) {
        const { chatId } = props;
        const { prevChatId } = state;

        if (prevChatId !== chatId) {
            let isEmpty = false;
            let hasGroupCall = false;
            const chat = ChatStore.get(chatId);
            if (chat) {
                const { is_voice_chat_empty, voice_chat_group_call_id } = chat;
                isEmpty = is_voice_chat_empty;
                hasGroupCall = Boolean(voice_chat_group_call_id);
            }

            return {
                prevChatId: chatId,
                isEmpty,
                hasGroupCall
            };
        }

        return null;
    }

    componentDidMount() {
        ChatStore.on('updateChatVoiceChat', this.onUpdateChatVoiceChat);
    }

    componentWillUnmount() {
        ChatStore.off('updateChatVoiceChat', this.onUpdateChatVoiceChat);
    }

    onUpdateChatVoiceChat = update => {
        const { chatId } = this.props;
        const { chat_id } = update;

        if (chat_id !== chatId) return;

        let isEmpty = false;
        let hasGroupCall = false;
        const chat = ChatStore.get(chatId);
        if (chat) {
            const { is_voice_chat_empty, voice_chat_group_call_id } = chat;
            isEmpty = is_voice_chat_empty;
            hasGroupCall = Boolean(voice_chat_group_call_id);
        }

        this.setState({ isEmpty, hasGroupCall });
    };

    render() {
        const { isEmpty, hasGroupCall } = this.state;
        if (!hasGroupCall) return null;

        return (
            <div className={classNames('group-call-status', { 'group-call-status-active': !isEmpty })}>
                <div className='group-call-status-icon'>
                    <div className='group-call-status-indicator' >
                        <div className={classNames('group-call-status-bar', 'group-call-status-bar1')}/>
                        <div className={classNames('group-call-status-bar', 'group-call-status-bar2')}/>
                        <div className={classNames('group-call-status-bar', 'group-call-status-bar1')}/>

                    </div>
                </div>
            </div>
        );
    }
}

GroupCallStatus.propTypes = {
    chatId: PropTypes.number
};

export default GroupCallStatus;