/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import CSSTransition from 'react-transition-group/CSSTransition';
import Archive from './Archive';
import Search from './Search/Search';
import Filters from './Filters';
import DialogsHeader from './DialogsHeader';
import DialogsList from './DialogsList';
import SidebarPage from './SidebarPage';
import Settings from './Settings/Settings';
import Contacts from './Contacts';
import UpdatePanel from './UpdatePanel';
import SidebarDialog from '../Popup/SidebarDialog';
import NewGroup from './NewGroup';
import NewChannel from './NewChannel';
import { openChat } from '../../Actions/Client';
import { getArchiveTitle } from '../../Utils/Archive';
import { loadChatsContent } from '../../Utils/File';
import { duration } from '@material-ui/core/styles/transitions';
import { CHAT_SLICE_LIMIT } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import CacheStore from '../../Stores/CacheStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import FilterStore from '../../Stores/FilterStore';
import TdLibController from '../../Controllers/TdLibController';
import './Dialogs.css';

const defaultTimeout = {
    enter: duration.enteringScreen,
    exit: duration.leavingScreen
};

class Dialogs extends Component {
    constructor(props) {
        super(props);

        this.dialogListRef = React.createRef();
        this.archiveListRef = React.createRef();
        this.dialogsHeaderRef = React.createRef();

        this.state = {
            cache: null,

            showArchive: false,
            archiveTitle: null,

            archiveItems: [],

            timeout: defaultTimeout,
            openSearch: false,
            openArchive: false,
            openContacts: false,
            openSettings: false,
            openNewGroup: false,
            openNewChannel: false,

            searchChatId: 0,
            searchText: null,
            query: null
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const {
            cache,
            showArchive,
            archiveTitle,
            archiveItems,
            openSearch,
            openArchive,
            openSettings,
            openContacts,
            openNewGroup,
            openNewChannel,
            searchChatId,
            searchText
        } = this.state;

        if (nextState.cache !== cache) {
            return true;
        }

        if (nextState.showArchive !== showArchive) {
            return true;
        }

        if (nextState.archiveTitle !== archiveTitle) {
            return true;
        }

        if (nextState.archiveItems !== archiveItems) {
            return true;
        }

        if (nextState.openSearch !== openSearch) {
            return true;
        }

        if (nextState.openArchive !== openArchive) {
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

        if (nextState.searchChatId !== searchChatId) {
            return true;
        }

        if (nextState.searchText !== searchText) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        this.loadCache();

        AppStore.on('clientUpdateSearchChat', this.onClientUpdateSearchChat);
        AppStore.on('clientUpdateThemeChange', this.onClientUpdateThemeChange);
        AppStore.on('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        ChatStore.on('updateChatDraftMessage', this.onUpdateChatOrder);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatOrder);
        ChatStore.on('updateChatPosition', this.onUpdateChatOrder);
        ChatStore.on('clientUpdateSettings', this.onClientUpdateSettings);
        ChatStore.on('clientUpdateArchive', this.onClientUpdateArchive);
        ChatStore.on('clientUpdateContacts', this.onClientUpdateContacts);
        ChatStore.on('clientUpdateNewGroup', this.onClientUpdateNewGroup);
        ChatStore.on('clientUpdateNewChannel', this.onClientUpdateNewChannel);
        FilterStore.on('updateChatFilters', this.onUpdateChatFilters);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateSearchChat', this.onClientUpdateSearchChat);
        AppStore.off('clientUpdateThemeChange', this.onClientUpdateThemeChange);
        AppStore.off('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        ChatStore.off('updateChatDraftMessage', this.onUpdateChatOrder);
        ChatStore.off('updateChatLastMessage', this.onUpdateChatOrder);
        ChatStore.off('updateChatPosition', this.onUpdateChatOrder);
        ChatStore.off('clientUpdateSettings', this.onClientUpdateSettings);
        ChatStore.off('clientUpdateArchive', this.onClientUpdateArchive);
        ChatStore.off('clientUpdateContacts', this.onClientUpdateContacts);
        ChatStore.off('clientUpdateNewGroup', this.onClientUpdateNewGroup);
        ChatStore.off('clientUpdateNewChannel', this.onClientUpdateNewChannel);
        FilterStore.off('updateChatFilters', this.onUpdateChatFilters);
    }

    onUpdateChatFilters = update => {
        this.handleSaveCache();
    };

    onClientUpdatePageWidth = update => {
        const { isSmallWidth } = update;

        if (!isSmallWidth) return;

        const { openSettings, openContacts, openSearch, openNewGroup, openNewChannel } = this.state;
        if (openSettings || openContacts || openSearch || openNewGroup || openNewChannel) {
            this.setState({
                    openContacts: false,
                    openSettings: false,
                    openSearch: false,
                    openNewGroup: false,
                    openNewChannel: false,
                    timeout: 0
                }, () => {
                    this.setState({
                        timeout: defaultTimeout
                    });
            });
        }
    };

    async loadCache() {
        const cache = (await CacheStore.load()) || {};

        const { chats, archiveChats } = cache;

        FilterStore.filters = FilterStore.filters || CacheStore.filters;
        this.setState({
            cache,

            showArchive: archiveChats && archiveChats.length > 0,
            archiveTitle: getArchiveTitle()
        });

        this.loadChatContents((chats || []).map(x => x.id));

        TdLibController.clientUpdate({
            '@type': 'clientUpdateCacheLoaded'
        });
    }

    async saveCache() {
        const promises = [];
        promises.push(TdLibController.send({
            '@type': 'getChats',
            chat_list: { '@type': 'chatListMain' },
            limit: CHAT_SLICE_LIMIT
        }));
        promises.push(TdLibController.send({
            '@type': 'getChats',
            chat_list: { '@type': 'chatListArchive' },
            limit: CHAT_SLICE_LIMIT
        }));
        const [mainChats, archiveChats] = await Promise.all(promises);

        const { filters } = FilterStore;

        CacheStore.save(filters, mainChats.chat_ids, archiveChats.chat_ids);
    }

    onUpdateChatOrder = update => {
        const { showArchive: prevShowArchive } = this.state;

        const { current: mainCurrent } = this.dialogListRef;
        if (mainCurrent && mainCurrent.loading) {
            return;
        }

        const { current: archiveCurrent } = this.archiveListRef;
        if (archiveCurrent && archiveCurrent.loading) {
            return;
        }

        const archiveList = ChatStore.chatList.get('chatListArchive');
        const showArchive = archiveList && archiveList.size > 0;

        this.setState({ showArchive, archiveTitle: getArchiveTitle() }, () => {
            if (!prevShowArchive && showArchive) {
                const { current } = this.dialogListRef;
                if (current.listRef) {
                    const { current: listCurrent } = current.listRef;
                    if (listCurrent && listCurrent.scrollTop > 0) {
                        current.scrollTop += 68;
                    }
                }
            }
        });

        if (prevShowArchive && !showArchive) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateCloseArchive'
            });
        }
    };

    onClientUpdateContacts = async update => {
        const { isSmallWidth } = AppStore;
        if (isSmallWidth) return;

        const { open } = update;

        this.setState({ openContacts: open });
    };

    onClientUpdateSettings = update => {
        const { isSmallWidth } = AppStore;
        if (isSmallWidth) return;

        const { open, chatId } = update;

        this.setState({ openSettings: open, meChatId: chatId });
    };

    onClientUpdateNewGroup = async update => {
        const { isSmallWidth } = AppStore;
        if (isSmallWidth) return;

        const { open } = update;

        this.setState({ openNewGroup: open });
    };

    onClientUpdateNewChannel = async update => {
        const { isSmallWidth } = AppStore;
        if (isSmallWidth) return;

        const { open } = update;

        this.setState({ openNewChannel: open });
    };

    onClientUpdateArchive = update => {
        const { open } = update;

        this.setState({ openArchive: open });
    };

    onClientUpdateThemeChange = update => {
        this.forceUpdate();
    };

    onClientUpdateSearchChat = update => {
        const { isSmallWidth } = AppStore;
        if (isSmallWidth) return;

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
                searchText: null,
                openArchive: false,
                openContacts: false,
                openSettings: false,
                openNewGroup: false,
                openNewChannel: false,
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
            TdLibController.clientUpdate({
                '@type': 'clientUpdateCloseArchive'
            });
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
            openSearch,
            searchChatId,
            searchText
        });
    };

    handleCloseSearch = () => {
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
        this.saveCache();
    };

    loadChatContents(chatIds) {
        const store = FileStore.getStore();
        loadChatsContent(store, chatIds);
    }

    handleCloseArchive = () => {
        this.setState({ openArchive: false });
    };

    handleCloseContacts = () => {
        this.setState({ openContacts: false });
    };

    handleCloseSettings = () => {
        this.setState({ openSettings: false });
    };

    handleCloseNewGroup = () => {
        this.setState({ openNewGroup: false });
    };

    handleCloseNewChannel = () => {
        this.setState({ openNewChannel: false });
    };

    render() {
        const {
            cache,
            showArchive,
            archiveTitle,
            archiveItems,
            meChatId,
            openSettings,
            openContacts,
            openArchive,
            openSearch,
            openNewGroup,
            openNewChannel,
            timeout,
            searchChatId,
            searchText
        } = this.state;

        const mainCacheItems = cache && cache.chats ? cache.chats : null;
        const archiveCacheItems = cache && cache.archiveChats ? cache.archiveChats : null;

        return (
            <>
                <div className='dialogs'>
                    <div className='sidebar-page'>
                        <DialogsHeader
                            ref={this.dialogsHeaderRef}
                            openSearch={openSearch}
                            timeout={timeout !== 0}
                            onClick={this.handleHeaderClick}
                            onSearch={this.handleSearch}
                            onSearchTextChange={this.handleSearchTextChange}
                        />
                        <div className='dialogs-content'>
                            <div className='dialogs-content-internal'>
                                <Filters/>
                                {/*<div className='sidebar-page-top-divider' style={{ zIndex: 1 }}/>*/}
                                <DialogsList
                                    type='chatListMain'
                                    ref={this.dialogListRef}
                                    cacheItems={mainCacheItems}
                                    onSaveCache={this.handleSaveCache}
                                />
                            </div>
                            <CSSTransition
                                classNames='search'
                                timeout={timeout}
                                in={openSearch}
                                mountOnEnter={true}
                                unmountOnExit={true}>
                                <Search
                                    chatId={searchChatId}
                                    text={searchText}
                                    onSelectMessage={this.handleSelectMessage}
                                    onClose={this.handleCloseSearch}
                                />
                            </CSSTransition>
                        </div>
                        {/*<UpdatePanel />*/}
                    </div>

                    <SidebarPage open={openArchive} timeout={timeout} onClose={this.handleCloseArchive}>
                        <Archive
                            innerListRef={this.archiveListRef}
                            items={archiveItems}
                            cacheItems={archiveCacheItems}
                        />
                    </SidebarPage>

                    <SidebarPage open={openContacts} timeout={timeout} onClose={this.handleCloseContacts}>
                        <Contacts />
                    </SidebarPage>

                    <SidebarPage open={openSettings} timeout={timeout} onClose={this.handleCloseSettings}>
                        <Settings chatId={meChatId} />
                    </SidebarPage>

                    <SidebarPage open={openNewGroup} timeout={timeout} onClose={this.handleCloseNewGroup}>
                        <NewGroup />
                    </SidebarPage>

                    <SidebarPage open={openNewChannel} timeout={timeout} onClose={this.handleCloseNewChannel}>
                        <NewChannel />
                    </SidebarPage>

                    <SidebarDialog/>
                </div>
            </>
        );
    }
}

export default Dialogs;
