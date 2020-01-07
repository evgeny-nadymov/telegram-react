/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import withStyles from '@material-ui/core/styles/withStyles';
import CheckMarkIcon from '@material-ui/icons/Check';
import Reply from './Reply';
import Forward from './Forward';
import Meta from './Meta';
import MessageStatus from './MessageStatus';
import MessageAuthor from './MessageAuthor';
import UserTile from '../Tile/UserTile';
import ChatTile from '../Tile/ChatTile';
import UnreadSeparator from './UnreadSeparator';
import WebPage from './Media/WebPage';
import {
    getEmojiMatches,
    getText,
    getMedia,
    getUnread,
    getWebPage,
    openMedia,
    showMessageForward,
    canMessageBeEdited,
    isMessagePinned
} from '../../Utils/Message';
import { canPinMessages, canSendMessages } from '../../Utils/Chat';
import {
    openUser,
    openChat,
    selectMessage,
    openReply,
    forwardMessages,
    replyMessage,
    editMessage,
    clearSelection,
    deleteMessages
} from '../../Actions/Client';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './Message.css';
import Popover from '@material-ui/core/Popover';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import ChatStore from '../../Stores/ChatStore';
import { pinMessage, unpinMessage } from '../../Actions/Message';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';

const styles = theme => ({
    message: {
        backgroundColor: 'transparent'
    },
    messageBubble: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        '&::after': {
            background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF'
        }
    },
    menuListRoot: {
        minWidth: 150
    },
    messageAuthorColor: {
        color: theme.palette.primary.main
    },
    messageSelected: {
        backgroundColor: theme.palette.primary.main + '22'
    },
    messageSelectTick: {
        background: theme.palette.primary.main,
        color: 'white'
    },
    '@keyframes highlighted': {
        from: { backgroundColor: theme.palette.primary.main + '22' },
        to: { backgroundColor: 'transparent' }
    },
    messageHighlighted: {
        animation: '$highlighted 4s ease-out'
    }
});

