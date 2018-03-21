import React, {Component} from 'react';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import './TelegramApp.css';
import Header from "./Components/Header";
import Dialogs from './Components/Dialogs';
import DialogDetails from './Components/DialogDetails';
import AuthFormControl from './Components/Auth/AuthFormControl';
import {throttle, getSize} from './Utils/Common';
import ChatStore from './Stores/ChatStore';
import TdLibController from './Controllers/TdLibController'
import localForage from 'localforage';
import LocalForageWithGetItems from 'localforage-getitems';
import {CHAT_SLICE_LIMIT, MESSAGE_SLICE_LIMIT, PHOTO_SIZE} from "./Constants";
import Footer from "./Components/Footer";

const theme = createMuiTheme({
    palette: {
        primary: { main: '#6bace1'},
    },
});

class TelegramApp extends Component{
    constructor(){
        super();

        this.state = {
            selectedChat: null,
            chats: [],
            history: [],
            scrollBottom: false,
            authState: 'init'
        };
        this.downloads = new Map();

        this.store = localForage.createInstance({
            name: '/tdlib'
        });

        let request = window.indexedDB.open('/tdlib');
        request.onerror = function(event) {
            console.log("error: ");
        };
        request.onsuccess = function(event) {
            this.db = request.result;
            console.log("success: " + this.db);
        }.bind(this);

        this.onUpdateState = this.onUpdateState.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.handleSelectChat = this.handleSelectChat.bind(this);
        this.handleSendText = this.handleSendText.bind(this);
        this.handleSendFile = this.handleSendFile.bind(this);
        this.handleLoadDialogs = this.handleLoadDialogs.bind(this);
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
                this.setState({authState : state.status});
                TdLibController
                    .send({
                        '@type': 'setOption',
                        name: 'online',
                        value: { '@type': 'optionValueBoolean', value: true }
                    });

                this.handleLoadDialogs();
                break;
            case 'waitPhoneNumber':
                this.setState({authState: state.status});
                break;
            case 'waitCode':
                this.setState({authState: state.status});
                break;
            case 'waitPassword':
                this.setState({authState: state.status});
                break;
            case 'init':
                this.setState({
                    selectedChat: null,
                    chats: [],
                    history: [],
                    scrollBottom: false,
                    authState: state.status
                });
                break;
            default:
                break;
        }
    }

    onUpdate(update) {
        switch (update['@type']) {
            case 'updateFatalError':
                alert('Oops! Something went wrong. We need to refresh this page.');
                window.location.reload();
                break;
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
        this.appendChats(result);
        //this.setState({ chats: result });

        let store = this.db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');

        for (let i = 0; i < result.length; i++){
            let chat = result[i];
            let [id, pid, idb_key] = this.getChatPhoto(chat);
            if (pid) {
                chat.pid = pid;
                this.getLocalFile(store, chat, idb_key, null,
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

    getMessagePhotoPreview(message) {
        if (message['@type'] !== 'message') {
            return [0, '', ''];
        }

        if (!message.content || message.content['@type'] !== 'messagePhoto'){
            return [0, '', ''];
        }

        if (message.content.photo) {
            let photoSize = TelegramApp.getPreviewPhotoSize(message.content.photo.sizes);
            if (photoSize && photoSize['@type'] === 'photoSize'){
                let file = photoSize.photo;
                if (file && file.remote.id) {
                    return [file.id, file.remote.id, file.idb_key];
                }
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
        return getSize(sizes, PHOTO_SIZE);
    }

    getPreviewPhotoSize(sizes){
        return sizes.length > 0 ? sizes[0] : null;
    }

    onUpdateFile(file) {
        if (!file.idb_key || !file.remote.id) {
            return;
        }
        let idb_key = file.idb_key;

        if (file.local.is_downloading_completed
            && this.downloads.has(file.id)){

            let items = this.downloads.get(file.id);
            if (items){
                this.downloads.delete(file.id);

                let store = this.db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');

                for (let i = 0; i < items.length; i++){
                    let obj = items[i];
                    switch (obj['@type']){
                        case 'chat':
                            this.getLocalFile(store, obj, idb_key, file.arr,
                                () => ChatStore.updatePhoto(obj.id),
                                () => this.getRemoteFile(file.id, 1));
                            break;
                        case 'message':
                            switch (obj.content['@type']){
                                case 'messagePhoto':
                                    // preview
                                    /*let preview = this.getPreviewPhotoSize(obj.content.photo.sizes);
                                    if (preview && preview.photo.id === file.id)
                                    {
                                        this.getLocalFile(store, preview, idb_key,
                                            () => ChatStore.updateMessagePhoto(obj.id),
                                            () => { },
                                            'update_',
                                            obj.id);
                                    }*/

                                    // regular
                                    let photo = this.getPhotoSize(obj.content.photo.sizes);
                                    if (photo && photo.photo.id === file.id)
                                    {
                                        this.getLocalFile(store, photo, idb_key, file.arr,
                                            () => ChatStore.updateMessagePhoto(obj.id),
                                            () => { },
                                            'update',
                                            obj.id);
                                    }
                                    break;
                                case 'messageSticker':
                                    this.getLocalFile(store, obj.content.sticker.sticker, idb_key, file.arr,
                                        () => ChatStore.updateMessageSticker(obj.id),
                                        () => this.getRemoteFile(file.id, 1, obj),
                                        'update',
                                        obj.id);
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

    getLocalFile(store, obj, idb_key, arr, callback, faultCallback, from, messageId) {
        if (!idb_key){
            faultCallback();
            return;
        }

        obj.idb_key = idb_key;
        if (arr){
            let t0 = performance.now();
            obj.blob = new Blob([arr]);
            let t1 = performance.now();
            console.log('[perf]' + (from? ' ' + from : '') + ' id=' + messageId + ' blob=' + obj.blob + ' new_time=' + (t1 - t0));

            callback();
            return;
        }

        let objectStore = store;

        let t0 = performance.now();
        let getItem = objectStore.get(idb_key);
        getItem.onsuccess = function (event) {
            let blob = event.target.result;
            let t1 = performance.now();
            console.log('[perf]' + (from? ' ' + from : '') + ' id=' + messageId + ' blob=' + blob + ' time=' + (t1 - t0));

            if (blob){
                obj.blob = blob;
                callback();
            }
            else{
                faultCallback();
            }
        };

        return;
        console.log((from? from : '') + 'download_message start getLocal id=' + messageId);

        this.store.getItem(idb_key).then(blob => {
            console.log((from? from : '') + 'download_message stop getLocal id=' + messageId + ' blob=' + blob);
            //console.log('Got blob: ' + idb_key + ' => ' + blob);

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

        console.log('[perf] downloadFile file_id=' + fileId);
        TdLibController.send({ '@type': 'downloadFile', file_id: fileId, priority: priority });
    }

    cancelGetRemoteFile(fileId, obj){
        if (this.downloads.has(fileId)){
            this.downloads.delete(fileId);
            console.log('cancel_download_message id=' + obj.id);
            TdLibController.send({ '@type': 'cancelDownloadFile', file_id: fileId, only_if_pending: false });
        }
    }

    handleSelectChat(chat){
        this.previousScrollHeight = 0;

        let previousChat = this.state.selectedChat;

        this.setState({selectedChat : chat});

        TdLibController
            .send({
                '@type': 'getChatHistory',
                chat_id: chat.id,
                from_message_id: 0,
                offset: 0,
                limit: MESSAGE_SLICE_LIMIT
            })
            .then(result => {
                result.messages.reverse();
                this.setHistory(result.messages);

                // load photos
                this.loadMessageContents(result.messages);

                if (result.messages.length < MESSAGE_SLICE_LIMIT) {
                    this.onLoadNext(0, true);
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

    loadMessageContents(messages, loadRemote = true){

        let store = this.db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');

        for (let i = messages.length - 1; i >= 0 ; i--){
            let message = messages[i];
            if (message && message.content){
                switch (message.content['@type']){
                    case 'messagePhoto': {

                        // preview
                        /*let [previewId, previewPid, previewIdbKey] = this.getMessagePhotoPreview(message);
                        if (previewPid) {
                            let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                            if (!preview.blob){
                                this.getLocalFile(store, preview, previewIdbKey, null,
                                    () => ChatStore.updateMessagePhoto(message.id),
                                    () => { if (loadRemote)  this.getRemoteFile(previewId, 2, message); },
                                    'load_contents_preview_',
                                    message.id);

                            }
                        }*/

                        // regular
                        let [id, pid, idb_key] = this.getMessagePhoto(message);
                        if (pid) {
                            let obj = this.getPhotoSize(message.content.photo.sizes);
                            if (!obj.blob){
                                this.getLocalFile(store, obj, idb_key, null,
                                    () => ChatStore.updateMessagePhoto(message.id),
                                    () => { if (loadRemote)  this.getRemoteFile(id, 1, message); },
                                    'load_contents',
                                    message.id);
                            }
                        }
                        break;
                    }
                    case 'messageSticker': {
                        let [id, pid, idb_key] = this.getMessageSticker(message);
                        if (pid) {
                            let obj = message.content.sticker.sticker;
                            if (!obj.blob){
                                this.getLocalFile(store, obj, idb_key, null,
                                    () => ChatStore.updateMessageSticker(message.id),
                                    () => { if (loadRemote)  this.getRemoteFile(id, 1, message); },
                                    'load_contents',
                                    message.id);
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

    cancelLoadMessageContents(messages) {
        //return;
        for (let i = messages.length - 1; i >= 0 ; i--){
            let message = messages[i];
            if (message && message.content){
                switch (message.content['@type']){
                    case 'messagePhoto': {
                        let [id, pid] = this.getMessagePhoto(message);
                        if (pid) {
                            let obj = this.getPhotoSize(message.content.photo.sizes);
                            if (!obj.blob){
                                this.cancelGetRemoteFile(id, message);
                            }
                        }
                        break;
                    }
                    case 'messageSticker': {
                        let [id, pid] = this.getMessageSticker(message);
                        if (pid) {
                            let obj = message.content.sticker.sticker;
                            if (!obj.blob){
                                this.cancelGetRemoteFile(id, message);
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

    appendChats(chats, callback){
        if (chats.length === 0) return;

        this.setState({ chats: this.getChats().concat(chats) }, callback);
    }

    getHistory() {
        return this.state.history;
    }

    getChats() {
        return this.state.chats;
    }

    historyPushFront(entry) {
        this.setHistory([entry].concat(this.getHistory()));
    }

    historyPushBack(entry) {
        this.setHistory(this.getHistory().concat([entry]));
    }

    handleSendText(text){
        if (!text) return;

        const content = {
            '@type': 'inputMessageText',
            text: { '@type': 'formattedText', text: text }
        };

        this.onSendInternal(content);
    }

    handleSendFile(file){
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

    handleLoadDialogs(){
        if (this.loading) return;
        if (this.lastSliceLoaded) return;

        let offsetOrder = 8000000000000000000;
        if (this.state.chats && this.state.chats.length > 0){
            offsetOrder = this.state.chats[this.state.chats.length - 1].order;
        }

        TdLibController
            .send({
                '@type': 'getChats',
                offset_order: offsetOrder,
                limit: CHAT_SLICE_LIMIT
            })
            .then(result => {
                this.loading = false;
                this.lastSliceLoaded = result.chat_ids.length < CHAT_SLICE_LIMIT;
                this.onGetChats(result);
            })
            .catch(() => {
                this.loading = false;
            });
    }

    onLoadNext(scrollHeight, loadRemote = false){
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
                limit: MESSAGE_SLICE_LIMIT
            })
            .then(result => {
                    this.loading = false;

                    /*if (this.state.selectedChat.id !== chatId){
                        return;
                    }*/

                    result.messages.reverse();
                    this.appendHistory(result.messages);

                    this.loadMessageContents(result.messages, loadRemote);
                })
            .catch(() =>{
                    this.loading = false;
                });
    }

    clearCache(){
        this.store.clear()
            .then(() => alert('cache cleared'));
    }

    onUpdateItemsInView(messages){
        if (!messages) return;

        let ids = messages.map(x => x.id);
        console.log('[perf] load_messages_contents ids=[' + ids + ']');
/*
        let messagesMap = new Map(messages.map((i) => [i.id, i]));

        if (this.previousMessages){
            let cancelMessages = [];
            for (let i = 0; i < this.previousMessages.length; i++){
                if (!messagesMap.has(this.previousMessages[i].id)){
                    cancelMessages.push(this.previousMessages[i]);
                }
            }
            if (cancelMessages.length > 0) {
                this.cancelLoadMessageContents(cancelMessages);
            }
        }
        this.previousMessages = messages;*/

        this.loadMessageContents(messages, true);
    }

    render(){
        let page = null;
        switch (this.state.authState){
            case 'waitPhoneNumber':
            case 'waitCode':
            case 'waitPassword':
                page = (
                    <div id='app-inner'>
                        <AuthFormControl authState={this.state.authState}/>
                    </div>
                );
                break;
            case 'init':
            case 'ready':
            default:
                page = (
                    <div id='app-inner'>
                        <Header selectedChat={this.state.selectedChat} onClearCache={() => this.clearCache()}/>
                        <div className='im-page-wrap'>
                            <Dialogs
                                chats={this.state.chats}
                                selectedChat={this.state.selectedChat}
                                onSelectChat={this.handleSelectChat}
                                onLoadNext={this.handleLoadDialogs}/>
                            <DialogDetails
                                selectedChat={this.state.selectedChat}
                                scrollBottom={this.state.scrollBottom}
                                history={this.state.history}
                                onSendText={this.handleSendText}
                                onSendFile={this.handleSendFile}
                                onLoadNext={x => this.onLoadNext(x, true)}
                                onUpdateItemsInView={items => this.onUpdateItemsInView(items)}
                            />
                        </div>
                        <Footer/>
                    </div>
                );
                break;
        }

        return (
            <MuiThemeProvider theme={theme}>
                <div id='app'>
                    {page}
                </div>
            </MuiThemeProvider>
        );
    }
}

/*window.onblur = function(){
    TdLibController
        .send({
            '@type': 'setOption',
            name: 'online',
            value: { '@type': 'optionValueBoolean', value: false }
        });
};

window.onfocus = function(){
    TdLibController
        .send({
            '@type': 'setOption',
            name: 'online',
            value: { '@type': 'optionValueBoolean', value: true }
        });
};*/

export default TelegramApp;