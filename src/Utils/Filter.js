/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { hasChatList } from './Chat';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import { isMessageUnread } from './Message';

export function isContactChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            return false;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const user = UserStore.get(chat.type.user_id);
            if (!user) return false;

            return user.is_contact || user.is_mutual_contact;
        }
    }

    return false;
}

export function isNonContactChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            return false;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const user = UserStore.get(chat.type.user_id);
            if (!user) return false;

            return !user.is_contact;
        }
    }

    return false;
}

export function isBotChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            return false;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const user = UserStore.get(chat.type.user_id);
            if (!user) return false;

            return user.type['@type'] === 'userTypeBot';
        }
    }

    return false;
}

export function isChatRead(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return true;

    const { last_message } = chat;
    if (!last_message) return true;

    const { id } = last_message;

    return !isMessageUnread(chatId, id);
}

export function getFilterSubtitle(t, filterId, chats) {
    // console.log('[f] getSubtitle', filterId, chats);
    if (!chats) return ' ';

    let count = 0;
    for (let i = 0; i < chats.chat_ids.length; i++) {
        if (hasChatList(chats.chat_ids[i], { '@type': 'chatListFilter', chat_filter_id: filterId })) {
            count++;
        }
    }

    if (!count) {
        return t('FilterNoChats');
    }

    return count === 1 ? '1 chat' : `${count} chats`;
}