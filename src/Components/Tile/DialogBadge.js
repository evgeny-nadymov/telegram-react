/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import { isChatMuted, showChatDraft, showChatUnreadMessageIcon } from '../../Utils/Chat';
import ApplicationStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import './DialogBadge.css';

const styles = theme => ({
    dialogBadge: {
        background: theme.palette.primary.main
    },
    dialogBadgeMuted: {
        background: theme.palette.type === 'dark' ? theme.palette.text.disabled : '#d8d8d8'
    }
});

class DialogBadge extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, theme } = this.props;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.theme !== theme) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.on('updateChatIsPinned', this.onUpdate);
        ChatStore.on('updateChatNotificationSettings', this.onUpdate);
        ChatStore.on('updateChatReadInbox', this.onUpdate);
        ChatStore.on('updateChatReadOutbox', this.onUpdate);
        ChatStore.on('updateChatUnreadMentionCount', this.onUpdate);
        ChatStore.on('updateMessageMentionRead', this.onUpdate);
        ApplicationStore.on('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    componentWillUnmount() {
        ChatStore.removeListener('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.removeListener('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate);
        ChatStore.removeListener('updateChatIsMarkedAsUnread', this.onUpdate);
        ChatStore.removeListener('updateChatIsPinned', this.onUpdate);
        ChatStore.removeListener('updateChatNotificationSettings', this.onUpdate);
        ChatStore.removeListener('updateChatReadInbox', this.onUpdate);
        ChatStore.removeListener('updateChatReadOutbox', this.onUpdate);
        ChatStore.removeListener('updateChatUnreadMentionCount', this.onUpdate);
        ChatStore.removeListener('updateMessageMentionRead', this.onUpdate);
        ApplicationStore.removeListener('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
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

        const { classes, chatId } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { is_marked_as_unread, unread_count, unread_mention_count } = chat;

        const showUnreadIcon = showChatUnreadMessageIcon(chatId);
        const showUnreadMentionCount = unread_mention_count > 0;
        const showUnreadCount =
            unread_count > 1 ||
            (unread_count === 1 && unread_mention_count === 0) ||
            (is_marked_as_unread && unread_count === 0 && unread_mention_count === 0);
        const showDraftChat = showChatDraft(chatId);

        return (
            <>
                {showUnreadIcon && !showDraftChat && <i className='dialog-badge-unread' />}
                {showUnreadMentionCount && (
                    <div className={classNames('dialog-badge', classes.dialogBadge)}>
                        <div className='dialog-badge-mention'>@</div>
                    </div>
                )}
                {showUnreadCount ? (
                    <div
                        className={classNames(
                            { [classes.dialogBadgeMuted]: isChatMuted(chat) },
                            'dialog-badge',
                            classes.dialogBadge
                        )}>
                        <span className='dialog-badge-text'>{unread_count > 0 ? unread_count : ''}</span>
                    </div>
                ) : chat.is_pinned && !showUnreadIcon ? (
                    <i className='dialog-badge-pinned' />
                ) : null}
            </>
        );
    }
}

export default withStyles(styles, { withTheme: true })(DialogBadge);
