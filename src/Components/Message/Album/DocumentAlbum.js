/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import CheckMarkIcon from '@material-ui/icons/Check';
import AlbumItem from './AlbumItem';
import DayMeta from '../DayMeta';
import Forward from '../Forward';
import UnreadSeparator from '../UnreadSeparator';
import MessageAuthor from '../MessageAuthor';
import Reply from '../Reply';
import Meta from '../Meta';
import ChatTile from '../../Tile/ChatTile';
import EmptyTile from '../../Tile/EmptyTile';
import UserTile from '../../Tile/UserTile';
import { albumHistoryEquals } from '../../../Utils/Common';
import { selectMessage } from '../../../Actions/Client';
import { getText, getWebPage, isEmptySelection, showMessageForward } from '../../../Utils/Message';
import { isChannelChat, isMeChat, isPrivateChat } from '../../../Utils/Chat';
import { PHOTO_DISPLAY_SIZE } from '../../../Constants';
import MessageStore from '../../../Stores/MessageStore';
import './DocumentAlbum.css';

class DocumentAlbum extends React.Component {
    state = { };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { messageIds } = this.props;
        const { emojiMatches, lastSelected, selected, lastHighlighted, highlighted } = this.state;

        if (!albumHistoryEquals(nextProps.messageIds, messageIds)) {
            return true;
        }

        if (nextState.emojiMatches !== emojiMatches) {
            return true;
        }

        if (nextState.selected !== selected) {
            return true;
        }

        if (nextState.lastSelected !== lastSelected) {
            return true;
        }

        if (nextState.highlighted !== highlighted) {
            return true;
        }

        if (nextState.lastHighlighted !== lastHighlighted) {
            return true;
        }

