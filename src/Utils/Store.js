/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ChatStore from '../Stores/ChatStore';
import NotificationStore from '../Stores/NotificationStore';
import SupergroupStore from '../Stores/SupergroupStore';

function isChatMuted(chatId) {
    return getChatMuteFor(chatId) > 0;
}

function getChatMuteFor(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return 0;

    const { notification_settings } = chat;
    if (!notification_settings) return 0;

    const { use_default_mute_for, mute_for } = notification_settings;

    if (use_default_mute_for) {
        const settings = getScopeNotificationSettings(chatId);

        return settings ? settings.mute_for : false;
    }

    return mute_for;
}

function isChannelChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);

            return supergroup && supergroup.is_channel;
        }
        case 'chatTypeBasicGroup':
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return false;
        }
    }

    return false;
}

function getScopeNotificationSettings(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    switch (chat.type['@type']) {
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return NotificationStore.settings.get('notificationSettingsScopePrivateChats');
        }
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            let settings = null;
            if (isChannelChat(chatId)) {
                settings = NotificationStore.settings.get('notificationSettingsScopeChannelChats');
            } else {
                settings = NotificationStore.settings.get('notificationSettingsScopeGroupChats');
            }
            return settings;
        }
    }

    return null;
}

function getChatDisablePinnedMessageNotifications(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { notification_settings } = chat;
    if (!chat) return false;

    const {
        use_default_disable_pinned_message_notifications,
        disable_pinned_message_notifications
    } = notification_settings;
    if (use_default_disable_pinned_message_notifications) {
        const settings = getScopeNotificationSettings(chatId);

        return settings ? settings.disable_pinned_message_notifications : false;
    }

    return disable_pinned_message_notifications;
}

function getChatDisableMentionNotifications(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { notification_settings } = chat;
    if (!notification_settings) return false;

    const { use_default_disable_mention_notifications, disable_mention_notifications } = notification_settings;
    if (use_default_disable_mention_notifications) {
        const settings = getScopeNotificationSettings(chatId);

        return settings ? settings.disable_mention_notifications : false;
    }

    return disable_mention_notifications;
}

function hasMention(message) {
    return message && message.contains_unread_mention;
}

function hasPinnedMessage(message) {
    return message && message.content['@type'] === 'messagePinMessage';
}

export function isMessageMuted(message) {
    const { chat_id } = message;

    if (hasMention(message)) {
        return getChatDisableMentionNotifications(chat_id);
    }
    if (hasPinnedMessage(message)) {
        return getChatDisablePinnedMessageNotifications(chat_id);
    }

    return isChatMuted(chat_id);
}
