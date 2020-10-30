/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import ReplyTile from '../Tile/ReplyTile';
import PlaylistEditIcon from '../../Assets/Icons/PlaylistEdit';
import { canPinMessages } from '../../Utils/Chat';
import { getContent, getReplyMinithumbnail, getReplyPhotoSize, isDeletedMessage } from '../../Utils/Message';
import { loadMessageContents } from '../../Utils/File';
import { openChat } from '../../Actions/Client';
import { unpinMessage } from '../../Actions/Message';
import { modalManager } from '../../Utils/Modal';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './PinnedMessage.css';

class PinnedMessage extends React.Component {
    state = {};

    static getDerivedStateFromProps(props, state) {
        const { prevPropsChatId } = state;
        const { chatId } = props;

        if (prevPropsChatId !== chatId) {
            const media = MessageStore.getMedia(chatId);

            const pinned = media ? media.pinned : [];

            return {
                prevPropsChatId: chatId,
                clientData: ChatStore.getClientData(chatId),
                pinned,
                messageId: pinned && pinned.length > 0 ? pinned[0].id : 0,
                confirm: false
            };
        }

        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // const { messages } = this.state;

        // if (messages && prevState.messages !== messages) {
        //     this.loadContent();
        // }
    }

    componentDidMount() {
        ChatStore.on('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        ChatStore.on('clientUpdateUnpin', this.onClientUpdateUnpin);
        ChatStore.on('updateChatPinnedMessage', this.onUpdateChatPinnedMessage);
        MessageStore.on('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageIsPinned', this.onUpdateMessageIsPinned);
    }

    componentWillUnmount() {
        ChatStore.off('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        ChatStore.off('clientUpdateUnpin', this.onClientUpdateUnpin);
        ChatStore.off('updateChatPinnedMessage', this.onUpdateChatPinnedMessage);
        MessageStore.off('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateMessageIsPinned', this.onUpdateMessageIsPinned);
    }

    onUpdateMessageIsPinned = update => {
        const { chatId } = this.props;
        const { pinned } = this.state;
        const { chat_id, message_id, is_pinned } = update;
        if (chatId !== chat_id) {
            return;
        }
        if (!(pinned.some(x => x.id === message_id) || is_pinned)) {
            return;
        }

        this.setPinnedState();
    };

    onUpdateNewMessage = update => {
        const { chatId } = this.props;
        const { message } = update;
        if (chatId !== message.chat_id) {
            return;
        }
        if (!message.is_pinned) {
            return;
        }

        this.setPinnedState();
    };

    onUpdateDeleteMessages = update => {
        const { chatId } = this.props;
        const { pinned } = this.state;
        const { chat_id, is_permanent, message_ids } = update;
        const messageIds = new Map(message_ids.map(x => [x, x]));
        if (chatId !== chat_id) {
            return;
        }
        if (!pinned.some(x => messageIds.has(x.id))) {
            return;
        }
        if (!is_permanent) {
            return;
        }

        this.setPinnedState();
    };

    onUpdateMessageContent = update => {
        const { chatId } = this.props;
        const { pinned } = this.state;
        const { chat_id, message_id } = update;
        if (chatId !== chat_id) {
            return;
        }
        if (!pinned.some(x => x.id === message_id)) {
            return;
        }

        this.setPinnedState();
    };

    setPinnedState = () => {
        const { chatId } = this.props;
        const { messageId: currentMessageId } = this.state;

        const media = MessageStore.getMedia(chatId);
        const pinned = media ? media.pinned : [];

        let messageId = pinned.some(x => x.id === currentMessageId) ? currentMessageId : 0;
        if (!messageId && pinned.length > 0) {
            messageId = pinned[0].id;
        }

        this.setState({
            pinned,
            messageId
        });
    };

    onClientUpdateChatMedia = update => {
        const { chatId: currentChatId } = this.props;
        const { chatId } = update;
        if (chatId !== currentChatId) return;

        this.setPinnedState();
    };

    onClientUpdateUnpin = update => {
        const { chatId } = update;

        if (this.props.chatId !== chatId) return;

        this.handleDelete();
    };

    onClientUpdateSetChatClientData = update => {
        const { chatId, clientData } = update;

        if (this.props.chatId !== chatId) return;

        this.setState({ clientData });
    };

    onUpdateChatPinnedMessage = update => {
        const { chat_id, pinned_message_id: messageId } = update;
        const { chatId } = this.props;

        if (chatId !== chat_id) return;

        this.setState({ messageId });
    };

    loadContent = () => {
        const { chatId } = this.props;
        const { messageId } = this.state;

        if (!chatId) return;
        if (!messageId) return;

        const message = MessageStore.get(chatId, messageId);
        if (message) return;

        TdLibController.send({
            '@type': 'getMessage',
            chat_id: chatId,
            message_id: messageId
        })
            .then(result => {
                MessageStore.set(result);

                const store = FileStore.getStore();
                loadMessageContents(store, [result]);

                this.forceUpdate();
            })
            .catch(error => {
                const { code, message } = error;
                if (message !== 'Chat not found') {
                    const deletedMessage = {
                        '@type': 'deletedMessage',
                        chat_id: chatId,
                        id: messageId,
                        sender: { },
                        content: null
                    };

                    MessageStore.set(deletedMessage);
                    this.forceUpdate();
                }
            });
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, t, theme } = this.props;
        const { clientData, confirm, pinned, messageId } = this.state;

        if (nextProps.t !== t) {
            return true;
        }

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextState.clientData !== clientData) {
            return true;
        }

        if (nextState.confirm !== confirm) {
            return true;
        }

        if (nextState.pinned !== pinned) {
            return true;
        }

        if (nextState.messageId !== messageId) {
            return true;
        }

        return false;
    }

