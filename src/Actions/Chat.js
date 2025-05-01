/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import TdLibController from '../Controllers/TdLibController';
import { isChatMuted, isChatPinned } from '../Utils/Chat';
import { MUTED_VALUE_MAX, MUTED_VALUE_MIN } from '../Constants';
import ChatStore from '../Stores/ChatStore';

export function clearHistory(chatId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateRequestClearHistory',
        chatId
    });
}

export function leaveChat(chatId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateRequestLeaveChat',
        chatId
    });
}

export function changeChatDetailsVisibility(visibility) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateChatDetailsVisibility',
        visibility
    });
}

export async function openPinnedChat(index) {
    const chats = await TdLibController.send({
        '@type': 'getChats',
        chat_list: { '@type': 'chatListMain' },
        offset_order: '9223372036854775807',
        offset_chat_id: 0,
        limit: 10
    });

    if (chats) {
        let pinnedIndex = -1;
        for (let i = 0; i < chats.chat_ids.length; i++) {
            const chat = ChatStore.get(chats.chat_ids[i]);
            if (chat && isChatPinned(chat.id, { '@type': 'chatListMain' })) {
                pinnedIndex++;
            }

            if (pinnedIndex === index) {
                TdLibController.setChatId(chat.id);
                return;
            }
        }
    }
}

export async function getChat(chatId) {
    const chat = TdLibController.send({
        '@type': 'getChat',
        chat_id: chatId
    });
    ChatStore.set(chat);

    return chat;
}

export function addChatToList(chatId, chatList) {
    TdLibController.send({
        '@type': 'addChatToList',
        chat_id: chatId,
        chat_list: chatList
    });
}

export function toggleChatIsPinned(chatId, chatList, isPinned) {
    TdLibController.send({
        '@type': 'toggleChatIsPinned',
        chat_id: chatId,
        chat_list: chatList,
        is_pinned: isPinned
    });
}

export function toggleChatIsMarkedAsUnread(chatId, isMarkedAsUnread) {
    TdLibController.send({
        '@type': 'toggleChatIsMarkedAsUnread',
        chat_id: chatId,
        is_marked_as_unread: isMarkedAsUnread
    });
}

export function toggleChatNotificationSettings(chatId, isMuted) {
    const chat = ChatStore.get(chatId);
    if (!chat) return;

    const { notification_settings } = chat;
    if (!notification_settings) return;

    const isMutedPrev = isChatMuted(chatId);
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

export async function getChatCounters(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return;

    const promises = [];

    const photoCounter = TdLibController.send({
        '@type': 'getChatMessageCount',
        chat_id: chatId,
        filter: { '@type': 'searchMessagesFilterPhoto' },
        return_local: false
    })
        .then(result => {
            return result ? result.count : 0;
        })
        .catch(() => {
            return 0;
        });
    promises.push(photoCounter);

    const videoCounter = TdLibController.send({
        '@type': 'getChatMessageCount',
        chat_id: chatId,
        filter: { '@type': 'searchMessagesFilterVideo' },
        return_local: false
    })
        .then(result => {
            return result ? result.count : 0;
        })
        .catch(() => {
            return 0;
        });
    promises.push(videoCounter);

    const documentCounter = TdLibController.send({
        '@type': 'getChatMessageCount',
        chat_id: chatId,
        filter: { '@type': 'searchMessagesFilterDocument' },
        return_local: false
    })
        .then(result => {
            return result ? result.count : 0;
        })
        .catch(() => {
            return 0;
        });
    promises.push(documentCounter);

    const audioCounter = TdLibController.send({
        '@type': 'getChatMessageCount',
        chat_id: chatId,
        filter: { '@type': 'searchMessagesFilterAudio' },
        return_local: false
    })
        .then(result => {
            return result ? result.count : 0;
        })
        .catch(() => {
            return 0;
        });
    promises.push(audioCounter);

    const urlCounter = TdLibController.send({
        '@type': 'getChatMessageCount',
        chat_id: chatId,
        filter: { '@type': 'searchMessagesFilterUrl' },
        return_local: false
    })
        .then(result => {
            return result ? result.count : 0;
        })
        .catch(() => {
            return 0;
        });
    promises.push(urlCounter);

    const voiceAndVideoNoteCounter = TdLibController.send({
        '@type': 'getChatMessageCount',
        chat_id: chatId,
        filter: { '@type': 'searchMessagesFilterVoiceNote' },
        return_local: false
    })
        .then(result => {
            return result ? result.count : 0;
        })
        .catch(() => {
            return 0;
        });
    promises.push(voiceAndVideoNoteCounter);

    return await Promise.all(promises);
}
