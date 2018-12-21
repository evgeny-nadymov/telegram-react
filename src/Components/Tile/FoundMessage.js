/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ChatTileControl from './ChatTileControl';
import UserTileControl from './UserTileControl';
import DialogTitleControl from './DialogTitleControl';
import { getMessageDate, getMessageSenderFullName, getMessageSenderName } from '../../Utils/Chat';
import { getContent } from '../../Utils/Message';
import MessageStore from '../../Stores/MessageStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import './FoundMessage.css';

class FoundMessage extends React.PureComponent {

    constructor(props){
        super(props);

        this.state = {
            chatId: ApplicationStore.getChatId(),
            messageId: ApplicationStore.getMessageId()
        };
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = (update) => {
        const { nextChatId, nextMessageId } = update;

        this.setState({
            chatId: nextChatId,
            messageId: nextMessageId
        });
    };

    render() {
        const { chatId, messageId, chatSearch } = this.props;
        const selectedChatId = this.state.chatId;
        const selectedMessageId = this.state.messageId;
        const message = MessageStore.get(chatId, messageId);

        const { sender_user_id } = message;

        const date = getMessageDate(message);
        const senderName = getMessageSenderName(message);
        const senderFullName = getMessageSenderFullName(message);
        const content = getContent(message) || '\u00A0';

        const tile = sender_user_id && chatSearch
            ? <UserTileControl userId={sender_user_id}/>
            : <ChatTileControl chatId={chatId}/>;

        return (
            <div className={classNames('found-message', { 'accent-background': chatId === selectedChatId && messageId === selectedMessageId })}>
                {tile}
                <div className='dialog-inner-wrapper'>
                    <div className='tile-first-row'>
                        {   chatSearch && senderFullName
                            ? <div className='dialog-title'>{senderFullName}</div>
                            : <DialogTitleControl chatId={chatId}/>
                        }
                        <div className='dialog-meta-date'>{date}</div>
                    </div>
                    <div className='tile-second-row'>
                        <div className='dialog-content'>
                            {
                                <>
                                    { !chatSearch && senderName && <span className='dialog-content-accent'>{senderName}: </span> }
                                    { content }
                                </>
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

FoundMessage.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    chatSearch: PropTypes.bool
};

export default FoundMessage;