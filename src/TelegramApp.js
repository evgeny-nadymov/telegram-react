import React, {Component} from 'react';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import './TelegramApp.css';
import Header from './Components/Header';
import Dialogs from './Components/Dialogs';
import DialogDetails from './Components/DialogDetails';
import AuthFormControl from './Components/Auth/AuthFormControl';
import Footer from './Components/Footer';
import {getPhotoSize} from './Utils/Common';
import ChatStore from './Stores/ChatStore';
import UserStore from './Stores/UserStore';
import MessageStore from './Stores/MessageStore';
import TdLibController from './Controllers/TdLibController'
import FileController from './Controllers/FileController'
import localForage from 'localforage';
import LocalForageWithGetItems from 'localforage-getitems';
import {MESSAGE_SLICE_LIMIT, VERBOSITY_MAX, VERBOSITY_MIN} from './Constants';
import {getChatPhoto} from './Utils/File';
import {getPhotoFile, getStickerFile, getContactFile, getDocumentThumbnailFile} from './Utils/File';
import packageJson from '../package.json';

const theme = createMuiTheme({
    palette: {
        primary: { main: '#6bace1'},
    },
});

class TelegramApp extends Component{
    constructor(){
        super();

        console.log(`Start Telegram Web ${packageJson.version}`);

        this.state = {
            selectedChat: null,
            history: [],
            scrollBottom: false,
            authState: 'init'
        };

        /*this.store = localForage.createInstance({
            name: '/tdlib'
        });*/

        //this.initDB();

        this.onUpdateState = this.onUpdateState.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.handleSelectChat = this.handleSelectChat.bind(this);
        this.handleSendText = this.handleSendText.bind(this);
        this.handleSendFile = this.handleSendFile.bind(this);
        this.handleUpdateItemsInView = this.handleUpdateItemsInView.bind(this);
        this.setQueryParams = this.setQueryParams.bind(this);
    }

    componentWillMount(){
        this.setQueryParams();
        //alert('TdLibController.init use_test_dc=' + TdLibController.useTestDC);
        TdLibController.init();
    }

    setQueryParams(){
        if (this.props.location
            && this.props.location.search){
            const params = new URLSearchParams(this.props.location.search);

            if (params.has('test')){
                let useTestDC = parseInt(params.get('test'), 10);
                if (useTestDC === 0 || useTestDC === 1){
                    TdLibController.parameters.useTestDC = useTestDC === 1;
                    console.log(`setQueryParams use_test_dc=${TdLibController.parameters.useTestDC}`);
                }
                else{
                    console.log(`setQueryParams skip use_test_dc=${params.get('test')} valid values=[0,1]`);
                }
            }

            if (params.has('verbosity')){
                let verbosity = parseInt(params.get('verbosity'), 10);
                if (verbosity >= VERBOSITY_MIN && verbosity <= VERBOSITY_MAX){
                    TdLibController.parameters.verbosity = verbosity;
                    console.log(`setQueryParams verbosity=${TdLibController.parameters.verbosity}`);
                }
                else{
                    console.log(`setQueryParams skip verbosity=${params.get('verbosity')} valid values=[${VERBOSITY_MIN}..${VERBOSITY_MAX}]`);
                }
            }
        }
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
                TdLibController
                    .send({
                        '@type': 'getMe'
                    })
                    .then(result =>{
                        this.setState({ currentUser: result });
                    });

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

        // NOTE: important to start init DB after receiving first update
        FileController.initDB();

        switch (update['@type']) {
            case 'updateFatalError':
                alert('Oops! Something went wrong. We need to refresh this page.');
                window.location.reload();
                break;
            case 'updateUserChatAction':
                this.onUpdateUserChatAction(update.chat_id, update.user_id, update.action);
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
            case 'updateDeleteMessages':
                this.onUpdateDeleteMessages(update);
                break;
            case 'updateMessageSendSucceeded':
                //this.onUpdateMessageSendSucceeded(update.old_message_id, update.message);
                break;
            default:
                break;
        }
    }

    onUpdateUserChatAction(chat_id, user_id, action){
        if (!chat_id) return;
        if (!user_id) return;
        if (!action) return;


    }

    onUpdateNewMessage(message){
        if (!this.state.selectedChat) return;
        if (this.state.selectedChat.id !== message.chat_id) return;

        this.historyPushBack(message);

        MessageStore.set(message);
        this.loadMessageContents([message])

        TdLibController
            .send({
                '@type': 'viewMessages',
                chat_id: this.state.selectedChat.id,
                message_ids: [message.id]
            });
    }

    onUpdateDeleteMessages(update){
        if (!update.is_permanent) return;

        if (!this.state.selectedChat) return;
        if (this.state.selectedChat.id !== update.chat_id) return;

        this.deleteHistory(update.message_ids)

        // this.historyPushBack(message);

        // MessageStore.set(message);
        // this.loadMessageContents([message])

        // TdLibController
        //     .send({
        //         '@type': 'viewMessages',
        //         chat_id: this.state.selectedChat.id,
        //         message_ids: [message.id]
        //     });
    }

