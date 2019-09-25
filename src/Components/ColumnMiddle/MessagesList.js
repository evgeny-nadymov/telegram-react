/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import * as ReactDOM from 'react-dom';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import DayMeta from '../Message/DayMeta';
import FilesDropTarget from './FilesDropTarget';
import Message from '../Message/Message';
import PinnedMessage from './PinnedMessage';
import Placeholder from './Placeholder';
import ScrollDownButton from './ScrollDownButton';
import ServiceMessage from '../Message/ServiceMessage';
import StickersHint from './StickersHint';
import { throttle, getPhotoSize, itemsInView, historyEquals } from '../../Utils/Common';
import { loadChatsContent, loadDraftContent, loadMessageContents } from '../../Utils/File';
import { filterDuplicateMessages, filterMessages } from '../../Utils/Message';
import { isServiceMessage } from '../../Utils/ServiceMessage';
import { canSendFiles, getChatFullInfo, getSupergroupId, isChannelChat } from '../../Utils/Chat';
import { highlightMessage, openChat } from '../../Actions/Client';
import { MESSAGE_SLICE_LIMIT, MESSAGE_SPLIT_MAX_TIME_S } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import PlayerStore from '../../Stores/PlayerStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './MessagesList.css';

const ScrollBehaviorEnum = Object.freeze({
    SCROLL_TO_BOTTOM: 'SCROLL_TO_BOTTOM',
    SCROLL_TO_UNREAD: 'SCROLL_TO_UNREAD',
    SCROLL_TO_MESSAGE: 'SCROLL_TO_MESSAGE',
    KEEP_SCROLL_POSITION: 'KEEP_SCROLL_POSITION'
});

const styles = theme => ({
    background: {
        background: theme.palette.type === 'dark' ? theme.palette.grey[900] : 'transparent'
    }
});

class MessagesList extends React.Component {
    constructor(props) {
        super(props);

        // console.log(`MessagesList.ctor chat_id=${props.chatId} message_id=${props.messageId}`);

        // console.log('MessagesList.newSessionId ctor');
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

        this.defferedActions = [];
        this.itemsMap = new Map();

        this.updateItemsInView = throttle(this.updateItemsInView, 500);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId || props.messageId !== state.prevMessageId) {
            return {
                prevChatId: props.chatId,
                prevMessageId: props.messageId,
                clearHistory: false,
                selectionActive: false,
                separatorMessageId: 0,
                scrollDownVisible:
                    props.chatId === state.prevChatId && (state.scrollDownVisible || state.replyHistory.length > 0),
                replyHistory: props.chatId !== state.prevChatId ? [] : state.replyHistory
            };
        }

        return null;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { chatId, messageId } = this.props;

        const list = this.listRef.current;
        const { scrollTop, scrollHeight, offsetHeight } = list;

        const snapshot = {
            scrollTop,
            scrollHeight,
            offsetHeight
        };

        // console.log(
        //     `MessagesList.getSnapshotBeforeUpdate
        //     chatId=${chatId} messageId=${messageId}
        //     list.scrollTop=${scrollTop}
        //     list.scrollHeight=${scrollHeight}
        //     list.offsetHeight=${offsetHeight}`
        // );

