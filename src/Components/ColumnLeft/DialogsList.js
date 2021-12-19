/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Dialog from '../Tile/Dialog';
import DialogPlaceholder from '../Tile/DialogPlaceholder';
import VirtualizedList from '../Additional/VirtualizedList';
import { changeChatDetailsVisibility } from '../../Actions/Chat';
import { loadChatsContent } from '../../Utils/File';
import { isAuthorizationReady, orderCompare } from '../../Utils/Common';
import { scrollTop } from '../../Utils/DOM';
import { chatListEquals, getChatOrder, hasChatList, isChatMember, isChatPinned, positionListEquals } from '../../Utils/Chat';
import { CHAT_SLICE_LIMIT, SCROLL_CHATS_PRECISION } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './DialogsList.css';
import FilterStore from '../../Stores/FilterStore';
import DialogsHeader from './DialogsHeader';
import Filters from './Filters';

class DialogListItem extends React.Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, chatList, style, hidden } = this.props;
        if (nextProps.chatId !== chatId) {
            // console.log('[vl] UserListItem.shouldUpdate true userId');
            return true;
        }

        if (nextProps.chatList !== chatList) {
            // console.log('[vl] UserListItem.shouldUpdate true userId');
            return true;
        }

        if (nextProps.hidden !== hidden) {
            // console.log('[vl] UserListItem.shouldUpdate true userId');
            return true;
        }

        if (nextProps.style.top !== style.top) {
            // console.log('[vl] UserListItem.shouldUpdate true style');
            return true;
        }

        // console.log('[vl] UserListItem.shouldUpdate false', nextProps, this.props);
        return false;
    }

    render() {
        const { chatId, chatList, hidden, style } = this.props;

        return (
            <div className='dialog-list-item' style={style}>
                <Dialog chatId={chatId} chatList={chatList} hidden={hidden} />
            </div>
        );
    }
}

class DialogsList extends React.Component {
    constructor(props) {
        super(props);

        this.hiddenChats = new Map();

        this.listRef = React.createRef();

        const { authorizationState } = AppStore;

        this.state = {
            authorizationState,
            chats: null,
            fistSliceLoaded: false,
            chatList: props.type === 'chatListMain' ? { '@type': 'chatListMain' } : { '@type': 'chatListArchive' },
            params: {
                loading: false,
                completed: false
            }
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { theme, cacheItems } = this.props;
        const { chats, chatList } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.cacheItems !== cacheItems) {
            return true;
        }

        if (nextState.chats !== chats) {
            return true;
        }

        // if (nextState.chatList !== chatList) {
        //     return true;
        // }

        return false;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { current: list } = this.listRef;
        if (!list) return { scrollTop: 0 };

        return { scrollTop: list.scrollTop };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {

    }

    componentDidMount() {
        this.loadFirstSlice();

        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);

        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('clientUpdateLeaveChat', this.onClientUpdateLeaveChat);
        ChatStore.on('updateChatDraftMessage', this.onUpdateChatOrder);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatOrder);
        ChatStore.on('updateChatPosition', this.onUpdateChatPosition);

        FilterStore.on('clientUpdateChatList', this.onClientUpdateChatList);

