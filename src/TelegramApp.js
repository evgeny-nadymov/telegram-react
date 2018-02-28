import React, {Component} from 'react';
import './TelegramApp.css';
import Header from "./Components/Header";
import Dialogs from './Components/Dialogs';
import DialogDetails from './Components/DialogDetails';
import {getSize} from './Utils/Common';
import ChatStore from './Stores/ChatStore';
import TdLibController from './Controllers/TdLibController'
import localForage from "localforage";

class TelegramApp extends Component{
    constructor(){
        super();

        this.state = {
            selectedChat: null,
            chats: [],
            history: [],
            scrollBottom: false,
        };
        this.downloads = new Map();
        this.store = localForage.createInstance({
            name: '/tdlib'
        });
        //this.store.clear();

        this.onUpdateState = this.onUpdateState.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
    }

    componentDidMount(){
        TdLibController.on('tdlib_status', this.onUpdateState);
        TdLibController.on('tdlib_update', this.onUpdate);
    }

    componentWillUnmount(){
        TdLibController.removeListener('tdlib_status', this.onUpdateState);
        TdLibController.removeListener('tdlib_update', this.onUpdate);
    }

    onUpdateState(state){
        switch (state.status) {
            case 'ready':
                TdLibController
                    .send({
                        '@type': 'getChats',
                        offset_order: 8000000000000000000,
                        limit: 20
                    })
                    .then(result => this.onGetChats(result));
                break;
            case 'init':
                this.setState({
                    selectedChat: null,
                    chats: [],
                    history: [],
                    scrollBottom: false,
                });
                break;
            default:
                break;
        }
    }

    onUpdate(update) {
        switch (update['@type']) {
            case 'updateNewChat':
                //this.onUpdateChatTitle(update.chat.id, update.chat.title);
                break;
            case 'updateChatTitle':
                //this.onUpdateChatTitle(update.chat_id, update.title);
                break;
            case 'updateNewMessage':
                this.onUpdateNewMessage(update.message);
                break;
            case 'updateMessageSendSucceeded':
                this.onUpdateMessageSendSucceeded(update.old_message_id, update.message);
                break;
            case 'updateChatLastMessage':
                this.onUpdateChatLastMessage(update.chat_id, update.order, update.last_message);
                break;
            case 'updateFile':
                this.onUpdateFile(update.file);
                break;
            default:
                break;
        }
    }

    onUpdateChatLastMessage(chat_id, order, last_message){
        if (!last_message) return;
        if (order === '0') return;

        let updatedChats = this.state.chats.map(x =>{
            return x.id !== chat_id ? x : Object.assign({}, x, {'last_message' : last_message, 'order' : order });
        });

        const orderedChats = updatedChats.sort((a, b) => { return b.order - a.order; });

        this.setState({ chats: orderedChats });
    }

    onUpdateNewMessage(message){
        if (!this.state.selectedChat) return;
        if (this.state.selectedChat.id !== message.chat_id) return;

        this.historyPushBack(message);
    }

    onUpdateMessageSendSucceeded(old_message_id, message){
        if (!this.state.selectedChat) return;
        if (this.state.selectedChat.id !== message.chat_id) return;

        let updatedHistory = this.state.history.map((obj) =>{
            return obj.id === old_message_id ? message : obj;
        });

        this.setHistory(updatedHistory);
    }

    onGetChats(result){
        let chats = [];
        for (let i = 0; i < result.chat_ids.length; i++){
            chats.push(ChatStore.get(result.chat_ids[i]));
        }
        this.onGetChatsContinue(chats);
    }

    onGetChatsContinue(result){
        this.setState({ chats: result });

        for (let i = 0; i < result.length; i++){
            let chat = result[i];
            let [id, pid, idb_key] = this.getChatPhoto(chat);
            if (pid) {
                chat.pid = pid;
                this.getLocalFile(chat, idb_key,
                    () => ChatStore.updatePhoto(chat.id),
                    () => this.getRemoteFile(id, 1, chat));
            }
        }
    }

    getChatPhoto(chat) {
        if (chat['@type'] !== 'chat') {
            return [0, '', ''];
        }
        if (chat.photo) {
            let file = chat.photo.small;
            if (file.remote.id) {
                return [file.id, file.remote.id, file.idb_key];
            }
        }
        return [0, '', ''];
    }

