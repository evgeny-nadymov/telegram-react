/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import Contacts from '../ColumnLeft/Contacts';
import DialogsHeader from '../ColumnLeft/DialogsHeader';
import Search from '../ColumnLeft/Search/Search';
import Settings from '../ColumnLeft/Settings/Settings';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import './ChatInfoDialog.css';
import { openChat } from '../../Actions/Client';
import NewChannel from '../ColumnLeft/NewChannel';
import NewGroup from '../ColumnLeft/NewGroup';

class SidebarDialog extends React.Component {
    constructor(props) {
        super(props);

        this.headerRef = React.createRef();

        this.state = {
            openSearch: false,
            openSettings: false,
            openContacts: false,
            openNewGroup: false,
            openNewChannel: false
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { openSearch, searchText, openSettings, openContacts, openNewGroup, openNewChannel } = this.state;

        if (nextState.openSearch !== openSearch) {
            return true;
        }

        if (nextState.searchText !== searchText) {
            return true;
        }

        if (nextState.openSettings !== openSettings) {
            return true;
        }

        if (nextState.openContacts !== openContacts) {
            return true;
        }

        if (nextState.openNewGroup !== openNewGroup) {
            return true;
        }

        if (nextState.openNewChannel !== openNewChannel) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateSearchChat', this.onClientUpdateSearchChat);
        ChatStore.on('clientUpdateSettings', this.onClientUpdateSettings);
        ChatStore.on('clientUpdateContacts', this.onClientUpdateContacts);
        ChatStore.on('clientUpdateNewGroup', this.onClientUpdateNewGroup);
        ChatStore.on('clientUpdateNewChannel', this.onClientUpdateNewChannel);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateSearchChat', this.onClientUpdateSearchChat);
        ChatStore.off('clientUpdateSettings', this.onClientUpdateSettings);
        ChatStore.off('clientUpdateContacts', this.onClientUpdateContacts);
        ChatStore.off('clientUpdateNewGroup', this.onClientUpdateNewGroup);
        ChatStore.off('clientUpdateNewChannel', this.onClientUpdateNewChannel);
    }

    onClientUpdateSearchChat = update => {
        const { isSmallWidth } = AppStore;
        if (!isSmallWidth) return;

        const { chatId, query } = update;
        const { openSearch, searchChatId, searchText } = this.state;

        if (openSearch && chatId === searchChatId && query === searchText) {
            return;
        }

        this.query = query;
        this.setState(
            {
                openSearch: true,
                searchChatId: chatId,
                searchText: null
            }
        );
    };

    handleDialogEnter = () => {
        if (!this.query) return;

        const header = this.headerRef.current;
        if (header) {
            header.setInitQuery(this.query);
        }

        this.query = null;
    };

    onClientUpdateSettings = update => {
        const { isSmallWidth } = AppStore;
        if (!isSmallWidth) return;

        const { open, chatId } = update;

        this.setState({ openSettings: open, meChatId: chatId });
    };

    onClientUpdateContacts = async update => {
        const { isSmallWidth } = AppStore;
        if (!isSmallWidth) return;

        const { open } = update;

        this.setState({ openContacts: open });
    };

    onClientUpdateNewGroup = async update => {
        const { isSmallWidth } = AppStore;
        if (!isSmallWidth) return;

        const { open } = update;

        this.setState({ openNewGroup: open });
    };

    onClientUpdateNewChannel = async update => {
        const { isSmallWidth } = AppStore;
        if (!isSmallWidth) return;

        const { open } = update;

        this.setState({ openNewChannel: open });
    };

    handleClose = () => {
        this.setState({
            openSettings: false,
            openContacts: false,
            openNewGroup: false,
            openNewChannel: false,
            openSearch: false
        });
    };

    handleSearch = visible => {
        this.setState({
            openSearch: visible,
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

    handleSelectMessage = (chatId, messageId, openSearch) => {
        openChat(chatId, messageId);

        this.handleCloseSearch();
    };

    handleCloseSearch = () => {
        this.setState({
            openSearch: false,
            searchChatId: 0,
            searchText: null
        });
    };

    render() {
        const { meChatId, searchChatId, searchText, openSearch, openContacts, openSettings, openNewGroup, openNewChannel } = this.state;
        if (!openSearch && !openContacts && !openSettings && !openNewGroup && !openNewChannel) {
            return null;
        }

        return (
            <Dialog
                open
                transitionDuration={0}
                onClose={this.handleClose}
                classes={{
                    root: 'chat-info-dialog-root',
                    container: 'chat-info-dialog-container',
                    paper: 'chat-info-dialog-paper'
                }}
                onEnter={this.handleDialogEnter}
                >
                {openSettings && <Settings chatId={meChatId} popup/>}
                {openContacts && <Contacts popup />}
                {openNewGroup && <NewGroup popup/>}
                {openNewChannel && <NewChannel popup />}
                {openSearch && (
                    <>
                        <DialogsHeader
                            ref={this.headerRef}
                            openSearch={true}
                            timeout={false}
                            onClick={this.handleHeaderClick}
                            onSearch={this.handleSearch}
                            onSearchTextChange={this.handleSearchTextChange}
                            popup
                        />
                        <div className='search-content'>
                            <Search
                                chatId={searchChatId}
                                text={searchText}
                                onSelectMessage={this.handleSelectMessage}
                                onClose={this.handleCloseSearch}
                            />
                        </div>
                    </>
                )}
            </Dialog>
        );
    }
}

SidebarDialog.propTypes = {};

export default SidebarDialog;
