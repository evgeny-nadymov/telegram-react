import React, {Component} from 'react';
import './DialogDetails.css';
import InputBoxControl from './InputBoxControl';
import MessageControl from './MessageControl';
import MessageGroupControl from "./MessageGroupControl";
import {debounce, getPhotoSize, itemsInView, throttle} from '../Utils/Common';
import ChatTileControl from './ChatTileControl';
import UserTileControl from './UserTileControl';
import TdLibController from '../Controllers/TdLibController';
import {MESSAGE_SLICE_LIMIT} from '../Constants';
import MessageStore from '../Stores/MessageStore';
import FileController from '../Controllers/FileController';
import {getChatPhoto, getContactFile, getDocumentThumbnailFile, getPhotoFile, getStickerFile} from '../Utils/File';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import SupergroupStore from '../Stores/SupergroupStore';
import DialogFooterControl from './DialogFooterControl';
import Header from './Header';

class DialogDetails extends Component{

    constructor(props){
        super(props);

        this.state = {
            history : [],
            scrollBottom : false,
            selectedChatId : ChatStore.getSelectedChatId()
        };

        this.listRef = React.createRef();
        this.itemsRef = React.createRef();

        this.updateItemsInView = debounce(this.updateItemsInView.bind(this), 250);
        this.loadIncompleteHistory = this.loadIncompleteHistory.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.onLoadNext = this.onLoadNext.bind(this);
        this.handleUpdateItemsInView = this.handleUpdateItemsInView.bind(this);
        this.onUpdateNewMessage = this.onUpdateNewMessage.bind(this);
        this.onUpdateDeleteMessages = this.onUpdateDeleteMessages.bind(this);
        this.showDialogFooter = this.showDialogFooter.bind(this);
        this.getFullInfo = this.getFullInfo.bind(this);

        this.onClientUpdateSelectedChatId = this.onClientUpdateSelectedChatId.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.history !== this.state.history
            || nextState.selectedChatId !== this.state.selectedChatId){
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

        ChatStore.on('clientUpdateSelectedChatId', this.onClientUpdateSelectedChatId);
    }

    componentWillUnmount(){
        MessageStore.removeListener('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.removeListener('updateDeleteMessages', this.onUpdateDeleteMessages);

        MessageStore.removeListener('clientUpdateSelectedChatId', this.onClientUpdateSelectedChatId);
    }

    onClientUpdateSelectedChatId(update){
        this.setState({ selectedChatId : update.nextChatId });
    }

    onUpdateNewMessage(message){
        if (this.state.selectedChatId !== message.chat_id) return;

        let history = [message];

        this.prependHistory(history);
        this.loadMessageContents(history);
        DialogDetails.viewMessages(history);
    }

    onUpdateDeleteMessages(update){
        if (!update.is_permanent) return;

        if (this.state.selectedChatId !== update.chat_id) return;

        this.deleteHistory(update.message_ids);
    }

    handleScroll(){
        const list = this.listRef.current;

        if (this.suppressHandleScroll){
            this.suppressHandleScroll = false;
            return;
        }

        if (list && list.scrollTop <= 0){
            this.onLoadNext();
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

        if (prevState.selectedChatId !== this.state.selectedChatId){
            this.handleSelectChat(this.state.selectedChatId, prevState.selectedChatId);
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

    async handleSelectChat(chatId, previousChatId){
        const chat = ChatStore.get(chatId);
        const previousChat = ChatStore.get(previousChatId);

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

            //TODO: replace result with one-way data flow

            MessageStore.setItems(result.messages);
            result.messages.reverse();
            this.setHistory(result.messages);
            this.loadMessageContents(result.messages);
            DialogDetails.viewMessages(result.messages);

            this.loadIncompleteHistory(result);

            // load full info
            this.getFullInfo(chat);

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

    getFullInfo(chat){
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']){
            case 'chatTypePrivate' : {
                TdLibController.send(
                    {
                        '@type': 'getUserFullInfo',
                        user_id: chat.type.user_id,
                    });
                break;
            }
            case 'chatTypeSecret' : {
                TdLibController.send(
                    {
                        '@type': 'getUserFullInfo',
                        user_id: chat.type.user_id,
                    });
                break;
            }
            case 'chatTypeBasicGroup' : {
                TdLibController.send(
                    {
                        '@type': 'getBasicGroupFullInfo',
                        basic_group_id: chat.type.basic_group_id,
                    });
                break;
            }
            case 'chatTypeSupergroup' : {
                TdLibController.send(
                    {
                        '@type': 'getSupergroupFullInfo',
                        supergroup_id: chat.type.supergroup_id,
                    });
                break;
            }
        }
    }

    static viewMessages(messages){
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

    async loadIncompleteHistory(result){
        const MAX_ITERATIONS = 5;
        let incomplete = result && result.messages.length > 0 && result.messages.length < MESSAGE_SLICE_LIMIT;

        for (let i = 0; i < MAX_ITERATIONS && incomplete; i++){
            result = await this.onLoadNext();
            incomplete = result && result.messages.length > 0 && result.messages.length < MESSAGE_SLICE_LIMIT;
        }
    }

    async onLoadNext(){
        if (!this.state.selectedChatId) return;
        if (this.loading) return;

        let fromMessageId = 0;
        if (this.state.history && this.state.history.length > 0){
            fromMessageId = this.state.history[0].id;
        }

        let chatId = this.state.selectedChatId;

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

        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.appendHistory(result.messages);
        this.loadMessageContents(result.messages, true);
        DialogDetails.viewMessages(result.messages);

        return result;
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

    showDialogFooter(){
        return false;

        const chat = ChatStore.get(this.state.selectedChatId);
        if (!chat) return false;

        const {type} = chat;

        if (type && type['@type'] === 'chatTypeSupergroup'){
            if (type.is_channel){
                return true;
            }
        }

        return false;
    }

    render(){
        this.messages = this.state.history.map(x => {
            return (<MessageControl key={x.id} showTitle={true} sendingState={x.sending_state} chatId={x.chat_id} messageId={x.id} onSelectChat={this.props.onSelectChat}/>);
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

        const showDialogFooter = this.showDialogFooter();

        return (
            <div className='details'>
                <Header />
                <div ref={this.listRef} className='dialogdetails-wrapper' onScroll={this.handleScroll}>
                    <div className='dialogdetails-list-top'/>
                    <div ref={this.itemsRef} className='dialogdetails-list'>
                        {this.messages}
                    </div>
                </div>
                {   this.state.selectedChatId !== 0 &&
                    <React.Fragment>
                        {showDialogFooter
                            ? <DialogFooterControl/>
                            : <InputBoxControl currentUser={this.props.currentUser} />
                        }
                    </React.Fragment>
                }
            </div>
        );
    }
}

export default DialogDetails;