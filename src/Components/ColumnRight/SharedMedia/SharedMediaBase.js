/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import SharedDocument from '../../Tile/SharedMedia/SharedDocument';
import SharedMediaHeader from './SharedMediaHeader';
import { between, insertByOrder } from '../../../Utils/Common';
import { loadMessageContents } from '../../../Utils/File';
import { messageComparatorDesc } from '../../../Utils/Message';
import { SCROLL_PRECISION, SHARED_MESSAGE_SLICE_LIMIT } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import TdLibController from '../../../Controllers/TdLibController';
import './SharedMediaBase.css';

class SharedMediaBase extends React.Component {
    getListClassName() {
        return null;
    }

    getSearchListClassName() {
        return null;
    }

    constructor(props) {
        if (new.target === SharedMediaBase) {
            throw new TypeError('Cannot construct SharedMediaBase instances directly');
        }

        // console.log('SharedMediaBase.ctor');

        super(props);

        this.listRef = React.createRef();
        this.searchListRef = React.createRef();

        this.state = {
            items: [],
            migratedItems: [],
            searchItems: [],
            searchMigratedItems: []
        };
    }

    hasSearch() {
        return true;
    }

    isValidContent(content) {
        throw new Error('Virtual method isValidContent is not implemented');
    }

    getItemTemplate(message) {
        const { migratedChatId } = this.props;
        const { chat_id, id } = message;

        return (
            <SharedDocument
                key={`chat_id=${chat_id}_message_id=${id}`}
                chatId={chat_id}
                messageId={id}
                showOpenMessage={chat_id !== migratedChatId}
            />
        );
    }

    getSearchFilter() {
        throw new Error('Virtual method getSearchFilter is not implemented');
    }

    getHeader() {
        throw new Error('Virtual method getHeader is not implemented');
    }

    componentDidMount() {
        this.loadContent();

        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
    }

    componentWillUnmount() {
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
    }

    onUpdateMessageContent = update => {
        const { chatId, migratedChatId } = this.props;
        const { items, migratedItems } = this.state;

        const { chat_id, message_id, old_content, new_content } = update;

        const message = MessageStore.get(chat_id, message_id);
        // console.log(`SharedDocuments.onUpdateMessageContent chat_id=${chat_id} message_id=${message_id}`, this.state.items);

        if (chat_id === chatId) {
            if (!items.length) return;
            if (!between(message_id, items[0].id, items[items.length - 1].id, true)) return;

            const index = items.findIndex(x => x.id === message_id);
            if (this.isValidContent(new_content)) {
                if (index === -1) {
                    // add new document
                    this.setState({ items: insertByOrder(items, message, messageComparatorDesc) });
                } else {
                    // replace document
                    this.setState({ items: [...items.slice(0, index), message, ...items.slice(index + 1)] });
                }
            } else {
                if (index === -1) {
                } else {
                    // remove none document
                    this.setState({ items: items.filter(x => x.id !== message_id) });
                }
            }
        } else if (chat_id === migratedChatId) {
            if (!migratedItems.length) return;
            if (!between(message_id, migratedItems[0].id, migratedItems[migratedItems.length - 1].id, true)) return;

            const index = migratedItems.findIndex(x => x.id === message_id);
            if (this.isValidContent(new_content)) {
                if (index === -1) {
                    // add new document
                    this.setState({
                        migratedItems: insertByOrder(migratedItems, message, messageComparatorDesc)
                    });
                } else {
                    // replace document
                    this.setState({
                        migratedItems: [...migratedItems.slice(0, index), message, ...migratedItems.slice(index + 1)]
                    });
                }
            } else {
                if (index === -1) {
                } else {
                    // remove none document
                    this.setState({ migratedItems: migratedItems.filter(x => x.id !== message_id) });
                }
            }
        }
    };

    onUpdateNewMessage = update => {
        const { chatId, migratedChatId } = this.props;
        const { items, migratedItems } = this.state;

        const { message } = update;
        const { chat_id } = message;

        if (chat_id !== chatId) return;
        if (!this.isValidMessage(message)) return;

        const store = FileStore.getStore();
        loadMessageContents(store, [message]);

        if (chat_id === chatId) {
            this.setState({ items: [message].concat(items) });
        } else if (chat_id === migratedChatId) {
            this.setState({ migratedItems: [message].concat(migratedItems) });
        }
    };

