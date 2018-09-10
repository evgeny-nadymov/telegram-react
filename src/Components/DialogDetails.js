import React, {Component} from 'react';
import './DialogDetails.css';
import InputBoxControl from "./InputBoxControl";
import MessageControl from "./MessageControl";
import MessageGroupControl from "./MessageGroupControl";
import {debounce, getPhotoSize, itemsInView, throttle} from '../Utils/Common';
import TileControl from './TileControl';
import UserTileControl from './UserTileControl';
import TdLibController from '../Controllers/TdLibController';
import {MESSAGE_SLICE_LIMIT} from '../Constants';
import MessageStore from '../Stores/MessageStore';
import FileController from '../Controllers/FileController';
import {getChatPhoto, getContactFile, getDocumentThumbnailFile, getPhotoFile, getStickerFile} from '../Utils/File';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';

class DialogDetails extends Component{

    constructor(props){
        super(props);

        this.state = {
            history : [],
            scrollBottom : false
        };

        this.listRef = React.createRef();
        this.itemsRef = React.createRef();

        this.updateItemsInView = debounce(this.updateItemsInView.bind(this), 250);
        this.loadHistory = this.loadHistory.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.onLoadNext = this.onLoadNext.bind(this);
        this.handleUpdateItemsInView = this.handleUpdateItemsInView.bind(this);
        this.onUpdateNewMessage = this.onUpdateNewMessage.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.history !== this.state.history
            || nextProps.selectedChat !== this.props.selectedChat){
            return true;
        }

        // const list = this.listRef.current;
        // if (list && list.scrollTop !== 0){
        //     return true;
        // }

