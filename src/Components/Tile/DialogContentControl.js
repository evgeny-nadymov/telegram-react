/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {
    getChatTypingString,
    getChatDraft,
    getLastMessageSenderName,
    getLastMessageContent
} from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import './DialogContentControl.css';

class DialogContentControl extends React.Component {
    constructor(props){
        super(props);

        this.onUpdate = this.onUpdate.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        return false;
    }

    componentWillMount(){
        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateChatReadInbox', this.onUpdate);
        ChatStore.on('updateUserChatAction', this.onUpdate);
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate);
        ChatStore.removeListener('updateChatLastMessage', this.onUpdate);
        ChatStore.removeListener('updateChatReadInbox', this.onUpdate);
        ChatStore.removeListener('updateUserChatAction', this.onUpdate);
    }

    onUpdate(update) {
        if (!this.props.chatId) return;
        if (this.props.chatId !== update.chat_id) return;

        this.forceUpdate();
    }

    render() {
        const chat = ChatStore.get(this.props.chatId);

        let contentControl = null;
        const typingString = getChatTypingString(chat);
        if (typingString){
            contentControl = (<span className='dialog-content-accent'>{typingString}</span>);
        }

        if (!contentControl){
            const draft = getChatDraft(chat);
            if (draft && chat.unread_count === 0 && chat.unread_mention_count === 0){
                const text = draft.text || '\u00A0';

                contentControl = (
                    <>
                        <span className='dialog-content-draft'>Draft: </span>
                        {text}
                    </>
                );
            }
        }

        if (!contentControl){
            const content = getLastMessageContent(chat) || '\u00A0';
            const senderName = getLastMessageSenderName(chat);
            contentControl = (
                <>
                    {senderName && <span className='dialog-content-accent'>{senderName}: </span>}
                    {content}
                </>
            );
        }

        return (
            <div className='dialog-content'>
                {contentControl}
            </div>
        );
    }
}

export default DialogContentControl;