    onUpdateMessageSendSucceeded(old_message_id, message){
        if (!this.state.selectedChat) return;
        if (this.state.selectedChat.id !== message.chat_id) return;

        let updatedHistory = this.state.history.map((obj) =>{
            return obj.id === old_message_id ? message : obj;
        });

        this.setHistory(updatedHistory);
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

                MessageStore.setItems(result.messages);

                result.messages.reverse();
                this.setHistory(result.messages);

                // load photos
                this.loadMessageContents(result.messages);

                if (result.messages.length < MESSAGE_SLICE_LIMIT) {
                    this.onLoadNext(0, true);
                }

                TdLibController
                    .send({
                        '@type': 'viewMessages',
                        chat_id: chat.id,
                        message_ids: result.messages.map(x => x.id)
                    });
            });

        if (previousChat){
            TdLibController
                .send({
                    '@type': 'closeChat',
                    chat_id: previousChat.id,
                });

            let newDraft = this.refs.dialogDetails.refs.inputBox.getInputText();
            let previousDraft = '';
            if (previousChat.draft_message
                && previousChat.draft_message.input_message_text
                && previousChat.draft_message.input_message_text.text){
                previousDraft = previousChat.draft_message.input_message_text.text.text;
            }

            if (newDraft !== previousDraft){
                let newDraftMessage = null;
                if (newDraft){
                    newDraftMessage = {
                        '@type': 'draftMessage',
                        reply_to_message_id: 0,
                        input_message_text: {
                            '@type': 'inputMessageText',
                            text: {
                                '@type': 'formattedText',
                                text: newDraft,
                                entities: null
                            },
                            disable_web_page_preview: true,
                            clear_draft: false
                        }
                    };
                }

                TdLibController
                    .send({
                        '@type': 'setChatDraftMessage',
                        chat_id: previousChat.id,
                        draft_message: newDraftMessage
                    });
            }
        }

        TdLibController
            .send({
                '@type': 'openChat',
                chat_id: chat.id,
            });

        TdLibController
            .send({
                '@type': 'readAllChatMentions',
                chat_id: chat.id
            });

        // load chat photo
        if (chat.photo){
            let store = FileController.getStore();

            let file = chat.photo.small;
            if (file){
                let [id, pid, idb_key] = getChatPhoto(chat);
                if (pid) {
                    if (!file.blob){
                        FileController.getLocalFile(store, file, idb_key, null,
                            () => ChatStore.updatePhoto(chat.id),
                            () => FileController.getRemoteFile(id, 1, chat),
                            'load_chat',
                            null);
                    }
                }
            }
        }
    }

    loadMessageContents(messages, loadRemote = true){

        let store = FileController.getStore();

        for (let i = messages.length - 1; i >= 0 ; i--){
            let message = messages[i];
            if (message && message.content){
                switch (message.content['@type']){
                    case 'messagePhoto': {

                        // preview
                        /*let [previewId, previewPid, previewIdbKey] = getPhotoPreviewFile(message);
                        if (previewPid) {
                            let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                            if (!preview.blob){
                                FileController.getLocalFile(store, preview, previewIdbKey, null,
                                    () => MessageStore.updateMessagePhoto(message.id),
                                    () => { if (loadRemote)  FileController.getRemoteFile(previewId, 2, message); },
                                    'load_contents_preview_',
                                    message.id);

                            }
                        }*/

                        // regular
                        let [id, pid, idb_key] = getPhotoFile(message);
                        if (pid) {
                            let photoSize = getPhotoSize(message.content.photo.sizes);
                            if (photoSize){
                                let obj = photoSize.photo;
                                if (!obj.blob){
                                    FileController.getLocalFile(store, obj, idb_key, null,
                                        () => MessageStore.updateMessagePhoto(message.id),
                                        () => { if (loadRemote)  FileController.getRemoteFile(id, 1, message); },
                                        'load_contents',
                                        message.id);
                                }
                            }
                        }
                        break;
                    }
                    case 'messageSticker': {
                        let [id, pid, idb_key] = getStickerFile(message);
                        if (pid) {
                            let obj = message.content.sticker.sticker;
                            if (!obj.blob){
                                FileController.getLocalFile(store, obj, idb_key, null,
                                    () => MessageStore.updateMessageSticker(message.id),
                                    () => { if (loadRemote)  FileController.getRemoteFile(id, 1, message); },
                                    'load_contents',
                                    message.id);
                            }
                        }
                        break;
                    }
                    case 'messageContact':{
                        let contact = message.content.contact;
                        if (contact && contact.user_id > 0){
                            let user = UserStore.get(contact.user_id);
                            if (user){
                                let [id, pid, idb_key] = getContactFile(message);
                                if (pid) {
                                    let obj = user.profile_photo.small;
                                    if (!obj.blob){
                                        FileController.getLocalFile(store, obj, idb_key, null,
                                            () => UserStore.updatePhoto(user.id),
                                            () => { if (loadRemote)  FileController.getRemoteFile(id, 1, user); },
                                            'load_contents',
                                            message.id);
                                    }
                                }
                            }
                        }
                    }
                    case 'messageDocument': {
                        let [id, pid, idb_key] = getDocumentThumbnailFile(message);
                        if (pid) {
                            let obj = message.content.document.thumbnail.photo;
                            if (!obj.blob){
                                FileController.getLocalFile(store, obj, idb_key, null,
                                    () => MessageStore.updateMessageDocumentThumbnail(obj.id),
                                    () => { if (loadRemote)  FileController.getRemoteFile(id, 1, message); },
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
                            let obj = getPhotoSize(message.content.photo.sizes);
                            if (!obj.blob){
                                FileController.cancelGetRemoteFile(id, message);
                            }
                        }
                        break;
                    }
                    case 'messageSticker': {
                        let [id, pid] = this.getMessageSticker(message);
                        if (pid) {
                            let obj = message.content.sticker.sticker;
                            if (!obj.blob){
                                FileController.cancelGetRemoteFile(id, message);
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

    deleteHistory(message_ids, callback) {
        let history = this.getHistory();
        if (history.length === 0) return;

        let map = new Map(message_ids.map(x => [x, x]));

        history = history.filter(x => !map.has(x.id));

        this.setState({ history: history, scrollBottom: true }, callback);
    }

    getHistory() {
        return this.state.history;
    }

    historyPushFront(entry) {
        this.setState({ history: [entry].concat(this.getHistory()), scrollBottom: false });
        //this.setHistory([entry].concat(this.getHistory()));
    }

    historyPushBack(entry) {
        this.setHistory(this.getHistory().concat([entry]));
    }

    handleSendText(text){
        if (!text) return;

        const content = {
            '@type': 'inputMessageText',
            text: {
                '@type': 'formattedText',
                text: text,
                entities: null
            },
            disable_web_page_preview: false,
            clear_draft: true
        };

        this.onSendInternal(
            content,
            result => { });
    }

    handleSendFile(file){
        if (!file) return;

        const content = {
            '@type': 'inputMessageDocument',
            document: { '@type': 'inputFileBlob', name: file.name, blob: file }
        };

        this.onSendInternal(
            content,
            result => { FileController.uploadFile(result.content.document.document.id, result); }
            );
    }

    onSendInternal(content, callback){
        if (!this.state.selectedChat) return;
        if (!content) return;

        TdLibController
            .send({
                '@type': 'sendMessage',
                chat_id: this.state.selectedChat.id,
                reply_to_message_id: 0,
                input_message_content: content
            })
            .then(result => {

                MessageStore.set(result);

                let messageIds = [];
                messageIds.push(result.id);

                TdLibController
                    .send({
                        '@type': 'viewMessages',
                        chat_id: this.state.selectedChat.id,
                        message_ids: messageIds
                    });

                callback(result);
            })
            .catch(error =>{
                alert('sendMessage error ' + error);
            });

        /*if (this.state.selectedChat.draft_message){
            TdLibController
                .send({
                    '@type': 'setChatDraftMessage',
                    chat_id: this.state.selectedChat.id,
                    draft_message: null
                });
        }*/
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

                MessageStore.setItems(result.messages);

                result.messages.reverse();
                this.appendHistory(result.messages);

                this.loadMessageContents(result.messages, loadRemote);

                return result;
            })
            .then(result => {
                TdLibController
                    .send({
                        '@type': 'viewMessages',
                        chat_id: chatId,
                        message_ids: result.messages.map(x => x.id)
                    });
            })
            .catch(() => {
                this.loading = false;
            });
    }

    clearCache(){
        this.store.clear()
            .then(() => alert('cache cleared'));
    }

    handleUpdateItemsInView(messages){
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
        //console.log('TelegramApp.render authState=' + this.state.authState);
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
                                selectedChat={this.state.selectedChat}
                                onSelectChat={this.handleSelectChat}
                                authState={this.state.authState}/>
                            <DialogDetails
                                ref='dialogDetails'
                                currentUser={this.state.currentUser}
                                selectedChat={this.state.selectedChat}
                                scrollBottom={this.state.scrollBottom}
                                history={this.state.history}
                                onSelectChat={this.handleSelectChat}
                                onSendText={this.handleSendText}
                                onSendFile={this.handleSendFile}
                                onLoadNext={x => this.onLoadNext(x, true)}
                                onUpdateItemsInView={this.handleUpdateItemsInView}
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