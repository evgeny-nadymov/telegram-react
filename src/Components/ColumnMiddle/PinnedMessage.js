/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import CSSTransition from 'react-transition-group/CSSTransition';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ReplyTile from '../Tile/ReplyTile';
import PlaylistEditIcon from '../../Assets/Icons/PlaylistEdit';
import { getContent, getReplyMinithumbnail, getReplyPhotoSize, isDeletedMessage } from '../../Utils/Message';
import { openChat } from '../../Actions/Client';
import ChatStore from '../../Stores/ChatStore';
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

            const messageId = pinned && pinned.length > 0 ? pinned[0].id : 0;
            const photoSize = getReplyPhotoSize(chatId, messageId);
            const minithumbnail = getReplyMinithumbnail(chatId, messageId);

            return {
                prevPropsChatId: chatId,
                clientData: ChatStore.getClientData(chatId),
                pinned,
                messageId,
                photoSize,
                minithumbnail,
                lastPhoto: {
                    messageId,
                    photoSize,
                    minithumbnail
                }
            };
        }

        return null;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        MessageStore.on('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageIsPinned', this.onUpdateMessageIsPinned);
    }

    componentWillUnmount() {
        ChatStore.off('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        MessageStore.off('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateMessageIsPinned', this.onUpdateMessageIsPinned);
    }

    onUpdateMessageIsPinned = update => {
        const { chatId } = this.props;
        const { chat_id } = update;
        if (chatId !== chat_id) {
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

        const clientData = ChatStore.getClientData(chatId);

        const media = MessageStore.getMedia(chatId);
        const pinned = media ? media.pinned : [];

        let messageId = pinned.some(x => x.id === currentMessageId) ? currentMessageId : 0;
        if (!messageId && pinned.length > 0) {
            messageId = pinned[0].id;
        }
        const photoSize = getReplyPhotoSize(chatId, messageId);
        const minithumbnail = getReplyMinithumbnail(chatId, messageId);

        this.setState({
            clientData,
            pinned,
            messageId,
            photoSize,
            minithumbnail,
            lastPhoto: {
                messageId,
                photoSize,
                minithumbnail
            }
        });
    };

    onClientUpdateChatMedia = update => {
        const { chatId: currentChatId } = this.props;
        const { chatId } = update;
        if (chatId !== currentChatId) return;

        this.setPinnedState();
    };

    onClientUpdateSetChatClientData = update => {
        const { chatId, clientData } = update;

        if (this.props.chatId !== chatId) return;

        this.setState({ clientData });
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId } = this.props;
        const { clientData, pinned, messageId } = this.state;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextState.clientData !== clientData) {
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
        const { pinned, messageId, photoSize, minithumbnail } = this.state;

        if (!messageId) return;
        if (event.nativeEvent.which !== 1) return;

        openChat(chatId, messageId);

        if (pinned.length > 0) {
            let index = pinned.findIndex(x => x.id === messageId);
            if (index !== -1) {
                index = index >= pinned.length - 1 ? 0 : index + 1;

                const nextMessageId = pinned[index].id;
                const nextPhotoSize = getReplyPhotoSize(chatId, nextMessageId);
                const nextMinithumbnail = getReplyMinithumbnail(chatId, nextMessageId);

                const lastPhoto = nextPhotoSize ? {
                    messageId: nextMessageId,
                    photoSize: nextPhotoSize,
                    minithumbnail: nextMinithumbnail
                } : {
                    messageId,
                    photoSize,
                    minithumbnail
                }

                this.setState({
                    messageId: nextMessageId,
                    photoSize: nextPhotoSize,
                    minithumbnail: nextMinithumbnail,
                    lastPhoto
                })
            }
        }
    };

    handleMouseDown = event => {
        event.stopPropagation();
    };

    handleEditClick = event => {
        const { chatId } = this.props;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateOpenPinned',
            chatId
        })
    };

    render() {
        const { chatId, t } = this.props;
        const { messageId, pinned, photoSize, minithumbnail, lastPhoto, clientData } = this.state;

        if (!chatId) return null;

        if (clientData) {
            const { unpinned } = clientData;
            if (unpinned) return null;
        }

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        let content = !message ? t('Loading') : getContent(message, t);

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
                <ListItem button className={classNames('pinned-message', { 'pinned-message-photo': photoSize })} onMouseDown={this.handleClick}>
                    <div className='border reply-border' />
                    <CSSTransition
                        in={!!photoSize}
                        classNames='pinned-message-tile'
                        timeout={150}
                        mountOnEnter={true}
                        unmountOnExit={true}>
                        <div>
                            <ReplyTile
                                chatId={chatId}
                                messageId={lastPhoto ? lastPhoto.messageId : null}
                                photoSize={lastPhoto ? lastPhoto.photoSize : null}
                                minithumbnail={lastPhoto ? lastPhoto.minithumbnail : null}
                            />
                        </div>
                    </CSSTransition>
                    <div className='pinned-message-content'>
                        <div className='pinned-message-title'>{caption}</div>
                        <div className='pinned-message-subtitle'>{content}</div>
                    </div>
                    { pinned.length > 1 && (
                        <IconButton
                            className='pinned-message-edit-button'
                            aria-label='Edit'
                            onClick={this.handleEditClick}
                            onMouseDown={this.handleMouseDown}>
                            <PlaylistEditIcon />
                        </IconButton>
                    )}
                </ListItem>
            </>
        );
    }
}

PinnedMessage.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(PinnedMessage);
