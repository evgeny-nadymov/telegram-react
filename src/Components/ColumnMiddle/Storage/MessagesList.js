/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import * as ReactDOM from 'react-dom';
import classNames from 'classnames';
import ActionBar from '../ActionBar';
import FilesDropTarget from '../FilesDropTarget';
import StubMessage from '../../Message/StubMessage';
import FileItem from '../../Message/Storage/FileItem';
import ServiceMessage from '../../Message/ServiceMessage';
import Placeholder from '../Placeholder';
import ScrollDownButton from '../ScrollDownButton';
import StickersHint from '../StickersHint';
import { throttle, getPhotoSize, itemsInView, historyEquals, getScrollMessage } from '../../../Utils/Common';
import { loadChatsContent, loadDraftContent, loadMessageContents } from '../../../Utils/File';
import { canMessageBeEdited, filterDuplicateMessages, filterMessages } from '../../../Utils/Message';
import { isServiceMessage } from '../../../Utils/ServiceMessage';
import { canSendMediaMessages, getChatFullInfo, getChatMedia, getSupergroupId, isChannelChat } from '../../../Utils/Chat';
import { editMessage, highlightMessage, openChat } from '../../../Actions/Client';
import { MESSAGE_SLICE_LIMIT, MESSAGE_SPLIT_MAX_TIME_S, SCROLL_PRECISION } from '../../../Constants';
import AppStore from '../../../Stores/ApplicationStore';
import ChatStore from '../../../Stores/ChatStore';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import PlayerStore from '../../../Stores/PlayerStore';
import SupergroupStore from '../../../Stores/SupergroupStore';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './MessagesList.css';

const ScrollBehaviorEnum = Object.freeze({
    SCROLL_TO_BOTTOM: 'SCROLL_TO_BOTTOM',
    SCROLL_TO_UNREAD: 'SCROLL_TO_UNREAD',
    SCROLL_TO_MESSAGE: 'SCROLL_TO_MESSAGE',
    SCROLL_TO_POSITION: 'SCROLL_TO_POSITION',
    KEEP_SCROLL_POSITION: 'KEEP_SCROLL_POSITION',
    NONE: 'NONE'
});

class MessagesList extends React.Component {
    constructor(props) {
        super(props);

        this.sessionId = Date.now();
        this.state = {
            prevChatId: 0,
            prevMessageId: null,
            playerOpened: false,
            history: [],
            clearHistory: false,
            selectionActive: false,
            separatorMessageId: 0,
            scrollDownVisible: false,
            replyHistory: []
        };

        this.listRef = React.createRef();
        this.itemsRef = React.createRef();
        this.scrollDownButtonRef = React.createRef();

        this.defferedActions = [];
        this.itemsMap = new Map();

        // this.setState({path: this.props.getPath()});

        this.updateItemsInView = throttle(this.updateItemsInView, 500);

        this.tmp = this.tmp.bind(this);
    }

    hasLastMessage() {
        const { chatId } = this.props;
        const { history } = this.state;

        const chat = ChatStore.get(chatId);
        if (!chat) return false;

        // console.log("ChatCurrent", chat);

        const { last_message } = chat;
        if (!last_message) return true;

        return history.length > 0 && history[history.length - 1].id === last_message.id;
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId || props.messageId !== state.prevMessageId) {
            return {
                prevChatId: props.chatId,
                prevMessageId: props.messageId,
                clearHistory: false,
                selectionActive: false,
                separatorMessageId: props.chatId !== state.prevChatId ? 0 : state.separatorMessageId,
                scrollDownVisible:
                    props.chatId === state.prevChatId && (state.scrollDownVisible || state.replyHistory.length > 0),
                replyHistory: props.chatId !== state.prevChatId ? [] : state.replyHistory
            };
        }

        return null;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const list = this.listRef.current;
        const { scrollTop, scrollHeight, offsetHeight } = list;

        const snapshot = {
            scrollTop,
            scrollHeight,
            offsetHeight
        };

