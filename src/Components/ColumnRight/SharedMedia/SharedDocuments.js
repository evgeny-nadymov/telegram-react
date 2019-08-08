/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SharedDocument from '../../Tile/SharedMedia/SharedDocument';
import { between } from '../../../Utils/Common';
import { isSupergroup } from '../../../Utils/Chat';
import { loadMessageContents } from '../../../Utils/File';
import { SHARED_MESSAGE_SLICE_LIMIT } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import TdLibController from '../../../Controllers/TdLibController';
import './SharedDocuments.css';

const styles = {
    headerBackButton: {
        margin: '8px -2px 8px 12px'
    }
};

function SharedDocumentHeader({ classes, title, onClick, onClose }) {
    return (
        <div className='header-master'>
            <IconButton className={classes.headerBackButton} onClick={onClose}>
                <ArrowBackIcon />
            </IconButton>
            <div className='header-status grow cursor-pointer' onClick={onClick}>
                <span className='header-status-content'>{title}</span>
            </div>
        </div>
    );
}

class SharedDocuments extends React.Component {
    constructor(props) {
        console.log('SharedDocuments.ctor');
        super(props);

        this.listRef = React.createRef();

        this.state = {
            items: [],
            migratedItems: []
        };
    }

    componentDidMount() {
        this.loadContent();

        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
    }

    componentWillUnmount() {
        MessageStore.removeListener('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.removeListener('updateNewMessage', this.onUpdateNewMessage);
    }

    isDocumentMessage = message => {
        if (!message) return false;

        const { content } = message;
        if (!content) return false;

        return content['@type'] === 'messageDocument';
    };

    insertByOrder = (array, element, comparator) => {
        let i = 0;
        for (; i < array.length && comparator(array[i], element) < 0; i++) {}

        return [...array.slice(0, i), element, ...array.slice(i)];
    };

    messageComparatorDesc = (left, right) => {
        return left.id - right.id;
    };

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
            if (new_content['@type'] === 'messageDocument') {
                if (index === -1) {
                    // add new document
                    this.setState({ items: this.insertByOrder(items, message, this.messageComparatorDesc) });
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
            if (new_content['@type'] === 'messageDocument') {
                if (index === -1) {
                    // add new document
                    this.setState({
                        migratedItems: this.insertByOrder(migratedItems, message, this.messageComparatorDesc)
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
        const { chat_id, content } = message;

        if (chat_id !== chatId) return;
        // console.log(`SharedDocuments.onUpdateNewMessage chat_id=${chat_id} message_id=${message.id}`, this.state.items);

        if (content['@type'] !== 'messageDocument') return;

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
                this.onLoadNext();
            }
        };

        if (chat_id === chatId) {
            this.setState({ items: items.filter(x => !map.has(x.id)) }, callback);
        } else if (chat_id === migratedChatId) {
            this.setState({ migratedItems: migratedItems.filter(x => !map.has(x.id)) }, callback);
        }
    };

    loadContent = () => {
        this.onLoadNext();
    };

    onLoadMigratedNext = async (loadIncomplete = true) => {
        const { chatId, migratedChatId } = this.props;
        const { migratedItems: items } = this.state;

        if (!isSupergroup(chatId)) return;
        if (!migratedChatId) return;

        if (this.loading) return;
        if (this.migrateCompleted) return;

        const fromMessageId = items.length > 0 ? items[items.length - 1].id : 0;
        this.loading = true;
        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: migratedChatId,
            query: '',
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT,
            filter: { '@type': 'searchMessagesFilterDocument' }
        }).finally(() => {
            this.loading = false;
        });

        if (this.state.migratedItems !== items) return;

        this.migrateCompleted = result.messages.length === 0;
        if (this.migrateCompleted) return;

        MessageStore.setItems(result.messages);

        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);

        this.setState({ migratedItems: items.concat(result.messages.filter(this.isDocumentMessage)) });

        const incomplete = result.messages.length > 0 && result.messages.length < SHARED_MESSAGE_SLICE_LIMIT;
        if (loadIncomplete && incomplete) {
            this.onLoadMigratedNext(false);
        }
    };

    onLoadNext = async (loadIncomplete = true) => {
        // console.log('SharedDocuments.onLoadNext');
        const { chatId } = this.props;
        const { items } = this.state;

        if (this.loading) return;
        if (this.completed) return;

        const fromMessageId = items.length > 0 ? items[items.length - 1].id : 0;
        this.loading = true;
        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT,
            filter: { '@type': 'searchMessagesFilterDocument' }
        }).finally(() => {
            this.loading = false;
        });

        if (this.state.items !== items) return;

        this.completed = result.messages.length === 0;
        if (this.completed) {
            this.onLoadMigratedNext(true);
            return;
        }

        MessageStore.setItems(result.messages);

        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);

        this.setState({ items: items.concat(result.messages.filter(this.isDocumentMessage)) });

        const incomplete = result.messages.length > 0 && result.messages.length < SHARED_MESSAGE_SLICE_LIMIT;
        if (loadIncomplete && incomplete) {
            this.onLoadNext(false);
        }
    };

    handleScroll = () => {
        const list = this.listRef.current;
        if (!list) return;

        if (list.scrollTop + list.offsetHeight >= list.scrollHeight) {
            if (!this.completed) {
                this.onLoadNext();
            } else {
                this.onLoadMigratedNext();
            }
        }
    };

    handleHeaderClick = () => {
        const list = this.listRef.current;
        if (!list) return;

        list.scrollTop = 0;
    };

    render() {
        const { classes, t, onClose } = this.props;
        const { items, migratedItems } = this.state;
        // console.log('SharedDocuments.render', items, migratedItems, this.state);

        const messages = items
            .concat(migratedItems)
            .map(x => (
                <SharedDocument key={`chat_id=${x.chat_id}_message_id=${x.id}`} chatId={x.chat_id} messageId={x.id} />
            ));

        return (
            <>
                <SharedDocumentHeader
                    classes={classes}
                    title={t('DocumentsTitle')}
                    onClick={this.handleHeaderClick}
                    onClose={onClose}
                />
                <div ref={this.listRef} className='shared-documents-list' onScroll={this.handleScroll}>
                    {messages}
                </div>
            </>
        );
    }
}

SharedDocuments.propTypes = {
    chatId: PropTypes.number.isRequired,
    migratedChatId: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    popup: PropTypes.bool,
    minHeight: PropTypes.number
};

SharedDocuments.defaultProps = {
    popup: false,
    minHeight: 0
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(SharedDocuments);
