/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import * as ReactDOM from 'react-dom';
import ServiceMessageControl from '../Message/ServiceMessageControl';
import MessageControl from '../Message/MessageControl';
import {
    debounce,
    getPhotoSize,
    itemsInView
} from '../../Utils/Common';
import {
    getChatPhoto,
    getContactFile,
    getDocumentThumbnailFile,
    getPhotoFile,
    getStickerFile,
    loadUserPhotos
} from '../../Utils/File';
import { isServiceMessage } from '../../Utils/ServiceMessage';
import { getChatFullInfo } from '../../Utils/Chat';
import {MESSAGE_SLICE_LIMIT} from '../../Constants';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';
import FileController from '../../Controllers/FileController';
import './MessagesList.css';

const ScrollBehaviorEnum = Object.freeze({
    NONE : 'NONE',
    SCROLL_TO_BOTTOM : 'SCROLL_TO_BOTTOM',
    SCROLL_TO_UNREAD : 'SCROLL_TO_UNREAD',
    KEEP_SCROLL_POSITION : 'KEEP_SCROLL_POSITION'
});

class MessagesList extends React.Component {
    constructor(props){
        super(props);

        this.sessionId = Date.now();
        this.state = {
            previousPropsSelectedChatId : 0,
            history : [],
            scrollBehavior : ScrollBehaviorEnum.NONE,
        };

        this.listRef = React.createRef();
        this.itemsRef = React.createRef();
        this.itemsMap = new Map();

        this.updateItemsInView = debounce(this.updateItemsInView.bind(this), 250);
        this.loadIncompleteHistory = this.loadIncompleteHistory.bind(this);
        this.onLoadNext = this.onLoadNext.bind(this);
        this.onLoadPrevious = this.onLoadPrevious.bind(this);
        this.handleUpdateItemsInView = this.handleUpdateItemsInView.bind(this);
        this.onUpdateNewMessage = this.onUpdateNewMessage.bind(this);
        this.onUpdateDeleteMessages = this.onUpdateDeleteMessages.bind(this);
        this.onUpdateChatLastMessage = this.onUpdateChatLastMessage.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleScrollBehavior = this.handleScrollBehavior.bind(this);
        this.filterMessages = this.filterMessages.bind(this);
    }

    static getDerivedStateFromProps(props, state){
        if (props.selectedChatId !== state.previousPropsSelectedChatId){
            return {
                previousPropsSelectedChatId : props.selectedChatId,
                scrollBehavior : ScrollBehaviorEnum.SCROLL_TO_BOTTOM,
            }
        }

        return null;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const list = this.listRef.current;

        const snapshot = {
            scrollTop : list.scrollTop,
            scrollHeight : list.scrollHeight,
            offsetHeight : list.offsetHeight };

        console.log(`SCROLL GETSNAPSHOTBEFOREUPDATE list.scrollTop=${list.scrollTop} list.scrollHeight=${list.scrollHeight} list.offsetHeight=${list.offsetHeight} selectedChatId=${this.props.selectedChatId}`);

        return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

        if (prevProps.selectedChatId !== this.props.selectedChatId){
            this.handleSelectChat(this.props.selectedChatId, prevProps.selectedChatId);
        }

        this.handleScrollBehavior(snapshot);
    }