    handleClick = event => {
        const { chatId } = this.props;
        const { pinned, messageId } = this.state;

        if (!messageId) return;
        if (event.nativeEvent.which !== 1) return;

        openChat(chatId, messageId);

        if (pinned.length > 0) {
            let index = pinned.findIndex(x => x.id === messageId);
            if (index !== -1) {
                index = index >= pinned.length - 1 ? 0 : index + 1;
                this.setState({
                    messageId: pinned[index].id
                })
            }
        }
    };

    handleDelete = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { chatId } = this.props;
        const { messageId } = this.state;

        const canPin = canPinMessages(chatId);
        if (canPin) {
            this.setState({ confirm: true });
        } else {
            const data = ChatStore.getClientData(chatId);
            await TdLibController.clientUpdate({
                '@type': 'clientUpdateSetChatClientData',
                chatId: chatId,
                clientData: Object.assign({}, data, { unpinned_message_id: messageId })
            });
        }
    };

    handleUnpin = async () => {
        const { chatId } = this.props;
        const { messageId } = this.state;

        this.handleClose();

        unpinMessage(chatId, messageId);
    };

    handleClose = () => {
        this.setState({ confirm: false });
    };

    handleMouseDown = event => {
        event.stopPropagation();
    };

    handleEditClick = event => {

    };

    render() {
        const { chatId, t } = this.props;
        const { messageId, pinned, confirm } = this.state;

        if (!chatId) return null;

        const { unpinned_message_id } = ChatStore.getClientData(chatId);
        if (unpinned_message_id === messageId) return null;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        let content = !message ? t('Loading') : getContent(message, t);
        const photoSize = getReplyPhotoSize(chatId, messageId);
        const minithumbnail = getReplyMinithumbnail(chatId, messageId);

        if (isDeletedMessage(message)) {
            content = t('DeletedMessage');
        }

        let caption = t('PinnedMessage');
        if (pinned && pinned.length > 1) {
            const index = pinned ? pinned.findIndex(x => x.id === messageId) : -1;
            if (pinned.length === 2) {
                caption = index === 1 ? t('PreviousPinnedMessage') : t('PinnedMessage');
            } else {
                caption = t('PinnedMessage') + (index > 0 ? ` #${pinned.length - index}` : '');
            }
        }

        return (
            <>
                <div className='pinned-message' onMouseDown={this.handleClick}>
                    <div className='border reply-border' />
                    {photoSize && (
                        <ReplyTile
                            chatId={chatId}
                            messageId={messageId}
                            photoSize={photoSize}
                            minithumbnail={minithumbnail}
                        />
                    )}
                    <div className='pinned-message-content'>
                        <div className='pinned-message-title'>{caption}</div>
                        <div className='pinned-message-subtitle'>{content}</div>
                    </div>
                    { pinned.length > 1 && (
                        <IconButton
                            className='header-right-second-button'
                            aria-label='Edit'
                            onClick={this.handleEditClick}
                            onMouseDown={this.handleMouseDown}>
                            <PlaylistEditIcon />
                        </IconButton>
                    )}
                </div>
                {confirm && (
                    <Dialog
                        manager={modalManager}
                        transitionDuration={0}
                        open
                        onClose={this.handleClose}
                        aria-labelledby='unpin-message-confirmation'>
                        <DialogTitle id='unpin-message-confirmation'>{t('Confirm')}</DialogTitle>
                        <DialogContent>
                            <DialogContentText>{t('UnpinMessageAlert')}</DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.handleClose} color='primary'>
                                {t('Cancel')}
                            </Button>
                            <Button onClick={this.handleUnpin} color='primary'>
                                {t('Ok')}
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}
            </>
        );
    }
}

PinnedMessage.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(PinnedMessage);
