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
import { getChatOrder, hasChatList, isChatMember, isChatPinned } from '../../Utils/Chat';
import { CHAT_SLICE_LIMIT, SCROLL_CHATS_PRECISION } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './DialogsList.css';

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

        // console.log('[vl] UserListItem.shouldUpdate false');
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
            offset: 0,
            chats: null,
            fistSliceLoaded: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { theme, open, showArchive, archiveTitle, items, cacheItems } = this.props;
        const { chats, offset } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.open !== open) {
            return true;
        }

        if (nextProps.items !== items) {
            return true;
        }

        if (nextProps.cacheItems !== cacheItems) {
            return true;
        }

        if (nextProps.showArchive !== showArchive) {
            return true;
        }

        if (nextProps.archiveTitle !== archiveTitle) {
            return true;
        }

        if (nextState.offset !== offset) {
            return true;
        }

        if (nextState.chats !== chats) {
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

        // if (prevState.offset > this.state.offset) {
        //     list.scrollTop += ( - this.state.offset + prevState.offset) * 72;
        // }
        // list.scrollTop = scrollTop;
    }

    componentDidMount() {
        this.loadFirstSlice();

        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);

        ChatStore.on('updateChatDraftMessage', this.onUpdateChatOrder);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatOrder);
        ChatStore.on('updateChatPosition', this.onUpdateChatPosition);

        SupergroupStore.on('updateSupegroup', this.onUpdateSupergroup);

        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('clientUpdateLeaveChat', this.onClientUpdateLeaveChat);
    }

    componentWillUnmount() {
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);

        ChatStore.off('updateChatDraftMessage', this.onUpdateChatOrder);
        ChatStore.off('updateChatLastMessage', this.onUpdateChatOrder);
        ChatStore.off('updateChatPosition', this.onUpdateChatPosition);

        SupergroupStore.off('updateSupegroup', this.onUpdateSupergroup);

        ChatStore.off('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.off('clientUpdateLeaveChat', this.onClientUpdateLeaveChat);
    }

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
        // this.setState({ chats: [] }, () => this.onLoadNext(true));
    };

    loadFirstSlice = async () => {
        const { authorizationState } = this.state;
        if (isAuthorizationReady(authorizationState)) {
            await FileStore.initDB(() => this.onLoadNext(true));
        }
    };

    saveCache = () => {
        const { onSaveCache } = this.props;

        if (onSaveCache) onSaveCache();
    };

    onUpdateChatPosition = update => {
        const { type } = this.props;
        const { position } = update;

        if (position.list['@type'] !== type) {
            return;
        }

        this.onUpdateChatOrder(update);
    };

    onUpdateChatOrder = update => {
        const { type } = this.props;
        const { chats } = this.state;
        if (!chats) return;

        const { loading } = this;
        if (loading) return;

        const { chat_id } = update;

        const chat = ChatStore.get(chat_id);
        if (!chat) {
            return;
        }

        console.log('[update]', type, update, chat.positions);
        if (!hasChatList(chat_id, { '@type': type })) {
            console.log('[update] hasChatList=false', type, chat.id);
            return;
        }

        const order = getChatOrder(chat_id, { '@type': type });
        const currentIndex = chats.findIndex(x => x === chat_id);
        if (currentIndex === -1 && order === '0') {
            console.log('[update] currentIndex=-1', type, chat.id);
            return;
        }

        const chatIds = [];
        for (let i = 0; i < chats.length; i++) {
            const chat = ChatStore.get(chats[i]);
            const chatOrder = getChatOrder(chats[i], { '@type': type });
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
                newChatIds.push(chat_id);
            }
        }

        console.log('[update] add', type, update, chats, chatIds, newChatIds);
        this.reorderChats(chatIds, newChatIds, () => {
            this.loadChatContents(newChatIds);
            this.saveCache();
        });
    };

    reorderChats(chatIds, newChatIds = [], callback) {
        const { type } = this.props;

        const orderedChatIds = chatIds.concat(newChatIds).sort((a, b) => {
            return orderCompare(getChatOrder(b, { '@type': type }), getChatOrder(a, { '@type': type }));
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
        // console.log('[vl] onScroll');
        const list = this.listRef.current.getListRef().current;
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
        this.setState({
            offset: Math.max(this.state.offset - CHAT_SLICE_LIMIT, 0)
        });
    }

    async onLoadNext(replace = false) {
        const { type } = this.props;
        const { offset, chats } = this.state;

        if (chats && offset + 2 * CHAT_SLICE_LIMIT < chats.length) {
            this.setState({
                offset: offset + CHAT_SLICE_LIMIT
            });
            return;
        }

        if (this.loading) {
            return;
        }

        let offsetOrder = '9223372036854775807'; // 2^63 - 1
        let offsetChatId = 0;
        if (!replace && chats && chats.length > 0) {
            const chat = ChatStore.get(chats[chats.length - 1]);
            if (chat) {
                offsetOrder = getChatOrder(chat.id, { '@type': type });
                offsetChatId = chat.id;
            }
        }

        if (type === 'chatListMain') console.log('[p] GETCHATS start', offsetOrder, offsetChatId);
        this.loading = true;
        const result = await TdLibController.send({
            '@type': 'getChats',
            chat_list: { '@type': type },
            offset_chat_id: offsetChatId,
            offset_order: offsetOrder,
            limit: CHAT_SLICE_LIMIT
        }).finally(() => {
            this.loading = false;
            if (type === 'chatListMain') console.log('[p] GETCHATS stop');
            if (replace) {
                TdLibController.clientUpdate({ '@type': 'clientUpdateDialogsReady' });
            }
        });

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
        this.setState({ chats: newChats, offset: newChats.length - 2 * CHAT_SLICE_LIMIT }, callback);
    }

    replaceChats(chats, callback) {
        this.setState({ chats, offset: 0 }, callback);
    }

    scrollToTop() {
        const list = this.listRef.current.getListRef().current;

        scrollTop(list);
    }

    renderItem = ({ index, style }, source) => {
        const { type } = this.props;
        const x = source[index];

        return <DialogListItem key={x} chatId={x} chatList={{ '@type': type }} hidden={this.hiddenChats.has(x)} style={style} />;

        // return <Dialog key={x} chatId={x} hidden={this.hiddenChats.has(x)} style={style} />
    };

    render() {
        const { type, open, cacheItems, showArchive, archiveTitle } = this.props;
        const { chats, offset } = this.state;

        // console.log('[dl] render', type, open, chats, cacheChats);
        if (!open) return null;

        this.source = [];
        let dialogs = null;
        if (chats) {
            let lastPinnedId = 0;
            chats.forEach(x => {
                if (isChatPinned(x, { '@type': type })) {
                    lastPinnedId = x;
                }
            });
            this.source = chats;
            // dialogs = chats.slice(offset, offset + 2 * CHAT_SLICE_LIMIT).map(x => (
            //     <Dialog key={x} chatId={x} isLastPinned={x === lastPinnedId} hidden={this.hiddenChats.has(x)} />
            // ));
        } else if (cacheItems) {
            let lastPinnedId = 0;
            cacheItems.forEach(x => {
                if (isChatPinned(x, { '@type': type })) {
                    lastPinnedId = x;
                }
            });
            this.source = cacheItems.map(x => x.id);
            // dialogs = cacheItems.map(x => (
            //     <Dialog
            //         key={x.id}
            //         chatId={x.id}
            //         isLastPinned={x === lastPinnedId}
            //         hidden={this.hiddenChats.has(x.id)}
            //     />
            // ));
        } else {
            if (type === 'chatListMain') {
                dialogs = Array.from(Array(10)).map((x, index) => <DialogPlaceholder key={index} index={index} />);
            }
        }

        return (
            <VirtualizedList
                ref={this.listRef}
                className='dialogs-list'
                source={this.source}
                rowHeight={76}
                overScanCount={20}
                renderItem={x => this.renderItem(x, this.source)}
                onScroll={this.handleScroll}
            />
            // <div ref={this.listRef} className='dialogs-list' onScroll={this.handleScroll}>
            //     {showArchive && offset === 0 && <Archive title={archiveTitle} />}
            //     {dialogs}
            // </div>
        );
    }
}

DialogsList.propTypes = {
    type: PropTypes.oneOf(['chatListMain', 'chatListArchive']).isRequired,
    showArchive: PropTypes.bool,
    archiveTitle: PropTypes.string,
    cacheItems: PropTypes.array,
    items: PropTypes.array
};

export default DialogsList;
