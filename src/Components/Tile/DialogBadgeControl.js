/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import {
    getChatMuteFor,
    getChatUnreadCount,
    getChatUnreadMentionCount,
    getChatUnreadMessageIcon,
    isChatMuted
} from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import './DialogBadgeControl.css';

class DialogBadgeControl extends React.Component {
    constructor(props){
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.on('updateChatIsPinned', this.onUpdate);
        ChatStore.on('updateChatNotificationSettings', this.onUpdate);
        ChatStore.on('updateChatReadInbox', this.onUpdate);
        ChatStore.on('updateChatReadOutbox', this.onUpdate);
        ChatStore.on('updateChatUnreadMentionCount', this.onUpdate);
        ApplicationStore.on('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    componentWillUnmount(){
        ChatStore.removeListener('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.removeListener('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.removeListener('updateChatIsPinned', this.onUpdate);
        ChatStore.removeListener('updateChatNotificationSettings', this.onUpdate);
        ChatStore.removeListener('updateChatReadInbox', this.onUpdate);
        ChatStore.removeListener('updateChatReadOutbox', this.onUpdate);
        ChatStore.removeListener('updateChatUnreadMentionCount', this.onUpdate);
        ApplicationStore.removeListener('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    onFastUpdatingComplete = (update) => {
        this.forceUpdate();
    };

    onUpdate = (update) => {
        const { chatId } = this.props;

        if (update.chat_id !== chatId) return;

        this.forceUpdate();
    };

    onUpdateScopeNotificationSettings = (update) => {
        const { chatId } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return;

        switch (update.scope['@type']) {
            case 'notificationSettingsScopeGroupChats': {
                if (chat.type['@type'] === 'chatTypeBasicGroup'
                    || chat.type['@type'] === 'chatTypeSupergroup'){
                    this.forceUpdate();
                }
                break;
            }
            case 'notificationSettingsScopePrivateChats':{
                if (chat.type['@type'] === 'chatTypePrivate'
                    || chat.type['@type'] === 'chatTypeSecret'){
                    this.forceUpdate();
                }
                break;
            }
        }
    };

    render() {
        const { chatId } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const unreadMessageIcon = getChatUnreadMessageIcon(chat);
        const unreadCount = getChatUnreadCount(chat);
        const unreadMentionCount = getChatUnreadMentionCount(chat);
        const showUnreadCount = unreadCount > 1 || (unreadCount === 1 && unreadMentionCount < 1);
        const muteClassName = isChatMuted(chat) ? 'dialog-badge-muted' : '';

        return (
            <>
                {unreadMessageIcon && <i className='dialog-badge-unread'/>}
                {unreadMentionCount && <div className='dialog-badge'><div className='dialog-badge-mention'>@</div></div> }
                {showUnreadCount
                    ? <div className={classNames(muteClassName, 'dialog-badge')}><span className='dialog-badge-text'>{unreadCount}</span></div>
                    : (chat.is_pinned && !unreadMessageIcon ? <i className='dialog-badge-pinned'/> : null) }
            </>
        );
    }
}

export default DialogBadgeControl;