    handleScrollBehavior(snapshot){
        console.log(`SCROLL HANDLESCROLLBEHAVIOR scrollBehavior=${this.state.scrollBehavior} previousScrollTop=${snapshot.scrollTop} previousScrollHeight=${snapshot.scrollHeight} previousOffsetHeight=${snapshot.offsetHeight} selectedChatId=${this.props.selectedChatId}`);
        if (this.state.scrollBehavior === ScrollBehaviorEnum.NONE) {

        }
        else if (this.state.scrollBehavior === ScrollBehaviorEnum.SCROLL_TO_BOTTOM) {
            this.scrollToBottom();
        }
        else if (this.state.scrollBehavior === ScrollBehaviorEnum.SCROLL_TO_UNREAD) {
            const list = this.listRef.current;
            console.log(`SCROLL SCROLL_TO_UNREAD before list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} selectedChatId=${this.props.selectedChatId}`);

            let scrollTop = 12 + 10; // message-list-top min-height + unread messages margin-top
            for (let i = 0; i < this.state.history.length; i++) {
                let itemComponent = this.itemsMap.get(i);
                let item = ReactDOM.findDOMNode(itemComponent);
                if (item) {
                    console.log(`SCROLL SCROLL_TO_UNREAD item item.scrollTop=${item.scrollTop} showUnreadSeparator=${itemComponent.props.showUnreadSeparator} item.offsetHeight=${item.offsetHeight} item.scrollHeight=${item.scrollHeight}`);
                    if (itemComponent.props.showUnreadSeparator) {
                        list.scrollTop = item.offsetTop; // + unread messages margin-top
                        break;
                    }
                    else {
                        scrollTop += item.scrollHeight;
                    }
                }
            }

            console.log(`SCROLL SCROLL_TO_UNREAD after list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} selectedChatId=${this.props.selectedChatId}`);
        }
        else if (this.state.scrollBehavior === ScrollBehaviorEnum.KEEP_SCROLL_POSITION) {
            const list = this.listRef.current;
            console.log(`SCROLL KEEP_SCROLL_POSITION before list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} selectedChatId=${this.props.selectedChatId}`);
            list.scrollTop = snapshot.scrollTop + (list.scrollHeight - snapshot.scrollHeight);
            console.log(`SCROLL KEEP_SCROLL_POSITION after list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} selectedChatId=${this.props.selectedChatId}`);
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.history !== this.state.history
            || nextProps.selectedChatId !== this.props.selectedChatId){
            return true;
        }

        // const list = this.listRef.current;
        // if (list && list.scrollTop !== 0){
        //     return true;
        // }

        return false;
    }

