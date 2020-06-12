/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import PinIcon from '../../Assets/Icons/Pin';
import {
    isChatMuted,
    isChatPinned,
    showChatUnreadCount,
    showChatUnreadMentionCount
} from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import FilterStore from '../../Stores/FilterStore';
import NotificationStore from '../../Stores/NotificationStore';
import './DialogBadge.css';

class DialogBadge extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, chatList } = this.props;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.chatList !== chatList) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.on('updateChatPosition', this.onUpdate);
        ChatStore.on('updateChatNotificationSettings', this.onUpdate);
        ChatStore.on('updateChatReadInbox', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateChatReadOutbox', this.onUpdate);
        ChatStore.on('updateChatUnreadMentionCount', this.onUpdate);
        ChatStore.on('updateMessageMentionRead', this.onUpdate);
        NotificationStore.on('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    componentWillUnmount() {
        ChatStore.off('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.off('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.off('updateChatDraftMessage', this.onUpdate);
        ChatStore.off('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.off('updateChatPosition', this.onUpdate);
        ChatStore.off('updateChatNotificationSettings', this.onUpdate);
        ChatStore.off('updateChatReadInbox', this.onUpdate);
        ChatStore.off('updateChatLastMessage', this.onUpdate);
        ChatStore.off('updateChatReadOutbox', this.onUpdate);
        ChatStore.off('updateChatUnreadMentionCount', this.onUpdate);
        ChatStore.off('updateMessageMentionRead', this.onUpdate);
        NotificationStore.off('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    onClientUpdateClearHistory = update => {
        const { chatId } = this.props;

        if (chatId === update.chatId) {
            this.clearHistory = update.inProgress;
            this.forceUpdate();
        }
    };

    onFastUpdatingComplete = update => {
        this.forceUpdate();
    };

    onUpdate = update => {
        const { chatId } = this.props;

        if (update.chat_id !== chatId) return;

        this.forceUpdate();
    };

    onUpdateScopeNotificationSettings = update => {
        const { chatId } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return;

        switch (update.scope['@type']) {
            case 'notificationSettingsScopeGroupChats': {
                if (chat.type['@type'] === 'chatTypeBasicGroup' || chat.type['@type'] === 'chatTypeSupergroup') {
                    this.forceUpdate();
                }
                break;
            }
            case 'notificationSettingsScopePrivateChats': {
                if (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret') {
                    this.forceUpdate();
                }
                break;
            }
        }
    };

    render() {
        if (this.clearHistory) return null;

        const { chatId, chatList } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { unread_count } = chat;
        const isPinned = isChatPinned(chatId, chatList);

        const showUnreadMentionCount = showChatUnreadMentionCount(chatId);
        const showUnreadCount = showChatUnreadCount(chatId);
        const isMuted = isChatMuted(chatId);

        return (
            <>
                {showUnreadMentionCount && (
                    <div className='dialog-badge'>
                        <div className='dialog-badge-mention'>@</div>
                    </div>
                )}
                {showUnreadCount && (
                    <div className={classNames({ 'dialog-badge-muted': isMuted }, 'dialog-badge')}>
                        <span className='dialog-badge-text'>{unread_count > 0 ? unread_count : ''}</span>
                    </div>
                )}
                {isPinned && !showUnreadCount && !showUnreadMentionCount && (
                    <div className='dialog-badge-pinned'>
                        <PinIcon className='dialog-badge-pinned-icon' />
                    </div>
                )}
            </>
        );
    }
}

export default DialogBadge;
