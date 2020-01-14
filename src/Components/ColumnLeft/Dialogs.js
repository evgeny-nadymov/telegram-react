/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import Search from './Search/Search';
import DialogsHeader from './DialogsHeader';
import DialogsList from './DialogsList';
import UpdatePanel from './UpdatePanel';
import { borderStyle } from '../Theme';
import { openChat } from '../../Actions/Client';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import './Dialogs.css';
import CacheStore from '../../Stores/CacheStore';

const styles = theme => ({
    ...borderStyle(theme)
});

class Dialogs extends Component {
    constructor(props) {
        super(props);

        this.dialogListRef = React.createRef();
        this.archiveListRef = React.createRef();
        this.dialogsHeaderRef = React.createRef();

        this.state = {
            isChatDetailsVisible: AppStore.isChatDetailsVisible,
            openSearch: false,
            openArchive: false,
            searchChatId: 0,
            searchText: null,
            query: null
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { isChatDetailsVisible, openSearch, openArchive, searchChatId, searchText } = this.state;

        if (nextState.isChatDetailsVisible !== isChatDetailsVisible) {
            return true;
        }

        if (nextState.openSearch !== openSearch) {
            return true;
        }

        if (nextState.openArchive !== openArchive) {
            return true;
        }

        if (nextState.searchChatId !== searchChatId) {
            return true;
        }

        if (nextState.searchText !== searchText) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        AppStore.on('clientUpdateSearchChat', this.onClientUpdateSearchChat);
        AppStore.on('clientUpdateThemeChange', this.onClientUpdateThemeChange);

        ChatStore.on('clientUpdateOpenArchive', this.onClientUpdateOpenArchive);
        ChatStore.on('clientUpdateCloseArchive', this.onClientUpdateCloseArchive);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        AppStore.off('clientUpdateSearchChat', this.onClientUpdateSearchChat);
        AppStore.off('clientUpdateThemeChange', this.onClientUpdateThemeChange);

        ChatStore.off('clientUpdateOpenArchive', this.onClientUpdateOpenArchive);
        ChatStore.off('clientUpdateCloseArchive', this.onClientUpdateCloseArchive);
    }

    onClientUpdateOpenArchive = update => {
        this.setState({ openArchive: true });
    };

    onClientUpdateCloseArchive = update => {
        this.setState({ openArchive: false });
    };

    onClientUpdateThemeChange = update => {
        this.forceUpdate();
    };

    onClientUpdateChatDetailsVisibility = update => {
        this.setState({
            isChatDetailsVisible: AppStore.isChatDetailsVisible
        });
    };

    onClientUpdateSearchChat = update => {
        const { chatId, query } = update;
        const { openSearch, searchChatId, searchText } = this.state;

        if (openSearch && chatId === searchChatId && query === searchText) {
            return;
        }

        const header = this.dialogsHeaderRef.current;
        this.setState(
            {
                openSearch: true,
                searchChatId: chatId,
                searchText: null
            },
            () => {
                if (header) {
                    header.setInitQuery(query);
                }
            }
        );
    };

    handleHeaderClick = () => {
        const { openArchive } = this.state;
        if (openArchive) {
            this.archiveListRef.current.scrollToTop();
        } else {
            this.dialogListRef.current.scrollToTop();
        }
    };

    handleSearch = visible => {
        this.setState({
            openSearch: visible,
            searchChatId: 0,
            searchText: null
        });
    };

    handleSelectMessage = (chatId, messageId, openSearch) => {
        openChat(chatId, messageId);

        const searchChatId = openSearch ? this.state.searchChatId : 0;
        const searchText = openSearch ? this.state.searchText : null;

        this.setState({
            openSearch: openSearch,
            searchChatId: searchChatId,
            searchText: searchText
        });
    };

    handleClose = () => {
        this.setState({
            openSearch: false,
            searchChatId: 0,
            searchText: null
        });
    };

    handleSearchTextChange = text => {
        this.setState({
            searchText: text,
            query: null
        });
    };

    handleSaveCache = () => {
        const archiveChatIds = [];
        const archive = ChatStore.chatList.get('chatListArchive');
        if (archive) {
            for (const chatId of archive.keys()) {
                archiveChatIds.push(chatId);
            }
        }

        console.log('[dl] saveCache start');
        const { current } = this.dialogListRef;
        if (current) {
            const chatIds = current.state.chats.slice(0, 25);
            console.log('[dl] saveCache', chatIds, archiveChatIds);
            CacheStore.saveChats(chatIds, archiveChatIds);
        }
    };

    render() {
        const { classes } = this.props;
        const { isChatDetailsVisible, openArchive, openSearch, searchChatId, searchText } = this.state;

        return (
            <div
                className={classNames(classes.borderColor, 'dialogs', {
                    'dialogs-third-column': isChatDetailsVisible
                })}>
                <DialogsHeader
                    ref={this.dialogsHeaderRef}
                    openArchive={openArchive}
                    openSearch={openSearch}
                    onClick={this.handleHeaderClick}
                    onSearch={this.handleSearch}
                    onSearchTextChange={this.handleSearchTextChange}
                />
                <div className='dialogs-content'>
                    <DialogsList
                        type='chatListMain'
                        ref={this.dialogListRef}
                        open={true}
                        onSaveCache={this.handleSaveCache}
                    />
                    <DialogsList
                        type='chatListArchive'
                        ref={this.archiveListRef}
                        open={openArchive}
                        onSaveCache={this.handleSaveCache}
                    />
                    {openSearch && (
                        <Search
                            chatId={searchChatId}
                            text={searchText}
                            onSelectMessage={this.handleSelectMessage}
                            onClose={this.handleClose}
                        />
                    )}
                </div>
                <UpdatePanel />
            </div>
        );
    }
}

export default withStyles(styles)(Dialogs);
