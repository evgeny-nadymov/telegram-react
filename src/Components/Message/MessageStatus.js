/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import MessageStore from '../../Stores/MessageStore';
import ChatStore from '../../Stores/ChatStore';
import './MessageStatus.css';

class MessageStatus extends React.Component {
    constructor(props) {
        super(props);
        this.handleUpdateMessageSend = this.handleUpdateMessageSend.bind(this);
        this.handleUpdateChatReadOutbox = this.handleUpdateChatReadOutbox.bind(this);

        this.state = {
            sendingState: props.sendingState,
            unread: true
        };
    }

    componentDidMount() {
        MessageStore.on('updateMessageSendFailed', this.handleUpdateMessageSend);
        MessageStore.on('updateMessageSendSucceeded', this.handleUpdateMessageSend);

        ChatStore.on('updateChatReadOutbox', this.handleUpdateChatReadOutbox);
    }

    handleUpdateMessageSend(payload) {
        if (this.props.messageId === payload.old_message_id && payload.message) {
            this.newMessageId = payload.message.id;
            this.setState({ sendingState: payload.message.sending_state });
        }
    }

    handleUpdateChatReadOutbox(payload) {
        if (
            this.props.chatId === payload.chat_id &&
            ((this.props.newMessageId && this.props.newMessageId <= payload.last_read_outbox_message_id) ||
                this.props.messageId <= payload.last_read_outbox_message_id)
        ) {
            this.setState({ sendingState: null, unread: false });
        }
    }

    componentWillUnmount() {
        MessageStore.removeListener('updateMessageSendFailed', this.handleUpdateMessageSend);
        MessageStore.removeListener('updateMessageSendSucceeded', this.handleUpdateMessageSend);

        ChatStore.removeListener('updateChatReadOutbox', this.handleUpdateChatReadOutbox);
    }

    render() {
        let stateClassName = 'messagestatus-succeded';
        if (this.state.sendingState) {
            stateClassName =
                this.state.sendingState['@type'] === 'messageSendingStateFailed'
                    ? 'messagestatus-failed'
                    : 'messagestatus-pending';
        }

        return this.state.unread && <i className={classNames('messagestatus-icon', stateClassName)} />;
    }
}

export default MessageStatus;
