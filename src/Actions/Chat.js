/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import TdLibController from '../Controllers/TdLibController';
import ChatStore from '../Stores/ChatStore';
import { isChatMuted } from '../Utils/Chat';
import { MUTED_VALUE_MAX, MUTED_VALUE_MIN } from '../Constants';

export function toggleChatIsPinned(chatId, isPinned) {
    TdLibController.send({
        '@type': 'toggleChatIsPinned',
        chat_id: chatId,
        is_pinned: isPinned
    });
}

export function toggleChatNotificationSettings(chatId, isMuted) {
    const chat = ChatStore.get(chatId);
    if (!chat) return;

    const { notification_settings } = chat;
    if (!notification_settings) return;

    const isMutedPrev = isChatMuted(chat);
    if (isMutedPrev === isMuted) {
        return;
    }

    const muteFor = isMuted ? MUTED_VALUE_MAX : MUTED_VALUE_MIN;
    const newNotificationSettings = {
        ...chat.notification_settings,
        use_default_mute_for: false,
        mute_for: muteFor
    };

    TdLibController.send({
        '@type': 'setChatNotificationSettings',
        chat_id: chatId,
        notification_settings: newNotificationSettings
    });
}
