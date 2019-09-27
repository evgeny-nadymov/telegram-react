/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { withSnackbar } from 'notistack';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import CloseIcon from '@material-ui/icons/Close';
import ForwardTargetChat from '../Tile/ForwardTargetChat';
import { canSendMessages, getChatTitle, getChatUsername, isSupergroup } from '../../Utils/Chat';
import { loadChatsContent } from '../../Utils/File';
import { getCyrillicInput, getLatinInput } from '../../Utils/Language';
import { getInputMediaContent } from '../../Utils/Media';
import { borderStyle } from '../Theme';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';
import './ForwardDialog.css';

const styles = theme => ({
    close: {
        padding: theme.spacing.unit / 2
    },
    dialog: {
        color: theme.palette.text.primary
    },
    dialogContent: {
        padding: 0,
        display: 'flex',
        position: 'relative'
    },
    searchList: {
        background: theme.palette.background.paper
    },
    ...borderStyle(theme)
});

class ForwardDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            chatIds: [],
            savedMessages: null
        };

        this.searchRef = React.createRef();
        this.messageRef = React.createRef();

        this.targetChats = new Map();
    }

    componentDidMount() {
        this.loadContent();

        this.setSearchFocus();
    }

    loadContent = async () => {
        this.getPublicMessageLink();

        const promises = [];
        const getChatsPromise = TdLibController.send({
            '@type': 'getChats',
            offset_order: '9223372036854775807',
            offset_chat_id: 0,
            limit: 100
        });
        promises.push(getChatsPromise);

        const savedMessagesPromise = TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: UserStore.getMyId(),
            force: true
        });
        promises.push(savedMessagesPromise);

        const [chats, savedMessages] = await Promise.all(promises.map(x => x.catch(e => null)));

        this.setState({
            chatIds: chats.chat_ids,
            savedMessages: savedMessages
        });

        const store = FileStore.getStore();
        loadChatsContent(store, chats.chat_ids);
    };

    getPublicMessageLink = async () => {
        const { chatId, messageIds } = this.props;
        if (!chatId) return;
        if (!messageIds) return;
        if (messageIds.length > 1) return;
        if (!isSupergroup(chatId)) return;
        if (!getChatUsername(chatId)) return;

        const result = await TdLibController.send({
            '@type': 'getPublicMessageLink',
            chat_id: chatId,
            message_id: messageIds[0],
            for_album: false
        });

        this.setState({
            publicMessageLink: result
        });
    };

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateForward',
            info: null
        });
    };

    handleCopyLink = () => {
        const { t } = this.props;
        const { publicMessageLink } = this.state;

        if (!publicMessageLink) return;
        if (!publicMessageLink.link) return;

        const key = `copy_link_${publicMessageLink.link}`;
        const message = t('LinkCopied');
        const action = null;

        copy(publicMessageLink.link);

        this.handleScheduledAction(key, message, action);
    };

    handleScheduledAction = (key, message, action) => {
        if (!key) return;

        const { enqueueSnackbar, classes } = this.props;
        if (!enqueueSnackbar) return;

        const TRANSITION_DELAY = 150;
        if (
            ApplicationStore.addScheduledAction(key, NOTIFICATION_AUTO_HIDE_DURATION_MS + 2 * TRANSITION_DELAY, action)
        ) {
            enqueueSnackbar(message, {
                autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
                action: [
                    <IconButton
                        key='close'
                        aria-label='Close'
                        color='inherit'
                        className={classes.close}
                        onClick={() => ApplicationStore.removeScheduledAction(key)}>
                        <CloseIcon />
                    </IconButton>
                ]
            });
        }
    };

    getForwardPhotoSize = (chatId, messageIds) => {
        if (messageIds.length !== 1) return null;

        const message = MessageStore.get(chatId, messageIds[0]);
        if (!message) return null;

        const { can_be_forwarded, content } = message;
        if (!can_be_forwarded && content['@type'] === 'messageChatChangePhoto') {
            const { photo } = content;
            if (!photo) return null;

            const { sizes } = photo;
            if (sizes && sizes.length) {
                return sizes[sizes.length - 1];
            }
        }

        return null;
    };

    handleSend = () => {
        this.handleClose();

        const { chatId, messageIds, photoSize, media, link } = this.props;
        if (!chatId && !messageIds && !messageIds && !photoSize && !media && !link) return;

        const text = this.getInnerText(this.messageRef.current);

        this.targetChats.forEach(targetChatId => {
            if (media) {
                const content = getInputMediaContent(media, text);
                if (content) {
                    TdLibController.send({
                        '@type': 'sendMessage',
                        chat_id: targetChatId,
                        reply_to_message_id: 0,
                        disable_notifications: false,
                        from_background: false,
                        reply_markup: null,
                        input_message_content: content
                    });
                }

                return;
            }

            if (link) {
                if (text) {
                    TdLibController.send({
                        '@type': 'sendMessage',
                        chat_id: targetChatId,
                        reply_to_message_id: 0,
                        disable_notifications: false,
                        from_background: false,
                        reply_markup: null,
                        input_message_content: {
                            '@type': 'inputMessageText',
                            text: {
                                '@type': 'formattedText',
                                text: text,
                                entities: null
                            },
                            disable_web_page_preview: true,
                            clear_draft: false
                        }
                    });
                }

                TdLibController.send({
                    '@type': 'sendMessage',
                    chat_id: targetChatId,
                    reply_to_message_id: 0,
                    disable_notifications: false,
                    from_background: false,
                    reply_markup: null,
                    input_message_content: {
                        '@type': 'inputMessageText',
                        text: {
                            '@type': 'formattedText',
                            text: link,
                            entities: null
                        },
                        disable_web_page_preview: true,
                        clear_draft: false
                    }
                });

                return;
            }

            const size = photoSize || this.getForwardPhotoSize(chatId, messageIds);
            if (size) {
                const { width, height, photo } = size;

                TdLibController.send({
                    '@type': 'sendMessage',
                    chat_id: targetChatId,
                    reply_to_message_id: 0,
                    disable_notifications: false,
                    from_background: false,
                    reply_markup: null,
                    input_message_content: {
                        '@type': 'inputMessagePhoto',
                        photo: {
                            '@type': 'inputFileId',
                            id: photo.id
                        },
                        thumbnail: null,
                        added_sticker_file_ids: [],
                        width: width,
                        height: height,
                        caption: {
                            '@type': 'formattedText',
                            text: text,
                            entities: null
                        },
                        ttl: 0
                    }
                });

                return;
            }

            if (text) {
                TdLibController.send({
                    '@type': 'sendMessage',
                    chat_id: targetChatId,
                    reply_to_message_id: 0,
                    disable_notifications: false,
                    from_background: false,
                    reply_markup: null,
                    input_message_content: {
                        '@type': 'inputMessageText',
                        text: {
                            '@type': 'formattedText',
                            text: text,
                            entities: null
                        },
                        disable_web_page_preview: true,
                        clear_draft: false
                    }
                });
            }

            TdLibController.send({
                '@type': 'forwardMessages',
                chat_id: targetChatId,
                from_chat_id: chatId,
                message_ids: messageIds,
                disable_notifications: false,
                from_background: false,
                as_album: false
            });
        });
    };

    handleChangeSelection = chatId => {
        if (this.targetChats.has(chatId)) {
            this.targetChats.delete(chatId);
        } else {
            this.targetChats.set(chatId, chatId);
        }

        console.log(this.targetChats);

        this.forceUpdate();
    };

    getInnerText = div => {
        const innerText = div.innerText;
        const innerHTML = div.innerHTML;

        if (innerText && innerText === '\n' && innerHTML && (innerHTML === '<br>' || innerHTML === '<div><br></div>')) {
            div.innerHTML = '';
        }

        return innerText;
    };

    handleSearchKeyDown = event => {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    };

    handleSearchKeyUp = () => {
        const { chatIds, savedMessages } = this.state;

        const innerHTML = this.searchRef.current.innerHTML;
        if (innerHTML && (innerHTML === '<br>' || innerHTML === '<div><br></div>')) {
            this.searchRef.current.innerHTML = '';
        }

        const innerText = this.getInnerText(this.searchRef.current).trim();
        if (!innerText) {
            this.setState({ searchText: null, searchResults: [] });
            return;
        }

        const latinText = getLatinInput(innerText);
        const cyrillicText = getCyrillicInput(innerText);

        const chatsSource = savedMessages
            ? [savedMessages.id].concat(chatIds.filter(x => x !== savedMessages.id)).filter(x => canSendMessages(x))
            : chatIds;

        const searchResults = chatsSource.filter(
            x =>
                this.hasSearchText(x, innerText) ||
                (latinText && this.hasSearchText(x, latinText)) ||
                (cyrillicText && this.hasSearchText(x, cyrillicText))
        );

        this.setState({ searchText: innerText, searchResults: searchResults });
    };

    handleSearchPaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertHTML', false, plainText);
        }
    };

    handleMessageKeyUp = () => {
        const innerHTML = this.messageRef.current.innerHTML;
        if (innerHTML && (innerHTML === '<br>' || innerHTML === '<div><br></div>')) {
            this.messageRef.current.innerHTML = '';
        }
    };

    handleMessagePaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertHTML', false, plainText);
        }
    };

    hasSearchText = (chatId, searchText) => {
        const { t } = this.props;
        const { savedMessages } = this.state;

        if (savedMessages && chatId === savedMessages.id) {
            const title = getChatTitle(chatId, true, t) || '';
            if (title.toLocaleLowerCase().indexOf(searchText.toLowerCase()) !== -1) {
                return true;
            }
        }

        const title1 = getChatTitle(chatId, false, t) || '';
        if (title1.toLocaleLowerCase().indexOf(searchText.toLowerCase()) !== -1) {
            return true;
        }

        const username = getChatUsername(chatId) || '';
        if (username.toLocaleLowerCase().indexOf(searchText.toLowerCase()) !== -1) {
            return true;
        }

        return false;
    };

    setSearchFocus = () => {
        setTimeout(() => {
            if (this.searchRef.current) {
                const element = this.searchRef.current;

                element.focus();
            }
        }, 100);
    };

    render() {
        const { classes, t } = this.props;
        const { chatIds, searchText, searchResults, savedMessages, publicMessageLink } = this.state;

        const chatsSource = savedMessages
            ? [savedMessages.id].concat(chatIds.filter(x => x !== savedMessages.id)).filter(x => canSendMessages(x))
            : chatIds;

        const chats = chatsSource.map(x => (
            <ForwardTargetChat
                key={x}
                chatId={x}
                selected={this.targetChats.has(x)}
                onSelect={() => this.handleChangeSelection(x)}
            />
        ));

        const foundChats = (searchResults || []).map(x => (
            <ForwardTargetChat
                key={x}
                chatId={x}
                selected={this.targetChats.has(x)}
                onSelect={() => this.handleChangeSelection(x)}
            />
        ));

        return (
            <Dialog
                open
                onClose={this.handleClose}
                aria-labelledby='forward-dialog-title'
                aria-describedby='forward-dialog-description'
                className={classes.dialog}>
                <DialogTitle id='forward-dialog-title'>{t('ShareSendTo')}</DialogTitle>
                <div
                    ref={this.searchRef}
                    id='forward-dialog-search'
                    contentEditable
                    suppressContentEditableWarning
                    placeholder={t('Search')}
                    onKeyDown={this.handleSearchKeyDown}
                    onKeyUp={this.handleSearchKeyUp}
                    onPaste={this.handleSearchPaste}
                />
                <div className={classNames(classes.borderColor, 'forward-dialog-content')}>
                    <div className='forward-dialog-list'>{chats}</div>
                    {searchText && (
                        <div className={classNames(classes.searchList, 'forward-dialog-search-list')}>{foundChats}</div>
                    )}
                </div>
                {this.targetChats.size > 0 && (
                    <div
                        ref={this.messageRef}
                        id='forward-dialog-message'
                        contentEditable
                        suppressContentEditableWarning
                        placeholder={t('ShareComment')}
                        onKeyUp={this.handleMessageKeyUp}
                        onPaste={this.handleMessagePaste}
                    />
                )}
                <DialogActions>
                    <Button onClick={this.handleClose} color='primary'>
                        {t('Cancel')}
                    </Button>
                    {this.targetChats.size > 0 && (
                        <Button onClick={this.handleSend} color='primary' autoFocus>
                            {t('Send')}
                        </Button>
                    )}
                    {!this.targetChats.size && publicMessageLink && (
                        <Button onClick={this.handleCopyLink} color='primary'>
                            {t('CopyLink')}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        );
    }
}

ForwardDialog.propTypes = {
    chatId: PropTypes.number,
    messageIds: PropTypes.array,
    photoSize: PropTypes.object,
    media: PropTypes.object
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation(),
    withSnackbar
);

export default enhance(ForwardDialog);