        SupergroupStore.on('updateSupegroup', this.onUpdateSupergroup);
    }

    componentWillUnmount() {
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);

        ChatStore.off('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.off('clientUpdateLeaveChat', this.onClientUpdateLeaveChat);
        ChatStore.off('updateChatDraftMessage', this.onUpdateChatOrder);
        ChatStore.off('updateChatLastMessage', this.onUpdateChatOrder);
        ChatStore.off('updateChatPosition', this.onUpdateChatPosition);

        FilterStore.off('clientUpdateChatList', this.onClientUpdateChatList);

        SupergroupStore.off('updateSupegroup', this.onUpdateSupergroup);
    }

    onClientUpdateChatList = update => {
        const { chatList } = update;

        if (chatListEquals(this.state.chatList, chatList)) {
            this.scrollToTop();
        } else {
            this.setState({
                chatList,
                params: {
                    loading: false,
                    completed: false
                }
            }, () => {
                this.loadFirstSlice();
            });
        }
    };

    onUpdateSupergroup = update => {
        // const { supegroup, prevSupergroup } = update;
        //
        // if (!hasLeftSupergroup(supegroup, prevSupergroup)) {
        //     return;
        // }


    };

    onClientUpdateLeaveChat = update => {
        const { inProgress, chatId } = update;

        if (inProgress) {
            this.hiddenChats.set(chatId, chatId);
        } else {
            this.hiddenChats.delete(chatId);
        }

        this.forceUpdate();
    };

    onUpdateAuthorizationState = update => {
        const { authorization_state: authorizationState } = update;

        this.setState({ authorizationState }, () => this.loadFirstSlice());
    };

    onFastUpdatingComplete = update => {
        this.onLoadNext(true);
    };

    loadFirstSlice = async () => {
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;

        await FileStore.initDB(() => this.onLoadNext(true));
    };

    saveCache = () => {
        const { onSaveCache, type } = this.props;
        const { chatList } = this.state;
        if (type !== 'chatListMain') return;
        if (chatList['@type'] !== 'chatListMain') return;

        if (onSaveCache) onSaveCache();
    };

    onUpdateChatPosition = update => {
        const { chatList } = this.state;
        const { position } = update;

        if (!chatListEquals(chatList, position.list)) {
            return;
        }

        this.onUpdateChatOrder(update);
    };

    onUpdateChatOrder = update => {
        const { chats, chatList, params } = this.state;
        if (!chats) return;

        const { loading } = params;
        if (loading && !chats.length) return;

        const { chat_id } = update;

        const chat = ChatStore.get(chat_id);
        if (!chat) {
            return;
        }

        if (!hasChatList(chat_id, chatList)) {
            return;
        }

        const order = getChatOrder(chat_id, chatList);
        const currentIndex = chats.findIndex(x => x === chat_id);
        if (currentIndex === -1 && order === '0') {
            return;
        }

        const chatIds = [];
        for (let i = 0; i < chats.length; i++) {
            const chat = ChatStore.get(chats[i]);
            const chatOrder = getChatOrder(chats[i], chatList);
            if (chat && chatOrder !== '0') {
                chatIds.push(chat.id);
            }
        }

        const newChatIds = [];
        if (order === '0') {
            // unselect deleted chat
            if (chat_id === AppStore.getChatId() && !chat.last_message) {
                TdLibController.setChatId(0);
                changeChatDetailsVisibility(false);
            }
        } else {
            if (currentIndex === -1) {
                if (loading) {
                    console.error(`[vl] skip ${update['@type']}`, { id: chat_id, title: ChatStore.get(chat_id).title, chat: ChatStore.get(chat_id) });
                    // TODO: check and add if within loaded part
                } else {
                    newChatIds.push(chat_id);
                }
            }
        }

        this.reorderChats(chatIds, newChatIds, () => {
            this.loadChatContents(newChatIds);
            this.saveCache();
        });
    };

    reorderChats(chatIds, newChatIds = [], callback) {
        const { chatList } = this.state;

        const orderedChatIds = chatIds.concat(newChatIds).sort((a, b) => {
            return orderCompare(getChatOrder(b, chatList), getChatOrder(a, chatList));
        });

        if (!DialogsList.isDifferentOrder(this.state.chats, orderedChatIds)) {
            if (callback) callback();
            return;
        }

        // console.log('[vl] reorderChats', orderedChatIds);
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
        return;

        // console.log('[vl] onScroll');
        if (this.stub) return;

        const { current } = this.listRef;
        if (!current) return;

        const list = current.getListRef().current;
        if (!list) return;

        // console.log(`[vl] onScroll [scrollTop, offsetHeight, scrollHeight] = [${list.scrollTop}, ${list.offsetHeight}, ${list.scrollHeight}]`, list.scrollTop + list.offsetHeight, (list.scrollHeight - SCROLL_CHATS_PRECISION));
        if (list.scrollTop <= SCROLL_CHATS_PRECISION) {
            this.onLoadPrev();
        } else if (list.scrollTop + list.offsetHeight >= list.scrollHeight - list.offsetHeight) {
            // console.log(`[vl] onScroll onLoadNext`);
            this.onLoadNext();
        }
    };

    onLoadPrev() {

    }

    async onLoadNext(replace = false, limit = CHAT_SLICE_LIMIT) {
        const { type } = this.props;
        const { chats, chatList, params } = this.state;

        // console.log('[folders] onLoadNext', chatList, limit);
        if (params.loading) {
            // console.log('[folders] onLoadNext cancel loading', chatList);
            return;
        }

        if (params.completed) {
            // console.log('[folders] onLoadNext cancel loaded', chatList);
            return;
        }

        let offsetOrder = '9223372036854775807'; // 2^63 - 1
        let offsetChatId = 0;
        let offsetChat = null;
        if (!replace && chats && chats.length > 0) {
            offsetChat = ChatStore.get(chats[chats.length - 1]);
            if (offsetChat) {
                offsetOrder = getChatOrder(offsetChat.id, chatList);
                offsetChatId = offsetChat.id;
            }
        }

        if (type === 'chatListMain') console.log('[vl] GETCHATS start', type, offsetOrder, offsetChatId, offsetChat);
        params.loading = true;
        const result = await TdLibController.send({
            '@type': 'getChats',
            chat_list: chatList,
            limit: 300
        }).finally(() => {
            params.loading = false;
            if (replace) {
                TdLibController.clientUpdate({ '@type': 'clientUpdateDialogsReady', list: chatList });
            }
        });
        if (type === 'chatListMain') console.log('[vl] GETCHATS stop', replace, type, result);

        if (params !== this.state.params) {
            // console.log('[folders] onLoadNext cancel', chatList);
            return;
        }

        if (result.chat_ids.length > 0 && result.chat_ids[0] === offsetChatId) {
            result.chat_ids.shift();
        }

        params.completed = !result.chat_ids.length;

        if (replace) {
            this.replaceChats(result.chat_ids, () => {
                this.loadChatContents(result.chat_ids);
                this.saveCache();

                if (result.chat_ids.length < CHAT_SLICE_LIMIT) {
                    this.onLoadNext(false, CHAT_SLICE_LIMIT - result.chat_ids.length);
                }

                const list = this.listRef.current.getListRef().current;
                if (!list) return;
                list.scrollTop = 0;
            });
        } else {
            // console.log('DialogsList.onLoadNext setState start', offsetChatId, offsetOrder);
            this.appendChats(result.chat_ids, () => {
                // console.log('DialogsList.onLoadNext setState stop', offsetChatId, offsetOrder);
                this.loadChatContents(result.chat_ids);

                if (result.chat_ids.length && result.chat_ids.length < limit) {
                    this.onLoadNext(false, limit - result.chat_ids.length);
                }
            });
        }
    }

    loadChatContents(chatIds) {
        const store = FileStore.getStore();
        loadChatsContent(store, chatIds);
    }

    appendChats(chatIds, callback) {
        if (chatIds.length === 0) {
            if (callback) callback();
            return;
        }

        const { chats } = this.state;

        const newChats = (chats || []).concat(chatIds);
        this.setState({ chats: newChats }, callback);
    }

    replaceChats(chats, callback) {
        this.setState({ chats }, callback);
    }

    scrollToTop() {
        const list = this.listRef.current.getListRef().current;

        scrollTop(list);
    }

    renderItem = ({ index, style }, source, stub = false) => {
        const { chatList } = this.state;
        const x = source[index];

        if (stub) {
            return <DialogPlaceholder key={index} index={index} />
        }

        return <DialogListItem key={x} chatId={x} chatList={chatList} hidden={this.hiddenChats.has(x)} style={style} />;

        // return <Dialog key={x} chatId={x} hidden={this.hiddenChats.has(x)} style={style} />
    };

    render() {
        const { cacheItems } = this.props;
        const { chats, chatList } = this.state;

        this.source = [];
        this.stub = false;
        if (chats) {
            let lastPinnedId = 0;
            chats.forEach(x => {
                if (isChatPinned(x, chatList)) {
                    lastPinnedId = x;
                }
            });
            this.source = chats;
        } else if (cacheItems) {
            let lastPinnedId = 0;
            cacheItems.forEach(x => {
                if (isChatPinned(x, chatList)) {
                    lastPinnedId = x;
                }
            });
            this.source = cacheItems.map(x => x.id);
        } else {
            if (chatList['@type'] === 'chatListMain') {
                this.source = Array.from(Array(10));
                this.stub = true;
            }
        }

        return (
            <VirtualizedList
                ref={this.listRef}
                className='dialogs-list'
                source={this.source}
                rowHeight={76}
                overScanCount={20}
                renderItem={x => this.renderItem(x, this.source, this.stub)}
                onScroll={this.handleScroll}
            />
        );
    }
}

DialogsList.propTypes = {
    type: PropTypes.oneOf(['chatListMain', 'chatListArchive']).isRequired,
    cacheItems: PropTypes.array,
};

export default DialogsList;
