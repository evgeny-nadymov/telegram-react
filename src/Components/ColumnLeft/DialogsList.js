/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import DialogControl from '../Tile/DialogControl';
import {CHAT_SLICE_LIMIT} from '../../Constants';
import {
    getChatPhoto,
    loadChatPhotos
} from '../../Utils/File';
import {
    itemsInView,
    orderCompare,
    throttle
} from '../../Utils/Common';
import ChatStore from '../../Stores/ChatStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import FileController from '../../Controllers/FileController';
import TdLibController from '../../Controllers/TdLibController';
import './DialogsList.css';

class DialogsList extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            chatIds: []
        };

        this.listRef = React.createRef();

        this.once = false;
        this.subscriptions = [];

        this.onUpdateState = this.onUpdateState.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onUpdateChatOrder = this.onUpdateChatOrder.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.onLoadNext = this.onLoadNext.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.chatIds !== this.state.chatIds){
            return true;
        }

        return false;
    }

    componentDidMount(){
        TdLibController.on('tdlib_status', this.onUpdateState);

        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatIsPinned', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateChatOrder', this.onUpdateChatOrder);

        if (!this.once
            && this.props.authState === 'ready'){
            this.once = true;
            this.onLoadNext();
        }
    }

    createListeners(){

    }

    componentWillUnmount(){
        for (let i = 0; i < this.subscriptions.length; i++){
            this.subscriptions[i].unsubscribe();
        }

        TdLibController.removeListener('tdlib_status', this.onUpdateState);

        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate);
        ChatStore.removeListener('updateChatIsPinned', this.onUpdate);
        ChatStore.removeListener('updateChatLastMessage', this.onUpdate);
        ChatStore.removeListener('updateChatOrder', this.onUpdateChatOrder);
    }

    onUpdateState(state){
        switch (state.status) {
            case 'ready':
                this.onLoadNext();
                break;
            default:
                break;
        }
    }

    onUpdateChatOrder(update){
        // NOTE: updateChatOrder is primary used to delete chats with order=0
        // In all other cases use updateChatLastMessage

        if (update.order !== '0') return;
        const chat = ChatStore.get(update.chat_id);
        if (!chat) {
            return;
        }

        // unselect deleted chat
        if (update.chat_id === ChatStore.getSelectedChatId()){
            ChatStore.setSelectedChatId(0);
        }

        let chatIds = [];
        for (let i = 0; i < this.state.chatIds.length; i++){
            let chat = ChatStore.get(this.state.chatIds[i]);
            if (chat && chat.order !== '0'){
                switch (chat.type['@type']) {
                    case 'chatTypeBasicGroup' : {
                        const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
                        if (basicGroup.status['@type'] !== 'chatMemberStatusLeft'){
                            chatIds.push(chat.id);
                        }
                        break;
                    }
                    case 'chatTypePrivate' : {
                        chatIds.push(chat.id);
                        break;
                    }
                    case 'chatTypeSecret' : {
                        chatIds.push(chat.id);
                        break;
                    }
                    case 'chatTypeSupergroup' : {
                        const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                        if (supergroup.status['@type'] !== 'chatMemberStatusLeft'){
                            chatIds.push(chat.id);
                        }
                        break;
                    }
                }
            }
        }

        this.reorderChats(chatIds);
    }

    onUpdate(update) {
        if (update.order === '0') return;

        const chat = ChatStore.get(update.chat_id);
        if (!chat || chat.order === '0') {
            return;
        }

        let newChatIds = [];
        if (this.state.chatIds.length > 0){
            const existingChat = this.state.chatIds.find(x => x === update.chat_id);
            if (!existingChat){
                const minChatOrder = ChatStore.get(this.state.chatIds[this.state.chatIds.length - 1]).order;
                if (orderCompare(minChatOrder, chat.order) === 1) {
                    return;
                }
                newChatIds.push(chat.id);
            }
        }

        // get last chat.order values
        let chatIds = [];
        for (let i = 0; i < this.state.chatIds.length; i++){
            let chat = ChatStore.get(this.state.chatIds[i]);
            if (chat && chat.order !== '0'){
                switch (chat.type['@type']) {
                    case 'chatTypeBasicGroup' : {
                        const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
                        if (basicGroup.status['@type'] !== 'chatMemberStatusLeft'){
                            chatIds.push(chat.id);
                        }
                        break;
                    }
                    case 'chatTypePrivate' : {
                        chatIds.push(chat.id);
                        break;
                    }
                    case 'chatTypeSecret' : {
                        chatIds.push(chat.id);
                        break;
                    }
                    case 'chatTypeSupergroup' : {
                        const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                        if (supergroup.status['@type'] !== 'chatMemberStatusLeft'){
                            chatIds.push(chat.id);
                        }
                        break;
                    }
                }
            }
        }

        this.reorderChats(chatIds, newChatIds,
            () =>{
                this.loadChatContents(newChatIds);
            });
    }

    componentDidUpdate(){
        //let list = ReactDOM.findDOMNode(this.refs.list);
        //let items = itemsInView(list);

        //console.log(items);
    }

    reorderChats(chatIds, newChatIds = [], callback) {
        const orderedChatIds = chatIds.concat(newChatIds).sort((a, b) => {
            return orderCompare(ChatStore.get(b).order, ChatStore.get(a).order);
        });

        if (!DialogsList.isDifferentOrder(this.state.chatIds, orderedChatIds)){
            return;
        }

        this.setState({ chatIds: orderedChatIds }, callback);
    }

    static isDifferentOrder(oldChatIds, newChatIds){
        if (oldChatIds.length === newChatIds.length){
            for (let i = 0; i < oldChatIds.length;i++){
                if (oldChatIds[i] !== newChatIds[i]) return true;
            }

            return false;
        }

        return true;
    }

    handleScroll(){
        const list = this.listRef.current;

        if (list && (list.scrollTop + list.offsetHeight) >= list.scrollHeight){
            this.onLoadNext();
        }
    }

    async onLoadNext(){
        if (this.loading) return;

        let offsetOrder = '9223372036854775807'; // 2^63
        let offsetChatId = 0;
        if (this.state.chatIds && this.state.chatIds.length > 0){
            const chat = ChatStore.get(this.state.chatIds[this.state.chatIds.length - 1]);
            if (chat){
                offsetOrder = chat.order;
                offsetChatId = chat.id;
            }
        }

        this.loading = true;
        let result = await TdLibController
            .send({
                '@type': 'getChats',
                offset_chat_id: offsetChatId,
                offset_order: offsetOrder,
                limit: CHAT_SLICE_LIMIT
            })
            .finally(() => {
                this.loading = false;
            });

        //TODO: replace result with one-way data flow

        if (result.chat_ids.length > 0
            && result.chat_ids[0] === offsetChatId) {
            result.chat_ids.shift();
        }

        this.appendChats(result.chat_ids,
            async () => {
                //await FileController.initDB();
                this.loadChatContents(result.chat_ids);
            });
    }

    loadChatContents(chatIds){

        const store = FileController.getStore();
        loadChatPhotos(store, chatIds);
    }

    appendChats(chatIds, callback){
        if (chatIds.length === 0) return;

        this.setState({ chatIds: this.state.chatIds.concat(chatIds) }, callback);
    }


    scrollToTop() {
        const list = this.listRef.current;
        list.scrollTop = 0;
    };

    render() {

        const chats = this.state.chatIds.map(x =>
            (<DialogControl
                key={x}
                chatId={x}
                onSelect={this.props.onSelectChat}/>));

        {/*<Scrollbars*/}
            {/*ref={this.listRef}*/}
            {/*onScroll={this.handleScroll}*/}
            {/*autoHide*/}
            {/*autoHideTimeout={500}*/}
            {/*autoHideDuration={300}>*/}
            {/*{chats}*/}
        {/*</Scrollbars>*/}

        return (
            <div ref={this.listRef} className='dialogs-list' onScroll={this.handleScroll}>
                {chats}
            </div>
        );
    }

}

export default DialogsList;