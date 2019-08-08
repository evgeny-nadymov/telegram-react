/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import './MessageStatus.css';
import PropTypes from 'prop-types';

const styles = theme => ({
    messageStatusFailed: {
        background: theme.palette.error.light
    },
    messageStatusPending: {
        background: theme.palette.primary.light
    },
    messageStatusSucceeded: {
        background: theme.palette.primary.light
    }
});

class MessageStatus extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            prevChatId: props.chatId,
            prevMessageId: props.messageId,
            sendingState: props.sendingState,
            unread: true
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId || props.messageId !== state.prevMessageId) {
            return {
                prevChatId: props.chatId,
                prevMessageId: props.messageId,
                sendingState: props.sendingState
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
        ChatStore.removeListener('updateChatReadOutbox', this.onUpdateChatReadOutbox);

        MessageStore.removeListener('updateMessageSendFailed', this.onUpdateMessageSend);
        MessageStore.removeListener('updateMessageSendSucceeded', this.onUpdateMessageSend);
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
        const { classes } = this.props;
        const { sendingState, unread } = this.state;

        let stateClassName = classNames('message-status-succeeded', classes.messageStatusSucceeded);
        if (sendingState) {
            stateClassName =
                sendingState['@type'] === 'messageSendingStateFailed'
                    ? classNames('message-status-failed', classes.messageStatusFailed)
                    : classNames('message-status-pending', classes.messageStatusPending);
        }

        return unread && <i className={classNames('message-status-icon', stateClassName)} />;
    }
}

MessageStatus.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    sendingState: PropTypes.object
};

export default withStyles(styles, { withTheme: true })(MessageStatus);