        return false;
    }
    componentDidMount(){
        if (this.state.scrollBottom)
        {
            this.scrollToBottom();
        }

        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
    }

    componentWillUnmount(){
        MessageStore.removeListener('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.removeListener('updateDeleteMessages', this.onUpdateDeleteMessages);
    }

    onUpdateNewMessage(message){
        if (!this.props.selectedChat) return;
        if (this.props.selectedChat.id !== message.chat_id) return;

        let history = [message];

        this.prependHistory(history);
        this.loadMessageContents(history);
        this.viewMessages(history);
    }

    onUpdateDeleteMessages(update){
        if (!update.is_permanent) return;

        if (!this.props.selectedChat) return;
        if (this.props.selectedChat.id !== update.chat_id) return;

        this.deleteHistory(update.message_ids);
    }

    handleScroll(){
        const list = this.listRef.current;

        if (this.suppressHandleScroll){
            this.suppressHandleScroll = false;
            return;
        }

        if (list && list.scrollTop <= 0){
            this.onLoadNext(true);
        }
        else{
            this.updateItemsInView();
        }
        /*if (x && (x.scrollTop + x.offsetHeight) >= x.scrollHeight){
            this.props.onLoadNext();
        }*/
    }

    updateItemsInView(){
        if (!this.messages) return;

        let messages = [];
        let items = itemsInView(this.listRef, this.itemsRef);
        for (let i = 0; i < items.length; i++){
            let messageControl = this.messages[items[i]];
            if (messageControl) {
                messages.push(messageControl.props.message);
            }
        }

        this.handleUpdateItemsInView(messages);
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const list = this.listRef.current;

        if (list)
        {
            this.previousScrollHeight = list.scrollHeight;
        }

        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        if (prevProps.selectedChat !== this.props.selectedChat){
            this.handleSelectChat(this.props.selectedChat, prevProps.selectedChat);
        }

        const list = this.listRef.current;

        if (this.state.scrollBottom)
        {
            this.scrollToBottom();
        }
        else{
            /// keep scrolling position
            list.scrollTop = list.scrollHeight - this.previousScrollHeight;
        }
    }

    async handleSelectChat(chat, previousChat){
        this.previousScrollHeight = 0;

        if (chat){
            TdLibController
                .send({
                    '@type': 'openChat',
                    chat_id: chat.id,
                });

            let result = await TdLibController
                .send({
                    '@type': 'getChatHistory',
                    chat_id: chat.id,
                    from_message_id: 0,
                    offset: 0,
                    limit: MESSAGE_SLICE_LIMIT
                });

            MessageStore.setItems(result.messages);
            result.messages.reverse();
            this.setHistory(result.messages);
            this.loadMessageContents(result.messages);
            this.loadHistory(0, result);
            this.viewMessages(result.messages);

            // load photo
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

        if (previousChat){
            TdLibController
                .send({
                    '@type': 'closeChat',
                    chat_id: previousChat.id,
                });
        }
    }

    viewMessages(messages){
        if (!messages) return;
        if (messages.length === 0) return;
        if (!messages[0].chat_id) return;

        TdLibController
            .send({
                '@type': 'viewMessages',
                chat_id: messages[0].chat_id,
                message_ids: messages.map(x => x.id)
            });
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
                        break;
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

    loadHistory(callStack, result){
        //console.log('loadHistory result=' + result.messages.length);
        if (callStack < 5
            && result.messages.length > 0
            && result.messages.length < MESSAGE_SLICE_LIMIT){
            this.onLoadNext(true, result2 => this.loadHistory(callStack + 1, result2));
        }
    }

    async onLoadNext(loadRemote = false, callback){

        if (!this.props.selectedChat) return;
        if (this.loading) return;

        let fromMessageId = 0;
        if (this.state.history && this.state.history.length > 0){
            fromMessageId = this.state.history[0].id;
        }

        let chatId = this.props.selectedChat.id;

        this.loading = true;
        let result = await TdLibController
            .send({
                '@type': 'getChatHistory',
                chat_id: chatId,
                from_message_id: fromMessageId,
                offset: 0,
                limit: MESSAGE_SLICE_LIMIT
            })
            .finally(() => {
                this.loading = false;
            });

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.appendHistory(result.messages);
        this.loadMessageContents(result.messages, loadRemote);
        this.viewMessages(result.messages);

        if (callback){
            callback(result);
        }
    }

    handleUpdateItemsInView(messages){
        if (!messages) return;

        /*let ids = messages.map(x => x.id);
        console.log('[perf] load_messages_contents ids=[' + ids + ']');

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

    setHistory(history, callback) {

        this.setState({ history: history, scrollBottom: true }, callback);
    }

    appendHistory(history, callback) {
        if (history.length === 0) return;

        this.setState({ history: history.concat(this.state.history), scrollBottom: false }, callback);
    }

    prependHistory(history, callback){
        if (history.length === 0) return;

        let scrollBottom = history[0].is_outgoing;

        this.setState({ history: this.state.history.concat(history), scrollBottom: scrollBottom }, callback);
    }

    deleteHistory(message_ids, callback) {
        let history = this.state.history;
        if (history.length === 0) return;

        let map = new Map(message_ids.map(x => [x, x]));

        history = history.filter(x => !map.has(x.id));

        this.setState({ history: history, scrollBottom: true }, callback);
    }

    scrollToBottom() {
        this.suppressHandleScroll = true;

        const list = this.listRef.current;

        list.scrollTop = list.scrollHeight - list.offsetHeight;
    };

    render(){
        this.messages = this.state.history.map(x => {
            return (<MessageControl key={x.id} showTitle={true} sendingState={x.sending_state} message={x} onSelectChat={this.props.onSelectChat}/>);
        });

        /*let groups = [];
        if (this.props.history.length > 0){
            let currentGroup = {
                key: this.props.history[0].id,
                date: this.props.history[0].date,
                senderUserId: this.props.history[0].sender_user_id,
                messages: [this.props.history[0]]
            };

            for (let i = 1; i < this.props.history.length; i++){
                if (this.props.history[i].sender_user_id === currentGroup.senderUserId
                    && Math.abs(this.props.history[i].date - currentGroup.date) <= 10 * 60
                    && i % 20 !== 0){
                    currentGroup.key += '_' + this.props.history[i].id;
                    currentGroup.messages.push(this.props.history[i]);
                }
                else {
                    groups.push(currentGroup);
                    currentGroup = {
                        key: this.props.history[i].id,
                        date: this.props.history[i].date,
                        senderUserId: this.props.history[i].sender_user_id,
                        messages: [this.props.history[i]]
                    };
                }
            }
            groups.push(currentGroup);
        }

        this.groups = groups.map(x => {
            return (<MessageGroupControl key={x.key} senderUserId={x.senderUserId} messages={x.messages} onSelectChat={this.props.onSelectChat}/>);
        });*/

        return (
            <div className='details'>
                <div ref={this.listRef} className='dialogdetails-wrapper' onScroll={this.handleScroll}>
                    <div className='dialogdetails-list-top'></div>
                    <div ref={this.itemsRef} className='dialogdetails-list'>
                        {this.messages}
                    </div>
                </div>
                {   this.props.selectedChat &&
                    <div className='dialogdetails-input-wrapper'>
                        <InputBoxControl
                            className='dialogdetails-input'
                            currentUser={this.props.currentUser}
                            selectedChat={this.props.selectedChat}/>
                    </div>
                }
            </div>
        );
    }
}

export default DialogDetails;