/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import ListItem from '@material-ui/core/ListItem';
import ChatTile from './ChatTile';
import UserTile from './UserTile';
import DialogTitle from './DialogTitle';
import { getMessageDate, getMessageSenderFullName, getMessageSenderName } from '../../Utils/Chat';
import { getContent } from '../../Utils/Message';
import AppStore from '../../Stores/ApplicationStore';
import MessageStore from '../../Stores/MessageStore';
import './FoundMessage.css';

class FoundMessage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nextChatId: AppStore.getChatId(),
            nextMessageId: AppStore.getMessageId()
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId } = this.props;

        if (nextState.nextChatId === chatId && nextState.nextMessageId === messageId) {
            return true;
        }

        if (nextState.previousChatId === chatId && nextState.previousMessageId === messageId) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = update => {
        this.setState({
            ...update
        });
    };

    render() {
        const { chatId, messageId, chatSearch, onClick, t } = this.props;
        const selectedChatId = this.state.nextChatId;
        const selectedMessageId = this.state.nextMessageId;
        const message = MessageStore.get(chatId, messageId);

        const { sender_user_id } = message;

        const date = getMessageDate(message);
        const senderName = getMessageSenderName(message, t);
        const senderFullName = getMessageSenderFullName(message, t);
        const content = getContent(message, t) || '\u00A0';
        const selected = chatId === selectedChatId && messageId === selectedMessageId;

        const tile =
            sender_user_id && chatSearch ? (
                <UserTile userId={sender_user_id} dialog />
            ) : (
                <ChatTile chatId={chatId} dialog />
            );

        return (
            <ListItem button className={classNames('found-message', { 'item-selected': selected })} onClick={onClick}>
                <div className='dialog-wrapper'>
                    {tile}
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            {chatSearch && senderFullName ? (
                                <div className='dialog-title'>{senderFullName}</div>
                            ) : (
                                <DialogTitle chatId={chatId} />
                            )}
                            <div className='dialog-meta'>{date}</div>
                        </div>
                        <div className='tile-second-row'>
                            <div className='dialog-content'>
                                {
                                    <>
                                        {!chatSearch && senderName && (
                                            <span className='dialog-content-accent'>{senderName}: </span>
                                        )}
                                        {content}
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </ListItem>
        );
    }
}

FoundMessage.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    chatSearch: PropTypes.bool,
    onClick: PropTypes.func
};

export default withTranslation()(FoundMessage);
