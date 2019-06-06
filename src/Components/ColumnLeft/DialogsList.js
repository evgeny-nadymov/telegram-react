/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import DialogControl from '../Tile/DialogControl';
import { CHAT_SLICE_LIMIT } from '../../Constants';
import { loadChatsContent } from '../../Utils/File';
import { itemsInView, orderCompare, throttle } from '../../Utils/Common';
import ChatStore from '../../Stores/ChatStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './DialogsList.css';

class DialogsList extends React.Component {
    constructor(props) {
        super(props);

        this.hiddenChats = new Map();

        this.listRef = React.createRef();

        this.state = {
            chats: [],
            authorizationState: ApplicationStore.getAuthorizationState(),
            connectionState: ApplicationStore.getConnectionState()
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState.chats !== this.state.chats) {
            return true;
        }

        return false;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { current: list } = this.listRef;

        return { scrollTop: list.scrollTop };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { current: list } = this.listRef;
        const { scrollTop } = snapshot;

        list.scrollTop = scrollTop;
    }

    componentDidMount() {
        this.loadFirstSlice();

        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        // ApplicationStore.on('updateConnectionState', this.onUpdateConnectionState);
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatIsPinned', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateChatOrder', this.onUpdateChatOrder);
        ChatStore.on('clientUpdateLeaveChat', this.onClientUpdateLeaveChat);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState);
        // ApplicationStore.removeListener('updateConnectionState', this.onUpdateConnectionState);
        ChatStore.removeListener('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate);
        ChatStore.removeListener('updateChatIsPinned', this.onUpdate);
        ChatStore.removeListener('updateChatLastMessage', this.onUpdate);
        ChatStore.removeListener('updateChatOrder', this.onUpdateChatOrder);
        ChatStore.removeListener('clientUpdateLeaveChat', this.onClientUpdateLeaveChat);
    }

    onClientUpdateLeaveChat = update => {
        if (update.inProgress) {
            this.hiddenChats.set(update.chatId, update.chatId);
        } else {
            this.hiddenChats.delete(update.chatId);
        }

        this.forceUpdate();
    };

    onUpdateAuthorizationState = update => {
        const { authorization_state } = update;

        this.setState({ authorizationState: authorization_state }, () => this.loadFirstSlice());
    };

    onFastUpdatingComplete = update => {
        this.onLoadNext(true);
        // this.setState({ chats: [] }, () => this.onLoadNext(true));
    };

    onUpdateConnectionState = update => {
        const newConnectionState = update.state;
        const { connectionState } = this.state;

        this.setState({ connectionState: newConnectionState });

        const updatingCompleted =
            connectionState &&
            connectionState['@type'] === 'connectionStateUpdating' &&
            newConnectionState['@type'] !== 'connectionStateUpdating';
        if (!updatingCompleted) return;

        const hasSkippedUpdates = ChatStore.skippedUpdates.length > 0;
        if (!hasSkippedUpdates) return;

        ChatStore.skippedUpdates = [];
        this.setState({ chats: [] }, () => this.onLoadNext(true));
    };

    loadFirstSlice = async () => {
        const { authorizationState } = this.state;
        if (authorizationState && authorizationState['@type'] === 'authorizationStateReady') {
            await FileStore.initDB(() => this.onLoadNext());
        }
    };

    onUpdateChatOrder = update => {
        // NOTE: updateChatOrder is primary used to delete chats with order=0
        // In all other cases use updateChatLastMessage

        if (update.order !== '0') return;
        const chat = ChatStore.get(update.chat_id);
        if (!chat) {
            return;
        }

        // unselect deleted chat
        if (update.chat_id === ApplicationStore.getChatId()) {
            TdLibController.setChatId(0);
            ApplicationStore.changeChatDetailsVisibility(false);
        }

        let chatIds = [];
        for (let i = 0; i < this.state.chats.length; i++) {
            let chat = ChatStore.get(this.state.chats[i]);
            if (chat && chat.order !== '0') {
                switch (chat.type['@type']) {
                    case 'chatTypeBasicGroup': {
                        const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
                        if (basicGroup.status['@type'] !== 'chatMemberStatusLeft') {
                            chatIds.push(chat.id);
                        }
                        break;
                    }
                    case 'chatTypePrivate': {
                        chatIds.push(chat.id);
                        break;
                    }
                    case 'chatTypeSecret': {
                        chatIds.push(chat.id);
                        break;
                    }
                    case 'chatTypeSupergroup': {
                        const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                        if (supergroup.status['@type'] !== 'chatMemberStatusLeft') {
                            chatIds.push(chat.id);
                        }
                        break;
                    }
                }
            }
        }

        this.reorderChats(chatIds);
    };

    onUpdate = update => {
        const { chat_id, order } = update;
        if (order === '0') return;
        const chat = ChatStore.get(chat_id);
        if (!chat || chat.order === '0') {
            return;
        }

        const { chats } = this.state;

        let newChatIds = [];
        if (chats.length > 0) {
            const existingChat = chats.find(x => x === chat_id);
            if (!existingChat) {
                const minChatOrder = ChatStore.get(chats[chats.length - 1]).order;
                if (orderCompare(minChatOrder, chat.order) === 1) {
                    return;
                }
                newChatIds.push(chat.id);
            }
        }

        // get last chat.order values
        let chatIds = [];
        for (let i = 0; i < chats.length; i++) {
            let chat = ChatStore.get(chats[i]);
            if (chat && chat.order !== '0') {
                switch (chat.type['@type']) {
                    case 'chatTypeBasicGroup': {
                        const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
                        if (basicGroup.status['@type'] !== 'chatMemberStatusLeft') {
                            chatIds.push(chat.id);
                        }
                        break;
                    }
                    case 'chatTypePrivate': {
                        chatIds.push(chat.id);
                        break;
                    }
                    case 'chatTypeSecret': {
                        chatIds.push(chat.id);
                        break;
                    }
                    case 'chatTypeSupergroup': {
                        const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                        if (supergroup.status['@type'] !== 'chatMemberStatusLeft') {
                            chatIds.push(chat.id);
                        }
                        break;
                    }
                }
            }
        }

        this.reorderChats(chatIds, newChatIds, () => {
            this.loadChatContents(newChatIds);
        });
    };

    reorderChats(chatIds, newChatIds = [], callback) {
        const orderedChatIds = chatIds.concat(newChatIds).sort((a, b) => {
            return orderCompare(ChatStore.get(b).order, ChatStore.get(a).order);
        });

        if (!DialogsList.isDifferentOrder(this.state.chats, orderedChatIds)) {
            return;
        }

        this.setState({ chats: orderedChatIds }, callback);
    }

    static isDifferentOrder(oldChatIds, newChatIds) {
        if (oldChatIds.length === newChatIds.length) {
            for (let i = 0; i < oldChatIds.length; i++) {
                if (oldChatIds[i] !== newChatIds[i]) return true;
            }

            return false;
        }

        return true;
    }

    handleScroll = () => {
        const list = this.listRef.current;

        if (list && list.scrollTop + list.offsetHeight >= list.scrollHeight) {
            this.onLoadNext();
        }
    };

    onLoadNext = async (replace = false) => {
        const { chats } = this.state;

        if (this.loading) return;

        let offsetOrder = '9223372036854775807'; // 2^63
        let offsetChatId = 0;
        if (!replace && chats && chats.length > 0) {
            const chat = ChatStore.get(chats[chats.length - 1]);
            if (chat) {
                offsetOrder = chat.order;
                offsetChatId = chat.id;
            }
        }

        this.loading = true;
        const result = await TdLibController.send({
            '@type': 'getChats',
            offset_chat_id: offsetChatId,
            offset_order: offsetOrder,
            limit: CHAT_SLICE_LIMIT
        }).finally(() => {
            this.loading = false;
        });

        //TODO: replace result with one-way data flow

        if (result.chat_ids.length > 0 && result.chat_ids[0] === offsetChatId) {
            result.chat_ids.shift();
        }

        if (replace) {
            this.replaceChats(result.chat_ids, () => this.loadChatContents(result.chat_ids));
        } else {
            this.appendChats(result.chat_ids, () => this.loadChatContents(result.chat_ids));
        }
    };

    loadChatContents(chats) {
        const store = FileStore.getStore();
        loadChatsContent(store, chats);
    }

    appendChats(chats, callback) {
        if (chats.length === 0) return;

        this.setState({ chats: this.state.chats.concat(chats) }, callback);
    }

    replaceChats(chats, callback) {
        this.setState({ chats: chats }, callback);
    }

    scrollToTop() {
        const list = this.listRef.current;
        list.scrollTop = 0;
    }

    render() {
        const { chats } = this.state;

        const dialogs = chats.map(x => <DialogControl key={x} chatId={x} hidden={this.hiddenChats.has(x)} />);

        /*<Scrollbars*/
        /*ref={this.listRef}*/
        /*onScroll={this.handleScroll}*/
        /*autoHide*/
        /*autoHideTimeout={500}*/
        /*autoHideDuration={300}>*/
        /*{chats}*/
        /*</Scrollbars>*/

        return (
            <div ref={this.listRef} className='dialogs-list' onScroll={this.handleScroll}>
                {dialogs}
            </div>
        );
    }
}

export default DialogsList;