        this.snapshot = snapshot;
        return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId, messageId } = this.props;
        const { scrollDownVisible } = this.state;

        const list = this.listRef.current;

        // console.log(
        //     `[ml] componentDidUpdate
        //     scrollBehaviorNone=${this.scrollBehaviorNone}
        //     scrollDownVisible=${scrollDownVisible}
        //     list.scrollTop=${list.scrollTop}
        //     list.scrollHeight=${list.scrollHeight}
        //     list.offsetHeight=${list.offsetHeight}`
        // );

        if (prevProps.chatId !== chatId || prevProps.messageId !== messageId) {
            this.handleSelectChat(chatId, prevProps.chatId, messageId, prevProps.messageId);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId, theme } = this.props;
        const { playerOpened, history, dragging, clearHistory, selectionActive, scrollDownVisible } = this.state;

        if (nextProps.theme !== theme) {
            // console.log('[ml] shouldComponentUpdate theme');
            return true;
        }

        if (nextProps.chatId !== chatId) {
            // console.log('[ml] shouldComponentUpdate chatId');
            return true;
        }

        if (nextProps.messageId !== messageId) {
            // console.log('[ml] shouldComponentUpdate messageId');
            return true;
        }

        if (nextState.scrollDownVisible !== scrollDownVisible) {
            // console.log('[ml] shouldComponentUpdate scrollDownVisible');
            return true;
        }

        if (nextState.playerOpened !== playerOpened) {
            // console.log('[ml] shouldComponentUpdate playerOpened');
            return true;
        }

        if (!historyEquals(nextState.history, history)) {
            // console.trace('[ml] shouldComponentUpdate history', nextState.history, history);
            return true;
        }

        if (nextState.dragging !== dragging) {
            // console.log('[ml] shouldComponentUpdate dragging');
            return true;
        }

        if (nextState.clearHistory !== clearHistory) {
            // console.log('[ml] shouldComponentUpdate clearHistory');
            return true;
        }

        if (nextState.selectionActive !== selectionActive) {
            // console.log('[ml] shouldComponentUpdate selectionActive');
            return true;
        }

        // console.log('[ml] shouldComponentUpdate false');
        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.on('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatLastMessage);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateSelection);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateSelection);
        MessageStore.on('clientUpdateOpenReply', this.onClientUpdateOpenReply);
        MessageStore.on('clientUpdateTryEditMessage', this.onClientUpdateTryEditMessage);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageSendSucceeded', this.onUpdateMessageSendSucceeded);
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaEnding', this.onClientUpdateMediaEnding);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.off('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
        ChatStore.off('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.off('updateChatLastMessage', this.onUpdateChatLastMessage);
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateSelection);
        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateSelection);
        MessageStore.off('clientUpdateOpenReply', this.onClientUpdateOpenReply);
        MessageStore.off('clientUpdateTryEditMessage', this.onClientUpdateTryEditMessage);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateMessageSendSucceeded', this.onUpdateMessageSendSucceeded);
        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaEnding', this.onClientUpdateMediaEnding);
        PlayerStore.off('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    onKeyDown = event => {
        // if (event.keyCode === 27) {
        //     if (MessageStore.selectedItems.size > 0) {
        //         console.log('[k] messagesList onKeyDown');
        //         clearSelection();
        //         event.stopPropagation();
        //         event.preventDefault();
        //     }
        // }
    };

    onClientUpdateTryEditMessage = async update => {
        if (this.hasLastMessage()) {
            const { history } = this.state;

            for (let i = history.length - 1; i >= 0; i--) {
                const message = history[i];
                if (canMessageBeEdited(message.chat_id, message.id)) {
                    editMessage(message.chat_id, message.id);

                    return;
                }
            }
        }

        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: this.props.chatId,
            query: '',
            sender_user_id: UserStore.getMyId(),
            from_message_id: 0,
            offset: 0,
            limit: 100,
            filter: { '@type': 'searchMessagesFilterEmpty' }
        });

        for (let i = 0; i < result.messages.length; i++) {
            const message = result.messages[i];
            if (canMessageBeEdited(message.chat_id, message.id)) {
                editMessage(message.chat_id, message.id);

                return;
            }
        }
    };

    onClientUpdateDialogsReady = async update => {
        const { list } = update;
        if (!list) return;
        if (list['@type'] !== 'chatListMain') return;

        const { history } = this.state;
        if (history && history.length > 0) return;

        await FileStore.initDB(async () => {
            const { chatId, messageId } = this.props;
            if (chatId) {
                const chat = ChatStore.get(chatId);
                if (chat) {
                    const { type } = chat;
                    switch (type['@type']) {
                        case 'chatTypePrivate':
                        case 'chatTypeSecret': {
                            await TdLibController.send({
                                '@type': 'createPrivateChat',
                                user_id: type.user_id,
                                force: false
                            });
                            break;
                        }
                        case 'chatTypeBasicGroup': {
                            await TdLibController.send({
                                '@type': 'createBasicGroupChat',
                                basic_group_id: type.basic_group_id,
                                force: false
                            });
                            break;
                        }
                        case 'chatTypeSupergroup': {
                            await TdLibController.send({
                                '@type': 'createSupergroupChat',
                                supergroup_id: type.supergroup_id,
                                force: false
                            });
                            break;
                        }
                    }
                    this.handleSelectChat(chatId, 0, messageId, 0);
                }
            }
        });
    };

    onClientUpdateFocusWindow = update => {
        const { focused } = update;
        if (focused) {
            this.defferedActions.forEach(x => x());
            this.defferedActions = [];
        }
    };

    onClientUpdateOpenReply = update => {
        const { chatId, messageId } = update;
        const { replyHistory } = this.state;

        if (this.props.chatId !== chatId) {
            return;
        }

        const lastItem = replyHistory.length > 0 ? replyHistory[replyHistory.length - 1] : null;
        if (lastItem && lastItem.chatId === chatId && lastItem.messageId === messageId) {
            return;
        }

        replyHistory.push({ chatId, messageId });
    };

    onClientUpdateMediaActive = update => {
        const list = this.listRef.current;

        const prevOffsetHeight = list.offsetHeight;
        const prevScrollTop = list.scrollTop;
        this.setState({ playerOpened: true }, () => {
            if (list.scrollTop === prevScrollTop) {
                list.scrollTop += Math.abs(prevOffsetHeight - list.offsetHeight);
            }
        });
    };

    onClientUpdateMediaEnding = udpate => {
        const list = this.listRef.current;

        this.prevOffsetHeight = list.offsetHeight;
        this.prevScrollTop = list.scrollTop;
    };

    onClientUpdateMediaEnd = udpate => {
        const list = this.listRef.current;

        //const prevOffsetHeight = list.offsetHeight;
        //const prevScrollTop = list.scrollTop;

        this.setState({ playerOpened: false }, () => {
            if (list.scrollTop === this.prevScrollTop) {
                list.scrollTop -= Math.abs(this.prevOffsetHeight - list.offsetHeight);
            }
        });
    };

    onClientUpdateSelection = update => {
        this.setState({
            selectionActive: MessageStore.selectedItems.size > 0
        });
    };

    onClientUpdateClearHistory = update => {
        const { chatId } = this.props;

        if (chatId === update.chatId) {
            this.setState({ clearHistory: update.inProgress });
        }
    };

    onUpdateMessageContent = update => {
        const { chatId } = this.props;
        const { history } = this.state;
        const { chat_id, message_id } = update;

        if (chatId !== chat_id) return;

        if (history.findIndex(x => x.id === message_id) !== -1) {
            const message = MessageStore.get(chat_id, message_id);
            if (!message) return;

            const store = FileStore.getStore();
            loadMessageContents(store, [message]);
        }
    };

    onUpdateChatLastMessage = update => {
        const { chatId } = this.props;
        if (chatId !== update.chat_id) return;
    };

    onUpdateMessageSendSucceeded = update => {
        if (!this.hasLastMessage()) return;

        const { message, old_message_id } = update;
        const { chatId } = this.props;
        if (chatId !== message.chat_id) return;

        // let handleSendSucceeded = false;
        // const { content } = message;
        // switch (content['@type']) {
        //     case 'messagePoll': {
        //         handleSendSucceeded = true;
        //         break;
        //     }
        // }
        //
        // if (!handleSendSucceeded) return;

        const scrollBehavior = message.is_outgoing
            ? ScrollBehaviorEnum.SCROLL_TO_BOTTOM
            : ScrollBehaviorEnum.KEEP_SCROLL_POSITION;

        this.replaceMessage(old_message_id, message, () => {
            if (scrollBehavior !== ScrollBehaviorEnum.KEEP_SCROLL_POSITION) {
                this.handleScrollBehavior(scrollBehavior, this.snapshot);
            }

            this.updateItemsInView();
        });

        const store = FileStore.getStore();
        loadMessageContents(store, [message]);
        this.viewMessages([message]);
    };

    onUpdateNewMessage = update => {
        if (!this.hasLastMessage()) return;

        const { message } = update;
        const { chatId } = this.props;
        if (chatId !== message.chat_id) return;

        const { date } = message;
        if (date === 0) return;

        const list = this.listRef.current;

        let scrollBehavior = message.is_outgoing ? ScrollBehaviorEnum.SCROLL_TO_BOTTOM : ScrollBehaviorEnum.NONE;
        if (list.scrollTop + list.offsetHeight >= list.scrollHeight) {
            scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
        }

        const newState = message.is_outgoing ? { scrollDownVisible: false } : {};

        const history = [message];
        this.scrollBehaviorNone = true;
        this.insertPrevious(filterMessages(history), newState, () => {
            this.scrollBehaviorNone = false;
            this.handleScrollBehavior(scrollBehavior, this.snapshot);
        });

        const store = FileStore.getStore();
        loadMessageContents(store, history);
        this.viewMessages(history);
    };

    onUpdateDeleteMessages = update => {
        const { chatId } = this.props;
        const { chat_id, is_permanent, message_ids } = update;
        if (chatId !== chat_id) return;

        if (!is_permanent) return;

        this.deleteHistory(message_ids);
    };

    updateItemsInView = () => {
        if (!this.messages) return;

        const messages = new Map();
        const items = itemsInView(this.listRef, this.itemsRef);
        for (let i = 0; i < items.length; i++) {
            const messageWrapper = this.messages[items[i]];
            if (messageWrapper) {
                const message = messageWrapper;
                const { chatId, messageId } = message.props;
                const key = `${chatId}_${messageId}`;
                messages.set(key, key);
            }
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMessagesInView',
            messages
        });
        return;

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

        const store = FileStore.getStore();
        loadMessageContents(store, messages);
    };

    async handleSelectChat(chatId, previousChatId, messageId, previousMessageId) {
        const chat = ChatStore.get(chatId);
        const previousChat = ChatStore.get(previousChatId);

        //console.log('MessagesList.newSessionId handleSelectChat');
        this.sessionId = Date.now();
        this.loading = false;
        this.loadMigratedHistory = false;
        this.defferedActions = [];

        const scrollPosition = null; //ChatStore.getScrollPosition(chatId);

        if (chat) {
            TdLibController.send({
                '@type': 'openChat',
                chat_id: chat.id
            });

            const unread = !messageId && chat.unread_count > 1;
            let fromMessageId = 0;
            if (unread && chat.last_read_inbox_message_id) {
                fromMessageId = chat.last_read_inbox_message_id;
            } else if (messageId) {
                fromMessageId = messageId;
            } else if (scrollPosition) {
                fromMessageId = scrollPosition.messageId;
            }
            const offset = unread || messageId || scrollPosition ? -1 - MESSAGE_SLICE_LIMIT : 0;
            const limit = unread || messageId || scrollPosition ? 2 * MESSAGE_SLICE_LIMIT : MESSAGE_SLICE_LIMIT;

            this.loading = true;
            const sessionId = this.sessionId;
            const result = await TdLibController.send({
                '@type': 'getChatHistory',
                chat_id: chat.id,
                from_message_id: fromMessageId,
                offset,
                limit
            }).catch(error => {
                return {
                    '@type': 'messages',
                    messages: [],
                    total_count: 0
                };
            }).finally(() => {
                this.loading = false;
            });

            if (sessionId !== this.sessionId) {
                return;
            }

            MessageStore.setItems(result.messages);
            result.messages.reverse();
            // console.warn("...", result.messages);

            let separatorMessageId = this.state.separatorMessageId;
            if (chatId !== previousChatId) {
                separatorMessageId = Number.MAX_VALUE;
                if (chat && chat.unread_count > 1) {
                    for (let i = result.messages.length - 1; i >= 0; i--) {
                        const { id } = result.messages[i];
                        if (
                            !result.messages[i].is_outgoing &&
                            id > chat.last_read_inbox_message_id &&
                            id < separatorMessageId
                        ) {
                            separatorMessageId = id;
                        } else {
                            break;
                        }
                    }
                }
                separatorMessageId = separatorMessageId === Number.MAX_VALUE ? 0 : separatorMessageId;
            }

            let scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
            if (messageId) {
                scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_MESSAGE;
            } else if (unread && separatorMessageId) {
                scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_UNREAD;
            } else if (scrollPosition) {
                scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_POSITION;
            }

            this.replace(separatorMessageId, result.messages, () => {
                this.handleScrollBehavior(scrollBehavior, this.snapshot, scrollPosition);
                if (messageId) {
                    highlightMessage(chatId, messageId);
                }
            });

            // load files
            const store = FileStore.getStore();
            loadMessageContents(store, result.messages);
            this.viewMessages(result.messages);

            loadChatsContent(store, [chatId]);
            loadDraftContent(store, chatId);

            this.loadIncompleteHistory(result);

            if (previousChatId !== chatId) {
                getChatFullInfo(chatId);
                getChatMedia(chatId);
            }
        } else {
            this.loading = true;
            this.replace(0, [], () => {
                this.loading = false;
            });
        }

        if (previousChatId !== chatId) {
            if (previousChat) {
                TdLibController.send({
                    '@type': 'closeChat',
                    chat_id: previousChatId
                });

                const scrollMessage = getScrollMessage(this.snapshot, this.itemsRef);
                // console.log('[scroll] start setScrollPosition', [previousChatId, previousChat, this.snapshot, scrollMessage]);
                const message = this.messages[scrollMessage.index];
                if (message) {
                    const { chatId, messageId } = message.props;
                    // console.log('[scroll] stop setScrollPosition', [previousChatId, previousChat], { chatId, messageId, offset: scrollMessage.offset });
                    ChatStore.setScrollPosition(previousChatId, { chatId, messageId, offset: scrollMessage.offset });
                }
            }
        }
    }

    viewMessages(messages) {
        if (!messages) return;
        if (messages.length === 0) return;
        if (!messages[0].chat_id) return;

        const viewAction = () => {
            TdLibController.send({
                '@type': 'viewMessages',
                chat_id: messages[0].chat_id,
                message_ids: messages.map(x => x.id)
            });
        };

        if (window.hasFocus) {
            viewAction();
        } else {
            this.defferedActions.push(viewAction);
        }
    }

    cancelLoadMessageContents(messages) {
        //return;
        for (let i = messages.length - 1; i >= 0; i--) {
            let message = messages[i];
            if (message && message.content) {
                switch (message.content['@type']) {
                    case 'messagePhoto': {
                        let [id, pid] = this.getMessagePhoto(message);
                        if (pid) {
                            let obj = getPhotoSize(message.content.photo.sizes);
                            if (!obj.blob) {
                                FileStore.cancelGetRemoteFile(id, message);
                            }
                        }
                        break;
                    }
                    case 'messageSticker': {
                        let [id, pid] = this.getMessageSticker(message);
                        if (pid) {
                            let obj = message.content.sticker.sticker;
                            if (!obj.blob) {
                                FileStore.cancelGetRemoteFile(id, message);
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

    loadIncompleteHistory = async result => {
        const MAX_ITERATIONS = 5;
        let incomplete = result && result.messages.length > 0 && result.messages.length < MESSAGE_SLICE_LIMIT;

        for (let i = 0; i < MAX_ITERATIONS && incomplete; i++) {
            result = await this.onLoadNext();
            incomplete = result && result.messages.length > 0 && result.messages.length < MESSAGE_SLICE_LIMIT;
        }
    };

    onLoadNext = async () => {
        const { chatId } = this.props;
        const { history } = this.state;

        if (!chatId) return;
        if (this.loading) return;

        if (this.loadMigratedHistory) {
            this.onLoadMigratedHistory();
            return;
        }

        const fromMessageId = history && history.length > 0 ? history[0].id : 0;
        const limit = history.length < MESSAGE_SLICE_LIMIT? MESSAGE_SLICE_LIMIT * 2 : MESSAGE_SLICE_LIMIT;

        // console.log('[p] getChatHistory', [fromMessageId]);
        this.loading = true;
        const sessionId = this.sessionId;
        let result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chatId,
            from_message_id: fromMessageId,
            offset: 0,
            limit
        }).finally(() => {
            this.loading = false;
        });
            // console.warn("res", result);
        // console.log('[p] getChatHistory result', fromMessageId, limit, result);

        if (sessionId !== this.sessionId) {
            return;
        }

        if (this.props.chatId !== chatId) {
            return;
        }

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.loading = true;
        requestAnimationFrame(() => {
            this.loading = false;
            this.insertNext(filterMessages(result.messages), state => {
                if (filterMessages(result.messages).length > 0) {
                    this.handleScrollBehavior(ScrollBehaviorEnum.KEEP_SCROLL_POSITION, this.snapshot);
                    setTimeout(() => {
                        const { history: currentHistory } = this.state;
                        if (currentHistory.length >= MESSAGE_SLICE_LIMIT * 3) {
                            this.setState({
                                history: currentHistory.slice(0, MESSAGE_SLICE_LIMIT * 3)
                            });
                        }
                    }, 100);
                }
                if (!result.messages.length) {
                    this.onLoadMigratedHistory();
                }
            });

            const store = FileStore.getStore();
            loadMessageContents(store, result.messages);
            this.viewMessages(result.messages);

            return result;
        });
    };

    onLoadMigratedHistory = async () => {
        const { chatId } = this.props;
        const { history } = this.state;

        if (!chatId) return;
        if (this.loading) return;

        const supergroupId = getSupergroupId(chatId);
        if (!supergroupId) return;

        const fullInfo = SupergroupStore.getFullInfo(supergroupId);
        if (!fullInfo) return;
        if (!fullInfo.upgraded_from_basic_group_id) return;

        this.loadMigratedHistory = true;

        const basicGroupChat = await TdLibController.send({
            '@type': 'createBasicGroupChat',
            basic_group_id: fullInfo.upgraded_from_basic_group_id
        });

        if (!basicGroupChat) return;

        const fromMessageId = history.length > 0 && history[0].chat_id === basicGroupChat.id ? history[0].id : 0;

        this.loading = true;
        const sessionId = this.sessionId;
        const result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: basicGroupChat.id,
            from_message_id: fromMessageId,
            offset: 0,
            limit: fromMessageId === 0? MESSAGE_SLICE_LIMIT * 2 : MESSAGE_SLICE_LIMIT
        }).finally(() => {
            this.loading = false;
        });

        if (sessionId !== this.sessionId) {
            return;
        }

        if (this.props.chatId !== chatId) {
            return;
        }

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.insertNext(filterMessages(result.messages), state => {
            if (filterMessages(result.messages).length > 0) {
                this.handleScrollBehavior(ScrollBehaviorEnum.KEEP_SCROLL_POSITION, this.snapshot);
            }
        });

        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        this.viewMessages(result.messages);
    };

    onLoadPrevious = async () => {
        const { chatId } = this.props;
        const { history } = this.state;

        const chat = ChatStore.get(chatId);

        // console.log('[p] onLoadPrevious', [this.loading]);

        if (!chat) return;
        if (this.loading) return;
        if (this.hasLastMessage()) return;

        const fromMessageId = history && history.length > 0 ? history[history.length - 1].id : 0;
        const limit = history.length < MESSAGE_SLICE_LIMIT? MESSAGE_SLICE_LIMIT * 2 : MESSAGE_SLICE_LIMIT;

        this.loading = true;
        const sessionId = this.sessionId;
        let result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chatId,
            from_message_id: fromMessageId,
            offset: -limit - 1,
            limit: limit + 1
        }).finally(() => {
            this.loading = false;
        });
        // console.warn("res", result);

        if (sessionId !== this.sessionId) {
            return;
        }

        if (this.props.chatId !== chatId) {
            return;
        }

        filterDuplicateMessages(result, this.state.history);

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.scrollBehaviorNone = true;
        this.insertPrevious(filterMessages(result.messages), {}, () => {
            this.scrollBehaviorNone = false;
            if (filterMessages(result.messages).length > 0) {
                setTimeout(() => {
                    const { history: currentHistory } = this.state;
                    if (currentHistory.length > MESSAGE_SLICE_LIMIT * 3) {
                        this.setState({
                            history: currentHistory.slice(currentHistory.length - MESSAGE_SLICE_LIMIT * 3)
                        }, () => {
                            this.handleScrollBehavior(ScrollBehaviorEnum.KEEP_SCROLL_POSITION, this.snapshot);
                        });
                    }
                }, 0);
            }
        });

        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        this.viewMessages(result.messages);

        return result;
    };

    replace(separatorMessageId, history, callback) {
        this.setState({ separatorMessageId, history }, callback);
    }

    replaceMessage(oldMessageId, message, callback) {
        if (!message) {
            if (callback) callback();
            return;
        }

        this.setState(
            {
                history: this.state.history.filter(x => x.id !== oldMessageId).concat([message])
            },
            callback
        );
    }

    insertNext(history, callback) {
        if (history.length === 0) {
            callback && callback();
            return;
        }

        this.setState({
            history: history.concat(this.state.history)//.slice(0, 100)
        }, callback);
    }

    insertPrevious(history, newState, callback) {
        if (history.length === 0) {
            if (callback) callback();
            return;
        }

        this.setState({
            history: this.state.history.concat(history),
            ...newState
        }, callback);
    }

    deleteHistory(message_ids, callback) {
        const { history } = this.state;
        if (history.length === 0) {
            if (callback) callback();
            return;
        }

        const map = new Map(message_ids.map(x => [x, x]));
        this.setState({ history: history.filter(x => !map.has(x.id)) }, callback);
    }

    handleScroll = () => {
        const { scrollDownVisible, replyHistory, history } = this.state;
        const list = this.listRef.current;

        // console.log(
        //     `[ml] handleScroll
        //     list.scrollTop=${list.scrollTop}
        //     list.offsetHeight=${list.offsetHeight}
        //     list.scrollHeight=${list.scrollHeight}`
        // );

        this.updateItemsInView();

        if (list.scrollTop <= SCROLL_PRECISION) {
            this.onLoadNext();
        }

        if (list.scrollTop + list.offsetHeight >= list.scrollHeight - SCROLL_PRECISION) {
            this.onLoadPrevious();
        }

        if (list.scrollTop + list.offsetHeight >= list.scrollHeight - SCROLL_PRECISION) {
            if (this.hasLastMessage() && scrollDownVisible) {
                if (this.prevScrollTop !== list.scrollTop && this.prevScrollTop && this.prevHistory === history) {
                    this.setState({
                        scrollDownVisible: false,
                        replyHistory: []
                    });
                } else if (!replyHistory.length) {
                    this.setState({
                        scrollDownVisible: false
                    });
                }
            }
        } else {
            if (!scrollDownVisible) {
                this.setState({ scrollDownVisible: true });
            }
        }

        this.prevScrollTop = list.scrollTop;
        this.prevHistory = history;
    };

    handleScrollBehavior = (scrollBehavior, snapshot, position) => {
        const { chatId, messageId } = this.props;
        const { scrollTop, scrollHeight, offsetHeight } = snapshot || {
            scrollTop: 0,
            scrollHeight: 0,
            offsetHeight: 0
        };

        // console.log(
        //     `[ml] handleScrollBehavior
        //     scrollBehavior=${scrollBehavior}
        //     snapshot.scrollTop=${scrollTop}
        //     snapshot.offsetHeight=${offsetHeight}
        //     snapshot.scrollHeight=${scrollHeight}`
        // );

        switch (scrollBehavior) {
            case ScrollBehaviorEnum.SCROLL_TO_BOTTOM: {
                this.scrollToBottom();
                break;
            }
            case ScrollBehaviorEnum.SCROLL_TO_MESSAGE: {
                this.scrollToMessage();
                break;
            }
            case ScrollBehaviorEnum.SCROLL_TO_UNREAD: {
                this.scrollToUnread();
                break;
            }
            case ScrollBehaviorEnum.SCROLL_TO_POSITION: {
                this.scrollToPosition(position);
                break;
            }
            case ScrollBehaviorEnum.KEEP_SCROLL_POSITION: {
                this.keepScrollPosition(snapshot);
                break;
            }
            case ScrollBehaviorEnum.NONE: {
                break;
            }
        }
    };

    keepScrollPosition = snapshot => {
        const { scrollTop, scrollHeight, offsetHeight } = snapshot;
        const list = this.listRef.current;

        // console.log(
        //     `[ml] keepScrollPosition before
        //     list.scrollTop=${list.scrollTop}
        //     list.scrollHeight=${list.scrollHeight}
        //     list.offsetHeight=${list.offsetHeight}
        //     snapshot.scrollTop=${snapshot.scrollTop}
        //     snapshot.scrollHeight=${snapshot.scrollHeight}
        //     snapshot.offsetHeight=${snapshot.offsetHeight}`
        // );

        list.scrollTop = scrollTop + (list.scrollHeight - scrollHeight);

        // console.log(
        //     `[ml] keepScrollPosition after
        //     list.scrollTop=${list.scrollTop}
        //     list.scrollHeight=${list.scrollHeight}
        //     list.offsetHeight=${list.offsetHeight}`
        // );
    };

    scrollToUnread = () => {
        const { chatId, messageId } = this.props;
        const { history } = this.state;
        const list = this.listRef.current;

        const chat = ChatStore.get(chatId);
        const pinnedMessageMargin = 0; //chat && chat.pinned_message_id ? 55 : 0;

        // console.log(
        //     `MessagesList.scrollToUnread before
        //     chatId=${chatId} messageId=${messageId}
        //     list.scrollTop=${list.scrollTop}
        //     list.offsetHeight=${list.offsetHeight}
        //     list.scrollHeight=${list.scrollHeight}`
        // );

        let scrolled = false;
        for (let i = 0; i < history.length; i++) {
            let itemComponent = this.itemsMap.get(i);
            let item = ReactDOM.findDOMNode(itemComponent);
            if (item) {
                if (itemComponent.props.showUnreadSeparator) {
                    list.scrollTop = item.offsetTop - pinnedMessageMargin; // + unread messages margin-top
                    scrolled = true;
                    break;
                }
            }
        }

        // console.log(
        //     `MessagesList.scrollToUnread after
        //     chatId=${chatId} messageId=${messageId} scrolled=${scrolled}
        //     list.scrollTop=${list.scrollTop}
        //     list.offsetHeight=${list.offsetHeight}
        //     list.scrollHeight=${list.scrollHeight}`
        // );

        if (!scrolled) {
            this.scrollToBottom();
        }
    };

    scrollToPosition = position => {
        // console.log('[scroll] scrollToPosition', this.props.chatId, position);
        const { messageId, offset } = position;
        const { history } = this.state;
        const list = this.listRef.current;

        let scrolled = false;
        for (let i = 0; i < history.length; i++) {
            const itemComponent = this.itemsMap.get(i);
            const node = ReactDOM.findDOMNode(itemComponent);
            if (node) {
                if (itemComponent.props.messageId === messageId) {
                    list.scrollTop = node.offsetTop - offset;
                    scrolled = true;
                    break;
                }
            }
        }
    };

    scrollToMessage = () => {
        const { chatId, messageId } = this.props;
        const { history } = this.state;
        const list = this.listRef.current;

        // console.log(
        //     `MessagesList.scrollToMessage before
        //     chatId=${chatId} messageId=${messageId}
        //     list.scrollTop=${list.scrollTop}
        //     list.offsetHeight=${list.offsetHeight}
        //     list.scrollHeight=${list.scrollHeight}`,
        //     this.itemsMap
        // );

        let scrolled = false;
        for (let i = 0; i < history.length; i++) {
            const itemComponent = this.itemsMap.get(i);
            const node = ReactDOM.findDOMNode(itemComponent);
            if (node) {
                if (itemComponent.props.messageId === messageId) {
                    if (list.offsetHeight < node.offsetHeight) {
                        // scroll to the message top
                        list.scrollTop = node.offsetTop;
                    } else {
                        // scroll message to the center of screen
                        list.scrollTop = node.offsetTop - list.offsetHeight / 2.0 + node.offsetHeight / 2.0;
                    }
                    scrolled = true;
                    break;
                }
            }
        }

        // console.log(
        //     `MessagesList.scrollToMessage after
        //     chatId=${chatId} messageId=${messageId} scrolled=${scrolled}
        //     list.scrollTop=${list.scrollTop}
        //     list.offsetHeight=${list.offsetHeight}
        //     list.scrollHeight=${list.scrollHeight}`
        // );

        // if (!scrolled) {
        //     this.scrollToBottom();
        // }
    };

    scrollToBottom = () => {
        const { chatId, messageId } = this.props;
        const list = this.listRef.current;

        // console.log(
        //     `MessagesList.scrollToBottom before
        //     chatId=${chatId} messageId=${messageId}
        //     list.scrollTop=${list.scrollTop}
        //     list.offsetHeight=${list.offsetHeight}
        //     list.scrollHeight=${list.scrollHeight}`
        // );

        const nextScrollTop = list.scrollHeight - list.offsetHeight;
        if (nextScrollTop !== list.scrollTop) {
            list.scrollTop = list.scrollHeight - list.offsetHeight;

            // console.log(
            //     `MessagesList.scrollToBottom after
            // chatId=${chatId} messageId=${messageId}
            // list.scrollTop=${list.scrollTop}
            // list.offsetHeight=${list.offsetHeight}
            // list.scrollHeight=${list.scrollHeight}`
            // );
        } else {
            // console.log(
            //     `MessagesList.scrollToBottom after (no changes)
            // chatId=${chatId} messageId=${messageId}
            // list.scrollTop=${list.scrollTop}
            // list.offsetHeight=${list.offsetHeight}
            // list.scrollHeight=${list.scrollHeight}`
            // );
        }
    };

    scrollToStart = async () => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        // console.log('MessagesList.newSessionId scrollToStart');
        this.sessionId = Date.now();
        this.loading = false;

        const fromMessageId = 0;
        const offset = 0;
        const limit = MESSAGE_SLICE_LIMIT;

        this.loading = true;
        const sessionId = this.sessionId;
        const result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chat.id,
            from_message_id: fromMessageId,
            offset: offset,
            limit: limit
        }).finally(() => {
            this.loading = false;
        });

        if (sessionId !== this.sessionId) {
            return;
        }

        if (this.props.chatId !== chatId) {
            return;
        }

        // console.log('MessagesList.scrollToStart scrollDown', false);
        this.setState({ scrollDownVisible: false, replyHistory: [] });

        MessageStore.setItems(result.messages);
        result.messages.reverse();

        this.replace(this.state.separatorMessageId, result.messages, () => {
            this.handleScrollBehavior(ScrollBehaviorEnum.SCROLL_TO_BOTTOM, this.snapshot);
        });

        // load files
        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        this.viewMessages(result.messages);

        this.loadIncompleteHistory(result);
    };

    handleListDragEnter = event => {
        event.preventDefault();
        event.stopPropagation();

        const { chatId } = this.props;
        if (!canSendMediaMessages(chatId)) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateDragging',
            dragging: true,
            files: event.dataTransfer.files
        });
    };

    handleScrollDownClick = event => {
        const { replyHistory } = this.state;

        if (replyHistory.length > 0) {
            const lastReply = replyHistory.pop();
            if (lastReply) {
                const { chatId, messageId } = lastReply;
                if (chatId === this.props.chatId) {
                    openChat(chatId, messageId);
                }
            }
        } else {
            this.scrollToStart();
        }
    };

    showMessageTitle(message, prevMessage, isFirst) {
        if (!message) return false;

        const { chat_id, date, is_outgoing, sender_user_id, content } = message;

        if (isFirst) {
            return true;
        }

        if (isChannelChat(chat_id)) {
            return true;
        }

        return (
            prevMessage &&
            (isServiceMessage(prevMessage) ||
                prevMessage.content['@type'] === 'messageSticker' ||
                prevMessage.content['@type'] === 'messageVideoNote' ||
                sender_user_id !== prevMessage.sender_user_id ||
                is_outgoing !== prevMessage.is_outgoing ||
                date - prevMessage.date > MESSAGE_SPLIT_MAX_TIME_S)
        );
    }

    showMessageDate(message, prevMessage, isFirst) {
        if (isFirst) {
            return true;
        }

        const date = new Date(message.date * 1000);
        const prevDate = prevMessage ? new Date(prevMessage.date * 1000) : date;

        if (
            date.getFullYear() !== prevDate.getFullYear() ||
            date.getMonth() !== prevDate.getMonth() ||
            date.getDate() !== prevDate.getDate()
        ) {
            return true;
        }

        return false;
    }

    tmp(cid, mid) {
        const result = TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: cid,
            from_message_id: mid,
            offset: 0,
            limit: 10
        }).then(data => {
            console.warn("data-ml", cid, data);
            // console.trace();
            // return data;
        });

        // console.warn("Hello", result);
        // return result;
    }

    render() {
        const { chatId } = this.props;
        const { history, separatorMessageId, clearHistory, selectionActive, scrollDownVisible } = this.state;

        // console.log('[ml] render ', history);

        // const isChannel = isChannelChat(chatId);

        this.itemsMap.clear();
        this.messages = clearHistory
            ? null
            : history.map((x, i) => {
                // console.log(x, i);
                /// message id=5 prev
                /// message id=6 current
                /// message id=7 next
                /// ...
                /// message id=10

                const prevMessage = i > 0 ? history[i - 1] : null;
                const nextMessage = i < history.length - 1 ? history[i + 1] : null;

                const showDate = this.showMessageDate(x, prevMessage, i === 0);

                let m = null;
                if (isServiceMessage(x)) {
                    m = null;
                } else {
                    const showTitle = this.showMessageTitle(x, prevMessage, i === 0);
                    const nextShowTitle = this.showMessageTitle(nextMessage, x, false);

                    const showTail = !nextMessage
                        || isServiceMessage(nextMessage)
                        || nextMessage.content['@type'] === 'messageSticker'
                        || nextMessage.content['@type'] === 'messageVideoNote'
                        || x.sender_user_id !== nextMessage.sender_user_id
                        || x.is_outgoing !== nextMessage.is_outgoing
                        || nextShowTitle;

                    m = (
                        // <StubMessage
                        //     key={`chat_id=${x.chat_id} message_id=${x.id} show_date=${showDate}`}
                        //     ref={el => this.itemsMap.set(i, el)}
                        //     chatId={x.chat_id}
                        //     messageId={x.id}
                        //     sendingState={x.sending_state}
                        //     showTitle={showTitle}
                        //     showTail={showTail}
                        //     showUnreadSeparator={separatorMessageId === x.id}
                        //     showDate={showDate}
                        // />

                        <FileItem
                            // key={`chat_id=${x.chat_id} message_id=${x.id} show_date=${showDate}`}
                            // ref={el => this.itemsMap.set(i, el)}
                            chatId={x.chat_id}
                            messageId={x.id}
                            // sendingState={x.sending_state}
                            // showTitle={showTitle}
                            // showTail={showTail}
                            // showUnreadSeparator={separatorMessageId === x.id}
                            // showDate={showDate}
                            
                            getPath={this.props.getPath}
                            setPath={this.props.setPath}
                        />
                    );
                    // console.log("2)\nchatId", x.chat_id, "\nmessageId", x.id);
                    // console.warn("data-ml", this.tmp(x.chat_id, x.id));
                    
                    
                }

                return m;


              });
        // console.log('[p] messagesList.render');

        // const chat = ChatStore.get(this.props.chatId);
        // console.log("ChatCurrent", chat);

        // this.tmp(this.props.chatId, this.props.messageId);
        // console.log("2)\nchatId", this.props.chatId, "\nmessageId", this.props.messageId);

        return (
            <div
                className={classNames('messages-list', {
                    'messages-list-selection-active': selectionActive
                })}
                onDragEnter={this.handleListDragEnter}>
                <div ref={this.listRef} className='messages-list-wrapper' onScroll={this.handleScroll}>
                    {/* <div className='messages-list-top' /> */}
                    <div ref={this.itemsRef} className='messages-list-items'>
                        {this.messages}
                    </div>
                </div>
                <ActionBar chatId={chatId} />
                <Placeholder />
                {scrollDownVisible && (
                    <ScrollDownButton ref={this.scrollDownButtonRef} onClick={this.handleScrollDownClick} />
                )}
                <FilesDropTarget />
                <StickersHint />
            </div>
        );
    }
}

export default MessagesList;
