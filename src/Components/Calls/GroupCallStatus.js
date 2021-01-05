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
        isEmpty: true
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { isEmpty } = this.state;

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
            const chat = ChatStore.get(id);
            if (chat) {
                const { is_voice_chat_empty } = chat;
                isEmpty = is_voice_chat_empty;
            }

            return {
                prevChatId: chatId,
                isEmpty
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
        const chat = ChatStore.get(id);
        if (chat) {
            const { is_voice_chat_empty } = chat;
            isEmpty = is_voice_chat_empty;
        }

        this.setState({ isEmpty });
    };

    render() {
        const { isEmpty } = this.state;

        return (
            <div className={classNames('group-call-status', { 'group-call-status-active': !isEmpty })}>

            </div>
        );
    }
}

GroupCallStatus.propTypes = {
    chatId: PropTypes.number
};

export default GroupCallStatus;