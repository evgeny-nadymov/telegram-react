/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import Archive from '../Tile/Archive';
import Dialog from '../Tile/Dialog';
import DialogPlaceholder from '../Tile/DialogPlaceholder';
import { loadChatsContent } from '../../Utils/File';
import { isAuthorizationReady, orderCompare } from '../../Utils/Common';
import { CHAT_SLICE_LIMIT, SCROLL_PRECISION } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import CacheStore from '../../Stores/CacheStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './DialogsList.css';

const styles = theme => ({
    dialogsList: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF'
    }
});

class DialogsList extends React.Component {
    constructor(props) {
        super(props);

        this.hiddenChats = new Map();

        this.listRef = React.createRef();

        // console.log('[dl] ctor', props.type);
        this.state = {
            showArchive: false,
            chats: [],
            authorizationState: AppStore.getAuthorizationState(),
            connectionState: AppStore.getConnectionState(),
            fistSliceLoaded: false,
            cacheLoaded: false,
            cacheChats: null
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { theme, open } = this.props;
        const { showArchive, chats, firstSliceLoaded, cacheLoaded } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.open !== open) {
            return true;
        }

        if (nextState.showArchive !== showArchive) {
            return true;
        }

        if (nextState.chats !== chats) {
            return true;
        }

        if (nextState.firstSliceLoaded !== firstSliceLoaded) {
            return true;
        }

        if (nextState.cacheLoaded !== cacheLoaded) {
            return true;
        }

        return false;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { current: list } = this.listRef;
        if (!list) return { scrollTop: 0 };

        return { scrollTop: list.scrollTop };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { current: list } = this.listRef;
        if (!list) return;

        const { scrollTop } = snapshot;

        list.scrollTop = scrollTop;
    }

