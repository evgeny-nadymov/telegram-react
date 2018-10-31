/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import './ChatTileControl.css';
import ChatStore from '../Stores/ChatStore';
import {getChatLetters} from '../Utils/Chat';
import FileController from '../Controllers/FileController';
import {getChatPhoto} from '../Utils/File';

class ChatTileControl extends Component{
    constructor(props){
        super(props);

        this.onPhotoUpdated = this.onPhotoUpdated.bind(this);
        this.onUpdateChatPhoto = this.onUpdateChatPhoto.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ChatStore.on('chat_photo_changed', this.onPhotoUpdated);
        ChatStore.on('updateChatPhoto', this.onUpdateChatPhoto);
    }

    componentWillUnmount(){
        ChatStore.removeListener('chat_photo_changed', this.onPhotoUpdated);
        ChatStore.removeListener('updateChatPhoto', this.onUpdateChatPhoto);
    }

    onPhotoUpdated(payload) {
        if (this.props.chatId
            && this.props.chatId === payload.chatId){
            this.forceUpdate();
        }
    }

    onUpdateChatPhoto(update){
        if (!update.chat_id) return;
        if (update.chat_id !== this.props.chatId) return;

        const chat = ChatStore.get(this.props.chatId);
        if (!update.photo){
            this.forceUpdate();
        }
        else{
            this.loadChatContent(chat)
        }
    }

    loadChatContent(chat){
        if (!chat) return;

        let store = FileController.getStore();

        let [id, pid, idb_key] = getChatPhoto(chat);
        if (pid) {
            FileController.getLocalFile(store, chat.photo.small, idb_key, null,
                () => ChatStore.updatePhoto(chat.id),
                () => FileController.getRemoteFile(id, 1, chat));
        }
    }

    render(){
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return null;

        let letters = getChatLetters(chat);
        let blob = chat.photo && chat.photo.small? chat.photo.small.blob : null;
        let src;
        try{
            src = blob ? URL.createObjectURL(blob) : null;
        }
        catch(error){
            console.log(`ChatTileControl.render chat_id=${chat.id} with error ${error}`);
        }

        let chatId = chat.id || 1;
        let photoClasses = 'tile-photo';
        if (!blob){
            photoClasses += ` tile_color_${(Math.abs(chatId) % 8 + 1)}`;
        }

        return src ?
            (<img className={photoClasses} src={src} draggable={false} alt='' />) :
            (<div className={photoClasses}><span className='tile-text'>{letters}</span></div>);
    }
}

export default ChatTileControl;