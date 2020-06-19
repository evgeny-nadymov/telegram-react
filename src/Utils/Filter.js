/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isChannelChat, isChatArchived, isChatMuted, isGroupChat } from './Chat';
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

export function getFilterSubtitle(t, filter, chats) {
    // console.log('[f] getSubtitle', filter, chats)

    if (!chats) return null;
    if (!filter) return null;

    const {
        include_contacts,
        include_non_contacts,
        include_bots,
        include_groups,
        include_channels,
        included_chat_ids
    } = filter;

    const includedMap = new Map(included_chat_ids.map(i => [i.key, i.val]));

    const {
        exclude_muted,
        exclude_read,
        exclude_archived,
        excluded_chat_ids
    } = filter;

    const excludedMap = new Map(excluded_chat_ids.map(i => [i.key, i.val]));

    let count = 0;
    for (let i = 0; i < chats.chat_ids.length; i++) {
        let included = false;
        const chatId = chats.chat_ids[i];

        if (includedMap.has(chatId)){
            included = true;
        } else if (include_contacts && isContactChat(chatId)){
            included = true;
        } else if (include_non_contacts && isNonContactChat(chatId)){
            included = true;
        } else if (include_bots && isBotChat(chatId)) {
            included = true;}
        else if (include_groups && isGroupChat(chatId)) {
            included = true;
        } else if (include_channels && isChannelChat(chatId)) {
            included = true;
        }

        if (included) {
            if (excludedMap.has(chatId)) {
                included = false;
            } else if (exclude_muted && isChatMuted(chatId)) {
                included = false;
            } else if (exclude_read && isChatRead(chatId)) {
                included = false;
            } else if (exclude_archived && isChatArchived(chatId)) {
                included = false;
            }
        }

        if (included) {
            count++;
        }
    }

    if (!count) {
        return t('FilterNoChats');
    }

    return count === 1 ? '1 chat' : `${count} chats`;
}