    componentDidMount() {
        this.loadFirstSlice();
        this.loadCache();

        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        ChatStore.on('updateChatChatList', this.onUpdateChatChatList);
        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatIsPinned', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateChatOrder', this.onUpdateChatOrder);
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('clientUpdateLeaveChat', this.onClientUpdateLeaveChat);
    }

    componentWillUnmount() {
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
        ChatStore.off('updateChatChatList', this.onUpdateChatChatList);
        ChatStore.off('updateChatDraftMessage', this.onUpdate);
        ChatStore.off('updateChatIsPinned', this.onUpdate);
        ChatStore.off('updateChatLastMessage', this.onUpdate);
        ChatStore.off('updateChatOrder', this.onUpdateChatOrder);
        ChatStore.off('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.off('clientUpdateLeaveChat', this.onClientUpdateLeaveChat);
    }

    onUpdateChatChatList = update => {
        const { type } = this.props;

        const archiveList = ChatStore.chatList.get('chatListArchive');
        if (type === 'chatListMain') {
            setTimeout(() => {
                this.setState({
                    showArchive: archiveList && archiveList.size > 0
                });
            });
        } else {
            if (archiveList && !archiveList.size) {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateCloseArchive'
                });
            }
        }
    };

    onClientUpdateLeaveChat = update => {
        if (update.inProgress) {
            this.hiddenChats.set(update.chatId, update.chatId);
        } else {
            this.hiddenChats.delete(update.chatId);
        }

        this.forceUpdate();
    };

    onUpdateAuthorizationState = update => {
        const { authorization_state: authorizationState } = update;

        this.setState({ authorizationState }, () => this.loadFirstSlice());
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
        if (isAuthorizationReady(authorizationState)) {
            await FileStore.initDB(() => this.onLoadNext(true));
        }
    };

    saveCache = () => {
        const { type } = this.props;
        if (type !== 'chatListMain') return;

        setTimeout(() => {
            const archiveChatIds = [];
            const archive = ChatStore.chatList.get('chatListArchive');
            if (archive) {
                for (const chatId of archive.keys()) {
                    archiveChatIds.push(chatId);
                }
            }

            const chatIds = this.state.chats.slice(0, 25);
            CacheStore.saveChats(chatIds, archiveChatIds);
        }, 1000);
    };

    loadCache = async () => {
        const { type } = this.props;
        if (type !== 'chatListMain') return;

        const cacheChats = await CacheStore.getChats();
        if (!cacheChats) return;

        const archive = ChatStore.chatList.get('chatListArchive');

        this.setState({
            cacheLoaded: true,
            cacheChats,
            showArchive: archive && archive.size > 0
        });

        this.loadChatContents(cacheChats.map(x => x.id));

        TdLibController.clientUpdate({
            '@type': 'clientUpdateCacheLoaded'
        });
    };

    onUpdateChatOrder = update => {
        // NOTE: updateChatOrder is primary used to delete chats with order === 0
        // and add chats with order !== 0
        const { type } = this.props;
        const { chat_id, order } = update;
        // console.log('[dl] onUpdateChatOrder start', type, update);

        //if (update.order !== '0') return;
        const chat = ChatStore.get(chat_id);
        if (!chat) {
            return;
        }

        // delete chats
        if (order === '0') {
            // console.log('[dl] onUpdateChatOrder order===0', type);
            // unselect deleted chat
            if (chat_id === AppStore.getChatId()) {
                TdLibController.setChatId(0);
                AppStore.changeChatDetailsVisibility(false);
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

            this.reorderChats(chatIds, [], () => {
                this.saveCache();
            });
        }
        // add chats
        else {
            // console.log('[dl] onUpdateChatOrder order!==0', type);
            this.onUpdate(update);
        }
    };

    onUpdate = update => {
        // NOTE: updateChatIsPinned, updateChatLastMessage, updateChatDraftMessage is primary used to add chats with order!=0
        const { type } = this.props;
        // console.log('[dl] onUpdate start', type, update);
        const { chat_id, order } = update;
        if (order === '0') {
            // console.log('[dl] onUpdate return 1', type);
            return;
        }

        const chat = ChatStore.get(chat_id);
        if (!chat || chat.order === '0' || !chat.chat_list || chat.chat_list['@type'] !== type) {
            // console.log('[dl] onUpdate return 2', type, chat.chat_list);
            return;
        }

        const { chats } = this.state;

        let newChatIds = [];
        if (chats.length > 0) {
            const existingChat = chats.find(x => x === chat_id);
            if (!existingChat) {
                // const minChatOrder = ChatStore.get(chats[chats.length - 1]).order;
                // if (orderCompare(minChatOrder, chat.order) === 1) {
                //     console.log('[dl] onUpdate return 3', type);
                //     return;
                // }
                newChatIds.push(chat_id);
            }
        } else {
            newChatIds.push(chat_id);
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
        // console.log('[dl] onUpdate reorderChats', type, chatIds, newChatIds);
        this.reorderChats(chatIds, newChatIds, () => {
            this.loadChatContents(newChatIds);
            this.saveCache();
        });
    };

    reorderChats(chatIds, newChatIds = [], callback) {
        const orderedChatIds = chatIds.concat(newChatIds).sort((a, b) => {
            return orderCompare(ChatStore.get(b).order, ChatStore.get(a).order);
        });

        if (!DialogsList.isDifferentOrder(this.state.chats, orderedChatIds)) {
            if (callback) callback();
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

        if (list && list.scrollTop + list.offsetHeight >= list.scrollHeight - SCROLL_PRECISION) {
            this.onLoadNext();
        }
    };

    onLoadNext = async (replace = false) => {
        const { type } = this.props;
        const { chats } = this.state;

        if (this.loading) return;

        let offsetOrder = '9223372036854775807'; // 2^63 - 1
        let offsetChatId = 0;
        if (!replace && chats && chats.length > 0) {
            const chat = ChatStore.get(chats[chats.length - 1]);
            if (chat) {
                offsetOrder = chat.order;
                offsetChatId = chat.id;
            }
        }

        // console.log('DialogsList.onLoadNext getChats start', offsetChatId, offsetOrder);
        this.loading = true;
        const result = await TdLibController.send({
            '@type': 'getChats',
            chat_list: { '@type': type },
            offset_chat_id: offsetChatId,
            offset_order: offsetOrder,
            limit: CHAT_SLICE_LIMIT
        }).finally(() => {
            this.loading = false;
            if (replace) {
                TdLibController.clientUpdate({ '@type': 'clientUpdateDialogsReady' });
            }
        });
        // console.log('DialogsList.onLoadNext getChats stop', offsetChatId, offsetOrder);
        // TdLibController.send({
        //     '@type': 'getChats',
        //     offset_chat_id: offsetChatId,
        //     offset_order: offsetOrder,
        //     limit: CHAT_SLICE_LIMIT + 100
        // });

        if (result.chat_ids.length > 0 && result.chat_ids[0] === offsetChatId) {
            result.chat_ids.shift();
        }

        if (replace) {
            this.replaceChats(result.chat_ids, () => {
                this.loadChatContents(result.chat_ids);
                this.saveCache();
            });
        } else {
            // console.log('DialogsList.onLoadNext setState start', offsetChatId, offsetOrder);
            this.appendChats(result.chat_ids, () => {
                // console.log('DialogsList.onLoadNext setState stop', offsetChatId, offsetOrder);
                this.loadChatContents(result.chat_ids);
            });
        }
    };

    loadChatContents(chats) {
        const store = FileStore.getStore();
        loadChatsContent(store, chats);
    }

    appendChats(chats, callback) {
        if (chats.length === 0) return;

        this.setState({ chats: this.state.chats.concat(chats), firstSliceLoaded: true }, callback);
    }

    replaceChats(chats, callback) {
        this.setState({ chats: chats, firstSliceLoaded: true }, callback);
    }

    scrollToTop() {
        const list = this.listRef.current;
        list.scrollTop = 0;
    }

    render() {
        const { classes, type, open } = this.props;
        const { showArchive, chats, firstSliceLoaded, cacheLoaded, cacheChats } = this.state;

        // console.log('[dl] render', type, open, chats, cacheChats);
        if (!open) return null;

        let dialogs = null;
        if (firstSliceLoaded) {
            dialogs = chats.map(x => <Dialog key={x} chatId={x} hidden={this.hiddenChats.has(x)} />);
        } else if (cacheLoaded) {
            dialogs = cacheChats.map(x => <Dialog key={x.id} chatId={x.id} hidden={this.hiddenChats.has(x.id)} />);
        } else {
            if (type === 'chatListMain') {
                dialogs = Array.from(Array(10)).map((x, index) => <DialogPlaceholder key={index} index={index} />);
            }
        }

        return (
            <div
                ref={this.listRef}
                className={classNames('dialogs-list', classes.dialogsList)}
                onScroll={this.handleScroll}>
                {showArchive && <Archive />}
                {dialogs}
            </div>
        );
    }
}

DialogsList.propTypes = {
    type: PropTypes.oneOf(['chatListMain', 'chatListArchive']).isRequired
};

export default withStyles(styles, { withTheme: true })(DialogsList);
