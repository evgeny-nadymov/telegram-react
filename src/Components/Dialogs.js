import React, {Component} from 'react';
import './Dialogs.css';
import DialogControl from './DialogControl'
import ReactDOM from 'react-dom';
import {itemsInView, orderCompare, throttle} from '../Utils/Common';
import TdLibController from '../Controllers/TdLibController';
import {CHAT_SLICE_LIMIT} from '../Constants';
import ChatStore from "../Stores/ChatStore";
import FileContrller from '../Controllers/FileController';
import {getChatPhoto} from '../Utils/File';
import { Scrollbars } from 'react-custom-scrollbars';

class Dialogs extends Component{
    constructor(props){
        super(props);

        this.state = {
            chats: []
        };

        this.onUpdateState = this.onUpdateState.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleLoadDialogs = this.handleLoadDialogs.bind(this);
        //this.throttledScroll = throttle(this.handleScrollInternal.bind(this), 1000);
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
                this.handleLoadDialogs();
                break;
            default:
                break;
        }
    }

    onUpdate(update) {

        switch (update['@type']) {
            // case 'updateFatalError':
            //     alert('Oops! Something went wrong. We need to refresh this page.');
            //     window.location.reload();
            //     break;
            // case 'updateUserChatAction':
            //     this.onUpdateUserChatAction(update.chat_id, update.user_id, update.action);
            //     break;
            // case 'updateNewChat':
            //     //this.onUpdateChatTitle(update.chat.id, update.chat.title);
            //     break;
            // case 'updateChatTitle':
            //     //this.onUpdateChatTitle(update.chat_id, update.title);
            //     break;
            // case 'updateNewMessage':
            //     this.onUpdateNewMessage(update.message);
            //     break;
            // case 'updateMessageSendSucceeded':
            //     this.onUpdateMessageSendSucceeded(update.old_message_id, update.message);
            //     break;
            case 'updateChatDraftMessage':
                this.onUpdateChatDraftMessage(update.chat_id, update.order, update.draft_message);
                break;
            case 'updateChatLastMessage':
                this.onUpdateChatLastMessage(update.chat_id, update.order, update.last_message);
                break;
            case 'updateChatIsPinned':
                this.onUpdateChatIsPinned(update.chat_id, update.order, update.is_pinned);
                break;
            case 'updateChatOrder':
                this.onUpdateChatOrder(update.chat_id, update.order);
                break;
            case 'updateChatReadInbox':
                this.onUpdateChatReadInbox(update.chat_id, update.last_read_inbox_message_id, update.unread_count);
                break;
            case 'updateChatReadOutbox':
                this.onUpdateChatReadOutbox(update.chat_id, update.last_read_outbox_message_id);
                break;
            case 'updateChatUnreadMentionCount':
            case 'updateMessageMentionRead':
                this.onUpdateChatUnreadMentionCount(update.chat_id, update.unread_mention_count);
                break;
            // case 'updateFile':
            //     this.onUpdateFile(update.file);
            //     break;
            default:
                break;
        }
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.chats !== this.state.chats){
            return true;
        }

        if (nextProps.selectedChat !== this.props.selectedChat){
            return true;
        }

        return false;
    }

    componentDidUpdate(){
        //let list = ReactDOM.findDOMNode(this.refs.list);
        //let items = itemsInView(list);

        //console.log(items);
    }

    onUpdateChatDraftMessage(chat_id, order, draft_message){
        if (order === '0') return;

        let chatExists = false;
        let updatedChats = this.state.chats.map(x =>{
            if (x.id !== chat_id){
                return x;
            }

            chatExists = true;
            return Object.assign({}, x, {'order' : order, 'draft_message' : draft_message });
        });

        if (!chatExists) {
            return;
        }

        this.reorderChats(updatedChats);
    }

    onUpdateChatLastMessage(chat_id, order, last_message){
        if (!last_message) return;
        if (order === '0') return;

        let chatExists = false;
        let updatedChats = this.state.chats.map(x =>{
            if (x.id !== chat_id){
                return x;
            }

            chatExists = true;
            return Object.assign({}, x, {'order' : order, 'last_message' : last_message });
        });

        if (!chatExists) {
            return;
        }

        this.reorderChats(updatedChats);
    }

    onUpdateChatIsPinned(chat_id, order, is_pinned){
        if (order === '0') return;

        let chatExists = false;
        let updatedChats = this.state.chats.map(x =>{
            if (x.id !== chat_id){
                return x;
            }

            chatExists = true;
            return Object.assign({}, x, {'order' : order, 'is_pinned' : is_pinned });
        });

        if (!chatExists) {
            return;
        }

        this.reorderChats(updatedChats);
    }

    onUpdateChatOrder(chat_id, order){
        if (order === '0') return;

        let chatExists = false;
        let updatedChats = this.state.chats.map(x =>{
            if (x.id !== chat_id){
                return x;
            }

            chatExists = true;
            return Object.assign({}, x, {'order' : order });
        });

        if (!chatExists) {
            return;
        }

        this.reorderChats(updatedChats);
    }

    onUpdateChatReadOutbox(chat_id, last_read_outbox_message_id){
        if (!chat_id) return;

        let chatExists = false;
        let updatedChats = this.state.chats.map(x =>{
            if (x.id !== chat_id){
                return x;
            }

            chatExists = true;
            return Object.assign({}, x, {'last_read_outbox_message_id' : last_read_outbox_message_id });
        });

        if (!chatExists) {
            return;
        }

        this.reorderChats(updatedChats);
    }

    onUpdateChatReadInbox(chat_id, last_read_inbox_message_id, unread_count){
        if (!chat_id) return;

        let chatExists = false;
        let updatedChats = this.state.chats.map(x =>{
            if (x.id !== chat_id){
                return x;
            }

            chatExists = true;
            return Object.assign({}, x, {'last_read_inbox_message_id' : last_read_inbox_message_id, 'unread_count' : unread_count });
        });

        if (!chatExists) {
            return;
        }

        this.reorderChats(updatedChats);
    }

    onUpdateChatUnreadMentionCount(chat_id, unread_mention_count){
        if (!chat_id) return;

        let chatExists = false;
        let updatedChats = this.state.chats.map(x =>{
            if (x.id !== chat_id){
                return x;
            }

            chatExists = true;
            return Object.assign({}, x, {'unread_mention_count' : unread_mention_count});
        });

        if (!chatExists) {
            return;
        }

        const orderedChats = updatedChats.sort((a, b) => {
            let result = orderCompare(b.order, a.order);
            //console.log('orderCompare\no1=' + b.order + '\no2=' + a.order + '\nresult=' + result);
            return  result;
        });

        this.setState({ chats: orderedChats });
    }

    reorderChats(chats) {
        const orderedChats = chats.sort((a, b) => {
            return orderCompare(b.order, a.order);
        });

        this.setState({chats: orderedChats});
    }

    handleScroll(){
        if (!this.x)
        {
            this.x = ReactDOM.findDOMNode(this.refs.list);
        }

        if (this.x && (this.x.scrollTop + this.x.offsetHeight) >= this.x.scrollHeight){
            this.handleLoadDialogs();
        }
    }

    handleScrollInternal(){
        //let list = ReactDOM.findDOMNode(this.refs.list);
        //let items = itemsInView(list);

        //console.log(items);
    }

    handleLoadDialogs(){
        if (this.loading) return;

        let offsetOrder = '9223372036854775807'; // 2^63
        let offsetChatId = 0;
        if (this.state.chats && this.state.chats.length > 0){
            offsetOrder = this.state.chats[this.state.chats.length - 1].order;
            offsetChatId = this.state.chats[this.state.chats.length - 1].id;
        }

        TdLibController
            .send({
                '@type': 'getChats',
                offset_chat_id: offsetChatId,
                offset_order: offsetOrder,
                limit: CHAT_SLICE_LIMIT
            })
            .then(result => {
                this.loading = false;

                if (result.chat_ids.length > 0
                    && result.chat_ids[0] === offsetChatId) {
                    result.chat_ids.shift();
                }

                this.onGetChats(result);
            })
            .catch(() => {
                this.loading = false;
            });
    }

    onGetChats(result){
        let chats = [];
        for (let i = 0; i < result.chat_ids.length; i++){
            chats.push(ChatStore.get(result.chat_ids[i]));
        }

        this.appendChats(chats);

        let store = FileContrller.getStore();

        for (let i = 0; i < chats.length; i++){
            let chat = chats[i];
            let [id, pid, idb_key] = getChatPhoto(chat);
            if (pid) {
                FileContrller.getLocalFile(store, chat.photo.small, idb_key, null,
                    () => ChatStore.updatePhoto(chat.id),
                    () => FileContrller.getRemoteFile(id, 1, chat));
            }
        }
    }

    appendChats(chats, callback){
        if (chats.length === 0) return;

        this.setState({ chats: this.state.chats.concat(chats) }, callback);
    }

    render(){
        const chats = this.state.chats.map(x =>
            (<DialogControl
                key={x.id}
                chat={x}
                isSelected={this.props.selectedChat && this.props.selectedChat.id === x.id}
                onClick={this.props.onSelectChat}/>));

        return (
            <div className='master'>
                <div className='dialogs-list' ref='list' onScroll={this.handleScroll}>
                    {chats}
                </div>
            </div>
        );
    }
}

export default Dialogs;