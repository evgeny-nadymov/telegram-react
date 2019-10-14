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
import { getEmojiMatches, getText, getMedia, getUnread, getWebPage, openMedia } from '../../Utils/Message';
import { canSendMessages } from '../../Utils/Chat';
import { openUser, openChat, selectMessage, openReply } from '../../Actions/Client';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './Message.css';

const styles = theme => ({
    message: {
        backgroundColor: 'transparent'
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
        animation: 'highlighted 4s ease-out'
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
        const { theme, chatId, messageId, sendingState, showUnreadSeparator, showTitle } = this.props;
        const { contextMenu, selected, highlighted, emojiMatches } = this.state;

        if (nextProps.theme !== theme) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.chatId !== chatId) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.messageId !== messageId) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.sendingState !== sendingState) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.showUnreadSeparator !== showUnreadSeparator) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextProps.showTitle !== showTitle) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextState.contextMenu !== contextMenu) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextState.selected !== selected) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextState.highlighted !== highlighted) {
            console.log('Message.shouldComponentUpdate true');
            return true;
        }

        if (nextState.emojiMatches !== emojiMatches) {
            console.log('Message.shouldComponentUpdate true');
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
        MessageStore.removeListener('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.removeListener('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.removeListener('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.removeListener('updateMessageEdited', this.onUpdateMessageEdited);
        MessageStore.removeListener('updateMessageViews', this.onUpdateMessageViews);
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

    render() {
        // console.log('[m] render', this.props.messageId);
        const { t, classes, chatId, messageId, showUnreadSeparator, showTitle } = this.props;
        const { emojiMatches, selected, highlighted } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return <div>[empty message]</div>;

        const { sending_state, views, date, edit_date, reply_to_message_id, forward_info, sender_user_id } = message;

        const text = getText(message);
        const webPage = getWebPage(message);
        const media = getMedia(message, this.openMedia);
        this.unread = getUnread(message);

        let tile = null;
        if (showTitle) {
            tile = sender_user_id ? (
                <UserTile userId={sender_user_id} onSelect={this.handleSelectUser} />
            ) : (
                <ChatTile chatId={chatId} onSelect={this.handleSelectChat} />
            );
        }

        const messageClassName = classNames('message', classes.message, {
            'message-selected': selected,
            [classes.messageSelected]: selected,
            [classes.messageHighlighted]: highlighted && !selected,
            'message-short': !showTitle
        });

        const meta = <Meta date={date} editDate={edit_date} views={views} onDateClick={this.handleDateClick} />;

        return (
            <div
                className={messageClassName}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                onMouseDown={this.handleMouseDown}
                onClick={this.handleSelection}
                onAnimationEnd={this.handleAnimationEnd}>
                {showUnreadSeparator && <UnreadSeparator />}
                <div className='message-wrapper'>
                    <div className='message-left-padding'>
                        {/*<div className='message-left-padding-wrapper'>*/}
                        {/**/}
                        {/*</div>*/}
                        <CheckMarkIcon className={classNames('message-select-tick', classes.messageSelectTick)} />
                        {this.unread && (
                            <MessageStatus chatId={chatId} messageId={messageId} sendingState={sending_state} />
                        )}
                    </div>
                    {tile}
                    <div className='message-content'>
                        <div className='message-title'>
                            {showTitle && !forward_info && (
                                <MessageAuthor chatId={chatId} openChat userId={sender_user_id} openUser />
                            )}
                            {forward_info && <Forward forwardInfo={forward_info} />}
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
                    </div>
                    {!showTitle && meta}
                </div>
            </div>
        );
    }
}

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(Message);
