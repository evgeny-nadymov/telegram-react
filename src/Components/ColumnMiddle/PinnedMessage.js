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
import ReplyTile from '../Tile/ReplyTile';
import { canPinMessages } from '../../Utils/Chat';
import { getContent, getReplyMinithumbnail, getReplyPhotoSize, isDeletedMessage } from '../../Utils/Message';
import { loadMessageContents } from '../../Utils/File';
import { openChat } from '../../Actions/Client';
import { modalManager } from '../../Utils/Modal';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './PinnedMessage.css';

class PinnedMessage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    static getDerivedStateFromProps(props, state) {
        const { prevPropsChatId } = state;
        const { chatId } = props;

        if (prevPropsChatId !== chatId) {
            const chat = ChatStore.get(chatId);
            return {
                prevPropsChatId: chatId,
                clientData: ChatStore.getClientData(chatId),
                messageId: chat && chat.pinned_message_id ? chat.pinned_message_id : 0,
                confirm: false
            };
        }

        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { messageId } = this.state;

        if (messageId && prevState.messageId !== messageId) {
            this.loadContent();
        }
    }

    componentDidMount() {
        this.loadContent();

        AppStore.on('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
        ChatStore.on('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        ChatStore.on('clientUpdateUnpin', this.onClientUpdateUnpin);
        ChatStore.on('updateChatPinnedMessage', this.onUpdateChatPinnedMessage);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateDialogsReady', this.onClientUpdateDialogsReady);
        ChatStore.off('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        ChatStore.off('clientUpdateUnpin', this.onClientUpdateUnpin);
        ChatStore.off('updateChatPinnedMessage', this.onUpdateChatPinnedMessage);
    }

    onClientUpdateUnpin = update => {
        const { chatId } = update;

        if (this.props.chatId !== chatId) return;

        this.handleDelete();
    };

    onClientUpdateDialogsReady = update => {
        const { messageId } = this.state;

        if (messageId) {
            this.loadContent();
        }
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
                        content: null
                    };

                    MessageStore.set(deletedMessage);
                    this.forceUpdate();
                }
            });
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, t, theme } = this.props;
        const { clientData, confirm, messageId } = this.state;

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

        if (nextState.messageId !== messageId) {
            return true;
        }

        return false;
    }

    handleClick = event => {
        const { chatId } = this.props;
        const { messageId } = this.state;

        if (!messageId) return;

        openChat(chatId, messageId);
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

        this.handleClose();

        TdLibController.send({
            '@type': 'unpinChatMessage',
            chat_id: chatId
        });
    };

    handleClose = () => {
        this.setState({ confirm: false });
    };

    render() {
        const { chatId, t } = this.props;
        const { messageId, confirm } = this.state;

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
                        <div className='pinned-message-title'>{t('PinnedMessage')}</div>
                        <div className='pinned-message-subtitle'>{content}</div>
                    </div>
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
