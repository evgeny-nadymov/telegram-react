/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import withStyles from '@material-ui/core/styles/withStyles';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import ChatControl from '../../Tile/ChatControl';
import TopChat from '../../Tile/TopChat';
import RecentlyFoundChat from '../../Tile/RecentlyFoundChat';
import FoundPublicChat from '../../Tile/FoundPublicChat';
import FoundMessage from '../../Tile/FoundMessage';
import SearchCaption from './SearchCaption';
import { loadChatsContent, loadUsersContent } from '../../../Utils/File';
import { filterMessages } from '../../../Utils/Message';
import { getCyrillicInput, getLatinInput } from '../../../Utils/Language';
import { orderCompare, equal } from '../../../Utils/Common';
import { USERNAME_LENGTH_MIN } from '../../../Constants';
import MessageStore from '../../../Stores/MessageStore';
import FileStore from '../../../Stores/FileStore';
import ChatStore from '../../../Stores/ChatStore';
import UserStore from '../../../Stores/UserStore';
import ApplicationStore from '../../../Stores/ApplicationStore';
import TdLibController from '../../../Controllers/TdLibController';
import './Search.css';

const styles = theme => ({
    closeSearchIconButton: {
        margin: '8px 12px 8px 0'
    },
    listItem: {
        padding: '0px'
    },
    search: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF'
    }
});

class Search extends React.Component {
    constructor(props) {
        super(props);

        this.listRef = React.createRef();

        const { chatId, text } = this.props;

        this.state = {
            prevPropsChatId: chatId,
            prevPropsText: text,

            top: null,
            recentlyFound: null,
            local: null,
            global: null,
            messages: null
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevPropsChatId || props.text !== state.prevPropsText) {
            return {
                prevPropsChatId: props.chatId,
                prevPropsText: props.text,

                top: null,
                recentlyFound: null,
                local: null,
                global: null,
                messages: null
            };
        }

        return null;
    }

    componentDidMount() {
        this.loadContent();

        ApplicationStore.on('clientUpdateSearchText', this.onClientUpdateSearchText);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateSearchText', this.onClientUpdateSearchText);
    }

    onClientUpdateSearchText = update => {
        const { text } = update;

        const trimmedText = text.trim();

        if (!trimmedText) {
            this.loadContent();
        } else {
            this.searchText(trimmedText);
        }
    };

    concatSearchResults = results => {
        const arr = [];
        const map = new Map();

        for (let i = 0; i < results.length; i++) {
            let result = results[i].chat_ids;
            if (result) {
                for (let j = 0; j < result.length; j++) {
                    if (!map.has(result[j])) {
                        map.set(result[j], result[j]);
                        arr.push(result[j]);
                    }
                }
            }
        }

        arr.sort((a, b) => {
            return orderCompare(ChatStore.get(b).order, ChatStore.get(a).order);
        });

        return arr;
    };

