/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import ChatControl from '../../Tile/ChatControl';
import TopChat from '../../Tile/TopChat';
import RecentlyFoundChat from '../../Tile/RecentlyFoundChat';
import FoundPublicChat from '../../Tile/FoundPublicChat';
import FoundMessage from '../../Tile/FoundMessage';
import SearchCaption from './SearchCaption';
import { loadChatsContent, loadUsersContent } from '../../../Utils/File';
import { filterMessages } from '../../../Utils/Message';
import { MIN_USERNAME_LENGTH } from '../../../Constants';
import MessageStore from '../../../Stores/MessageStore';
import FileStore from '../../../Stores/FileStore';
import ChatStore from '../../../Stores/ChatStore';
import ApplicationStore from '../../../Stores/ApplicationStore';
import TdLibController from '../../../Controllers/TdLibController';
import './Search.css';

const styles = {
    closeSearchIconButton: {
        margin: '8px 12px 8px 0'
    },
    listItem: {
        padding: '0px'
    }
};

class Search extends React.Component {

    constructor(props){
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

    static getDerivedStateFromProps(props, state){
        if (props.chatId !== state.prevPropsChatId
            || props.text !== state.prevPropsText){
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

    onClientUpdateSearchText = (update) => {
        const { text } = update;

        const trimmedText = text.trim();

        if (!trimmedText){
            this.loadContent();
        }
        else{
            this.searchText(trimmedText);
        }
    };

    searchText =  async (text) => {
        this.sessionId = new Date();
        this.text = text;
        const sessionId = this.sessionId;
        let store = null;

        const { chatId } = this.props;

        if (!chatId){
            const local = await TdLibController.send({
                '@type': 'searchChats',
                query: text,
                limit: 100
            });

            if (sessionId !== this.sessionId){
                return;
            }

            this.setState({
                top: null,
                recentlyFound: null,
                local: local,
                global: null,
                messages: null
            });

            store = FileStore.getStore();
            loadChatsContent(store, local.chat_ids);

            if (text.length >= MIN_USERNAME_LENGTH){
                const global = await TdLibController.send({
                    '@type': 'searchPublicChats',
                    query: text
                });

                if (sessionId !== this.sessionId){
                    return;
                }

                this.setState({
                    global: global
                });

                store = FileStore.getStore();
                loadChatsContent(store, global.chat_ids);
            }
        }

        let messages = [];
        if (chatId){
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
        }
        else{
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

        if (sessionId !== this.sessionId){
            return;
        }

        this.setState({
            messages: messages
        });

        const chats = new Map();
        const users = new Map();
        for (let i = 0; i < messages.messages.length; i++){
            chats.set(messages.messages[i].chat_id, messages.messages[i].chat_id);
            if (messages.messages[i].sender_user_id){
                users.set(messages.messages[i].sender_user_id, messages.messages[i].sender_user_id);
            }
        }

        store = FileStore.getStore();
        loadChatsContent(store, [...chats.keys()]);
        loadUsersContent(store, [...users.keys()]);
    };

    loadContent = async () => {
        const { chatId } = this.props;
        if (chatId){
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
        });

        const recentlyFoundPromise = TdLibController.send({
            '@type': 'searchChats',
            query: '',
            limit: 100
        });

        const [top, recentlyFound] = await Promise.all([topPromise, recentlyFoundPromise]);

        this.setState({
            top: top,
            recentlyFound: recentlyFound,
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

        for (let i = chats.chat_ids.length - 1; i >= 0 ; i--) {
            TdLibController.send({
                '@type': 'addRecentlyFoundChat',
                chat_id: chats.chat_ids[i],
            });
        }
    };

    handleClearRecentlyFound = (event) => {
        event.stopPropagation();

        TdLibController.send({
            '@type': 'clearRecentlyFoundChats'
        });

        this.setState({ recentlyFound: null });
    };

    handleSelectMessage = (chatId, messageId, addToRecent, keepOpen) => {
        const { onSelectMessage } = this.props;

        if (addToRecent){
            TdLibController.send({
                '@type': 'addRecentlyFoundChat',
                chat_id: chatId
            });
        }

        onSelectMessage(chatId, messageId, keepOpen);
    };

    handleScroll = () => {
        const list = this.listRef.current;

        if (list.scrollTop + list.offsetHeight === list.scrollHeight){
            this.onLoadPrevious();
        }
    };

    getOffset = (messages) => {
        const length = messages? messages.messages.length : 0;

        const offsetDate = length > 0
            ? messages.messages[length - 1].date
            : 0;
        const offsetChatId = length > 0
            ? messages.messages[length - 1].chat_id
            : 0;
        const offsetMessageId = length > 0
            ? messages.messages[length - 1].id
            : 0;

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
        }
    };

    onLoadPrevious = async () => {
        if (this.loading) return;

        const { chatId } = this.props;

        const sessionId = this.sessionId;

        const { messages } = this.state;

        const offset = this.getOffset(messages);

        this.loading = true;
        let result = [];
        if (chatId){
            result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: this.text,
                sender_user_id: 0,
                from_message_id: offset.offset_message_id,
                limit: 50,
                filter: null
            });
        }
        else{
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

        if (sessionId !== this.sessionId){
            return;
        }

        this.setState({
            messages: this.concatMessages(messages, result)
        });

        const chats = new Map();
        const users = new Map();
        for (let i = 0; i < result.messages.length; i++){
            chats.set(result.messages[i].chat_id, result.messages[i].chat_id);
            if (result.messages[i].sender_user_id) {
                users.set(result.messages[i].sender_user_id, result.messages[i].sender_user_id);
            }
        }

        const store = FileStore.getStore();
        loadChatsContent(store, [...chats.keys()]);
        loadUsersContent(store, [...users.keys()]);
    };

    handleTopChatsScroll = (event) => {
        event.stopPropagation();
    };

    handleClose = () => {
        const { onClose } = this.props;

        onClose();
    };

    render() {
        const { classes, chatId } = this.props;
        const { top, recentlyFound, local, global, messages } = this.state;

        const chat = ChatStore.get(chatId);

        const topChats = top && top.chat_ids
            ? top.chat_ids.map(x => (
                <TopChat
                    key={x}
                    chatId={x}
                    onSelect={() => this.handleSelectMessage(x, null, false, false)}/>
            ))
            : [];
        const recentlyFoundChats = recentlyFound && recentlyFound.chat_ids
            ? recentlyFound.chat_ids.map(x => (
                <RecentlyFoundChat
                    key={x}
                    chatId={x}
                    onClick={() => this.handleSelectMessage(x, null, true, false)}/>
            ))
            : [];

        const localChats = local && local.chat_ids
            ? local.chat_ids.map(x => (
                <RecentlyFoundChat
                    key={x}
                    chatId={x}
                    onClick={() => this.handleSelectMessage(x, null, true, false)}/>
            ))
            : [];

        const globalChats = global && global.chat_ids
            ? global.chat_ids.map(x => (
                <FoundPublicChat
                    key={x}
                    chatId={x}
                    onClick={() => this.handleSelectMessage(x, null, true, true)}/>
            ))
            : [];
        const globalMessages = messages && messages.messages
            ? messages.messages.map(x => (
                <FoundMessage
                    key={`${x.chat_id}_${x.id}`}
                    chatId={x.chat_id}
                    messageId={x.id}
                    chatSearch={Boolean(chatId)}
                    onClick={() => this.handleSelectMessage(x.chat_id, x.id, false, true)}/>
            ))
            : [];

        let messagesCaption = 'No messages found';
        if (messages && messages.total_count){
            messagesCaption = messages.total_count === 1? 'Found 1 message' : `Found ${messages.total_count} messages`;
        }

        return (
            <div ref={this.listRef} className='search' onScroll={this.handleScroll}>
                {   chat &&
                    <div className='search-chat'>
                        <SearchCaption caption='Search messages in'/>
                        <div className='search-chat-wrapper'>
                            <div className='search-chat-control'>
                                <ChatControl chatId={chatId} hideStatus/>
                            </div>
                            <IconButton
                                className={classes.closeSearchIconButton}
                                aria-label='Search'
                                onMouseDown={this.handleClose}>
                                <CloseIcon/>
                            </IconButton>
                        </div>
                    </div>
                }
                {   topChats.length > 0 &&
                    <div className='search-top-chats'>
                        <SearchCaption caption='People'/>
                        <div className='search-top-chats-list' onScroll={this.handleTopChatsScroll}>
                            <div className='search-top-chats-placeholder'/>
                            {topChats}
                            <div className='search-top-chats-placeholder'/>
                        </div>
                    </div>
                }
                {   recentlyFoundChats.length > 0 &&
                    <div className='search-recently-found-chats'>
                        <SearchCaption caption='Recent' command='Clear' onClick={this.handleClearRecentlyFound}/>
                        {recentlyFoundChats}
                    </div>
                }
                {   localChats.length > 0 &&
                    <div className='search-local-chats'>
                        <SearchCaption caption='Chats and contacts'/>
                        {localChats}
                    </div>
                }
                {   globalChats.length > 0 &&
                    <div className='search-global-chats'>
                        <SearchCaption caption='Global search'/>
                        {globalChats}
                    </div>
                }
                {   messages &&
                    <div className='search-global-chats'>
                        <SearchCaption caption={messagesCaption}/>
                        {globalMessages}
                    </div>
                }
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

export default withStyles(styles)(Search);