class Message extends Component {
    constructor(props) {
        super(props);

        const { chatId, messageId } = this.props;
        if (process.env.NODE_ENV !== 'production') {
            this.state = {
                message: MessageStore.get(chatId, messageId),
                emojiMatches: getEmojiMatches(chatId, messageId),
                selected: false,
                highlighted: false
            };
        } else {
            this.state = {
                emojiMatches: getEmojiMatches(chatId, messageId),
                selected: false,
                highlighted: false
            };
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { theme, chatId, messageId, sendingState, showUnreadSeparator, showTail, showTitle } = this.props;
        const { contextMenu, selected, highlighted, emojiMatches } = this.state;

        if (nextProps.theme !== theme) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.chatId !== chatId) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.messageId !== messageId) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.sendingState !== sendingState) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.showUnreadSeparator !== showUnreadSeparator) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.showTail !== showTail) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.showTitle !== showTitle) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextState.contextMenu !== contextMenu) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextState.selected !== selected) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextState.highlighted !== highlighted) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextState.emojiMatches !== emojiMatches) {
            // console.log('Message.shouldComponentUpdate true');
            return true;
        }

        // console.log('Message.shouldComponentUpdate false');
        return false;
    }

    componentDidMount() {
        MessageStore.on('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageEdited', this.onUpdateMessageEdited);
        MessageStore.on('updateMessageViews', this.onUpdateMessageViews);
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateMessageEdited', this.onUpdateMessageEdited);
        MessageStore.off('updateMessageViews', this.onUpdateMessageViews);
    }

    onClientUpdateClearSelection = update => {
        if (!this.state.selected) return;

        this.setState({ selected: false });
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

        const message = MessageStore.get(chatId, messageId);

        const canBeReplied = canSendMessages(chatId);
        if (canBeReplied) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateReply',
                chatId: chatId,
                messageId: messageId
            });
            return;
        }

        const canBeForwarded = message && message.can_be_forwarded;
        if (canBeForwarded) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateForward',
                info: {
                    chatId: chatId,
                    messageIds: [messageId]
                }
            });
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

    handleContextMenu = async event => {
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

            this.setState({
                contextMenu: true,
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

    handleReply = event => {
        const { chatId, messageId } = this.props;

        clearSelection();
        this.handleCloseContextMenu(event);

        replyMessage(chatId, messageId);
    };

    handlePin = event => {
        const { chatId, messageId } = this.props;

        clearSelection();
        this.handleCloseContextMenu(event);

        if (isMessagePinned(chatId, messageId)) {
            unpinMessage(chatId);
        } else {
            pinMessage(chatId, messageId);
        }
    };

    handleForward = event => {
        const { chatId, messageId } = this.props;

        this.handleCloseContextMenu(event);

        forwardMessages(chatId, [messageId]);
    };

    handleEdit = event => {
        const { chatId, messageId } = this.props;

        clearSelection();
        this.handleCloseContextMenu(event);

        editMessage(chatId, messageId);
    };

    handleSelect = event => {
        const { chatId, messageId } = this.props;

        this.handleCloseContextMenu(event);

        selectMessage(chatId, messageId, true);
    };

    handleDelete = event => {
        const { chatId, messageId } = this.props;

        this.handleCloseContextMenu(event);

        deleteMessages(chatId, [messageId]);
    };

    render() {
        // console.log('[m] render', this.props.messageId);
        const { t, classes, chatId, messageId, showUnreadSeparator, showTail, showTitle } = this.props;
        const { emojiMatches, selected, highlighted, contextMenu, left, top } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return <div>[empty message]</div>;

        const { sending_state, views, date, edit_date, reply_to_message_id, forward_info, sender_user_id } = message;

        const showForward = showMessageForward(chatId, messageId);
        const text = getText(message);
        const hasTitle = showTitle || showForward || Boolean(reply_to_message_id);
        const hasCaption = text !== null && text.length > 0;
        const webPage = getWebPage(message);
        const media = getMedia(message, this.openMedia, hasTitle, hasCaption);
        this.unread = getUnread(message);

        let tile = null;
        if (showTail) {
            tile = sender_user_id ? (
                <UserTile userId={sender_user_id} onSelect={this.handleSelectUser} small />
            ) : (
                <ChatTile chatId={chatId} onSelect={this.handleSelectChat} small />
            );
        }

        const messageClassName = classNames('message', classes.message, {
            'message-selected': selected,
            [classes.messageSelected]: selected,
            [classes.messageHighlighted]: highlighted && !selected,
            'message-short': !tile
        });

        const meta = <Meta date={date} editDate={edit_date} views={views} onDateClick={this.handleDateClick} />;

        const canBeReplied = canSendMessages(chatId);
        const canBePinned = canPinMessages(chatId);
        const isPinned = isMessagePinned(chatId, messageId);
        const canBeForwarded = message.can_be_forwarded;
        const canBeDeleted = message.can_be_deleted_only_for_self || message.can_be_deleted_for_all_users;
        const canBeSelected = !MessageStore.hasSelectedMessage(chatId, messageId);
        const canBeEdited = canMessageBeEdited(chatId, messageId);
        const withBubble =
            message.content['@type'] !== 'messageSticker' && message.content['@type'] !== 'messageVideoNote';

        return (
            <div
                className={messageClassName}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                onMouseDown={this.handleMouseDown}
                onClick={this.handleSelection}
                onAnimationEnd={this.handleAnimationEnd}
                onContextMenu={this.handleContextMenu}>
                {showUnreadSeparator && <UnreadSeparator />}
                <div className='message-wrapper'>
                    <div className='message-left-padding'>
                        <CheckMarkIcon className={classNames('message-select-tick', classes.messageSelectTick)} />
                        {/*{this.unread && (*/}
                        {/*    <MessageStatus chatId={chatId} messageId={messageId} sendingState={sending_state} />*/}
                        {/*)}*/}
                    </div>
                    {tile}
                    <div
                        className={classNames('message-content', {
                            'message-bubble': withBubble,
                            [classes.messageBubble]: withBubble
                        })}>
                        <div className='message-title'>
                            {showTitle && !showForward && (
                                <MessageAuthor chatId={chatId} openChat userId={sender_user_id} openUser />
                            )}
                            {showForward && <Forward forwardInfo={forward_info} />}
                            {showTitle && meta}
                        </div>
                        {Boolean(reply_to_message_id) && (
                            <Reply chatId={chatId} messageId={reply_to_message_id} onClick={this.handleReplyClick} />
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
                        {webPage && <WebPage chatId={chatId} messageId={messageId} openMedia={this.openMedia} />}
                        {/*{!showTitle && meta}*/}
                    </div>
                    {/*{!showTitle && meta}*/}
                    {/*{showTail&&<div>tail</div>}*/}
                </div>
                <Popover
                    open={contextMenu}
                    onClose={this.handleCloseContextMenu}
                    anchorReference='anchorPosition'
                    anchorPosition={{ top, left }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    onMouseDown={e => e.stopPropagation()}>
                    <MenuList classes={{ root: classes.menuListRoot }} onClick={e => e.stopPropagation()}>
                        {canBeReplied && <MenuItem onClick={this.handleReply}>{t('Reply')}</MenuItem>}
                        {canBePinned && (
                            <MenuItem onClick={this.handlePin}>{isPinned ? t('Unpin') : t('Pin')}</MenuItem>
                        )}
                        {canBeSelected && <MenuItem onClick={this.handleSelect}>{t('Select')}</MenuItem>}
                        {canBeForwarded && <MenuItem onClick={this.handleForward}>{t('Forward')}</MenuItem>}
                        {canBeEdited && <MenuItem onClick={this.handleEdit}>{t('Edit')}</MenuItem>}
                        {canBeDeleted && <MenuItem onClick={this.handleDelete}>{t('Delete')}</MenuItem>}
                    </MenuList>
                </Popover>
            </div>
        );
    }
}

const enhance = compose(
    withSaveRef(),
    withStyles(styles, { withTheme: true }),
    withTranslation(),
    withRestoreRef()
);

export default enhance(Message);