    searchText = async text => {
        this.sessionId = new Date();
        this.text = text;
        const sessionId = this.sessionId;
        let store = null;

        const { chatId } = this.props;
        const { savedMessages } = this.state;

        if (!chatId) {
            const promises = [];
            const localPromise = TdLibController.send({
                '@type': 'searchChats',
                query: text,
                limit: 100
            });
            promises.push(localPromise);

            const latinText = getLatinInput(text);
            if (latinText) {
                const latinLocalPromise = TdLibController.send({
                    '@type': 'searchChats',
                    query: latinText,
                    limit: 100
                });
                promises.push(latinLocalPromise);
            }

            const cyrillicText = getCyrillicInput(text);
            if (cyrillicText) {
                const cyrillicLocalPromise = TdLibController.send({
                    '@type': 'searchChats',
                    query: cyrillicText,
                    limit: 100
                });
                promises.push(cyrillicLocalPromise);
            }

            const results = await Promise.all(promises.map(x => x.catch(e => null)));
            const local = this.concatSearchResults(results);

            if (sessionId !== this.sessionId) {
                return;
            }

            if (savedMessages) {
                const { t } = this.props;

                const searchText = text.toUpperCase();
                const savedMessagesStrings = ['SAVED MESSAGES', t('SavedMessages').toUpperCase()];

                if (
                    savedMessagesStrings.some(el => el.includes(searchText)) ||
                    (latinText && savedMessagesStrings.some(el => el.includes(latinText.toUpperCase())))
                ) {
                    local.splice(0, 0, savedMessages.id);
                }
            }

            store = FileStore.getStore();
            loadChatsContent(store, local);

            if (text.length >= USERNAME_LENGTH_MIN) {
                const globalPromises = [];

                const globalPromise = TdLibController.send({
                    '@type': 'searchPublicChats',
                    query: text
                });
                globalPromises.push(globalPromise);

                if (latinText) {
                    const globalLatinPromise = TdLibController.send({
                        '@type': 'searchPublicChats',
                        query: latinText
                    });
                    globalPromises.push(globalLatinPromise);
                }

                const globalResults = await Promise.all(globalPromises.map(x => x.catch(e => null)));
                const global = this.concatSearchResults(globalResults);

                if (sessionId !== this.sessionId) {
                    return;
                }

                this.setState({
                    global: global
                });

                store = FileStore.getStore();
                loadChatsContent(store, global);
            }
        }

        let messages = [];
        if (chatId) {
            messages = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: text,
                sender_user_id: 0,
                from_message_id: 0,
                offset: 0,
                limit: 50,
                filter: null
            });
        } else {
            messages = await TdLibController.send({
                '@type': 'searchMessages',
                query: text,
                offset_date: 0,
                offset_chat_id: 0,
                offset_message_id: 0,
                limit: 50
            });
        }

        MessageStore.setItems(messages.messages);

        if (sessionId !== this.sessionId) {
            return;
        }

        this.setState({
            messages: messages
        });

        const chats = new Map();
        const users = new Map();
        for (let i = 0; i < messages.messages.length; i++) {
            chats.set(messages.messages[i].chat_id, messages.messages[i].chat_id);
            if (messages.messages[i].sender_user_id) {
                users.set(messages.messages[i].sender_user_id, messages.messages[i].sender_user_id);
            }
        }

        store = FileStore.getStore();
        loadChatsContent(store, [...chats.keys()]);
        loadUsersContent(store, [...users.keys()]);
    };

    loadContent = async () => {
        const { chatId } = this.props;
        if (chatId) {
            this.setState({
                top: null,
                recentlyFound: null,
                local: null,
                global: null,
                messages: null
            });

            return;
        }

        const topPromise = TdLibController.send({
            '@type': 'getTopChats',
            category: { '@type': 'topChatCategoryUsers' },
            limit: 30
        }).catch(() => {
            return { '@type': 'chats', chat_ids: [] };
        });

        const recentlyFoundPromise = TdLibController.send({
            '@type': 'searchChats',
            query: '',
            limit: 100
        }).catch(() => {
            return { '@type': 'chats', chat_ids: [] };
        });

        const savedMessagesPromise = TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: UserStore.getMyId(),
            force: true
        }).catch(error => {});

        const [top, recentlyFound, savedMessages] = await Promise.all([
            topPromise,
            recentlyFoundPromise,
            savedMessagesPromise
        ]);

        this.setState({
            top: top,
            recentlyFound: recentlyFound,
            savedMessages: savedMessages,
            local: null,
            global: null,
            messages: null
        });

        const store = FileStore.getStore();
        loadChatsContent(store, top.chat_ids);
        loadChatsContent(store, recentlyFound.chat_ids);
    };

    handleRecentlyFound = async () => {
        const chats = await TdLibController.send({
            '@type': 'getChats',
            offset_order: '9223372036854775807',
            offset_chat_id: 0,
            limit: 20
        });

        for (let i = chats.chat_ids.length - 1; i >= 0; i--) {
            TdLibController.send({
                '@type': 'addRecentlyFoundChat',
                chat_id: chats.chat_ids[i]
            });
        }
    };

    handleClearRecentlyFound = event => {
        event.stopPropagation();

        TdLibController.send({
            '@type': 'clearRecentlyFoundChats'
        });

        this.setState({ recentlyFound: null });
    };

    handleSelectMessage = (chatId, messageId, addToRecent, keepOpen) => {
        const { onSelectMessage } = this.props;

        if (addToRecent) {
            TdLibController.send({
                '@type': 'addRecentlyFoundChat',
                chat_id: chatId
            });
        }

        onSelectMessage(chatId, messageId, keepOpen);
    };

    handleScroll = () => {
        const list = this.listRef.current;

        if (list.scrollTop + list.offsetHeight === list.scrollHeight) {
            this.onLoadPrevious();
        }
    };

    getOffset = messages => {
        const length = messages ? messages.messages.length : 0;

        const offsetDate = length > 0 ? messages.messages[length - 1].date : 0;
        const offsetChatId = length > 0 ? messages.messages[length - 1].chat_id : 0;
        const offsetMessageId = length > 0 ? messages.messages[length - 1].id : 0;

        return {
            offset_date: offsetDate,
            offset_chat_id: offsetChatId,
            offset_message_id: offsetMessageId
        };
    };

    concatMessages = (messages, result) => {
        if (!result) return messages;
        if (!result.messages.length) return messages;

        if (!messages) return result;
        if (!messages.messages.length) return result;

        return {
            total_count: result.total_count,
            messages: messages.messages.concat(result.messages)
        };
    };

    onLoadPrevious = async () => {
        if (this.loading) return;

        const { chatId } = this.props;

        const sessionId = this.sessionId;

        const { messages } = this.state;

        const offset = this.getOffset(messages);

        this.loading = true;
        let result = [];
        if (chatId) {
            result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: this.text,
                sender_user_id: 0,
                from_message_id: offset.offset_message_id,
                limit: 50,
                filter: null
            });
        } else {
            result = await TdLibController.send({
                '@type': 'searchMessages',
                query: this.text,
                ...offset,
                limit: 50
            });
        }
        this.loading = false;

        filterMessages(result, messages ? messages.messages : []);

        MessageStore.setItems(result.messages);

        if (sessionId !== this.sessionId) {
            return;
        }

        this.setState({
            messages: this.concatMessages(messages, result)
        });

        const chats = new Map();
        const users = new Map();
        for (let i = 0; i < result.messages.length; i++) {
            chats.set(result.messages[i].chat_id, result.messages[i].chat_id);
            if (result.messages[i].sender_user_id) {
                users.set(result.messages[i].sender_user_id, result.messages[i].sender_user_id);
            }
        }

        const store = FileStore.getStore();
        loadChatsContent(store, [...chats.keys()]);
        loadUsersContent(store, [...users.keys()]);
    };

    handleTopChatsScroll = event => {
        event.stopPropagation();
    };

    handleClose = () => {
        const { onClose } = this.props;

        onClose();
    };

    isTheSame = (nextState, field, compareField) => {
        const a1 = this.state[field],
            a2 = nextState[field],
            l1 = a1 && a1.length,
            l2 = a2 && a2.length;

        if (!a1 && !a2) return true;

        if (l1 !== l2) return false;

        return equal(a1[compareField], a2[compareField]);
    };

    shouldComponentUpdate(nextProps, nextState) {
        if (!equal(this.state.local, nextState.local) || !equal(this.state.global, nextState.global)) return true;

        if (
            !this.isTheSame(nextState, 'recentlyFound', 'chat_ids') ||
            !this.isTheSame(nextState, 'top', 'chat_ids') ||
            !this.isTheSame(nextState, 'messages', 'messages')
        )
            return true;

        return false;
    }

    render() {
        const { classes, chatId } = this.props;
        const { top, recentlyFound, local, global, messages } = this.state;

        const chat = ChatStore.get(chatId);

        const topChats =
            top && top.chat_ids
                ? top.chat_ids.map(x => (
                      <TopChat key={x} chatId={x} onSelect={() => this.handleSelectMessage(x, null, false, false)} />
                  ))
                : [];

        const recentlyFoundChats =
            recentlyFound && recentlyFound.chat_ids
                ? recentlyFound.chat_ids.map(x => (
                      <RecentlyFoundChat
                          key={x}
                          chatId={x}
                          onClick={() => this.handleSelectMessage(x, null, true, false)}
                      />
                  ))
                : [];

        const localChats = local
            ? local.map(x => (
                  <RecentlyFoundChat
                      key={x}
                      chatId={x}
                      onClick={() => this.handleSelectMessage(x, null, true, false)}
                  />
              ))
            : [];

        const globalChats = global
            ? global.map(x => (
                  <FoundPublicChat key={x} chatId={x} onClick={() => this.handleSelectMessage(x, null, true, true)} />
              ))
            : [];

        const globalMessages =
            messages && messages.messages
                ? messages.messages.map(x => (
                      <FoundMessage
                          key={`${x.chat_id}_${x.id}`}
                          chatId={x.chat_id}
                          messageId={x.id}
                          chatSearch={Boolean(chatId)}
                          onClick={() => this.handleSelectMessage(x.chat_id, x.id, false, true)}
                      />
                  ))
                : [];

        let messagesCaption = 'No messages found';
        if (messages && messages.total_count) {
            messagesCaption = messages.total_count === 1 ? 'Found 1 message' : `Found ${messages.total_count} messages`;
        }

        return (
            <div ref={this.listRef} className={classNames(classes.search, 'search')} onScroll={this.handleScroll}>
                {chat && (
                    <div className='search-chat'>
                        <SearchCaption caption='Search messages in' />
                        <div className='search-chat-wrapper'>
                            <div className='search-chat-control'>
                                <ChatControl chatId={chatId} showStatus={false} />
                            </div>
                            <IconButton
                                className={classes.closeSearchIconButton}
                                aria-label='Search'
                                onMouseDown={this.handleClose}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </div>
                )}
                {topChats.length > 0 && (
                    <div className='search-top-chats'>
                        <SearchCaption caption='People' />
                        <div className='search-top-chats-list' onScroll={this.handleTopChatsScroll}>
                            <div className='search-top-chats-placeholder' />
                            {topChats}
                            <div className='search-top-chats-placeholder' />
                        </div>
                    </div>
                )}
                {recentlyFoundChats.length > 0 && (
                    <div className='search-recently-found-chats'>
                        <SearchCaption caption='Recent' command='Clear' onClick={this.handleClearRecentlyFound} />
                        {recentlyFoundChats}
                    </div>
                )}
                {localChats.length > 0 && (
                    <div className='search-local-chats'>
                        <SearchCaption caption='Chats and contacts' />
                        {localChats}
                    </div>
                )}
                {globalChats.length > 0 && (
                    <div className='search-global-chats'>
                        <SearchCaption caption='Global search' />
                        {globalChats}
                    </div>
                )}
                {messages && (
                    <div className='search-global-chats'>
                        <SearchCaption caption={messagesCaption} />
                        {globalMessages}
                    </div>
                )}
            </div>
        );
    }
}

Search.propTypes = {
    chatId: PropTypes.number,
    text: PropTypes.string,
    onSelectMessage: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(Search);
