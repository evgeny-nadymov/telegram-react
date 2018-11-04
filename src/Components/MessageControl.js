/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import ReplyControl from './ReplyControl';
import MessageStatusControl from './MessageStatusControl';
import UserTileControl from './UserTileControl';
import {saveData, saveBlob} from '../Utils/File';
import {
    getTitle,
    getDate,
    getDateHint,
    getText,
    getMedia,
    getReply,
    getForward,
    getUnread,
    getSender
} from '../Utils/Message';
import {getPhotoSize} from '../Utils/Common';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import MessageStore from '../Stores/MessageStore';
import TdLibController from '../Controllers/TdLibController';
import FileController from '../Controllers/FileController';
import './MessageControl.css';

class MessageControl extends Component{
    constructor(props){
        super(props);

        this.openForward = this.openForward.bind(this);
        this.openMedia = this.openMedia.bind(this);
        this.handleUpdateMessageEdited = this.handleUpdateMessageEdited.bind(this);
        this.handleUpdateMessageViews = this.handleUpdateMessageViews.bind(this);
        this.handleUpdateMessageContent = this.handleUpdateMessageContent.bind(this);
    }

    componentWillMount(){
        MessageStore.on('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.on('updateMessageViews', this.handleUpdateMessageViews);
        //MessageStore.on('updateMessageContent', this.handleUpdateMessageContent);
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

    componentWillUnmount(){
        MessageStore.removeListener('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.removeListener('updateMessageViews', this.handleUpdateMessageViews);
        //MessageStore.removeListener('updateMessageContent', this.handleUpdateMessageContent);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId
            || nextProps.messageId !== this.props.messageId){
            return true;
        }

        if (nextProps.sendingState !== this.props.sendingState){
            return true;
        }

        return false;
    }

    openForward(){
        let message = MessageStore.get(this.props.chatId, this.props.messageId);

        if (!message) return;
        if (!message.forward_info) return null;

        switch (message.forward_info['@type']) {
            case 'messageForwardedFromUser': {
                let user = UserStore.get(message.forward_info.sender_user_id);
                if (user) {
                    TdLibController
                        .send({
                            '@type': 'createPrivateChat',
                            user_id: message.forward_info.sender_user_id,
                            force: true
                        })
                        .then(chat => {
                            this.props.onSelectChat(chat);
                        });
                }
                break;
            }
            case 'messageForwardedPost': {
                let chat = ChatStore.get(message.forward_info.chat_id);

                this.props.onSelectChat(chat);
                break;
            }
        }
    }

    openMedia(){
        let message = MessageStore.get(this.props.chatId, this.props.messageId);

        if (!message) return;
        if (!message.content) return null;

        switch (message.content['@type']) {
            case 'messageContact': {
                let user = UserStore.get(message.content.contact.user_id);
                if (user) {
                    TdLibController
                        .send({
                            '@type': 'createPrivateChat',
                            user_id: message.content.contact.user_id,
                            force: true
                        })
                        .then(chat => {
                            this.props.onSelectChat(chat);
                        });
                }
                break;
            }
            case 'messageDocument': {
                if (message.content){

                    let document = message.content.document;
                    if (document){

                        let file = document.document;
                        if (file) {

                            if (file.local.is_downloading_active){
                                FileController.cancelGetRemoteFile(file.id, message);
                            }
                            else if (file.remote.is_uploading_active){
                                FileController.cancelUploadFile(file.id, message);
                            }
                            else {
                                this.saveOrDownload(file, document.file_name, message);
                            }
                        }
                    }
                }

                break;
            }
            case 'messagePhoto': {
                if (message.content){

                    let photo = message.content.photo;
                    if (photo){

                        let photoSize = getPhotoSize(message.content.photo.sizes);
                        if (photoSize){
                            let file = photoSize.photo;
                            if (file) {

                                if (file.local.is_downloading_active){
                                    FileController.cancelGetRemoteFile(file.id, message);
                                }
                                else if (file.remote.is_uploading_active){
                                    FileController.cancelUploadFile(file.id, message);
                                }
                                else {
                                    this.saveOrDownload(file, document.file_name, message);
                                }
                            }
                        }
                    }
                }

                break;
            }
        }
    }

    saveOrDownload(file, fileName, message){
        if (!file) return;
        if (!fileName) return;

        if (file.arr) {
            saveData(file.arr, fileName);
            return;
        }

        if (file.idb_key){
            let store = FileController.getStore();

            FileController.getLocalFile(store, file, file.idb_key, null,
                () => {
                    if (file.blob){
                        saveBlob(file.blob, fileName);
                    }
                },
                () => {
                    if (file.local.can_be_downloaded){
                        FileController.getRemoteFile(file.id, 1, message);
                    }
                });
            return;
        }

        if (file.local.can_be_downloaded){
            FileController.getRemoteFile(file.id, 1, message);
        }
    }

    render(){
        let message = MessageStore.get(this.props.chatId, this.props.messageId);
        if (!message) return (<div>[empty message]</div>);

        let title = this.props.showTitle? getTitle(message) : null;
        let text = getText(message);
        let date = getDate(message);
        let dateHint = getDateHint(message);
        let media = getMedia(message, this.openMedia);
        let reply = getReply(message);
        let forward = getForward(message);
        this.unread = getUnread(message);
        let sender = getSender(message);

        return (
            <div className='message'>
                {this.props.showUnreadSeparator &&
                    <div className='message-unread-separator'>
                        Unread messages
                    </div>
                }
                <div className='message-wrapper'>
                    {this.unread && <MessageStatusControl chatId={message.chat_id} messageId={message.id} sendingState={message.sending_state}/>}
                    <div className='message-sender-tile'>
                        <UserTileControl user={sender}/>
                    </div>
                    <div className='message-content'>
                        <div className='message-body'>
                            <div className='message-title'>
                                {!forward && <div className='message-author'>{title}</div>}
                                {forward && <div className='message-author'>Forwarded from <a onClick={this.openForward}>{forward}</a></div>}
                                <div className='message-meta'>
                                    {message.views > 0 &&
                                        <>
                                            <i className='message-views-icon'/>
                                            <span className='message-views'> {message.views}&nbsp;&nbsp;</span>
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
            </div>
        );
    }
}

export default MessageControl;