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
import { getContent, getReplyMinithumbnail, getReplyThumbnail, isDeletedMessage } from '../../Utils/Message';
import { openChat } from '../../Actions/Client';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './PinnedMessage.css';
import AnimatedCounter from './AnimatedCounter';
import PinnedMessageBorder from './PinnedMessageBorder';

class PinnedMessage extends React.Component {
    state = {};

    static getDerivedStateFromProps(props, state) {
        const { prevPropsChatId } = state;
        const { chatId } = props;

        if (prevPropsChatId !== chatId) {
            const media = MessageStore.getMedia(chatId);

            const pinned = media ? media.pinned : [];

            const messageId = pinned && pinned.length > 0 ? pinned[0].id : 0;
            const thumbnail = getReplyThumbnail(chatId, messageId);
            const minithumbnail = getReplyMinithumbnail(chatId, messageId);

            return {
                prevPropsChatId: chatId,
                clientData: ChatStore.getClientData(chatId),
                pinned,
                prevMessageId: 0,
                messageId,
                minithumbnail,
                thumbnail,
                lastPhoto: {
                    messageId,
                    minithumbnail,
                    thumbnail
                }
            };
        }

        return null;
    }

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

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId } = this.props;
        const { prevMessageId, messageId } = this.state;

        if (prevProps.chatId !== chatId) {
            this.animateText(messageId, prevMessageId, 0);
        }
    }

    componentDidMount() {
        ChatStore.on('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        MessageStore.on('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.on('clientUpdateCurrentPinnedMessage', this.onClientUpdateCurrentPinnedMessage);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageIsPinned', this.onUpdateMessageIsPinned);
    }

    componentWillUnmount() {
        ChatStore.off('clientUpdateSetChatClientData', this.onClientUpdateSetChatClientData);
        MessageStore.off('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.off('clientUpdateCurrentPinnedMessage', this.onClientUpdateCurrentPinnedMessage);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateMessageIsPinned', this.onUpdateMessageIsPinned);
    }

    onClientUpdateCurrentPinnedMessage = update => {
        const { chatId } = this.props;
        if (chatId !== update.chatId) {
            return;
        }

        this.scrollToMessageId(update.messageId);
    };

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

    animateText = (messageId, prevMessageId, duration = 250) => {
        const textElement = document.getElementById('pinned-message-animated-text');
        const text1Element = document.getElementById('pinned-message-animated-text-1');
        const text2Element = document.getElementById('pinned-message-animated-text-2');
        if (!textElement || !text1Element || !text2Element) return;

        const timingFunction = 'ease-in-out';

        const scrollDown = prevMessageId === 0 || messageId < prevMessageId;
        if (scrollDown) {
            textElement.style.cssText = 'transform: translateY(-19px)';
            text1Element.style.cssText = 'opacity: 0';
            text2Element.style.cssText = 'opacity: 1';
            requestAnimationFrame(() => {
                textElement.style.cssText = `transform: translateY(0); transition: transform ${duration}ms ${timingFunction}`;
                text1Element.style.cssText = `opacity: 1; transition: opacity ${duration}ms ${timingFunction}`;
                text2Element.style.cssText = `opacity: 0; transition: opacity ${duration}ms ${timingFunction}`;
            });
        } else {
            textElement.style.cssText = 'transform: translateY(0px)';
            text1Element.style.cssText = 'opacity: 1';
            text2Element.style.cssText = 'opacity: 0';
            requestAnimationFrame(() => {
                textElement.style.cssText = `transform: translateY(-19px); transition: transform ${duration}ms ${timingFunction}`;
                text1Element.style.cssText = `opacity: 0; transition: opacity ${duration}ms ${timingFunction}`;
                text2Element.style.cssText = `opacity: 1; transition: opacity ${duration}ms ${timingFunction}`;
            });
        }
    };

    setPinnedState = () => {
        const { chatId } = this.props;
        const { messageId: currentMessageId, prevMessageId: currentPrevMessageId } = this.state;

        const clientData = ChatStore.getClientData(chatId);

        const media = MessageStore.getMedia(chatId);
        const pinned = media ? media.pinned : [];

        let messageId = pinned.some(x => x.id === currentMessageId) ? currentMessageId : 0;
        if (!messageId && pinned.length > 0) {
            messageId = pinned[0].id;
        }
        let prevMessageId = currentMessageId === messageId ? currentPrevMessageId : currentMessageId;

        const thumbnail = getReplyThumbnail(chatId, messageId);
        const minithumbnail = getReplyMinithumbnail(chatId, messageId);

        MessageStore.currentPinned = { chatId, id: messageId };
        this.setState({
            clientData,
            pinned,
            prevMessageId,
            messageId,
            thumbnail,
            minithumbnail,
            lastPhoto: {
                messageId,
                thumbnail,
                minithumbnail
            }
        }, () => {
            if (this.state.prevMessageId === 0) return;
            if (currentMessageId === this.state.messageId) return;

            this.animateText(this.state.messageId, this.state.prevMessageId);
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

    scrollToMessageId = nextMessageId => {
        const { chatId } = this.props;
        const { messageId, thumbnail, minithumbnail } = this.state;

        const nextThumbnail = getReplyThumbnail(chatId, nextMessageId);
        const nextMinithumbnail = getReplyMinithumbnail(chatId, nextMessageId);

        const lastPhoto = nextThumbnail ? {
            messageId: nextMessageId,
            thumbnail: nextThumbnail,
            minithumbnail: nextMinithumbnail
        } : {
            messageId,
            thumbnail,
            minithumbnail
        }

        MessageStore.currentPinned = { chatId, id: messageId };
        this.setState({
            prevMessageId: messageId,
            messageId: nextMessageId,
            thumbnail: nextThumbnail,
            minithumbnail: nextMinithumbnail,
            lastPhoto
        }, () => {
            if (this.state.prevMessageId === 0) return;
            if (messageId === this.state.messageId) return;

            this.animateText(this.state.messageId, this.state.prevMessageId);
        });
    };

    handleClick = event => {
        const { chatId } = this.props;
        const { pinned, messageId } = this.state;
        if (!pinned.length) return;

        if (!messageId) return;
        if (event.nativeEvent.which !== 1) return;

        MessageStore.clickedPinned = { chatId, id: messageId };

        openChat(chatId, messageId);

        const index = pinned.findIndex(x => x.id === messageId);
        if (index === -1) return;

        const nextIndex = index >= pinned.length - 1 ? 0 : index + 1;

        this.scrollToMessageId(pinned[nextIndex].id);
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
        const { messageId, prevMessageId, pinned, thumbnail, minithumbnail, lastPhoto, clientData } = this.state;

        if (!chatId) return null;

        if (clientData) {
            const { unpinned } = clientData;
            if (unpinned) return null;
        }

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const prevMessage = MessageStore.get(chatId, prevMessageId);

        let content = !message ? t('Loading') : getContent(message, t);
        if (isDeletedMessage(message)) {
            content = t('DeletedMessage');
        }

        let prevContent = !prevMessage ? '' : getContent(prevMessage, t);
        if (isDeletedMessage(prevMessage)) {
            content = t('DeletedMessage');
        }

        let index = 0;
        let caption = t('PinnedMessage');
        if (pinned && pinned.length > 1) {
            index = pinned ? pinned.findIndex(x => x.id === messageId) : -1;
            if (pinned.length === 2) {
                caption = index === 1 ? t('PreviousPinnedMessage') : t('PinnedMessage');
            } else {
                caption = (
                    <>
                        {t('PinnedMessage')}
                        {index > 0 && (
                            <>
                                {' #'}
                                <AnimatedCounter counter={pinned.length - index} height={19} reverse={true}/>
                            </>)
                        }
                    </>);
            }
        }

        const scrollDown = prevMessageId === 0 || messageId < prevMessageId;

        return (
            <>
                <ListItem button className={classNames('pinned-message', { 'pinned-message-photo': thumbnail })} onMouseDown={this.handleClick}>
                    <PinnedMessageBorder index={pinned.length - index - 1} count={pinned.length}/>
                    <CSSTransition
                        in={!!thumbnail}
                        classNames='pinned-message-tile'
                        timeout={250}
                        mountOnEnter={true}
                        unmountOnExit={true}>
                        <div>
                            <ReplyTile
                                chatId={chatId}
                                messageId={lastPhoto ? lastPhoto.messageId : null}
                                thumbnail={lastPhoto ? lastPhoto.thumbnail : null}
                                minithumbnail={lastPhoto ? lastPhoto.minithumbnail : null}
                            />
                        </div>
                    </CSSTransition>
                    <div className='pinned-message-content'>
                        <div className='pinned-message-title'>{caption}</div>
                        <div className='pinned-message-subtitle'>
                            <div id='pinned-message-animated-text'>
                                <div id='pinned-message-animated-text-1'>{scrollDown ? content : prevContent}</div>
                                <div id='pinned-message-animated-text-2'>{scrollDown ? prevContent : content}</div>
                            </div>
                        </div>
                    </div>
                </ListItem>
            </>
        );
    }
}

PinnedMessage.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(PinnedMessage);
