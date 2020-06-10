/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import { compose } from '../../Utils/HOC';
import { withTranslation } from 'react-i18next';
import CheckMarkIcon from '@material-ui/icons/Check';
import DayMeta from './DayMeta';
import Reply from './Reply';
import Forward from './Forward';
import Meta from './Meta';
import MessageAuthor from './MessageAuthor';
import MessageMenu from './MessageMenu';
import UserTile from '../Tile/UserTile';
import ChatTile from '../Tile/ChatTile';
import UnreadSeparator from './UnreadSeparator';
import WebPage from './Media/WebPage';
import {
    getEmojiMatches,
    getText,
    getWebPage,
    openMedia,
    showMessageForward,
    isMetaBubble,
    canMessageBeForwarded,
    getMessageStyle
} from '../../Utils/Message';
import { getMedia } from '../../Utils/Media';
import { canSendMessages, isChannelChat, isPrivateChat } from '../../Utils/Chat';
import {
    openUser,
    openChat,
    selectMessage,
    openReply, replyMessage, forwardMessages
} from '../../Actions/Client';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './Message.css';

class Message extends Component {
    constructor(props) {
        super(props);

        const { chatId, messageId } = this.props;
        this.state = {
            message: MessageStore.get(chatId, messageId),
            emojiMatches: getEmojiMatches(chatId, messageId),
            selected: false,
            highlighted: false,
            shook: false,

            contextMenu: false,
            copyLink: null,
            left: 0,
            top: 0
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId, sendingState, showUnreadSeparator, showTail, showTitle } = this.props;
        const { contextMenu, selected, highlighted, shook, emojiMatches } = this.state;

        if (nextProps.chatId !== chatId) {
            // console.log('Message.shouldComponentUpdate true chatId');
            return true;
        }

        if (nextProps.messageId !== messageId) {
            // console.log('Message.shouldComponentUpdate true messageId');
            return true;
        }

        if (nextProps.sendingState !== sendingState) {
            // console.log('Message.shouldComponentUpdate true sendingState');
            return true;
        }

        if (nextProps.showUnreadSeparator !== showUnreadSeparator) {
            // console.log('Message.shouldComponentUpdate true showUnreadSeparator');
            return true;
        }

        if (nextProps.showTail !== showTail) {
            // console.log('Message.shouldComponentUpdate true showTail');
            return true;
        }

        if (nextProps.showTitle !== showTitle) {
            // console.log('Message.shouldComponentUpdate true showTitle');
            return true;
        }

        if (nextState.contextMenu !== contextMenu) {
            // console.log('Message.shouldComponentUpdate true contextMenu');
            return true;
        }

        if (nextState.selected !== selected) {
            // console.log('Message.shouldComponentUpdate true selected');
            return true;
        }

        if (nextState.highlighted !== highlighted) {
            // console.log('Message.shouldComponentUpdate true highlighted');
            return true;
        }

        if (nextState.shook !== shook) {
            // console.log('Message.shouldComponentUpdate true shook');
            return true;
        }

        if (nextState.emojiMatches !== emojiMatches) {
            // console.log('Message.shouldComponentUpdate true emojiMatches');
            return true;
        }

        // console.log('Message.shouldComponentUpdate false');
        return false;
    }

    componentDidMount() {
        MessageStore.on('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.on('clientUpdateMessageShake', this.onClientUpdateMessageShake);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageEdited', this.onUpdateMessageEdited);
        MessageStore.on('updateMessageViews', this.onUpdateMessageViews);
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.off('clientUpdateMessageShake', this.onClientUpdateMessageShake);
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateMessageEdited', this.onUpdateMessageEdited);
        MessageStore.off('updateMessageViews', this.onUpdateMessageViews);
    }

    onClientUpdateClearSelection = update => {
        if (!this.state.selected) return;

        this.setState({ selected: false });
    };

