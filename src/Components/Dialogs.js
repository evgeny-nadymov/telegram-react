import React, {Component} from 'react';
import './Dialogs.css';
import DialogControl from './DialogControl'
import {itemsInView, orderCompare, throttle} from '../Utils/Common';
import TdLibController from '../Controllers/TdLibController';
import {CHAT_SLICE_LIMIT} from '../Constants';
import ChatStore from '../Stores/ChatStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import FileController from '../Controllers/FileController';
import {getChatPhoto} from '../Utils/File';
import { Scrollbars } from 'react-custom-scrollbars';
import DialogsHeader from './DialogsHeader';

class Dialogs extends Component{
    constructor(props){
        super(props);

        this.state = {
            chats: []
        };

        this.listRef = React.createRef();

        this.updateChatOrderCount = 0;
        this.updateChatLastMessageCount = 0;

        this.once = false;

        this.onUpdateState = this.onUpdateState.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.onLoadNext = this.onLoadNext.bind(this);
    }

    componentDidMount(){
        TdLibController.on('tdlib_status', this.onUpdateState);

        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatIsPinned', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);

        if (!this.once
            && this.props.authState === 'ready'){
            this.once = true;
            this.onLoadNext();
        }
    }

    componentWillUnmount(){
        TdLibController.removeListener('tdlib_status', this.onUpdateState);

        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate);
        ChatStore.removeListener('updateChatIsPinned', this.onUpdate);
        ChatStore.removeListener('updateChatLastMessage', this.onUpdate);
    }

    onUpdateState(state){
        //console.log('Dialogs onUpdateState status=' + state.status);
        switch (state.status) {
            case 'ready':
                this.onLoadNext();
                break;
            default:
                break;
        }
    }

    onUpdate(update) {
        if (update.order === '0') return;

        const chat = ChatStore.get(update.chat_id);
        if (!chat || chat.order === '0') {
            return;
        }

        const existingChat = this.state.chats.find(x => x.id === update.chat_id);
        if (!existingChat){
            const minChatOrder = Math.min(...this.state.chats.map(x => x.id));
            if (chat.order < minChatOrder) {
                return;
            }
        }

        // get last chat.order values
        let chats = [];//this.state.chats.map(x => { return ChatStore.get(x.id); });
        for (let i = 0; i < this.state.chats.length; i++){
            let chat = ChatStore.get(this.state.chats[i].id);
            if (chat && chat.order !== '0'){
                switch (chat.type['@type']) {
                    case 'chatTypeBasicGroup' : {
                        const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
                        if (basicGroup.status['@type'] !== 'chatMemberStatusLeft'){
                            chats.push(chat);
                        }
                        break;
                    }
                    case 'chatTypePrivate' : {
                        chats.push(chat);
                        break;
                    }
                    case 'chatTypeSecret' : {
                        chats.push(chat);
                        break;
                    }
                    case 'chatTypeSupergroup' : {
                        const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                        if (supergroup.status['@type'] !== 'chatMemberStatusLeft'){
                            chats.push(chat);
                        }
                        break;
                    }
                }
            }
        }

        if (update['@type'] === 'updateChatOrder'){

            console.log('REORDER_CHAT updateChatOrder=' + this.updateChatOrderCount++);
        }
        else if (update['@type'] === 'updateChatLastMessage'){

            console.log('REORDER_CHAT updateChatLastMessage=' + this.updateChatLastMessageCount++);
        }

        console.log(`REORDER_CHAT from update=${update['@type']} chat_id=${update.chat_id} order=${chat ? chat.order : 'null'} title=${chat ? chat.title : 'null'}`);
        this.reorderChats(chats);
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

    reorderChats(chats, newChats = [], callback) {
        const orderedChats = chats.concat(newChats).sort((a, b) => {
            return orderCompare(b.order, a.order);
        });

        if (!Dialogs.isDifferentOrder(this.state.chats, orderedChats)){
            return;
        }

        this.setState({ chats: orderedChats }, callback);
    }

    static isDifferentOrder(oldChats, newChats){
        if (oldChats.length === newChats.length){
            for (let i = 0; i < oldChats.length;i++){
                if (oldChats[i].id !== newChats[i].id) return true;
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
        if (this.state.chats && this.state.chats.length > 0){
            offsetOrder = this.state.chats[this.state.chats.length - 1].order;
            offsetChatId = this.state.chats[this.state.chats.length - 1].id;
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
        let chats = [];
        for (let i = 0; i < result.chat_ids.length; i++){
            chats.push(ChatStore.get(result.chat_ids[i]));
        }

        this.appendChats(chats,
            async () => {
                await FileController.initDB();
                this.loadChatContents(chats);
            });
    }

    loadChatContents(chats){
        let store = FileController.getStore();

        for (let i = 0; i < chats.length; i++){
            let chat = chats[i];
            let [id, pid, idb_key] = getChatPhoto(chat);
            if (pid) {
                FileController.getLocalFile(store, chat.photo.small, idb_key, null,
                    () => ChatStore.updatePhoto(chat.id),
                    () => FileController.getRemoteFile(id, 1, chat));
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
                chatId={x.id}
                isSelected={this.props.selectedChat && this.props.selectedChat.id === x.id}
                onSelect={this.props.onSelectChat}/>));

        return (
            <div className='master'>
                <DialogsHeader onClearCache={this.props.onClearCache}/>
                <div className='dialogs-list' ref={this.listRef} onScroll={this.handleScroll}>
                    {chats}
                </div>
            </div>
        );
    }
}

export default Dialogs;