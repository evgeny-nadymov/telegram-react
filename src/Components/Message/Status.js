/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ErrorIcon from '../../Assets/Icons/Error';
import PendingIcon from '../../Assets/Icons/Pending';
import SentIcon from '../../Assets/Icons/Sent';
import SucceededIcon from '../../Assets/Icons/Succeeded';
import { isMessageUnread } from '../../Utils/Message';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import './Status.css';

class Status extends React.Component {
    state = {};

    static getDerivedStateFromProps(props, state) {
        const { chatId, messageId } = props;

        const message = MessageStore.get(chatId, messageId);
        const sendingState = message ? message.sending_state : null;

        if (chatId !== state.prevChatId || messageId !== state.prevMessageId) {
            return {
                prevChatId: chatId,
                prevMessageId: messageId,
                sendingState,
                unread: isMessageUnread(chatId, messageId)
            };
        }

        return null;
    }

    componentDidMount() {
        ChatStore.on('updateChatReadOutbox', this.onUpdateChatReadOutbox);

        MessageStore.on('updateMessageSendFailed', this.onUpdateMessageSend);
        MessageStore.on('updateMessageSendSucceeded', this.onUpdateMessageSend);
    }

    componentWillUnmount() {
        ChatStore.off('updateChatReadOutbox', this.onUpdateChatReadOutbox);

        MessageStore.off('updateMessageSendFailed', this.onUpdateMessageSend);
        MessageStore.off('updateMessageSendSucceeded', this.onUpdateMessageSend);
    }

    onUpdateMessageSend = update => {
        const { chatId, messageId } = this.props;
        const { old_message_id, message } = update;

        if (messageId !== old_message_id) return;
        if (!message) return;

        const { chat_id, id, sending_state } = message;
        if (chatId !== chat_id) return;

        this.newMessageId = id;
        this.setState({ sendingState: sending_state });
    };

    onUpdateChatReadOutbox = update => {
        const { chatId, messageId } = this.props;
        const { chat_id, last_read_outbox_message_id } = update;
        const { newMessageId } = this;

        if (chatId !== chat_id) return;

        if ((newMessageId && newMessageId <= last_read_outbox_message_id) || messageId <= last_read_outbox_message_id) {
            this.setState({ sendingState: null, unread: false });
        }
    };

    render() {
        const { sendingState, unread } = this.state;
        if (!unread) {
            return <SucceededIcon className='status' viewBox='0 0 17 10' style={{ width: 16, height: 9 }} />;
        }

        if (sendingState) {
            return sendingState['@type'] === 'messageSendingStateFailed' ? (
                <ErrorIcon
                    className='status'
                    viewBox='0 0 14 14'
                    style={{ width: 16, height: 12, transform: 'translate(0, 1px)' }}
                />
            ) : (
                <PendingIcon
                    className='status'
                    viewBox='0 0 14 14'
                    style={{ width: 16, height: 12, transform: 'translate(0, 1px)', stroke: 'currentColor' }}
                />
            );
        }

        return <SentIcon className='status' viewBox='0 0 12 10' style={{ width: 16, height: 9 }} />;
    }
}

Status.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired
};

export default Status;
