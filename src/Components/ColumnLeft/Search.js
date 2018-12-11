/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import TopChat from '../Tile/TopChat';
import RecentlyFoundChat from '../Tile/RecentlyFoundChat';
import { loadChatsContent } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './Search.css';

class Search extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            top: null,
            recentlyFound: null
        };
    }

    componentDidMount() {
        this.loadContent();
    }

    loadContent = async () => {
        const top = await TdLibController.send({
            '@type': 'getTopChats',
            category: { '@type': 'topChatCategoryUsers' },
            limit: 30
        });

        this.setState({ top: top });

        const recentlyFound = await TdLibController.send({
            '@type': 'searchChats',
            query: '',
            limit: 100
        });

        this.setState({ recentlyFound: recentlyFound });

        const store = FileStore.getStore();
        loadChatsContent(store, top.chat_ids);
        loadChatsContent(store, recentlyFound.chat_ids);
    };

    handleRecentlyFound = async () => {
        const chats = await TdLibController.send({
            '@type': 'getChats',
            offset_order: '9223372036854775807',
            offset_chat_id: 0,
            limit: 100
        });

        for (let i = 0; i < chats.chat_ids.length; i++) {
            TdLibController.send({
                '@type': 'addRecentlyFoundChat',
                chat_id: chats.chat_ids[i],
            });
        }
    };

    handleClearRecentlyFound = async (event) => {
        event.stopPropagation();

        await TdLibController.send({
            '@type': 'clearRecentlyFoundChats'
        });

        this.setState({ recentlyFound: null });
    };

    render() {
        const { onSelectChat } = this.props;
        const { top, recentlyFound } = this.state;

        const topChats = top && top.chat_ids
            ? top.chat_ids.map(x => (<TopChat key={x} chatId={x} onSelect={(chatId) => onSelectChat(chatId, false)}/>))
            : [];
        const recentlyFoundChats = recentlyFound && recentlyFound.chat_ids
            ? recentlyFound.chat_ids.map(x => (
                <ListItem button key={x}>
                    <RecentlyFoundChat chatId={x} onSelect={(chatId) => onSelectChat(chatId, false)}/>
                </ListItem>
            ))
            : [];

        return (
            <div className='search'>
                {   topChats.length > 0 &&
                    <div className='search-top-chats'>
                        <div className='search-top-chats-placeholder'/>
                        {topChats}
                        <div className='search-top-chats-placeholder'/>
                    </div>
                }

                <div className='search-recently-found-chats-caption' onClick={this.handleRecentlyFound}>
                    <div className='search-recently-found-chats-label'>Recently found</div>
                    <div className='search-recently-found-chats-command' onClick={this.handleClearRecentlyFound}>Clear</div>
                </div>
                {   recentlyFoundChats.length > 0 &&
                    <div className='search-recently-found-chats'>
                        {recentlyFoundChats}
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