        this.snapshot = snapshot;
        return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId, messageId } = this.props;
        const { scrollDownVisible } = this.state;

        const list = this.listRef.current;
        // console.log(
        //     `MessagesList.componentDidUpdate
        //     chat_id=${chatId} message_id=${messageId}
        //     prevProps.chat_id=${prevProps.chatId} prevProps.message_id=${prevProps.messageId}
        //     scrollDownVisible=${scrollDownVisible}
        //     list.scrollTop=${list.scrollTop}
        //     list.scrollHeight=${list.scrollHeight}
        //     list.offsetHeight=${list.offsetHeight}`
        // );

        if (prevProps.chatId !== chatId || prevProps.messageId !== messageId) {
            //console.log('[Animation] componentDidUpdate');
            this.handleSelectChat(chatId, prevProps.chatId, messageId, prevProps.messageId);
        } else {
            if (!this.scrollBehaviorNone) {
                this.handleScrollBehavior(ScrollBehaviorEnum.KEEP_SCROLL_POSITION, snapshot);
                //console.log('[Animation] componentDidUpdate handleScrollBehavior');
            }
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId, theme } = this.props;
        const { playerOpened, history, dragging, clearHistory, selectionActive, scrollDownVisible } = this.state;

        if (nextProps.theme !== theme) {
            // console.log('MessagesList.shouldComponentUpdate theme');
            return true;
        }

        if (nextProps.chatId !== chatId) {
            // console.log('MessagesList.shouldComponentUpdate chatId');
            return true;
        }

        if (nextProps.messageId !== messageId) {
            // console.log('MessagesList.shouldComponentUpdate messageId');
            return true;
        }

        if (nextState.scrollDownVisible !== scrollDownVisible) {
            // console.log('MessagesList.shouldComponentUpdate scrollDownVisible');
            return true;
        }

        if (nextState.playerOpened !== playerOpened) {
            // console.log('MessagesList.shouldComponentUpdate playerOpened');
            return true;
        }

        if (!historyEquals(nextState.history, history)) {
            // console.trace('MessagesList.shouldComponentUpdate history', nextState.history, history);
            return true;
        }

        if (nextState.dragging !== dragging) {
            // console.log('MessagesList.shouldComponentUpdate dragging');
            return true;
        }

        if (nextState.clearHistory !== clearHistory) {
            // console.log('MessagesList.shouldComponentUpdate clearHistory');
            return true;
        }

        if (nextState.selectionActive !== selectionActive) {
            // console.log('MessagesList.shouldComponentUpdate selectionActive');
            return true;
        }

        // console.log('MessagesList.shouldComponentUpdate false');
        return false;
    }

    componentDidMount() {
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageSendSucceeded', this.onUpdateMessageSendSucceeded);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateSelection);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateSelection);
        MessageStore.on('clientUpdateOpenReply', this.onClientUpdateOpenReply);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatLastMessage);
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ApplicationStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);

        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaEnding', this.onClientUpdateMediaEnding);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        MessageStore.removeListener('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.removeListener('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.removeListener('updateMessageSendSucceeded', this.onUpdateMessageSendSucceeded);
        MessageStore.removeListener('clientUpdateMessageSelected', this.onClientUpdateSelection);
        MessageStore.removeListener('clientUpdateClearSelection', this.onClientUpdateSelection);
        MessageStore.removeListener('clientUpdateOpenReply', this.onClientUpdateOpenReply);
        ChatStore.removeListener('updateChatLastMessage', this.onUpdateChatLastMessage);
        ChatStore.removeListener('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ApplicationStore.removeListener('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);

        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaEnding', this.onClientUpdateMediaEnding);
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

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
        if (!this.completed) return;

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
        });

        const store = FileStore.getStore();
        loadMessageContents(store, [message]);
        this.viewMessages([message]);
    };

    onUpdateNewMessage = update => {
        if (!this.completed) return;

        const { message } = update;
        const { chatId } = this.props;
        if (chatId !== message.chat_id) return;

        const scrollBehavior = message.is_outgoing
            ? ScrollBehaviorEnum.SCROLL_TO_BOTTOM
            : ScrollBehaviorEnum.KEEP_SCROLL_POSITION;
        const newState = message.is_outgoing ? { scrollDownVisible: false } : {};

        const history = [message];
        this.insertPrevious(filterMessages(history), newState, () => {
            if (scrollBehavior !== ScrollBehaviorEnum.KEEP_SCROLL_POSITION) {
                this.handleScrollBehavior(scrollBehavior, this.snapshot);
            }
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
                const message = messageWrapper.props.children[1];
                const { chatId, messageId } = message.props;
                const key = `${chatId}_${messageId}`;
                messages.set(key, key);
            }
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMessagesInView',
            messages: messages
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
        this.completed = false;
        this.loadMigratedHistory = false;
        this.defferedActions = [];

        if (chat) {
            TdLibController.send({
                '@type': 'openChat',
                chat_id: chat.id
            });

            const unread = !messageId && chat.unread_count > 0;
            const fromMessageId =
                unread && chat.unread_count > 1 ? chat.last_read_inbox_message_id : messageId ? messageId : 0;
            const offset = (unread && chat.unread_count > 1) || messageId ? -1 - MESSAGE_SLICE_LIMIT : 0;
            const limit =
                (unread && chat.unread_count > 1) || messageId ? 2 * MESSAGE_SLICE_LIMIT : MESSAGE_SLICE_LIMIT;

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

            if (chat.last_message) {
                this.completed = result.messages.length > 0 && chat.last_message.id === result.messages[0].id;
            } else {
                this.completed = true;
            }

            MessageStore.setItems(result.messages);
            result.messages.reverse();

            let separatorMessageId = Number.MAX_VALUE;
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

            let scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
            if (messageId) {
                scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_MESSAGE;
            } else if (unread && separatorMessageId) {
                scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_UNREAD;
            }

            this.replace(separatorMessageId, result.messages, () => {
                this.handleScrollBehavior(scrollBehavior, this.snapshot);
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

            // load full info
            getChatFullInfo(chat.id);
        } else {
            this.loading = true;
            this.replace(0, [], () => {
                this.loading = false;
            });
        }

        if (previousChat && previousChatId !== chatId) {
            TdLibController.send({
                '@type': 'closeChat',
                chat_id: previousChatId
            });
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

        this.loading = true;
        const sessionId = this.sessionId;
        let result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chatId,
            from_message_id: fromMessageId,
            offset: 0,
            limit: MESSAGE_SLICE_LIMIT
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
        this.insertNext(filterMessages(result.messages), () => {
            if (!result.messages.length) {
                this.onLoadMigratedHistory();
            }
        });

        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        this.viewMessages(result.messages);

        return result;
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
            limit: MESSAGE_SLICE_LIMIT
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
        this.insertNext(filterMessages(result.messages));

        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        this.viewMessages(result.messages);
    };

    onLoadPrevious = async () => {
        const { chatId } = this.props;
        const { history } = this.state;

        const chat = ChatStore.get(chatId);

        if (!chat) return;
        if (this.loading) return;
        if (this.completed) return;

        const fromMessageId = history && history.length > 0 ? history[history.length - 1].id : 0;

        this.loading = true;
        const sessionId = this.sessionId;
        let result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chatId,
            from_message_id: fromMessageId,
            offset: -MESSAGE_SLICE_LIMIT - 1,
            limit: MESSAGE_SLICE_LIMIT + 1
        }).finally(() => {
            this.loading = false;
        });

        if (sessionId !== this.sessionId) {
            return;
        }

        if (this.props.chatId !== chatId) {
            return;
        }

        if (chat.last_message) {
            this.completed = result.messages.length > 0 && chat.last_message.id === result.messages[0].id;
        } else {
            this.completed = true;
        }

        filterDuplicateMessages(result, this.state.history);

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.scrollBehaviorNone = true;
        this.insertPrevious(filterMessages(result.messages), {}, () => {
            this.scrollBehaviorNone = false;
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
            if (callback) callback();
            return;
        }

        this.setState({ history: history.concat(this.state.history) }, callback);
    }

    insertPrevious(history, newState, callback) {
        if (history.length === 0) {
            if (callback) callback();
            return;
        }

        this.setState({ history: this.state.history.concat(history), ...newState }, callback);
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
        // console.log('MessagesList.handleScroll');
        const { scrollDownVisible, replyHistory, history } = this.state;
        const list = this.listRef.current;

        this.updateItemsInView();

        if (list.scrollTop <= 0) {
            this.onLoadNext();
        } else if (list.scrollTop + list.offsetHeight === list.scrollHeight) {
            this.onLoadPrevious();
        }

        if (list.scrollTop + list.offsetHeight === list.scrollHeight) {
            if (this.completed && scrollDownVisible) {
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

    handleScrollBehavior = (scrollBehavior, snapshot) => {
        const { chatId, messageId } = this.props;
        const { scrollTop, scrollHeight, offsetHeight } = snapshot || {
            scrollTop: 0,
            scrollHeight: 0,
            offsetHeight: 0
        };

        // console.log(
        //     `MessagesList.handleScrollBehavior
        //     chatId=${chatId} messageId=${messageId}
        //     scrollBehavior=${scrollBehavior}
        //     snapshot.scrollTop=${scrollTop}
        //     snapshot.scrollHeight=${scrollHeight}
        //     snapshot.offsetHeight=${offsetHeight}`
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
            case ScrollBehaviorEnum.KEEP_SCROLL_POSITION: {
                this.keepScrollPosition(snapshot);
                break;
            }
        }
    };

    keepScrollPosition = snapshot => {
        const { chatId, messageId } = this.props;
        const { scrollTop, scrollHeight, offsetHeight } = snapshot;
        const list = this.listRef.current;

        // console.log(
        //     `MessagesList.keepScrollPosition before
        //     chatId=${chatId} messageId=${messageId}
        //     list.scrollTop=${list.scrollTop}
        //     list.offsetHeight=${list.offsetHeight}
        //     list.scrollHeight=${list.scrollHeight}`
        // );

        list.scrollTop = scrollTop + (list.scrollHeight - scrollHeight);

        // console.log(
        //     `MessagesList.keepScrollPosition after
        //     chatId=${chatId} messageId=${messageId}
        //     list.scrollTop=${list.scrollTop}
        //     list.offsetHeight=${list.offsetHeight}
        //     list.scrollHeight=${list.scrollHeight}`
        // );
    };

    scrollToUnread = () => {
        const { chatId, messageId } = this.props;
        const { history } = this.state;
        const list = this.listRef.current;

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
                    list.scrollTop = item.offsetTop; // + unread messages margin-top
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

    scrollToMessage = () => {
        const { chatId, messageId } = this.props;
        const { history } = this.state;
        const list = this.listRef.current;

        // console.log(
        //     `MessagesList.scrollToMessage before
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
                if (itemComponent.props.messageId === messageId) {
                    list.scrollTop = item.offsetTop - list.offsetHeight / 2.0;
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

        if (!scrolled) {
            this.scrollToBottom();
        }
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
        this.completed = false;

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

        if (chat.last_message) {
            this.completed = result.messages.length > 0 && chat.last_message.id === result.messages[0].id;
        } else {
            this.completed = true;
        }
        // console.log('MessagesList.scrollToStart scrollDown', false);
        this.setState({ scrollDownVisible: false, replyHistory: [] });

        MessageStore.setItems(result.messages);
        result.messages.reverse();

        let separatorMessageId = 0;
        this.replace(separatorMessageId, result.messages, () => {
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
        if (!canSendFiles(chatId)) return;

        ApplicationStore.setDragging(true);
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

    render() {
        const { classes, chatId } = this.props;
        const { history, separatorMessageId, clearHistory, selectionActive, scrollDownVisible } = this.state;

        // console.log('MessagesList.render scrollDown', this.props.chatId, this.props.messageId, scrollDownVisible, history.length);

        const isChannel = isChannelChat(chatId);

        let prevShowDate = false;
        this.itemsMap.clear();
        this.messages = clearHistory
            ? null
            : history.map((x, i) => {
                  const prevMessage = i > 0 ? history[i - 1] : null;
                  const date = new Date(x.date * 1000);
                  const prevDate = prevMessage ? new Date(prevMessage.date * 1000) : date;
                  let showDate = false;
                  if (
                      i === 0 ||
                      date.getFullYear() !== prevDate.getFullYear() ||
                      date.getMonth() !== prevDate.getMonth() ||
                      date.getDate() !== prevDate.getDate()
                  ) {
                      showDate = true;
                  }

                  let m = null;
                  if (isServiceMessage(x)) {
                      m = (
                          <ServiceMessage
                              key={`chat_id=${x.chat_id} message_id=${x.id}`}
                              ref={el => this.itemsMap.set(i, el)}
                              chatId={x.chat_id}
                              messageId={x.id}
                              showUnreadSeparator={separatorMessageId === x.id}
                          />
                      );
                  } else {
                      const showTitle =
                          prevShowDate ||
                          isChannel ||
                          i === 0 ||
                          (prevMessage &&
                              (isServiceMessage(prevMessage) ||
                                  x.sender_user_id !== prevMessage.sender_user_id ||
                                  x.date - prevMessage.date > MESSAGE_SPLIT_MAX_TIME_S));

                      m = (
                          <Message
                              key={`chat_id=${x.chat_id} message_id=${x.id}`}
                              ref={el => this.itemsMap.set(i, el)}
                              chatId={x.chat_id}
                              messageId={x.id}
                              sendingState={x.sending_state}
                              showTitle={showTitle}
                              showUnreadSeparator={separatorMessageId === x.id}
                          />
                      );
                  }

                  // return m;

                  return (
                      <div key={`chat_id=${x.chat_id} message_id=${x.id}`}>
                          {showDate && <DayMeta date={x.date} />}
                          {m}
                      </div>
                  );
              });

        return (
            <div
                className={classNames(classes.background, 'messages-list', {
                    'messages-list-selection-active': selectionActive
                })}
                onDragEnter={this.handleListDragEnter}>
                <div ref={this.listRef} className='messages-list-wrapper' onScroll={this.handleScroll}>
                    <div className='messages-list-top' />
                    <div ref={this.itemsRef} className='messages-list-items'>
                        {this.messages}
                    </div>
                </div>
                <Placeholder />
                {scrollDownVisible && <ScrollDownButton onClick={this.handleScrollDownClick} />}
                <PinnedMessage chatId={chatId} />
                <FilesDropTarget />
                <StickersHint />
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(MessagesList);
