/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import TopChat from '../../Tile/TopChat';
import RecentlyFoundChat from '../../Tile/RecentlyFoundChat';
import FoundPublicChat from '../../Tile/FoundPublicChat';
import FoundMessage from '../../Tile/FoundMessage';
import SearchCaption from './SearchCaption';
import { loadChatsContent } from '../../../Utils/File';
import { filterMessages } from '../../../Utils/Message';
import { MIN_USERNAME_LENGTH } from '../../../Constants';
import MessageStore from '../../../Stores/MessageStore';
import FileStore from '../../../Stores/FileStore';
import ApplicationStore from '../../../Stores/ApplicationStore';
import TdLibController from '../../../Controllers/TdLibController';
import './Search.css';

class Search extends React.Component {

    constructor(props){
        super(props);

        this.listRef = React.createRef();

        this.state = {
            top: null,
            recentlyFound: null,
            local: null,
            global: null,
            messages: null
        };
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

        let store = FileStore.getStore();
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

        const messages = await TdLibController.send({
            '@type': 'searchMessages',
            query: text,
            offset_date: 0,
            offset_chat_id: 0,
            offset_message_id: 0,
            limit: 50
        });

        MessageStore.setItems(messages.messages);

        if (sessionId !== this.sessionId){
            return;
        }

        this.setState({
            messages: messages
        });

        const chats = new Map();
        for (let i = 0; i < messages.messages.length; i++){
            chats.set(messages.messages[i].chat_id, messages.messages[i].chat_id);
        }

        store = FileStore.getStore();
        loadChatsContent(store, [...chats.keys()]);
    };

    loadContent = async () => {
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

    handleSelectChat = (chatId) => {
        const { onSelectChat } = this.props;

        TdLibController.send({
            '@type': 'addRecentlyFoundChat',
            chat_id: chatId
        });

        onSelectChat(chatId, false)
    };

    handleSelectMessage = (chatId, messageId) => {
        const { onSelectChat } = this.props;

        onSelectChat(chatId, false)
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

        console.log('SCROLL HANDLESCROLL onLoadPrevious');

        const sessionId = this.sessionId;

        const { messages } = this.state;

        const offset = this.getOffset(messages);

        this.loading = true;
        const result = await TdLibController.send({
            '@type': 'searchMessages',
            query: this.text,
            ...offset,
            limit: 50
        });
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
        for (let i = 0; i < result.messages.length; i++){
            chats.set(result.messages[i].chat_id, result.messages[i].chat_id);
        }

        const store = FileStore.getStore();
        loadChatsContent(store, [...chats.keys()]);
    };

    handleTopChatsScroll = (event) => {
        event.stopPropagation();
    };

    render() {
        const { onSelectChat } = this.props;
        const { top, recentlyFound, local, global, messages } = this.state;

        const topChats = top && top.chat_ids
            ? top.chat_ids.map(x => (<TopChat key={x} chatId={x} onSelect={(chatId) => onSelectChat(chatId, false)}/>))
            : [];
        const recentlyFoundChats = recentlyFound && recentlyFound.chat_ids
            ? recentlyFound.chat_ids.map(x => (
                <ListItem button key={x} onClick={() => this.handleSelectChat(x)}>
                    <RecentlyFoundChat chatId={x}/>
                </ListItem>
            ))
            : [];

        const localChats = local && local.chat_ids
            ? local.chat_ids.map(x => (
                <ListItem button key={x} onClick={() => this.handleSelectChat(x)}>
                    <RecentlyFoundChat chatId={x}/>
                </ListItem>
            ))
            : [];

        const globalChats = global && global.chat_ids
            ? global.chat_ids.map(x => (
                <ListItem button key={x} onClick={() => this.handleSelectChat(x)}>
                    <FoundPublicChat chatId={x}/>
                </ListItem>
            ))
            : [];
        const globalMessages = messages && messages.messages
            ? messages.messages.map(x => (
                <ListItem button key={`${x.chat_id}_${x.id}`} onClick={() => this.handleSelectMessage(x.chat_id, x.id)}>
                    <FoundMessage chatId={x.chat_id} messageId={x.id}/>
                </ListItem>
            ))
            : [];

        let messagesCaption = 'No messages found';
        if (messages && messages.total_count){
            messagesCaption = messages.total_count === 1? 'Found 1 message' : `Found ${messages.total_count} messages`;
        }

        return (
            <div ref={this.listRef} className='search' onScroll={this.handleScroll}>
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
    onSelectChat: PropTypes.func.isRequired
};

export default Search;