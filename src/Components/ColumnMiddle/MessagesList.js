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
    loadChatPhotos,
    loadMessageContents
} from '../../Utils/File';
import { filterMessages } from '../../Utils/Message';
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
            prevChatId : 0,
            history : [],
            scrollBehavior : ScrollBehaviorEnum.NONE,
            separatorMessageId : 0
        };

        this.listRef = React.createRef();
        this.itemsRef = React.createRef();
        this.itemsMap = new Map();

        this.updateItemsInView = debounce(this.updateItemsInView, 250);
    }

    static getDerivedStateFromProps(props, state){
        if (props.chatId !== state.prevChatId){
            return {
                prevChatId : props.chatId,
                scrollBehavior : ScrollBehaviorEnum.SCROLL_TO_BOTTOM,
                separatorMessageId : 0
            }
        }

        return null;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { chatId } = this.props;

        const list = this.listRef.current;
        const snapshot = {
            scrollTop : list.scrollTop,
            scrollHeight : list.scrollHeight,
            offsetHeight : list.offsetHeight
        };

        console.log(`SCROLL GETSNAPSHOTBEFOREUPDATE list.scrollTop=${list.scrollTop} list.scrollHeight=${list.scrollHeight} list.offsetHeight=${list.offsetHeight} chatId=${chatId}`);

        return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId } = this.props;

        if (prevProps.chatId !== chatId){
            this.handleSelectChat(chatId, prevProps.chatId);
        }

        this.handleScrollBehavior(snapshot);
    }

    shouldComponentUpdate(nextProps, nextState){
        const { chatId } = this.props;
        const { history } = this.state;

        if (nextProps.chatId !== chatId){
            return true;
        }

        if (nextState.history !== history){
            return true;
        }

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

    onUpdateChatLastMessage = (update) => {
        const { chatId } = this.props;
        if (chatId !== update.chat_id) return;

        if  (!update.last_message){
            this.completed = false;
        }
    };

    onUpdateNewMessage = (update) => {
        if (!this.completed) return;

        const { message } = update;
        const { chatId } = this.props;
        if (chatId !== message.chat_id) return;

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

        const history = [message];

        this.insertAfter(history, scrollBehavior);
        const store = FileController.getStore();
        loadMessageContents(store, history);
        MessagesList.viewMessages(history);
    };

    onUpdateDeleteMessages = (update) => {
        const { chatId } = this.props;
        if (chatId !== update.chat_id) return;

        if (!update.is_permanent) return;


        this.deleteHistory(update.message_ids);
    };

    updateItemsInView = () => {
        if (!this.messages) return;

        let messages = [];
        let items = itemsInView(this.listRef, this.itemsRef);
        for (let i = 0; i < items.length; i++){
            let messageControl = this.messages[items[i]];
            if (messageControl) {
                messages.push(messageControl.props.message);
            }
        }

        if (!messages.length) return;

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

        const store = FileController.getStore();
        loadMessageContents(store, messages);
    };

    async handleSelectChat(chatId, previousChatId){
        const chat = ChatStore.get(chatId);
        const previousChat = ChatStore.get(previousChatId);

        this.sessionId = Date.now();
        this.loading = false;
        this.completed = false;

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

            if (this.props.chatId !== chatId){
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

            // calculate separator
            let separatorMessageId = Number.MAX_VALUE;
            if (chat && chat.unread_count > 1){
                for (let i = result.messages.length - 1; i >= 0; i--){
                    const {id} = result.messages[i];
                    if (!result.messages[i].is_outgoing
                        && id > chat.last_read_inbox_message_id
                        && id < separatorMessageId){
                        separatorMessageId = id;
                    }
                    else{
                        break;
                    }
                }
            }
            separatorMessageId = separatorMessageId === Number.MAX_VALUE? 0 : separatorMessageId;
            console.log('[MessagesList] separator_message_id=' + separatorMessageId);

            this.replace(separatorMessageId, result.messages, unread ? ScrollBehaviorEnum.SCROLL_TO_UNREAD : ScrollBehaviorEnum.SCROLL_TO_BOTTOM);

            // load files
            const store = FileController.getStore();
            loadMessageContents(store, result.messages);
            loadChatPhotos(store, [chatId]);

            MessagesList.viewMessages(result.messages);

            this.loadIncompleteHistory(result);

            // load full info
            getChatFullInfo(chat.id);
        }
        else{
            this.replace(0, [], ScrollBehaviorEnum.SCROLL_TO_BOTTOM);
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

    loadIncompleteHistory = async (result) => {
        const MAX_ITERATIONS = 5;
        let incomplete = result && result.messages.length > 0 && result.messages.length < MESSAGE_SLICE_LIMIT;

        for (let i = 0; i < MAX_ITERATIONS && incomplete; i++){
            result = await this.onLoadNext();
            incomplete = result && result.messages.length > 0 && result.messages.length < MESSAGE_SLICE_LIMIT;
        }
    };

    onLoadNext = async () => {
        const { chatId } = this.props;

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

        if (this.props.chatId !== chatId){
            return;
        }
        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.insertBefore(result.messages);
        const store = FileController.getStore();
        loadMessageContents(store, result.messages);
        MessagesList.viewMessages(result.messages);

        return result;
    };

    onLoadPrevious = async () => {
        const { chatId } = this.props;
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

        if (this.props.chatId !== chatId){
            return;
        }

        if (chat.last_message){
            this.completed = result.messages.length > 0 && chat.last_message.id === result.messages[0].id;
        }
        else{
            this.completed = true;
        }

        filterMessages(result, this.state.history);

        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.insertAfter(result.messages, ScrollBehaviorEnum.NONE);
        const store = FileController.getStore();
        loadMessageContents(store, result.messages);
        MessagesList.viewMessages(result.messages);

        return result;
    };

    replace(separatorMessageId, history, scrollBehavior, callback) {
        this.setState({ separatorMessageId: separatorMessageId, history: history, scrollBehavior: scrollBehavior }, callback);
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
        const { history } = this.state;
        if (history.length === 0) return;

        let map = new Map(message_ids.map(x => [x, x]));

        this.setState({ history: history.filter(x => !map.has(x.id)), scrollBehavior: ScrollBehaviorEnum.SCROLL_TO_BOTTOM }, callback);
    }

    handleScroll = () => {

        const list = this.listRef.current;
        //console.log(`SCROLL HANDLESCROLL list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} chatId=${this.props.chatId}`);

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
    };

    handleScrollBehavior = (snapshot) => {
        const { chatId } = this.props;
        const { scrollBehavior, history } = this.state;
        const { scrollTop, scrollHeight, offsetHeight } = snapshot;

        console.log(`SCROLL HANDLESCROLLBEHAVIOR scrollBehavior=${scrollBehavior} previousScrollTop=${scrollTop} previousScrollHeight=${scrollHeight} previousOffsetHeight=${offsetHeight} chatId=${chatId}`);
        if (scrollBehavior === ScrollBehaviorEnum.NONE) {

        }
        else if (scrollBehavior === ScrollBehaviorEnum.SCROLL_TO_BOTTOM) {
            this.scrollToBottom();
        }
        else if (scrollBehavior === ScrollBehaviorEnum.SCROLL_TO_UNREAD) {
            const list = this.listRef.current;
            console.log(`SCROLL SCROLL_TO_UNREAD before list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} chatId=${chatId}`);

            for (let i = 0; i < history.length; i++) {
                let itemComponent = this.itemsMap.get(i);
                let item = ReactDOM.findDOMNode(itemComponent);
                if (item) {
                    console.log(`SCROLL SCROLL_TO_UNREAD item item.scrollTop=${item.scrollTop} showUnreadSeparator=${itemComponent.props.showUnreadSeparator} item.offsetHeight=${item.offsetHeight} item.scrollHeight=${item.scrollHeight}`);
                    if (itemComponent.props.showUnreadSeparator) {
                        list.scrollTop = item.offsetTop; // + unread messages margin-top
                        break;
                    }
                }
            }

            console.log(`SCROLL SCROLL_TO_UNREAD after list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} chatId=${chatId}`);
        }
        else if (scrollBehavior === ScrollBehaviorEnum.KEEP_SCROLL_POSITION) {
            const list = this.listRef.current;
            console.log(`SCROLL KEEP_SCROLL_POSITION before list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} chatId=${chatId}`);
            list.scrollTop = scrollTop + (list.scrollHeight - scrollHeight);
            console.log(`SCROLL KEEP_SCROLL_POSITION after list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} chatId=${chatId}`);
        }
    };

    scrollToBottom = () => {
        this.suppressHandleScroll = true;
        const list = this.listRef.current;
        console.log(`SCROLL SCROLLTOBOTTOM before list.scrollHeight=${list.scrollHeight} list.offsetHeight=${list.offsetHeight} list.scrollTop=${list.scrollTop} chatId=${this.props.chatId}`);

        const nextScrollTop = list.scrollHeight - list.offsetHeight;
        if (nextScrollTop !== list.scrollTop){
            list.scrollTop = list.scrollHeight - list.offsetHeight;
            console.log(`SCROLL SCROLLTOBOTTOM after list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} suppressHandleScroll=${this.suppressHandleScroll} chatId=${this.props.chatId}`);
        }
        else{
            console.log(`SCROLL SCROLLTOBOTTOM after(already bottom) list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} suppressHandleScroll=${this.suppressHandleScroll} chatId=${this.props.chatId}`);
        }
    };

    render() {
        const { onSelectChat, onSelectUser } = this.props;
        const { history, separatorMessageId } = this.state;

        this.itemsMap.clear();
        this.messages = history.map((x, i) => {
            return (isServiceMessage(x)
                ? <ServiceMessageControl
                    key={x.id}
                    ref={el => this.itemsMap.set(i, el)}
                    chatId={x.chat_id}
                    messageId={x.id}
                    onSelectChat={onSelectChat}
                    onSelectUser={onSelectUser}
                    showUnreadSeparator={separatorMessageId === x.id}/>
                : <MessageControl
                    key={x.id}
                    ref={el => this.itemsMap.set(i, el)}
                    chatId={x.chat_id}
                    messageId={x.id}
                    showTitle={true}
                    sendingState={x.sending_state}
                    onSelectChat={onSelectChat}
                    onSelectUser={onSelectUser}
                    showUnreadSeparator={separatorMessageId === x.id}/>);
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