    onUpdateDeleteMessages = update => {
        const { chatId, migratedChatId } = this.props;
        const { items, migratedItems } = this.state;

        const { chat_id, message_ids } = update;

        const map = new Map(message_ids.map(x => [x, x]));
        const callback = () => {
            if (this.state.items.length + this.state.migratedItems.length < SHARED_MESSAGE_SLICE_LIMIT) {
                this.onLoadNext(this.params);
            }
        };

        if (chat_id === chatId) {
            this.setState({ items: items.filter(x => !map.has(x.id)) }, callback);
        } else if (chat_id === migratedChatId) {
            this.setState({ migratedItems: migratedItems.filter(x => !map.has(x.id)) }, callback);
        }
    };

    loadContent = () => {
        this.params = {
            loading: false,
            completed: false,
            migrateCompleted: false,
            items: [],
            migratedItems: [],
            filter: this.getSearchFilter()
        };
        this.onLoadNext(this.params);
    };

    onLoadNext = async (params, loadIncomplete = true) => {
        const { chatId } = this.props;
        const { completed, filter, items, loading } = params;

        // console.log('SharedMediaBase.onLoadNext', completed, loading);

        if (loading) return;
        if (completed) return;

        const fromMessageId = items.length > 0 ? items[items.length - 1].id : 0;
        params.loading = true;
        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT,
            filter
        }).finally(() => {
            params.loading = false;
        });

        TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT * 2,
            filter
        });

        const { messages } = result;
        params.completed = messages.length === 0 || messages.total_count === 0;
        params.items = items.concat(messages.filter(this.isValidMessage));
        const incompleteResults = loadIncomplete && messages.length > 0 && messages.length < SHARED_MESSAGE_SLICE_LIMIT;

        MessageStore.setItems(result.messages);
        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);

        this.setState({ items: params.items });

        if (params.completed) {
            this.onLoadMigratedNext(params, true);
        } else if (incompleteResults) {
            this.onLoadNext(params, false);
        }
    };

    onLoadMigratedNext = async (params, loadIncomplete = true) => {
        const { migratedChatId } = this.props;
        const { filter, loading, migrateCompleted, migratedItems: items } = params;

        // console.log('SharedMediaBase.onLoadMigratedNext', migratedChatId, loading, migrateCompleted);

        if (!migratedChatId) return;
        if (loading) return;
        if (migrateCompleted) return;

        const fromMessageId = items.length > 0 ? items[items.length - 1].id : 0;
        params.loading = true;
        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: migratedChatId,
            query: '',
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT,
            filter
        }).finally(() => {
            params.loading = false;
        });

        const { messages } = result;
        params.migratedItems = items.concat(messages.filter(this.isValidMessage));
        params.migrateCompleted = messages.length === 0 || messages.total_count === 0;
        const incompleteResults = loadIncomplete && messages.length > 0 && messages.length < SHARED_MESSAGE_SLICE_LIMIT;

        if (params.migrateCompleted) return;

        MessageStore.setItems(messages);
        const store = FileStore.getStore();
        loadMessageContents(store, messages);

        this.setState({ migratedItems: params.migratedItems });

        if (incompleteResults) {
            this.onLoadMigratedNext(params, false);
        }
    };

    handleScroll = () => {
        if (!this.listRef) return;

        const list = this.listRef.current;
        if (!list) return;

        const { params } = this;

        if (list.scrollTop + list.offsetHeight >= list.scrollHeight - SCROLL_PRECISION) {
            if (params && !params.completed) {
                this.onLoadNext(params);
            } else {
                this.onLoadMigratedNext(params);
            }
        }
    };

    handleHeaderClick = () => {
        const list = this.listRef.current;
        if (!list) return;

        list.scrollTop = 0;
    };

    handleSearchScroll = () => {
        if (!this.searchListRef) return;

        const list = this.searchListRef.current;
        if (!list) return;

        const { searchParams } = this;
        if (!searchParams) return;

        if (list.scrollTop + list.offsetHeight >= list.scrollHeight - SCROLL_PRECISION) {
            if (!searchParams.completed) {
                this.onSearchNext(searchParams);
            } else {
                this.onSearchMigratedNext(searchParams);
            }
        }
    };

    onSearchNext = async (params, loadIncomplete = true) => {
        const { chatId } = this.props;
        const { completed, filter, items, loading, query } = params;

        // console.log('SharedMediaBase.onSearchNext', completed, loading);

        if (completed) return;
        if (loading) return;

        const fromMessageId = items.length > 0 ? items[items.length - 1].id : 0;
        params.loading = true;
        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query,
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT,
            filter
        }).finally(() => {
            params.loading = false;
        });

        const { messages } = result;
        params.items = items.concat(messages.filter(this.isValidMessage));
        params.completed = messages.length === 0 || messages.total_count === 0;
        const incompleteResults = loadIncomplete && messages.length > 0 && messages.length < SHARED_MESSAGE_SLICE_LIMIT;

        if (this.searchParams !== params) return;

        MessageStore.setItems(messages);
        const store = FileStore.getStore();
        loadMessageContents(store, messages);

        this.setState({ searchItems: params.items, searchMigratedItems: params.migratedItems });

        if (params.completed) {
            this.onSearchMigratedNext(params, true);
        } else if (incompleteResults) {
            this.onSearchNext(params, false);
        }
    };

    onSearchMigratedNext = async (params, loadIncomplete = true) => {
        const { migratedChatId } = this.props;
        const { filter, loading, migratedItems: items, migrateCompleted, query } = params;

        // console.log('SharedMediaBase.onSearchMigratedNext', migratedChatId, loading, migrateCompleted);

        if (!migratedChatId) return;
        if (loading) return;
        if (migrateCompleted) return;

        const fromMessageId = items.length > 0 ? items[items.length - 1].id : 0;
        params.loading = true;
        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: migratedChatId,
            query,
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT,
            filter
        }).finally(() => {
            params.loading = false;
        });

        const { messages } = result;
        params.migratedItems = items.concat(messages.filter(this.isValidMessage));
        params.migrateCompleted = messages.length === 0 || messages.total_count === 0;
        const incompleteResults = loadIncomplete && messages.length > 0 && messages.length < SHARED_MESSAGE_SLICE_LIMIT;

        if (this.searchParams !== params) return;

        MessageStore.setItems(messages);
        const store = FileStore.getStore();
        loadMessageContents(store, messages);

        this.setState({ searchItems: params.items, searchMigratedItems: params.migratedItems });

        if (incompleteResults) {
            this.onSearchMigratedNext(params, false);
        }
    };

    handleSearch = async text => {
        const query = text ? text.trim() : '';
        if (!query) {
            this.handleCloseSearch();
            return;
        }

        this.searchParams = {
            query,
            completed: false,
            migrateCompleted: false,
            items: [],
            migratedItems: [],
            filter: this.getSearchFilter()
        };
        this.onSearchNext(this.searchParams, true);
    };

    handleCloseSearch = () => {
        this.searchParams = null;
        this.setState({ searchItems: [], searchMigratedItems: [] });
    };

    isValidMessage = message => {
        if (!message) return false;

        return this.isValidContent(message.content);
    };

    render() {
        const { minHeight, onClose, popup } = this.props;
        const { items, migratedItems, searchItems, searchMigratedItems } = this.state;
        const { searchParams } = this;

        const messages = items.concat(migratedItems).map(x => this.getItemTemplate(x));
        const searchMessages = searchItems.concat(searchMigratedItems).map(x => this.getItemTemplate(x));

        return (
            <>
                <SharedMediaHeader
                    title={this.getHeader()}
                    onClick={this.handleHeaderClick}
                    onClose={onClose}
                    onSearch={this.hasSearch() ? this.handleSearch : null}
                    onCloseSearch={this.handleCloseSearch}
                />
                <div
                    ref={this.listRef}
                    className={classNames('shared-media-list', this.getListClassName())}
                    onScroll={this.handleScroll}
                    style={{ minHeight: popup ? minHeight : null }}>
                    {messages}
                </div>
                {Boolean(searchParams) && (
                    <div
                        ref={this.searchListRef}
                        className={classNames('shared-media-search-list', this.getSearchListClassName())}
                        onScroll={this.handleSearchScroll}>
                        {searchMessages}
                    </div>
                )}
            </>
        );
    }
}

SharedMediaBase.propTypes = {};

export default SharedMediaBase;