        return false;
    }

    static getDerivedStateFromProps(props, state) {
        const { displaySize, chatId, messageIds } = props;

        if (messageIds !== state.prevMessageIds) {

            return {
                prevMessageIds: messageIds
            }
        }

        return null;
    }

    componentDidMount() {
        MessageStore.on('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        // MessageStore.on('clientUpdateMessageShake', this.onClientUpdateMessageShake);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        // MessageStore.off('clientUpdateMessageShake', this.onClientUpdateMessageShake);
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateClearSelection);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
    }

    onClientUpdateMessageHighlighted = update => {
        const { chatId, messageIds } = this.props;
        const { selected, highlighted } = this.state;

        if (selected) return;

        if (chatId === update.chatId && messageIds.some(x => x === update.messageId)) {
            if (highlighted) {
                this.setState({ highlighted: false, lastHighlighted: false }, () => {
                    setTimeout(() => {
                        this.setState({ highlighted: true, lastHighlighted: messageIds.length > 0 && messageIds[messageIds.length - 1] === update.messageId });
                    }, 0);
                });
            } else {
                this.setState({ highlighted: true, lastHighlighted: messageIds.length > 0 && messageIds[messageIds.length - 1] === update.messageId });
            }
        } else if (highlighted) {
            this.setState({ highlighted: false, lastHighlighted: false });
        }
    };

    onClientUpdateMessageSelected = update => {
        const { chatId, messageIds } = this.props;
        const { selected } = update;

        if (chatId === update.chatId && messageIds.some(x => x === update.messageId)) {
            this.setState({
                selected: messageIds.every(x => MessageStore.hasSelectedMessage(chatId, x)),
                lastSelected: messageIds.length > 0 && MessageStore.hasSelectedMessage(chatId, messageIds[messageIds.length - 1])
            });
        }
    };

    onClientUpdateClearSelection = update => {
        this.setState({ selected: false, lastSelected: false });
    };

    onUpdateMessageContent = update => {
        const { chat_id, message_id } = update;
        const { chatId, messageIds, displaySize } = this.props;
        const { emojiMatches: oldEmojiMatches } = this.state;

        if (chatId !== chat_id) return;
        if (!messageIds.some(x => x === message_id)) return;

        const emojiMatches = null; //getEmojiMatches(chatId, messageId);
        if (emojiMatches !== oldEmojiMatches) {
            this.setState({ emojiMatches });
        } else {
            this.forceUpdate();
        }
    };

    handleSelection = () => {
        // if (!this.mouseDown) return;

        const selection = window.getSelection().toString();
        if (!isEmptySelection(selection)) {
            return;
        }

        const { chatId, messageIds } = this.props;
        const { selected } = this.state;

        if (selected) {
            for (let i = 0; i < messageIds.length; i++) {
                selectMessage(chatId, messageIds[i], false);
            }
        } else {
            for (let i = 0; i < messageIds.length; i++) {
                selectMessage(chatId, messageIds[i], true);
            }
        }
    };

    render() {
        let { showTail, source } = this.props;
        const { chatId, messageIds, displaySize, showUnreadSeparator, showTitle, showDate, t = x => x } = this.props;
        const {
            emojiMatches,
            selected,
            lastSelected,
            highlighted,
            lastHighlighted,
            shook,
            copyLink,
            contextMenu,
            left,
            top
        } = this.state;

        if (!messageIds.length) {
            return null;
        }

        let messageId = messageIds[messageIds.length - 1];
        const message = MessageStore.get(chatId, messageId);
        if (!message) return <div>[empty message]</div>;

        const { content, is_outgoing, date, reply_to_message_id, forward_info, sender } = message;

        const isOutgoing = is_outgoing && !isChannelChat(chatId);

        const inlineMeta = (
            <Meta
                className='meta-hidden'
                key={`${chatId}_${messageId}_meta`}
                chatId={chatId}
                messageIds={messageIds}
            />
        );
        const webPage = getWebPage(message);
        let text = null;
        for (let i = 0; i < messageIds.length; i++) {
            const m = MessageStore.get(chatId, messageIds[i]);
            const t = getText(m, !!webPage ? null : inlineMeta, t);
            if (t && t.length) {
                if (text !== null) {
                    text = null;
                    break;
                } else {
                    text = t;
                    messageId = messageIds[i];
                }
            }
        }
        const hasCaption = text !== null && text.length > 0;
        const meta = (
            <Meta
                className={classNames('meta-text', {
                    'meta-bubble': false
                })}
                chatId={chatId}
                messageIds={messageIds}
                onDateClick={this.handleDateClick}
            />
        );

        const showForward = showMessageForward(chatId, messageId);
        const showReply = Boolean(reply_to_message_id);
        const suppressTitle = isPrivateChat(chatId) && !(isMeChat(chatId) && !isOutgoing);
        const hasTitle = (!suppressTitle && showTitle) || showForward || showReply;
        // const media = getMedia(message, this.openMedia, { hasTitle, hasCaption, inlineMeta, meta });
        const isChannel = isChannelChat(chatId);
        const isPrivate = isPrivateChat(chatId);

        // if (showTail && isMediaContent() && !hasCaption) {
        //     showTail = false;
        // }

        let tile = null;
        if (showTail) {
            if (isMeChat(chatId) && forward_info) {
                switch (forward_info.origin['@type']) {
                    case 'messageForwardOriginHiddenUser': {
                        tile = <UserTile small firstName={forward_info.origin.sender_name} onSelect={this.handleSelectUser} />;
                        break;
                    }
                    case 'messageForwardOriginUser': {
                        tile = <UserTile small userId={forward_info.origin.sender_user_id} onSelect={this.handleSelectUser} />;
                        break;
                    }
                    case 'messageForwardOriginChannel': {
                        tile = <ChatTile small chatId={forward_info.origin.chat_id} onSelect={this.handleSelectChat} />;
                        break;
                    }
                }
            } else if (isPrivate) {
                tile = <EmptyTile small />
            } else if (isChannel) {
                tile = <EmptyTile small />
            } else if (is_outgoing) {
                tile = <EmptyTile small />
            } else if (sender.user_id) {
                tile = <UserTile small userId={sender.user_id} onSelect={this.handleSelectUser} />;
            } else {
                tile = <ChatTile small chatId={chatId} onSelect={this.handleSelectChat} />;
            }
        }

        const style = {  };
        const withBubble = content['@type'] !== 'messageSticker' && content['@type'] !== 'messageVideoNote';
        const tailRounded = !hasCaption && (content['@type'] === 'messageAnimation' || content['@type'] === 'messageVideo' || content['@type'] === 'messagePhoto');

        const items = messageIds.map(x => MessageStore.get(chatId, x)).map(m => (
            <AlbumItem
                key={m.id}
                message={m}
                position={null}
                displaySize={displaySize}
                source={source}
            />));

        return (
            <div>
                {showDate && <DayMeta date={date} />}
                <div
                    className={classNames('message', 'message-album', 'message-document-album', {
                        'message-rounded': showTitle && showTail && tailRounded,
                        'message-short': !tile,
                        'message-out': isOutgoing,
                        'message-selected': selected,
                        'message-album-last-selected': lastSelected,
                        // 'message-highlighted': highlighted && !selected,
                        'message-album-last-highlighted': lastHighlighted && !selected,
                        'message-group-title': showTitle && !showTail,
                        'message-group': !showTitle && !showTail,
                        'message-group-tail': !showTitle && showTail && !tailRounded,
                        'message-group-tail-rounded': !showTitle && showTail && tailRounded,
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
                                className={classNames(
                                    'message-content', {
                                        'message-bubble': withBubble,
                                        'message-bubble-out': withBubble && isOutgoing
                                    })}
                                style={style}>
                                {withBubble && ((showTitle && !suppressTitle) || showForward) && (
                                    <div className='message-title'>
                                        {showTitle && !showForward && (
                                            <MessageAuthor sender={sender} forwardInfo={forward_info} openChat openUser />
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
                                <div className={classNames(
                                    'album',
                                    'document-album',
                                    { 'album-caption': false },
                                    { 'album-title': hasTitle }
                                )}>
                                    <div className='album-wrapper'>
                                        {items}
                                    </div>
                                </div>
                                {/*<div*/}
                                {/*    className={classNames('message-text', {*/}
                                {/*        'message-text-1emoji': emojiMatches === 1,*/}
                                {/*        'message-text-2emoji': emojiMatches === 2,*/}
                                {/*        'message-text-3emoji': emojiMatches === 3*/}
                                {/*    })}>*/}
                                {/*    {text}*/}
                                {/*</div>*/}
                                {withBubble && meta}
                            </div>
                            <div className='message-tile-padding' />
                        </div>
                        <div className='message-padding' />
                    </div>
                </div>
            </div>
        );
    }
}

DocumentAlbum.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageIds: PropTypes.arrayOf(PropTypes.number).isRequired,
    displaySize: PropTypes.number,
    showTitle: PropTypes.bool,
    showTail: PropTypes.bool,
    showUnreadSeparator: PropTypes.bool,
    showDate: PropTypes.bool
};

DocumentAlbum.defaultProps = {
    displaySize: PHOTO_DISPLAY_SIZE,
    showTitle: false,
    showTail: false,
    showUnreadSeparator: false,
    showData: false
};

export default DocumentAlbum;