    componentDidMount(){
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatLastMessage);
    }

    componentWillUnmount(){
        MessageStore.removeListener('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.removeListener('updateDeleteMessages', this.onUpdateDeleteMessages);
        ChatStore.removeListener('updateChatLastMessage', this.onUpdateChatLastMessage);
    }

    onUpdateChatLastMessage(update){
        if  (update.chat_id === this.props.selectedChatId && !update.last_message){
            this.completed = false;
        }
    }

    onUpdateNewMessage(message){
        if (!this.completed) return;
        if (this.props.selectedChatId !== message.chat_id) return;

        let scrollBehavior = ScrollBehaviorEnum.NONE;
        const list = this.listRef.current;
        // at the end of list
        if (list.scrollTop === list.scrollHeight - list.offsetHeight){
            scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
        }
        // sent message
        else if (message.is_outgoing){
            scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
        }

        let history = [message];

        this.insertAfter(history, scrollBehavior);
        this.loadMessageContents(history);
        MessagesList.viewMessages(history);
    }

    onUpdateDeleteMessages(update){
        if (!update.is_permanent) return;

        if (this.props.selectedChatId !== update.chat_id) return;

        this.deleteHistory(update.message_ids);
    }

    handleScroll(){

        const list = this.listRef.current;
        //console.log(`SCROLL HANDLESCROLL list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} selectedChatId=${this.props.selectedChatId}`);

        if (this.suppressHandleScroll){
            this.suppressHandleScroll = false;
            return;
        }

        if (list.scrollTop <= 0){
            console.log('SCROLL HANDLESCROLL onLoadNext');
            this.onLoadNext();
        }
        else if (list.scrollTop + list.offsetHeight === list.scrollHeight){
            console.log('SCROLL HANDLESCROLL onLoadPrevious');
            this.onLoadPrevious();
        }
        else{
            //console.log('SCROLL HANDLESCROLL updateItemsInView');

            //this.updateItemsInView();
        }
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

    async handleSelectChat(chatId, previousChatId){
        const chat = ChatStore.get(chatId);
        const previousChat = ChatStore.get(previousChatId);

        this.sessionId = Date.now();
        this.loading = false;
        this.completed = false;
        this.lastReadInboxMessageId = chat.last_read_inbox_message_id;

        if (chat){
            let sessionId = this.sessionId;

            TdLibController
                .send({
                    '@type': 'openChat',
                    chat_id: chat.id,
                });

            const unread = chat.unread_count > 0;
            const fromMessageId = unread ? chat.last_read_inbox_message_id : 0;
            const offset = unread ? -1 - MESSAGE_SLICE_LIMIT : 0;
            const limit = unread ? 2 * MESSAGE_SLICE_LIMIT : MESSAGE_SLICE_LIMIT;

            let result = await TdLibController
                .send({
                    '@type': 'getChatHistory',
                    chat_id: chat.id,
                    from_message_id: fromMessageId,
                    offset: offset,
                    limit: limit
                });

            //TODO: replace result with one-way data flow
            if (sessionId !== this.sessionId){
                return;
            }

            if (this.props.selectedChatId !== chatId){
                return;
            }

            if (chat.last_message){
                this.completed = result.messages.length > 0 && chat.last_message.id === result.messages[0].id;
            }
            else{
                this.completed = true;
            }

            MessageStore.setItems(result.messages);
            result.messages.reverse();
            this.replace(result.messages, unread ? ScrollBehaviorEnum.SCROLL_TO_UNREAD : ScrollBehaviorEnum.SCROLL_TO_BOTTOM);
            this.loadMessageContents(result.messages);
            MessagesList.viewMessages(result.messages);

            this.loadIncompleteHistory(result);

            // load full info
            getChatFullInfo(chat.id);

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
        else{
            this.replace([], ScrollBehaviorEnum.SCROLL_TO_BOTTOM);
        }

        if (previousChat){
            TdLibController
                .send({
                    '@type': 'closeChat',
                    chat_id: previousChat.id,
                });
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

    loadMessageContents(messages){
        let store = FileController.getStore();

        let users = new Map();
        for (let i = messages.length - 1; i >= 0; i--) {
            let message = messages[i];
            if (message) {
                if (message.sender_user_id){
                    users.set(message.sender_user_id, message.sender_user_id);
                }

                if (message.content){
                    switch (message.content['@type']) {
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

                            let [id, pid, idb_key] = getPhotoFile(message);
                            if (pid) {
                                let photoSize = getPhotoSize(message.content.photo.sizes);
                                if (photoSize){
                                    let obj = photoSize.photo;
                                    if (!obj.blob){
                                        let localMessage = message;
                                        FileController.getLocalFile(store, obj, idb_key, null,
                                            () => MessageStore.updateMessagePhoto(localMessage.id),
                                            () => FileController.getRemoteFile(id, 1, localMessage));
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
                                    let localMessage = message;
                                    FileController.getLocalFile(store, obj, idb_key, null,
                                        () => MessageStore.updateMessageSticker(localMessage.id),
                                        () => FileController.getRemoteFile(id, 1, localMessage));
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
                                                () => FileController.getRemoteFile(id, 1, user));
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
                                    let localMessage = message;
                                    FileController.getLocalFile(store, obj, idb_key, null,
                                        () => MessageStore.updateMessageDocumentThumbnail(obj.id),
                                        () => FileController.getRemoteFile(id, 1, localMessage));
                                }
                            }
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
        }

        loadUserPhotos(store, [...users.keys()]);
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
        const chatId = this.props.selectedChatId;

        if (!chatId) return;
        if (this.loading) return;

        let fromMessageId = 0;
        if (this.state.history && this.state.history.length > 0){
            fromMessageId = this.state.history[0].id;
        }

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

        if (this.props.selectedChatId !== chatId){
            return;
        }
        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.insertBefore(result.messages);
        this.loadMessageContents(result.messages);
        MessagesList.viewMessages(result.messages);

        return result;
    }

    async onLoadPrevious(){
        const chatId = this.props.selectedChatId;
        const chat = ChatStore.get(chatId);

        if (!chat) return;
        if (this.loading) return;
        if (this.completed) return;

        let fromMessageId = 0;
        if (this.state.history && this.state.history.length > 0){
            fromMessageId = this.state.history[this.state.history.length - 1].id;
        }

        this.loading = true;
        let result = await TdLibController
            .send({
                '@type': 'getChatHistory',
                chat_id: chatId,
                from_message_id: fromMessageId,
                offset: - MESSAGE_SLICE_LIMIT - 1,
                limit: MESSAGE_SLICE_LIMIT + 1
            })
            .finally(() => {
                this.loading = false;
            });

        if (this.props.selectedChatId !== chatId){
            return;
        }

        if (chat.last_message){
            this.completed = result.messages.length > 0 && chat.last_message.id === result.messages[0].id;
        }
        else{
            this.completed = true;
        }

        this.filterMessages(result, this.state.history);

        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.insertAfter(result.messages, ScrollBehaviorEnum.NONE);
        this.loadMessageContents(result.messages);
        MessagesList.viewMessages(result.messages);

        return result;
    }

    filterMessages(result, history){
        if (result.messages.length === 0) return;
        if (history.length === 0) return;

        const map = history.reduce(function(accumulator, current) {
            accumulator.set(current.id, current.id);
            return accumulator;
        }, new Map());

        result.messages = result.messages.filter(x => !map.has(x.id));
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

        this.loadMessageContents(messages);
    }

    replace(history, scrollBehavior, callback) {
        this.setState({ history: history, scrollBehavior: scrollBehavior }, callback);
    }

    insertBefore(history, callback) {
        if (history.length === 0) return;

        this.setState({ history: history.concat(this.state.history), scrollBehavior: ScrollBehaviorEnum.KEEP_SCROLL_POSITION }, callback);
    }

    insertAfter(history, scrollBehavior, callback){
        if (history.length === 0) return;

        this.setState({ history: this.state.history.concat(history), scrollBehavior: scrollBehavior }, callback);
    }

    deleteHistory(message_ids, callback) {
        let history = this.state.history;
        if (history.length === 0) return;

        let map = new Map(message_ids.map(x => [x, x]));

        history = history.filter(x => !map.has(x.id));

        this.setState({ history: history, scrollBehavior: ScrollBehaviorEnum.SCROLL_TO_BOTTOM }, callback);
    }

    scrollToBottom() {
        this.suppressHandleScroll = true;
        const list = this.listRef.current;
        console.log(`SCROLL SCROLLTOBOTTOM before list.scrollHeight=${list.scrollHeight} list.offsetHeight=${list.offsetHeight} list.scrollTop=${list.scrollTop} selectedChatId=${this.props.selectedChatId}`);

        const nextScrollTop = list.scrollHeight - list.offsetHeight;
        if (nextScrollTop !== list.scrollTop){
            list.scrollTop = list.scrollHeight - list.offsetHeight;
            console.log(`SCROLL SCROLLTOBOTTOM after list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} suppressHandleScroll=${this.suppressHandleScroll} selectedChatId=${this.props.selectedChatId}`);
        }
        else{
            console.log(`SCROLL SCROLLTOBOTTOM after(already bottom) list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} suppressHandleScroll=${this.suppressHandleScroll} selectedChatId=${this.props.selectedChatId}`);
        }

    };

    render() {
        const { selectedChatId, onSelectChat, onSelectUser } = this.props;
        const chat = ChatStore.get(selectedChatId);

        let unreadSeparatorMessageId = Number.MAX_VALUE;
        if (chat && chat.unread_count > 1){
            for (let i = this.state.history.length - 1; i >= 0; i--){
                const {id} = this.state.history[i];
                if (!this.state.history[i].is_outgoing
                    && id > this.lastReadInboxMessageId
                    && id < unreadSeparatorMessageId){
                    unreadSeparatorMessageId = id;
                }
                else{
                    break;
                }
            }
        }

        console.log('[MessagesList] unreadSeparatorMessageId=' + unreadSeparatorMessageId);

        this.itemsMap.clear();
        this.messages = this.state.history.map((x, i) => {
            return (isServiceMessage(x)
                ? <ServiceMessageControl
                    key={x.id}
                    ref={el => this.itemsMap.set(i, el)}
                    chatId={x.chat_id}
                    messageId={x.id}
                    onSelectChat={onSelectChat}
                    onSelectUser={onSelectUser}
                    showUnreadSeparator={!x.is_outgoing && unreadSeparatorMessageId === x.id}/>
                : <MessageControl
                    key={x.id}
                    ref={el => this.itemsMap.set(i, el)}
                    chatId={x.chat_id}
                    messageId={x.id}
                    showTitle={true}
                    sendingState={x.sending_state}
                    onSelectChat={onSelectChat}
                    onSelectUser={onSelectUser}
                    showUnreadSeparator={!x.is_outgoing && unreadSeparatorMessageId === x.id}/>);
        });

        return (
            <div ref={this.listRef} className='messages-list-wrapper' onScroll={this.handleScroll}>
                <div className='messages-list-top'/>
                <div ref={this.itemsRef} className='messages-list'>
                    {this.messages}
                </div>
            </div>
        );
    }
}

export default MessagesList;