    onClientUpdateMessageShake = update => {
        const { chatId, messageId } = this.props;
        const { shook } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (shook) {
                this.setState({ shook: false }, () => {
                    setTimeout(() => {
                        this.setState({ shook: true });
                    }, 0);
                });
            } else {
                this.setState({ shook: true });
            }
        }
    };

    onClientUpdateMessageHighlighted = update => {
        const { chatId, messageId } = this.props;
        const { selected, highlighted } = this.state;

        if (selected) return;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (highlighted) {
                this.setState({ highlighted: false }, () => {
                    setTimeout(() => {
                        this.setState({ highlighted: true });
                    }, 0);
                });
            } else {
                this.setState({ highlighted: true });
            }
        } else if (highlighted) {
            this.setState({ highlighted: false });
        }
    };

    onClientUpdateMessageSelected = update => {
        const { chatId, messageId } = this.props;
        const { selected } = update;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({ selected, highlighted: false });
        }
    };

    onUpdateMessageEdited = update => {
        const { chat_id, message_id } = update;
        const { chatId, messageId } = this.props;

        if (chatId === chat_id && messageId === message_id) {
            this.forceUpdate();
        }
    };

    onUpdateMessageViews = update => {
        const { chat_id, message_id } = update;
        const { chatId, messageId } = this.props;

        if (chatId === chat_id && messageId === message_id) {
            this.forceUpdate();
        }
    };

    onUpdateMessageContent = update => {
        const { chat_id, message_id } = update;
        const { chatId, messageId } = this.props;
        const { emojiMatches } = this.state;

        if (chatId !== chat_id) return;
        if (messageId !== message_id) return;

        const newEmojiMatches = getEmojiMatches(chatId, messageId);
        if (newEmojiMatches !== emojiMatches) {
            this.setState({ emojiMatches: getEmojiMatches(chatId, messageId) });
        } else {
            this.forceUpdate();
        }
    };

    handleSelectUser = userId => {
        openUser(userId, true);
    };

    handleSelectChat = chatId => {
        openChat(chatId, null, true);
    };

    handleSelection = () => {
        if (!this.mouseDown) return;

        const selection = window.getSelection().toString();
        if (selection) return;

        const { chatId, messageId } = this.props;

        const selected = !MessageStore.selectedItems.has(`chatId=${chatId}_messageId=${messageId}`);
        selectMessage(chatId, messageId, selected);
    };

    handleDateClick = e => {
        e.preventDefault();
        e.stopPropagation();

        const { chatId, messageId } = this.props;

        const canBeReplied = canSendMessages(chatId);
        if (canBeReplied) {
            replyMessage(chatId, messageId);

            return;
        }

        const canBeForwarded = canMessageBeForwarded(chatId, messageId);
        if (canBeForwarded) {
            forwardMessages(chatId, [messageId]);
        }
    };

    openMedia = event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { chatId, messageId } = this.props;

        openMedia(chatId, messageId);
    };

    handleAnimationEnd = () => {
        this.setState({ highlighted: false });
    };

    handleMouseDown = () => {
        this.mouseDown = true;
    };

    handleMouseOver = () => {
        this.mouseDown = false;
    };

    handleMouseOut = () => {
        this.mouseOut = false;
    };

    handleReplyClick = () => {
        const { chatId, messageId } = this.props;
        openReply(chatId, messageId);
    };

    handleOpenContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            if (MessageStore.selectedItems.size > 1) {
                return;
            }

            const left = event.clientX;
            const top = event.clientY;
            const copyLink =
                event.target && event.target.tagName === 'A' && event.target.href ? event.target.href : null;

            this.setState({
                contextMenu: true,
                copyLink,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    render() {
        const { t, chatId, messageId, showUnreadSeparator, showTail, showTitle, showDate } = this.props;
        const {
            emojiMatches,
            selected,
            highlighted,
            shook,
            copyLink,
            contextMenu,
            left,
            top
        } = this.state;

        // console.log('Message.render', messageId);

        const message = MessageStore.get(chatId, messageId);
        if (!message) return <div>[empty message]</div>;

        const { is_outgoing, views, date, edit_date, reply_to_message_id, forward_info, sender_user_id } = message;

        const isOutgoing = is_outgoing && !isChannelChat(chatId);
        const inlineMeta = (
            <Meta
                className='meta-hidden'
                key={`${chatId}_${messageId}_meta`}
                chatId={chatId}
                messageId={messageId}
                date={date}
                editDate={edit_date}
                views={views}
            />
        );
        const text = getText(message, inlineMeta, t);
        const hasCaption = text !== null && text.length > 0;
        const showForward = showMessageForward(chatId, messageId);
        const showReply = Boolean(reply_to_message_id);
        const suppressTitle = isPrivateChat(chatId);
        const hasTitle = (!suppressTitle && showTitle) || showForward || showReply;
        const webPage = getWebPage(message);
        const media = getMedia(message, this.openMedia, hasTitle, hasCaption, inlineMeta);

        let tile = null;
        if (showTail) {
            tile = sender_user_id ? (
                <UserTile small userId={sender_user_id} onSelect={this.handleSelectUser} />
            ) : (
                <ChatTile small chatId={chatId} onSelect={this.handleSelectChat} />
            );
        }

        const style = getMessageStyle(chatId, messageId);
        const withBubble =
            message.content['@type'] !== 'messageSticker' && message.content['@type'] !== 'messageVideoNote';

        return (
            <div>
                {showDate && <DayMeta date={date} />}
                <div
                    className={classNames('message', {
                        'message-short': !tile,
                        'message-out': isOutgoing,
                        'message-selected': selected,
                        'message-highlighted': highlighted && !selected,
                        'message-top': showTitle && !showTail,
                        'message-bottom': !showTitle && showTail,
                        'message-middle': !showTitle && !showTail,
                        'message-bubble-hidden': !withBubble
                    })}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}
                    onMouseDown={this.handleMouseDown}
                    onClick={this.handleSelection}
                    onAnimationEnd={this.handleAnimationEnd}
                    onContextMenu={this.handleOpenContextMenu}>
                    {showUnreadSeparator && <UnreadSeparator />}
                    <div className='message-body'>
                        <div className='message-padding'>
                            <CheckMarkIcon className='message-select-tick' />
                        </div>
                        <div className={classNames('message-wrapper', { 'shook': shook })}>
                            {tile}
                            <div
                                className={classNames('message-content', {
                                    'message-bubble': withBubble,
                                    'message-bubble-out': withBubble && isOutgoing
                                })}
                                style={style}>
                                {withBubble && ((showTitle && !suppressTitle) || showForward) && (
                                    <div className='message-title'>
                                        {showTitle && !showForward && (
                                            <MessageAuthor chatId={chatId} openChat userId={sender_user_id} openUser />
                                        )}
                                        {showForward && <Forward forwardInfo={forward_info} />}
                                    </div>
                                )}
                                {showReply && (
                                    <Reply
                                        chatId={chatId}
                                        messageId={reply_to_message_id}
                                        onClick={this.handleReplyClick}
                                    />
                                )}
                                {media}
                                <div
                                    className={classNames('message-text', {
                                        'message-text-1emoji': emojiMatches === 1,
                                        'message-text-2emoji': emojiMatches === 2,
                                        'message-text-3emoji': emojiMatches === 3
                                    })}>
                                    {text}
                                </div>
                                {webPage && (
                                    <WebPage
                                        chatId={chatId}
                                        messageId={messageId}
                                        openMedia={this.openMedia}
                                        meta={inlineMeta}
                                    />
                                )}
                                {withBubble && (
                                    <Meta
                                        className={classNames('meta-text', {
                                            'meta-bubble': isMetaBubble(chatId, messageId)
                                        })}
                                        chatId={chatId}
                                        messageId={messageId}
                                        date={date}
                                        editDate={edit_date}
                                        views={views}
                                        onDateClick={this.handleDateClick}
                                    />
                                )}
                            </div>
                            <div className='message-tile-padding' />
                        </div>
                        <div className='message-padding' />
                    </div>
                </div>
                <MessageMenu
                    chatId={chatId}
                    messageId={messageId}
                    anchorPosition={{ top, left }}
                    open={contextMenu}
                    onClose={this.handleCloseContextMenu}
                    copyLink={copyLink}
                />
            </div>
        );
    }
}

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(Message);
