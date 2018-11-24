/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import ReplyControl from './ReplyControl';
import MessageStatusControl from './MessageStatusControl';
import MessageAuthor from './MessageAuthor';
import UserTileControl from '../Tile/UserTileControl';
import ChatTileControl from '../Tile/ChatTileControl';
import {
    saveOrDownload
} from '../../Utils/File';
import {
    getDate,
    getDateHint,
    getText,
    getMedia,
    getReply,
    getForward,
    getUnread,
    getSenderUserId
} from '../../Utils/Message';
import {getPhotoSize} from '../../Utils/Common';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import './MessageControl.css';

class MessageControl extends Component{
    constructor(props){
        super(props);

        if (process.env.NODE_ENV !== 'production'){
            const { chatId, messageId } = this.props;
            this.state = {
                message: MessageStore.get(chatId, messageId)
            };
        }

        this.handleUpdateMessageEdited = this.handleUpdateMessageEdited.bind(this);
        this.handleUpdateMessageViews = this.handleUpdateMessageViews.bind(this);
        this.handleUpdateMessageContent = this.handleUpdateMessageContent.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        if (nextProps.messageId !== this.props.messageId){
            return true;
        }

        if (nextProps.sendingState !== this.props.sendingState){
            return true;
        }

        if (nextProps.showUnreadSeparator !== this.props.showUnreadSeparator){
            return true;
        }

        return false;
    }

    componentWillMount(){
        MessageStore.on('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.on('updateMessageViews', this.handleUpdateMessageViews);
        //MessageStore.on('updateMessageContent', this.handleUpdateMessageContent);
    }

    componentWillUnmount(){
        MessageStore.removeListener('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.removeListener('updateMessageViews', this.handleUpdateMessageViews);
        //MessageStore.removeListener('updateMessageContent', this.handleUpdateMessageContent);
    }

    handleUpdateMessageEdited(payload) {
        if (this.props.chatId === payload.chat_id
            && this.props.messageId === payload.message_id){
            this.forceUpdate();
        }
    }

    handleUpdateMessageViews(payload) {
        if (this.props.chatId === payload.chat_id
            && this.props.messageId === payload.message_id){
            this.forceUpdate();
        }
    }

    handleUpdateMessageContent(payload) {
        if (this.props.chatId === payload.chat_id
            && this.props.messageId === payload.message_id){
            this.forceUpdate();
        }
    }

    openForward = () => {
        const { chatId, messageId, onSelectUser, onSelectChat } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return;

        const { forward_info } = message;
        if (!forward_info) return null;

        switch (forward_info['@type']) {
            case 'messageForwardedFromUser': {
                if (onSelectUser){
                    onSelectUser(forward_info.sender_user_id);
                }
                break;
            }
            case 'messageForwardedPost': {
                if (onSelectChat){
                    onSelectChat(forward_info.chat_id);
                }
                break;
            }
        }
    };

    openMedia = () => {
        const { chatId, messageId, onSelectUser } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return;

        const { content } = message;
        if (!content) return null;

        switch (content['@type']) {
            case 'messageContact': {
                const { contact } = content;
                if (contact && onSelectUser){
                    onSelectUser(contact.user_id);
                }
                break;
            }
            case 'messageDocument': {
                const { document } = content;
                if (document){
                    const file = document.document;
                    if (file) {

                        if (file.local.is_downloading_active){
                            FileStore.cancelGetRemoteFile(file.id, message);
                        }
                        else if (file.remote.is_uploading_active){
                            FileStore.cancelUploadFile(file.id, message);
                        }
                        else {
                            saveOrDownload(file, document.file_name, message);
                        }
                    }
                }

                break;
            }
            case 'messagePhoto': {
                // cancel download/upload
                const { photo } = message.content;
                if (photo){
                    const photoSize = getPhotoSize(photo.sizes);
                    if (photoSize){
                        let file = photoSize.photo;
                        if (file) {
                            file = FileStore.get(file.id);
                            if (file){
                                if (file.local.is_downloading_active){
                                    FileStore.cancelGetRemoteFile(file.id, message);
                                    return;
                                }
                                else if (file.remote.is_uploading_active){
                                    FileStore.cancelUploadFile(file.id, message);
                                    return;
                                }
                                // else {
                                //     saveOrDownload(file, document.file_name, message);
                                // }
                            }
                        }
                    }
                }

                // open media viewer
                ApplicationStore.setMediaViewerContent({ chatId: chatId, messageId: messageId });

                break;
            }
        }
    };

    handleSelectUser = (userId) => {
        const { onSelectUser } = this.props;
        if (!onSelectUser) return;

        onSelectUser(userId);
    };

    handleSelectChat = () => {
        const { chatId, onSelectChat } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return;

        onSelectChat(chat);
    };

    render(){
        const { chatId, messageId, onSelectUser, onSelectChat } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return (<div>[empty message]</div>);

        const text = getText(message);
        const date = getDate(message);
        const dateHint = getDateHint(message);
        const media = getMedia(message, this.openMedia);
        const reply = getReply(message);
        const forward = getForward(message);
        this.unread = getUnread(message);
        const senderUserId = getSenderUserId(message);

        const tileControl = senderUserId
            ? (<UserTileControl userId={senderUserId} onSelect={this.handleSelectUser}/>)
            : (<ChatTileControl chatId={chatId} onSelect={this.handleSelectChat}/>);

        return (
            <div className='message'>
                {this.props.showUnreadSeparator &&
                    <div className='message-unread-separator'>
                        Unread messages
                    </div>
                }

                <div className='message-wrapper'>
                    {this.unread && <MessageStatusControl chatId={message.chat_id} messageId={message.id} sendingState={message.sending_state}/>}
                    {tileControl}
                    <div className='message-content'>
                        <div className='message-title'>
                            {!forward && <MessageAuthor chatId={chatId} onSelectChat={onSelectChat} userId={senderUserId} onSelectUser={onSelectUser}/>}
                            {forward && <div className='message-author'>Forwarded from <a onClick={this.openForward}>{forward}</a></div>}
                            <div className='message-meta'>
                                <span>&nbsp;</span>
                                {message.views > 0 &&
                                    <>
                                        <i className='message-views-icon'/>
                                        <span className='message-views'>&nbsp;{message.views}&nbsp;&nbsp;</span>
                                    </>
                                }
                                {message.edit_date > 0 && <span>edited </span>}
                                <span className='message-date' title={dateHint}>{date}</span>
                            </div>
                        </div>
                        {reply && <ReplyControl chatId={message.chat_id} messageId={reply}/>}
                        {media}
                        <div className='message-text'>{text}</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MessageControl;