    getMessageSticker(message) {
        if (message['@type'] !== 'message') {
            return [0, '', ''];
        }

        if (!message.content || message.content['@type'] !== 'messageSticker'){
            return [0, '', ''];
        }

        if (message.content.sticker) {
            let file = message.content.sticker.sticker;
            if (file && file.remote.id) {
                return [file.id, file.remote.id, file.idb_key];
            }
        }

        return [0, '', ''];
    }

    getMessagePhoto(message) {
        if (message['@type'] !== 'message') {
            return [0, '', ''];
        }

        if (!message.content || message.content['@type'] !== 'messagePhoto'){
            return [0, '', ''];
        }

        if (message.content.photo) {
            let photoSize = this.getPhotoSize(message.content.photo.sizes);
            if (photoSize && photoSize['@type'] === 'photoSize'){
                let file = photoSize.photo;
                if (file && file.remote.id) {
                    return [file.id, file.remote.id, file.idb_key];
                }
            }
        }

        return [0, '', ''];
    }

    getPhotoSize(sizes){
        return getSize(sizes, 260);
    }

    onUpdateFile(file) {
        if (!file.idb_key || !file.remote.id) {
            return;
        }
        let idb_key = file.idb_key;

        if (this.downloads.has(file.id)){
            let items = this.downloads.get(file.id);
            if (items){
                for (let i = 0; i < items.length; i++){
                    let obj = items[i];
                    switch (obj['@type']){
                        case 'chat':
                            this.getLocalFile(obj, idb_key,
                                () => ChatStore.updatePhoto(obj.id),
                                () => this.getRemoteFile(file.id, 1, obj));
                            break;
                        case 'message':
                            switch (obj.content['@type']){
                                case 'messagePhoto':
                                    this.getLocalFile(this.getPhotoSize(obj.content.photo.sizes), idb_key,
                                        () => ChatStore.updateMessagePhoto(obj.id),
                                        () => this.getRemoteFile(file.id, 1, obj));
                                    break;
                                case 'messageSticker':
                                    this.getLocalFile(obj.content.sticker.sticker, idb_key,
                                        () => ChatStore.updateMessageSticker(obj.id),
                                        () => this.getRemoteFile(file.id, 1, obj));
                                    break;
                                default:
                                    break;
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

    getLocalFile(obj, idb_key, callback, faultCallback) {
        if (!idb_key){
            faultCallback();
            return;
        }

        obj.idb_key = idb_key;
        this.store.getItem(idb_key).then(blob => {
            console.log('Got blob: ' + idb_key + ' => ' + blob);

            if (blob){
                obj.blob = blob;
                callback();
            }
            else{
                faultCallback();
            }
        });
    }

    getRemoteFile(fileId, priority, obj){
        if (this.downloads.has(fileId)){
            let items = this.downloads.get(fileId);
            items.push(obj);
        }
        else
        {
            this.downloads.set(fileId, [obj]);
        }
        TdLibController.send({ '@type': 'downloadFile', file_id: fileId, priority: priority });
    }

    selectChat(chat){
        this.previousScrollHeight = 0;

        let previousChat = this.state.selectedChat;

        this.setState({selectedChat : chat});

        const limit = 20;
        TdLibController
            .send({
                '@type': 'getChatHistory',
                chat_id: chat.id,
                from_message_id: 0,
                offset: 0,
                limit: limit
            })
            .then(result => {
                result.messages.reverse();
                this.setHistory(result.messages);

                // load photos
                this.loadMessageContents(result.messages);

                if (result.messages.length < limit) {
                    this.onLoadNext()
                }
            });

        if (previousChat){
            TdLibController
                .send({
                    '@type': 'closeChat',
                    chat_id: previousChat.id,
                });
        }

        TdLibController
            .send({
                '@type': 'openChat',
                chat_id: chat.id,
            });
    }

    loadMessageContents(messages){
        //return;
        for (let i = messages.length - 1; i >= 0 ; i--){
            let message = messages[i];
            if (message && message.content){
                switch (message.content['@type']){
                    case 'messagePhoto': {
                        let [id, pid, idb_key] = this.getMessagePhoto(message);
                        if (pid) {
                            let obj = this.getPhotoSize(message.content.photo.sizes);
                            if (!obj.blob){
                                this.getLocalFile(obj, idb_key,
                                    () => ChatStore.updateMessagePhoto(message.id),
                                    () => this.getRemoteFile(id, 1, message));
                            }
                        }
                        break;
                    }
                    case 'messageSticker': {
                        let [id, pid, idb_key] = this.getMessageSticker(message);
                        if (pid) {
                            let obj = message.content.sticker.sticker;
                            if (!obj.blob){
                                this.getLocalFile(obj, idb_key,
                                    () => ChatStore.updateMessageSticker(message.id),
                                    () => this.getRemoteFile(id, 1, message));
                            }
                        }
                        break;
                    }
                    default:
                            break;
                }
            }
        }
    }

    setHistory(history) {

        this.setState({ history: history, scrollBottom: true });
    }

    appendHistory(history, callback) {
        if (history.length === 0) return;

        this.setState({ history: history.concat(this.getHistory()), scrollBottom: false }, callback);
    }

    getHistory() {
        return this.state.history;
    }

    historyPushFront(entry) {
        this.setHistory([entry].concat(this.getHistory()));
    }

    historyPushBack(entry) {
        this.setHistory(this.getHistory().concat([entry]));
    }

    onSendText(text){
        if (!text) return;

        const content = {
            '@type': 'inputMessageText',
            text: { '@type': 'formattedText', text: text }
        };

        this.onSendInternal(content);
    }

    onSendFile(file){
        if (!file) return;

        const content = {
            '@type': 'inputMessageDocument',
            document: { '@type': 'inputFileBlob', name: file.name, blob: file }
        };

        this.onSendInternal(content);
    }

    onSendInternal(content){
        if (!this.state.selectedChat) return;
        if (!content) return;

        TdLibController
            .send({
                '@type': 'sendMessage',
                chat_id: this.state.selectedChat.id,
                input_message_content: content
            })
            .catch(error =>{
                alert('sendMessage error ' + error);
            });
    }

    onLoadNext(scrollHeight){
        if (!this.state.selectedChat) return;
        if (this.loading) return;
        //if (this.previousScrollHeight === scrollHeight) return;

        let fromMessageId = 0;
        if (this.state.history && this.state.history.length > 0){
            fromMessageId = this.state.history[0].id;
        }

        //this.previousScrollHeight = scrollHeight;
        this.loading = true;

        let chatId = this.state.selectedChat.id;
        TdLibController
            .send({
                '@type': 'getChatHistory',
                chat_id: chatId,
                from_message_id: fromMessageId,
                offset: 0,
                limit: 20
            })
            .then(result => {
                    this.loading = false;

                    /*if (this.state.selectedChat.id !== chatId){
                        return;
                    }*/

                    result.messages.reverse();
                    this.appendHistory(result.messages);

                    this.loadMessageContents(result.messages);
                })
            .catch(() =>{
                    this.loading = false;
                });
    }

    clearCache(){

        /*TdLibController
            .send({
                '@type': 'optimizeStorage',
                size: 0,
                ttl: 0,
                count: 0,
                immunity_delay : 0,
                file_types : [{'@type' : 'fileTypeThumbnail'}],
                chat_ids: [],
                exclude_chat_ids: [],
                chat_limit: 0,
            })
            .then(result => {
            })
            .catch(error =>{
                alert('Cache error');
            });*/

        this.store.clear(result =>{
            alert('cache cleared');
        });
    }

    render(){
        return (
            <div id='app'>
                <Header onClearCache={() => this.clearCache()}/>
                <div className='im-page-wrap'>
                    <Dialogs
                        className='master'
                        chats={this.state.chats}
                        selectedChat={this.state.selectedChat}
                        onSelectChat={chat => this.selectChat(chat)}/>
                    <DialogDetails
                        className='details'
                        scrollBottom={this.state.scrollBottom}
                        history={this.state.history}
                        onSendText={text => this.onSendText(text)}
                        onSendFile={file => this.onSendFile(file)}
                        onLoadNext={x => this.onLoadNext(x)}/>
                </div>
            </div>
        );
    }
}

export default TelegramApp;