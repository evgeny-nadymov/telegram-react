/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import * as ReactDOM from 'react-dom';
import withStyles from '@material-ui/core/styles/withStyles';
import classNames from 'classnames';
import FilesDropTarget from './FilesDropTarget';
import Message from '../Message/Message';
import PinnedMessage from './PinnedMessage';
import ServiceMessage from '../Message/ServiceMessage';
import StickersHint from './StickersHint';
import { debounce, throttle, getPhotoSize, itemsInView } from '../../Utils/Common';
import { loadChatsContent, loadDraftContent, loadMessageContents } from '../../Utils/File';
import { filterMessages } from '../../Utils/Message';
import { isServiceMessage } from '../../Utils/ServiceMessage';
import { canSendFiles, getChatFullInfo, getSupergroupId, isSupergroup } from '../../Utils/Chat';
import { highlightMessage } from '../../Actions/Client';
import { MESSAGE_SLICE_LIMIT } from '../../Constants';
import ChatStore from '../../Stores/ChatStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import MessageStore from '../../Stores/MessageStore';
import FileStore from '../../Stores/FileStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import './MessagesList.css';

const ScrollBehaviorEnum = Object.freeze({
    NONE: 'NONE',
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

        console.log(`MessagesList.ctor chat_id=${props.chatId} message_id=${props.messageId}`);

        this.sessionId = Date.now();
        this.state = {
            prevChatId: 0,
            prevMessageId: null,
            playerOpened: false,
            history: [],
            clearHistory: false,
            selectionActive: false,
            scrollBehavior: ScrollBehaviorEnum.NONE,
            separatorMessageId: 0
        };

        this.listRef = React.createRef();
        this.itemsRef = React.createRef();

        this.itemsMap = new Map();

        this.updateItemsInView = throttle(this.updateItemsInView, 500);
        //debounce(this.updateItemsInView, 250);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId || props.messageId !== state.prevMessageId) {
            return {
                prevChatId: props.chatId,
                prevMessageId: props.messageId,
                clearHistory: false,
                selectionActive: false,
                scrollBehavior: ScrollBehaviorEnum.SCROLL_TO_BOTTOM,
                separatorMessageId: 0
            };
        }

        return null;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { chatId } = this.props;

        const list = this.listRef.current;
        const snapshot = {
            scrollTop: list.scrollTop,
            scrollHeight: list.scrollHeight,
            offsetHeight: list.offsetHeight
        };

        console.log(
            `SCROLL GETSNAPSHOTBEFOREUPDATE \\
            list.scrollTop=${list.scrollTop} \\
            list.scrollHeight=${list.scrollHeight} \\
            list.offsetHeight=${list.offsetHeight} \\
            chatId=${chatId}`
        );

        return snapshot;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId, messageId } = this.props;

        const list = this.listRef.current;
        console.log(
            `MessagesList.componentDidUpdate chat_id=${chatId} message_id=${messageId} \\
            prev_chat_id=${prevProps.chatId} prev_message_id=${prevProps.messageId} \\
            list.scrollTop=${list.scrollTop} \\
            list.scrollHeight=${list.scrollHeight} \\
            list.offsetHeight=${list.offsetHeight}`
        );

        if (prevProps.chatId !== chatId || prevProps.messageId !== messageId) {
            this.handleSelectChat(chatId, prevProps.chatId, messageId, prevProps.messageId);
        } else {
            this.handleScrollBehavior(snapshot);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId, theme } = this.props;
        const { playerOpened, history, dragging, clearHistory, selectionActive } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.messageId !== messageId) {
            return true;
        }

        if (nextState.playerOpened !== playerOpened) {
            return true;
        }

        if (nextState.history !== history) {
            return true;
        }

        if (nextState.dragging !== dragging) {
            return true;
        }

        if (nextState.clearHistory !== clearHistory) {
            return true;
        }

        if (nextState.selectionActive !== selectionActive) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        const { chatId } = this.props;
        this.handleSelectChat(chatId, 0);

        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageSendSucceeded', this.onUpdateMessageSendSucceeded);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateSelection);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateSelection);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatLastMessage);
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory);

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
        ChatStore.removeListener('updateChatLastMessage', this.onUpdateChatLastMessage);
        ChatStore.removeListener('clientUpdateClearHistory', this.onClientUpdateClearHistory);

        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaEnding', this.onClientUpdateMediaEnding);
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

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
            selectionActive: MessageStore.selectedItems.size > 0,
            scrollBehavior: ScrollBehaviorEnum.KEEP_SCROLL_POSITION
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
        const { message, old_message_id } = update;
        const { chatId } = this.props;
        if (chatId !== message.chat_id) return;

        let handleSendSucceeded = false;
        const { content } = message;
        switch (content['@type']) {
            case 'messagePoll': {
                handleSendSucceeded = true;
                break;
            }
        }

        if (!handleSendSucceeded) return;

        let scrollBehavior = ScrollBehaviorEnum.NONE;
        const list = this.listRef.current;
        // at the end of list
        if (list.scrollTop === list.scrollHeight - list.offsetHeight) {
            scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
        }
        // sent message
        else if (message.is_outgoing) {
            scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
        }

        console.log('SCROLL MessagesList.onUpdateMessageSendSucceeded scrollBehavior=' + scrollBehavior);
        this.replaceMessage(old_message_id, message, scrollBehavior);
        const store = FileStore.getStore();
        loadMessageContents(store, [message]);
        MessagesList.viewMessages([message]);
    };

    onUpdateNewMessage = update => {
        if (!this.completed) return;

        const { message } = update;
        const { chatId } = this.props;
        if (chatId !== message.chat_id) return;

        let scrollBehavior = ScrollBehaviorEnum.NONE;
        const list = this.listRef.current;
        // at the end of list
        if (list.scrollTop === list.scrollHeight - list.offsetHeight) {
            scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
        }
        // sent message
        else if (message.is_outgoing) {
            scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
        }

        const history = [message];

        console.log('SCROLL MessagesList.onUpdateNewMessage scrollBehavior=' + scrollBehavior);
        this.insertAfter(this.filterMessages(history), scrollBehavior);
        const store = FileStore.getStore();
        loadMessageContents(store, history);
        MessagesList.viewMessages(history);
    };

    onUpdateDeleteMessages = update => {
        const { chatId } = this.props;
        if (chatId !== update.chat_id) return;

        if (!update.is_permanent) return;

        this.deleteHistory(update.message_ids);
    };

    updateItemsInView = () => {
        if (!this.messages) return;

        const messages = new Map();
        const items = itemsInView(this.listRef, this.itemsRef);
        for (let i = 0; i < items.length; i++) {
            const message = this.messages[items[i]];
            if (message) {
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

        this.sessionId = Date.now();
        this.loading = false;
        this.completed = false;
        this.loadMigratedHistory = false;

        this.suppressHandleScrollOnSelectChat = true;
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

            const sessionId = this.sessionId;
            const result = await TdLibController.send({
                '@type': 'getChatHistory',
                chat_id: chat.id,
                from_message_id: fromMessageId,
                offset: offset,
                limit: limit
            });

            if (sessionId !== this.sessionId) {
                return;
            }

            //TODO: replace result with one-way data flow

            if (chat.last_message) {
                this.completed = result.messages.length > 0 && chat.last_message.id === result.messages[0].id;
            } else {
                this.completed = true;
            }

            MessageStore.setItems(result.messages);
            result.messages.reverse();

            // calculate separator
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
            console.log('[MessagesList] separator_message_id=' + separatorMessageId);

            let scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_BOTTOM;
            if (messageId) {
                scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_MESSAGE;
            } else if (unread && separatorMessageId) {
                scrollBehavior = ScrollBehaviorEnum.SCROLL_TO_UNREAD;
            }

            this.replace(separatorMessageId, result.messages, scrollBehavior, () => {
                this.suppressHandleScrollOnSelectChat = false;
                if (messageId) {
                    highlightMessage(chatId, messageId);
                }
            });

            // load files
            const store = FileStore.getStore();
            loadMessageContents(store, result.messages);
            loadChatsContent(store, [chatId]);
            loadDraftContent(store, chatId);

            MessagesList.viewMessages(result.messages);

            this.loadIncompleteHistory(result);

            // load full info
            getChatFullInfo(chat.id);
        } else {
            this.replace(
                0,
                [],
                ScrollBehaviorEnum.SCROLL_TO_BOTTOM,
                () => (this.suppressHandleScrollOnSelectChat = false)
            );
        }

        if (previousChat) {
            TdLibController.send({
                '@type': 'closeChat',
                chat_id: previousChat.id
            });
        }
    }

    static viewMessages(messages) {
        if (!messages) return;
        if (messages.length === 0) return;
        if (!messages[0].chat_id) return;

        TdLibController.send({
            '@type': 'viewMessages',
            chat_id: messages[0].chat_id,
            message_ids: messages.map(x => x.id)
        });
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

        if (!chatId) return;
        if (this.loading) return;

        if (this.loadMigratedHistory) {
            this.onLoadMigratedHistory();
            return;
        }

        let fromMessageId = 0;
        if (this.state.history && this.state.history.length > 0) {
            fromMessageId = this.state.history[0].id;
        }

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
        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.insertBefore(this.filterMessages(result.messages), () => {
            if (!result.messages.length) {
                this.onLoadMigratedHistory();
            }
        });
        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        MessagesList.viewMessages(result.messages);

        return result;
    };

    filterMessages = messages => {
        return messages.filter(x => x.content['@type'] !== 'messageChatUpgradeTo');
    };

    onLoadMigratedHistory = async () => {
        const { chatId } = this.props;

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

        let fromMessageId = 0;
        if (
            this.state.history &&
            this.state.history.length > 0 &&
            this.state.history[0].chat_id === basicGroupChat.id
        ) {
            fromMessageId = this.state.history[0].id;
        }

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
        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        this.insertBefore(this.filterMessages(result.messages));
        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        MessagesList.viewMessages(result.messages);
    };

    onLoadPrevious = async () => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);

        if (!chat) return;
        if (this.loading) return;
        if (this.completed) return;

        let fromMessageId = 0;
        if (this.state.history && this.state.history.length > 0) {
            fromMessageId = this.state.history[this.state.history.length - 1].id;
        }

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

        filterMessages(result, this.state.history);

        //TODO: replace result with one-way data flow

        MessageStore.setItems(result.messages);
        result.messages.reverse();
        console.log('SCROLL MessagesList.onLoadPrevious scrollBehavior=NONE');
        this.insertAfter(this.filterMessages(result.messages), ScrollBehaviorEnum.NONE);
        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        MessagesList.viewMessages(result.messages);

        return result;
    };

    replace(separatorMessageId, history, scrollBehavior, callback) {
        this.setState(
            { separatorMessageId: separatorMessageId, history: history, scrollBehavior: scrollBehavior },
            callback
        );
    }

    insertBefore(history, callback) {
        if (history.length === 0) {
            if (callback) callback();
            return;
        }

        this.setState(
            { history: history.concat(this.state.history), scrollBehavior: ScrollBehaviorEnum.KEEP_SCROLL_POSITION },
            callback
        );
    }

    replaceMessage(oldMessageId, message, scrollBehavior, callback) {
        if (!message) return;

        this.setState(
            {
                history: this.state.history.filter(x => x.id !== oldMessageId).concat([message]),
                scrollBehavior: scrollBehavior
            },
            callback
        );
    }

    insertAfter(history, scrollBehavior, callback) {
        if (history.length === 0) return;

        this.setState({ history: this.state.history.concat(history), scrollBehavior: scrollBehavior }, callback);
    }

    deleteHistory(message_ids, callback) {
        const { history } = this.state;
        if (history.length === 0) return;

        let map = new Map(message_ids.map(x => [x, x]));

        this.setState(
            { history: history.filter(x => !map.has(x.id)), scrollBehavior: ScrollBehaviorEnum.SCROLL_TO_BOTTOM },
            callback
        );
    }

    handleScroll = () => {
        this.updateItemsInView();

        const list = this.listRef.current;
        //console.log(`SCROLL HANDLESCROLL list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight} chatId=${this.props.chatId}`);

        if (this.suppressHandleScroll) {
            console.log('SCROLL HANDLESCROLL suppressHandleScroll');
            this.suppressHandleScroll = false;
            return;
        }

        if (this.suppressHandleScrollOnSelectChat) {
            console.log('SCROLL HANDLESCROLL suppressHandleScrollOnSelectChat');
            return;
        }

        if (list.scrollTop <= 0) {
            console.log('SCROLL HANDLESCROLL onLoadNext');
            this.onLoadNext();
        } else if (list.scrollTop + list.offsetHeight === list.scrollHeight) {
            console.log('SCROLL HANDLESCROLL onLoadPrevious');
            this.onLoadPrevious();
        } else {
            //console.log('SCROLL HANDLESCROLL updateItemsInView');
        }
    };

    handleScrollBehavior = snapshot => {
        const { chatId, messageId } = this.props;
        const { scrollBehavior, history } = this.state;
        const { scrollTop, scrollHeight, offsetHeight } = snapshot;

        console.log(
            `SCROLL HANDLESCROLLBEHAVIOR \\
            scrollBehavior=${scrollBehavior} \\
            previousScrollTop=${scrollTop} \\
            previousScrollHeight=${scrollHeight} \\
            previousOffsetHeight=${offsetHeight} \\
            chatId=${chatId}`
        );
        if (scrollBehavior === ScrollBehaviorEnum.NONE) {
        } else if (scrollBehavior === ScrollBehaviorEnum.SCROLL_TO_BOTTOM) {
            this.scrollToBottom();
        } else if (scrollBehavior === ScrollBehaviorEnum.SCROLL_TO_MESSAGE) {
            this.scrollToMessage();
        } else if (scrollBehavior === ScrollBehaviorEnum.SCROLL_TO_UNREAD) {
            const list = this.listRef.current;
            console.log(
                `SCROLL SCROLL_TO_UNREAD before \\
                list.scrollTop=${list.scrollTop} \\
                list.offsetHeight=${list.offsetHeight} \\
                list.scrollHeight=${list.scrollHeight} \\
                chatId=${chatId}`
            );

            let scrolled = false;
            for (let i = 0; i < history.length; i++) {
                let itemComponent = this.itemsMap.get(i);
                let item = ReactDOM.findDOMNode(itemComponent);
                if (item) {
                    // console.log(`SCROLL SCROLL_TO_UNREAD item item.scrollTop=${item.scrollTop} showUnreadSeparator=${itemComponent.props.showUnreadSeparator} item.offsetHeight=${item.offsetHeight} item.scrollHeight=${item.scrollHeight}`);
                    if (itemComponent.props.showUnreadSeparator) {
                        list.scrollTop = item.offsetTop; // + unread messages margin-top
                        scrolled = true;
                        break;
                    }
                }
            }

            if (!scrolled) {
                this.scrollToBottom();
            }

            console.log(
                `SCROLL SCROLL_TO_UNREAD after \\
                list.scrollTop=${list.scrollTop} \\
                list.offsetHeight=${list.offsetHeight} \\
                list.scrollHeight=${list.scrollHeight} \\
                chatId=${chatId}`
            );
        } else if (scrollBehavior === ScrollBehaviorEnum.KEEP_SCROLL_POSITION) {
            const list = this.listRef.current;
            console.log(
                `SCROLL KEEP_SCROLL_POSITION before \\
                list.scrollTop=${list.scrollTop} \\
                list.offsetHeight=${list.offsetHeight} \\
                list.scrollHeight=${list.scrollHeight} \\
                chatId=${chatId}`
            );
            list.scrollTop = scrollTop + (list.scrollHeight - scrollHeight);
            console.log(
                `SCROLL KEEP_SCROLL_POSITION after \\
                list.scrollTop=${list.scrollTop} \\
                list.offsetHeight=${list.offsetHeight} \\
                list.scrollHeight=${list.scrollHeight} \\
                chatId=${chatId}`
            );
        }
    };

    scrollToMessage = () => {
        const { chatId, messageId } = this.props;
        const { history } = this.state;

        const list = this.listRef.current;
        console.log(
            `SCROLL SCROLL_TO_MESSAGE message_id=${messageId} before \\
            list.scrollTop=${list.scrollTop} \\
            list.offsetHeight=${list.offsetHeight} \\
            list.scrollHeight=${list.scrollHeight} \\
            chatId=${chatId}`
        );

        let scrolled = false;
        for (let i = 0; i < history.length; i++) {
            let itemComponent = this.itemsMap.get(i);
            let item = ReactDOM.findDOMNode(itemComponent);
            if (item) {
                // console.log(`SCROLL SCROLL_TO_MESSAGE message_id=${messageId} item item.scrollTop=${item.scrollTop} showUnreadSeparator=${itemComponent.props.showUnreadSeparator} item.offsetHeight=${item.offsetHeight} item.scrollHeight=${item.scrollHeight}`);
                if (itemComponent.props.messageId === messageId) {
                    list.scrollTop = item.offsetTop - list.offsetHeight / 2.0;
                    scrolled = true;
                    break;
                }
            }
        }

        if (!scrolled) {
            this.scrollToBottom();
        }

        console.log(
            `SCROLL SCROLL_TO_MESSAGE message_id=${messageId} after \\
            list.scrollTop=${list.scrollTop} \\
            list.offsetHeight=${list.offsetHeight} \\
            list.scrollHeight=${list.scrollHeight} \\
            chatId=${chatId}`
        );
    };

    scrollToBottom = () => {
        this.suppressHandleScroll = true;
        const list = this.listRef.current;
        console.log(
            `SCROLL SCROLL_TO_BOTTOM before \\
            list.scrollHeight=${list.scrollHeight} \\
            list.offsetHeight=${list.offsetHeight} \\
            list.scrollTop=${list.scrollTop} \\
            chatId=${this.props.chatId}`
        );

        const nextScrollTop = list.scrollHeight - list.offsetHeight;
        if (nextScrollTop !== list.scrollTop) {
            list.scrollTop = list.scrollHeight - list.offsetHeight;
            console.log(
                `SCROLL SCROLL_TO_BOTTOM after \\
                list.scrollTop=${list.scrollTop} \\
                list.offsetHeight=${list.offsetHeight} \\
                list.scrollHeight=${list.scrollHeight} \\
                suppressHandleScroll=${this.suppressHandleScroll} \\
                chatId=${this.props.chatId}`
            );
        } else {
            console.log(
                `SCROLL SCROLL_TO_BOTTOM after(already bottom) \\
                list.scrollTop=${list.scrollTop} \\
                list.offsetHeight=${list.offsetHeight} \\
                list.scrollHeight=${list.scrollHeight} \\
                suppressHandleScroll=${this.suppressHandleScroll} \\
                chatId=${this.props.chatId}`
            );
        }
    };

    scrollToStart = async () => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        this.sessionId = Date.now();
        this.loading = false;
        this.completed = false;

        const fromMessageId = 0;
        const offset = 0;
        const limit = MESSAGE_SLICE_LIMIT;

        const sessionId = this.sessionId;
        const result = await TdLibController.send({
            '@type': 'getChatHistory',
            chat_id: chat.id,
            from_message_id: fromMessageId,
            offset: offset,
            limit: limit
        });

        if (sessionId !== this.sessionId) {
            return;
        }

        //TODO: replace result with one-way data flow

        if (this.props.chatId !== chatId) {
            return;
        }

        if (chat.last_message) {
            this.completed = result.messages.length > 0 && chat.last_message.id === result.messages[0].id;
        } else {
            this.completed = true;
        }

        MessageStore.setItems(result.messages);
        result.messages.reverse();

        // calculate separator
        let separatorMessageId = 0;
        console.log('[MessagesList] separator_message_id=' + separatorMessageId);

        this.replace(separatorMessageId, result.messages, ScrollBehaviorEnum.SCROLL_TO_BOTTOM);

        // load files
        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);
        loadChatsContent(store, [chatId]);

        MessagesList.viewMessages(result.messages);

        this.loadIncompleteHistory(result);
    };

    handleListDragEnter = event => {
        event.preventDefault();
        event.stopPropagation();

        const { chatId } = this.props;
        if (!canSendFiles(chatId)) return;

        ApplicationStore.setDragging(true);
    };

    render() {
        const { classes, chatId } = this.props;
        const { history, separatorMessageId, clearHistory, selectionActive } = this.state;

        console.log(`MessagesList.render clearHistory=${clearHistory}`, history);

        this.itemsMap.clear();
        this.messages = clearHistory
            ? null
            : history.map((x, i) =>
                  isServiceMessage(x) ? (
                      <ServiceMessage
                          key={`chat_id=${x.chat_id} message_id=${x.id}`}
                          ref={el => this.itemsMap.set(i, el)}
                          chatId={x.chat_id}
                          messageId={x.id}
                          showUnreadSeparator={separatorMessageId === x.id}
                      />
                  ) : (
                      <Message
                          key={`chat_id=${x.chat_id} message_id=${x.id}`}
                          ref={el => this.itemsMap.set(i, el)}
                          chatId={x.chat_id}
                          messageId={x.id}
                          showTitle
                          sendingState={x.sending_state}
                          showUnreadSeparator={separatorMessageId === x.id}
                      />
                  )
              );

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
                <PinnedMessage chatId={chatId} />
                <FilesDropTarget />
                <StickersHint />
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(MessagesList);
