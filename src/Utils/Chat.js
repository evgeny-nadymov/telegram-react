/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import dateFormat from '../Utils/Date';
import { getUserFullName, getUserShortName, getUserStatus, isUserOnline } from './User';
import { getSupergroupStatus } from './Supergroup';
import { getBasicGroupStatus } from './BasicGroup';
import { getLetters } from './Common';
import { getContent, isMessageUnread } from './Message';
import { isServiceMessage } from './ServiceMessage';
import { formatPhoneNumber } from './Phone';
import { getChannelStatus } from './Channel';
import { SERVICE_NOTIFICATIONS_USER_ID, SHARED_MESSAGE_SLICE_LIMIT } from '../Constants';
import BasicGroupStore from '../Stores/BasicGroupStore';
import ChatStore from '../Stores/ChatStore';
import MessageStore from '../Stores/MessageStore';
import NotificationStore from '../Stores/NotificationStore';
import SupergroupStore from '../Stores/SupergroupStore';
import UserStore from '../Stores/UserStore';
import TdLibController from '../Controllers/TdLibController';

export function getDeleteChatTitle(chatId, t = x => x) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return t('DeleteChat');
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup) {
                return supergroup.is_channel ? t('LeaveChannel') : t('LeaveMegaMenu');
            }

            return null;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return t('DeleteChatUser');
        }
    }

    return null;
}

export function getViewInfoTitle(chatId, t = x => x) {
    const chat = ChatStore.get(chatId);
    if (!chat) return;

    const { type } = chat;
    switch (type['@type']) {
        case 'chatTypeBasicGroup': {
            return t('ViewGroupInfo');
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return t('ViewProfile');
        }
        case 'chatTypeSupergroup': {
            if (type.is_channel) {
                return t('ViewChannelInfo');
            }

            return t('ViewGroupInfo');
        }
    }
}

export function getChatPosition(chatId, chatList = { '@type': 'chatListMain'}) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    const { positions } = chat;
    if (!positions) return null;
    if (!positions.length) return null;

    switch (chatList['@type']) {
        case 'chatListMain': {
            return positions.find(x => x.list['@type'] === 'chatListMain');
        }
        case 'chatListArchive': {
            return positions.find(x => x.list['@type'] === 'chatListArchive');
        }
        case 'chatListFilter': {
            return positions.find(x => x.list['@type'] === 'chatListFilter' && x.list.chat_filter_id === chatList.chat_filter_id);
        }
    }

    return null;
}

export function isChatPinned(chatId, chatList = { '@type': 'chatListMain'}) {
    const position = getChatPosition(chatId, chatList);
    if (!position) return false;

    return position.is_pinned;
}

export function hasChatList(chatId, chatList = { '@type': 'chatListMain'}) {
    const position = getChatPosition(chatId, chatList);

    return Boolean(position);
}

export function getChatOrder(chatId, chatList = { '@type': 'chatListMain' }) {
    const position = getChatPosition(chatId, chatList);
    if (!position) return '0';

    return position.order;
}

export function chatListEquals(list1, list2) {
    if (list1 && !list2) return false;
    if (!list1 && list2) return false;
    if (!list1 && !list2) return true;

    if (list1['@type'] !== list2['@type']) return false;

    switch (list1['@type']) {
        case 'chatListMain': {
            return true;
        }
        case 'chatListArchive': {
            return true;
        }
        case 'chatListFilter': {
            return list1.chat_filter_id === list2.chat_filter_id;
        }
    }

    return false;
}

export function positionListEquals(p1, p2) {
    if (p1 && !p2) return false;
    if (!p1 && p2) return false;
    if (!p1 && !p2) return true;

    const { list: list1 } = p1;
    const { list: list2 } = p2;

    return chatListEquals(list1, list2);
}

export function canUnpinMessage(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { pinned_message_id } = chat;

    return pinned_message_id > 0;
}

export function isChatArchived(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { positions } = chat;
    if (!positions) return false;

    const archivePosition = positions.find(x => x.list['@type'] === 'chatListArchive');
    if (!archivePosition) return false;
    if (archivePosition.order === '0') return false;

    return true;
}

export function canAddChatToList(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { is_sponsored, positions } = chat;
    if (is_sponsored) return false;
    if (!positions) return false;

    const mainPosition = positions.find(x => x.list['@type'] === 'chatListMain');
    if (mainPosition && isMeChat(chatId) || chatId === SERVICE_NOTIFICATIONS_USER_ID) {
        return false;
    }

    return true;
}

export function draftEquals(draft1, draft2) {
    if (!draft1 && !draft2) return true;
    if (draft1 && !draft2) return false;
    if (draft2 && !draft1) return false;

    const { input_message_text: inputMessageText1, reply_to_message_id: replyToMessageId1 } = draft1;
    const { input_message_text: inputMessageText2, reply_to_message_id: replyToMessageId2 } = draft2;

    if (replyToMessageId1 !== replyToMessageId2) {
        return false;
    }

    if (inputMessageText1['@type'] !== inputMessageText2['@type']) {
        return false;
    }

    if (inputMessageText1['@type'] !== 'inputMessageText') {
        return true;
    }

    const { text: formattedText1 } = inputMessageText1;
    const { text: formattedText2 } = inputMessageText2;

    if (!formattedText1 && !formattedText2) return true;
    if (formattedText1 && !formattedText2) return false;
    if (formattedText2 && !formattedText1) return false;

    const { text: text1, entities: entities1 } = formattedText1;
    const { text: text2, entities: entities2 } = formattedText2;

    if (text1 !== text2) {
        return false;
    }

    return entitiesEquals(entities1, entities2);
}

function entitiesEquals(entities1, entities2) {
    if (!entities1 && !entities2) return true;
    if (entities1 && !entities2) return false;
    if (entities2 && !entities1) return false;

    if (entities1.length !== entities2.length) {
        return false;
    }

    const map = new Map();
    entities1.forEach(x => {
        map.set(`${x.type['@type']}_${x.offset}_${x.length}`, x);
    });

    return entities2.every(x => map.has(`${x.type['@type']}_${x.offset}_${x.length}`));
}

function getGroupChatTypingString(inputTypingManager) {
    if (!inputTypingManager) return null;

    let size = inputTypingManager.actions.size;
    if (size > 2) {
        return `${size} people are typing`;
    } else if (size > 1) {
        let firstUser;
        let secondUser;
        for (let userId of inputTypingManager.actions.keys()) {
            if (!firstUser) {
                firstUser = UserStore.get(userId);
            } else if (!secondUser) {
                secondUser = UserStore.get(userId);
                break;
            }
        }

        if (!firstUser || !secondUser) {
            return `${size} people are typing`;
        }

        firstUser = firstUser.first_name ? firstUser.first_name : firstUser.second_name;
        secondUser = secondUser.first_name ? secondUser.first_name : secondUser.second_name;

        if (!firstUser || !secondUser) {
            return `${size} people are typing`;
        }

        return `${firstUser} and ${secondUser} are typing`;
    } else {
        let firstUser;
        if (inputTypingManager.actions.size >= 1) {
            for (let userId of inputTypingManager.actions.keys()) {
                if (!firstUser) {
                    firstUser = UserStore.get(userId);
                    break;
                }
            }

            if (!firstUser) {
                return `1 person is typing`;
            }

            firstUser = firstUser.first_name ? firstUser.first_name : firstUser.second_name;

            if (!firstUser) {
                return `1 person is typing`;
            }

            let action = inputTypingManager.actions.values().next().value.action;
            switch (action['@type']) {
                case 'chatActionRecordingVideo':
                    return `${firstUser} is recording a video`;
                case 'chatActionRecordingVideoNote':
                    return `${firstUser} is recording a video message`;
                case 'chatActionRecordingVoiceNote':
                    return `${firstUser} is recording a voice message`;
                case 'chatActionStartPlayingGame':
                    return `${firstUser} is playing a game`;
                case 'chatActionUploadingDocument':
                    return `${firstUser} is sending a file`;
                case 'chatActionUploadingPhoto':
                    return `${firstUser} is sending a photo`;
                case 'chatActionUploadingVideo':
                    return `${firstUser} is sending a video`;
                case 'chatActionUploadingVideoNote':
                    return `${firstUser} is sending a video message`;
                case 'chatActionUploadingVoiceNote':
                    return `${firstUser} is sending a voice message`;
                case 'chatActionChoosingContact':
                case 'chatActionChoosingLocation':
                case 'chatActionTyping':
                default:
                    return `${firstUser} is typing`;
            }
        }
    }

    return null;
}

function getPrivateChatTypingString(inputTypingManager) {
    if (!inputTypingManager) return null;

    if (inputTypingManager.actions.size >= 1) {
        let action = inputTypingManager.actions.values().next().value.action;
        switch (action['@type']) {
            case 'chatActionRecordingVideo':
                return 'recording a video';
            case 'chatActionRecordingVideoNote':
                return 'recording a video message';
            case 'chatActionRecordingVoiceNote':
                return 'recording a voice message';
            case 'chatActionStartPlayingGame':
                return 'playing a game';
            case 'chatActionUploadingDocument':
                return 'sending a file';
            case 'chatActionUploadingPhoto':
                return 'sending a photo';
            case 'chatActionUploadingVideo':
                return 'sending a video';
            case 'chatActionUploadingVideoNote':
                return 'sending a video message';
            case 'chatActionUploadingVoiceNote':
                return 'sending a voice message';
            case 'chatActionChoosingContact':
            case 'chatActionChoosingLocation':
            case 'chatActionTyping':
            default:
                return 'typing';
        }
    }

    return null;
}

function getChatTypingString(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    let typingManager = ChatStore.getTypingManager(chat.id);
    if (!typingManager) return null;

    switch (chat.type['@type']) {
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const typingString = getPrivateChatTypingString(typingManager);
            return typingString ? typingString + '...' : null;
        }
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            const typingString = getGroupChatTypingString(typingManager);
            return typingString ? typingString + '...' : null;
        }
    }

    return null;
}

function getMessageSenderFullName(message, t = k => k) {
    if (!message) return null;
    if (isServiceMessage(message)) return null;
    if (!message.sender_user_id) return null;

    return getUserFullName(message.sender_user_id, null, t);
}

function getMessageSenderName(message, t = k => k) {
    if (!message) return null;
    if (isServiceMessage(message)) return null;

    const chat = ChatStore.get(message.chat_id);
    if (chat && chat.type['@type'] !== 'chatTypeBasicGroup' && chat.type['@type'] !== 'chatTypeSupergroup') {
        return null;
    }

    return getUserShortName(message.sender_user_id, t);
}

function getLastMessageSenderName(chat, t = k => k) {
    if (!chat) return null;

    return getMessageSenderName(chat.last_message, t);
}

function getLastMessageContent(chat, t = key => key) {
    if (!chat) return null;

    const { last_message } = chat;
    if (!last_message) return null;

    return getContent(last_message, t);
}

function showChatUnreadMessageIcon(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { is_marked_as_unread, last_message, last_read_outbox_message_id } = chat;
    if (!last_message) return false;

    const { is_outgoing } = last_message;

    return (
        is_outgoing && last_message.id > last_read_outbox_message_id && !is_marked_as_unread && !showChatDraft(chatId)
    );
}

function showChatUnreadMentionCount(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { unread_mention_count } = chat;

    return unread_mention_count > 0;
}

function showChatUnreadCount(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { is_marked_as_unread, unread_count, unread_mention_count } = chat;

    return (
        unread_count > 1 ||
        (unread_count === 1 && unread_mention_count === 0) ||
        (is_marked_as_unread && unread_count === 0 && unread_mention_count === 0)
    );
}

function isChatUnread(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { is_marked_as_unread, unread_count, unread_mention_count } = chat;

    return is_marked_as_unread || unread_count > 0;
}

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

export function getScopeNotificationSettings(chatId) {
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

function getMessageDate(message) {
    const date = new Date(message.date * 1000);

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    if (date > dayStart) {
        return dateFormat(date, 'H:MM');
    }

    const now = new Date();
    const day = now.getDay();
    const weekStart = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(weekStart));
    if (date > monday) {
        return dateFormat(date, 'ddd');
    }

    return dateFormat(date, 'd.mm.yyyy');
}

function getLastMessageDate(chat) {
    if (!chat) return null;
    if (!chat.last_message) return null;
    if (!chat.last_message.date) return null;
    if (showChatDraft(chat.id)) return null;

    return getMessageDate(chat.last_message);
}

function getChatSubtitleWithoutTyping(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    const { type } = chat;
    if (!type) return null;

    switch (type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(type.basic_group_id);
            if (basicGroup) {
                return getBasicGroupStatus(basicGroup, chatId);
            }

            break;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const user = UserStore.get(type.user_id);
            if (user) {
                return getUserStatus(user);
            }

            break;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);
            if (supergroup) {
                return supergroup.is_channel
                    ? getChannelStatus(supergroup, chatId)
                    : getSupergroupStatus(supergroup, chatId);
            }

            break;
        }
    }

    return null;
}

function getChatSubtitle(chatId, showSavedMessages = false) {
    if (isMeChat(chatId) && showSavedMessages) {
        return null;
    }

    const chatTypingString = getChatTypingString(chatId);
    if (chatTypingString) {
        return chatTypingString;
    }

    return getChatSubtitleWithoutTyping(chatId);
}

function getChatLetters(chatId, t) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    let title = chat.title || t('HiddenName');
    if (title.length === 0) return null;

    let letters = getLetters(title);
    if (letters && letters.length > 0) {
        return letters;
    }

    return chat.title.charAt(0);
}

function isAccentChatSubtitleWithoutTyping(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return false;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const user = UserStore.get(chat.type.user_id);
            if (user) {
                return isUserOnline(user);
            }

            break;
        }
        case 'chatTypeSupergroup': {
            return false;
        }
    }

    return false;
}

function isAccentChatSubtitle(chatId) {
    const typingString = getChatTypingString(chatId);
    if (typingString) return false;

    return isAccentChatSubtitleWithoutTyping(chatId);
}

function getChatUsername(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return null;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const user = UserStore.get(chat.type.user_id);
            if (user) {
                return user.username;
            }

            break;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup) {
                return supergroup.username;
            }
            break;
        }
    }

    return null;
}

function getChatPhoneNumber(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return null;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const user = UserStore.get(chat.type.user_id);
            if (user) {
                return formatPhoneNumber(user.phone_number);
            }

            break;
        }
        case 'chatTypeSupergroup': {
            return null;
        }
    }

    return null;
}

function getChatBio(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
            if (fullInfo) {
                return fullInfo.description;
            }

            break;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const fullInfo = UserStore.getFullInfo(chat.type.user_id);
            if (fullInfo) {
                return fullInfo.bio;
            }

            break;
        }
        case 'chatTypeSupergroup': {
            const fullInfo = SupergroupStore.getFullInfo(chat.type.supergroup_id);
            if (fullInfo) {
                return fullInfo.description;
            }

            break;
        }
    }

    return null;
}

function isPrivateChat(chatId) {
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
            return true;
        }
    }

    return false;
}

function isGroupChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            return true;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return false;
        }
    }

    return false;
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

function isChatMember(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;
    if (!type) return false;

    switch (type['@type']) {
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);
            if (supergroup && supergroup.status) {
                switch (supergroup.status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return true;
                    }
                    case 'chatMemberStatusBanned': {
                        return false;
                    }
                    case 'chatMemberStatusCreator': {
                        return supergroup.status.is_member;
                    }
                    case 'chatMemberStatusLeft': {
                        return false;
                    }
                    case 'chatMemberStatusMember': {
                        return true;
                    }
                    case 'chatMemberStatusRestricted': {
                        return supergroup.status.is_member;
                    }
                }
            }
            break;
        }
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(type.basic_group_id);
            if (basicGroup && basicGroup.status) {
                switch (basicGroup.status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return true;
                    }
                    case 'chatMemberStatusBanned': {
                        return false;
                    }
                    case 'chatMemberStatusCreator': {
                        return basicGroup.status.is_member;
                    }
                    case 'chatMemberStatusLeft': {
                        return false;
                    }
                    case 'chatMemberStatusMember': {
                        return true;
                    }
                    case 'chatMemberStatusRestricted': {
                        return basicGroup.status.is_member;
                    }
                }
            }
            break;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return true;
        }
    }

    return false;
}
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

function getChatTitle(chatId, showSavedMessages = false, t = key => key) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    if (isMeChat(chatId) && showSavedMessages) {
        return t('SavedMessages');
    }

    return chat.title || t('HiddenName');
}

export function getChatType(chatId, t = key => key) {
    const chat = ChatStore.get(chatId);
    if (!chat) return '';

    switch (chat.type['@type']) {
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            if (isMeChat(chatId)) {
                return '';
            }

            if (isBotChat(chatId)) {
                return t('Bot');
            }

            if (isContactChat(chatId)) {
                return t('FilterContact');
            }

            return t('FilterNonContact');
        }
        case 'chatTypeBasicGroup': {
            return t('AccDescrGroup');
        }
        case 'chatTypeSupergroup': {
            return isChannelChat(chatId) ? t('AccDescrGroup') : t('AccDescrChannel');
        }
    }

    return '';
}

export function isDeletedPrivateChat(chatId) {
    const fallbackValue = false;

    const chat = ChatStore.get(chatId);
    if (!chat) return fallbackValue;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            return false;
        }
        case 'chatTypeSecret':
        case 'chatTypePrivate': {
            const user = UserStore.get(chat.type.user_id);

            return user && user.type['@type'] === 'userTypeDeleted';
        }
    }

    return fallbackValue;
}

function isMeChat(chatId) {
    const fallbackValue = false;

    const chat = ChatStore.get(chatId);
    if (!chat) return fallbackValue;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            return false;
        }
        case 'chatTypeSecret':
        case 'chatTypePrivate': {
            return UserStore.getMyId() === chat.type.user_id;
        }
    }

    return fallbackValue;
}

function getGroupChatMembers(chatId) {
    const fallbackValue = [];

    const chat = ChatStore.get(chatId);
    if (!chat) return fallbackValue;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
            if (fullInfo) {
                return fullInfo.members || fallbackValue;
            }

            break;
        }
        case 'chatTypeSupergroup': {
            break;
        }
        case 'chatTypeSecret':
        case 'chatTypePrivate': {
            break;
        }
    }

    return fallbackValue;
}

export async function getChatMedia(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    console.log('[media] getChatMedia start', chatId);
    const promises = [];

    const limit = 100;
    promises.push(TdLibController.send({
        '@type': 'searchChatMessages',
        chat_id: chatId,
        query: '',
        sender_user_id: 0,
        from_message_id: 0,
        offset: 0,
        limit,
        filter: { '@type': 'searchMessagesFilterPhotoAndVideo' }
    }));
    promises.push(TdLibController.send({
        '@type': 'searchChatMessages',
        chat_id: chatId,
        query: '',
        sender_user_id: 0,
        from_message_id: 0,
        offset: 0,
        limit,
        filter: { '@type': 'searchMessagesFilterDocument' }
    }));
    promises.push(TdLibController.send({
        '@type': 'searchChatMessages',
        chat_id: chatId,
        query: '',
        sender_user_id: 0,
        from_message_id: 0,
        offset: 0,
        limit,
        filter: { '@type': 'searchMessagesFilterAudio' }
    }));
    promises.push(TdLibController.send({
        '@type': 'searchChatMessages',
        chat_id: chatId,
        query: '',
        sender_user_id: 0,
        from_message_id: 0,
        offset: 0,
        limit,
        filter: { '@type': 'searchMessagesFilterUrl' }
    }));
    promises.push(TdLibController.send({
        '@type': 'searchChatMessages',
        chat_id: chatId,
        query: '',
        sender_user_id: 0,
        from_message_id: 0,
        offset: 0,
        limit,
        filter: { '@type': 'searchMessagesFilterVoiceNote' }
    }));

    const [photoAndVideo, document, audio, url, voiceNote] = await Promise.all(promises);
    const media = {
        photoAndVideo: photoAndVideo.messages,
        document: document.messages,
        audio: audio.messages,
        url: url.messages,
        voiceNote: voiceNote.messages,
    }
    console.log('[media] getChatMedia stop', chatId, media);

    // console.log("media");
    // if (media.document.length){
    //     console.log(media.document);
    //     var file_name = media.document[0].content.document.file_name;
    //     var mime_type = media.document[0].content.document.mime_type;
    //     var remote = media.document[0].content.document.document.remote;
    //     var id = remote.id;
    //     var unique_id = remote.unique_id;
    //     console.log(file_name, mime_type, id, unique_id);
    // }

    TdLibController.clientUpdate({
        '@type': 'clientUpdateChatMedia',
        chatId,
        media
    });
}

async function getChatFullInfo(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    const { type } = chat;
    if (!type) return null;

    switch (type['@type']) {
        case 'chatTypePrivate': {
            return await TdLibController.send({
                '@type': 'getUserFullInfo',
                user_id: type.user_id
            });
        }
        case 'chatTypeSecret': {
            return await TdLibController.send({
                '@type': 'getUserFullInfo',
                user_id: type.user_id
            });
        }
        case 'chatTypeBasicGroup': {
            return await TdLibController.send({
                '@type': 'getBasicGroupFullInfo',
                basic_group_id: type.basic_group_id
            });
        }
        case 'chatTypeSupergroup': {
            return await TdLibController.send({
                '@type': 'getSupergroupFullInfo',
                supergroup_id: type.supergroup_id
            });
        }
    }

    return null;
}

function hasBasicGroupId(chatId, basicGroupId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    return type && type['@type'] === 'chatTypeBasicGroup' && type.basic_group_id === basicGroupId;
}


function isSupergroup(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    return type && type['@type'] === 'chatTypeSupergroup';
}

function getSupergroupId(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    if (type && type['@type'] === 'chatTypeSupergroup') {
        return type.supergroup_id;
    }

    return 0;
}

function hasSupergroupId(chatId, supergroupId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    return isSupergroup(chatId) && type.supergroup_id === supergroupId;
}

function hasUserId(chatId, userId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    return (
        type && (type['@type'] === 'chatTypePrivate' || type['@type'] === 'chatTypeSecret') && type.user_id === userId
    );
}

function getChatUserId(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return 0;

    const { type } = chat;

    return type && (type['@type'] === 'chatTypePrivate' || type['@type'] === 'chatTypeSecret') ? type.user_id : 0;
}

function getPhotoFromChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    if (isPrivateChat(chatId)) {
        const user = UserStore.get(getChatUserId(chatId));
        if (user) {
            return user.profile_photo;
        }
    }

    return chat.photo;
}

function canSendMediaMessages(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type, permissions: globalPermissions } = chat;
    if (!type) return false;
    if (!globalPermissions) return false;

    const { can_send_media_messages } = globalPermissions;

    switch (type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(type.basic_group_id);
            if (!basicGroup) return false;

            const { status } = basicGroup;
            if (!status) return false;

            const { is_member, permissions } = status;

            switch (status['@type']) {
                case 'chatMemberStatusAdministrator': {
                    return true;
                }
                case 'chatMemberStatusBanned': {
                    return false;
                }
                case 'chatMemberStatusCreator': {
                    return is_member;
                }
                case 'chatMemberStatusLeft': {
                    return false;
                }
                case 'chatMemberStatusMember': {
                    return true;
                }
                case 'chatMemberStatusRestricted': {
                    return is_member && permissions && permissions.can_send_media_messages;
                }
            }

            break;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return can_send_media_messages;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (!supergroup) return false;

            const { status } = supergroup;
            if (!status) return false;

            const { is_member, permissions } = status;

            switch (status['@type']) {
                case 'chatMemberStatusAdministrator': {
                    return true;
                }
                case 'chatMemberStatusBanned': {
                    return false;
                }
                case 'chatMemberStatusCreator': {
                    return is_member; //can_send_media_messages && is_member;
                }
                case 'chatMemberStatusLeft': {
                    return false;
                }
                case 'chatMemberStatusMember': {
                    return can_send_media_messages && !supergroup.is_channel;
                }
                case 'chatMemberStatusRestricted': {
                    return can_send_media_messages && is_member && permissions && permissions.can_send_media_messages;
                }
            }
        }
    }

    return false;
}

function getChatShortTitle(chatId, showSavedMessages = false, t = k => k) {
    if (isMeChat(chatId) && showSavedMessages) {
        return t('SavedMessages');
    }

    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return chat.title;
        }
        case 'chatTypeSupergroup': {
            return chat.title;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return getUserShortName(chat.type.user_id, t);
        }
    }

    return null;
}

function getGroupChatMembersCount(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
            if (basicGroup) {
                return basicGroup.member_count;
            }

            return 0;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup) {
                return supergroup.member_count;
            }

            return 0;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return 0;
        }
    }

    return 0;
}

function canClearHistory(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;
    if (!chat.last_message) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return true;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup) {
                return !Boolean(supergroup.username);
            }

            return true;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return true;
        }
    }

    return false;
}

function canDeleteChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return isChatMember(chatId);
        }
        case 'chatTypeSupergroup': {
            return isChatMember(chatId);
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return !isMeChat(chatId);
        }
    }

    return false;
}

function canSendPolls(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type, permissions: globalPermissions } = chat;
    if (!type) return false;
    if (!globalPermissions) return false;

    const { can_send_polls } = globalPermissions;

    switch (type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(type.basic_group_id);
            if (!basicGroup) return false;

            const { status } = basicGroup;
            if (!status) return false;

            const { is_member, permissions } = status;

            switch (status['@type']) {
                case 'chatMemberStatusAdministrator': {
                    return true;
                }
                case 'chatMemberStatusBanned': {
                    return false;
                }
                case 'chatMemberStatusCreator': {
                    return is_member;
                }
                case 'chatMemberStatusLeft': {
                    return false;
                }
                case 'chatMemberStatusMember': {
                    return true;
                }
                case 'chatMemberStatusRestricted': {
                    return is_member && permissions && permissions.can_send_polls;
                }
            }

            break;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return can_send_polls;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);
            if (!supergroup) return false;

            const { status } = supergroup;
            if (!status) return false;

            const { is_member, permissions } = status;

            switch (status['@type']) {
                case 'chatMemberStatusAdministrator': {
                    return true;
                }
                case 'chatMemberStatusBanned': {
                    return false;
                }
                case 'chatMemberStatusCreator': {
                    return is_member; //can_send_polls && is_member;
                }
                case 'chatMemberStatusLeft': {
                    return false;
                }
                case 'chatMemberStatusMember': {
                    return can_send_polls && !supergroup.is_channel;
                }
                case 'chatMemberStatusRestricted': {
                    return can_send_polls && is_member && permissions && permissions.can_send_polls;
                }
            }
        }
    }

    return false;
}

function canSendMessages(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type, permissions: globalPermissions } = chat;
    if (!type) return false;
    if (!globalPermissions) return false;

    const { can_send_messages } = globalPermissions;

    switch (type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(type.basic_group_id);
            if (!basicGroup) return false;

            const { status } = basicGroup;
            if (!status) return false;

            const { is_member, permissions } = status;

            switch (status['@type']) {
                case 'chatMemberStatusAdministrator': {
                    return true;
                }
                case 'chatMemberStatusBanned': {
                    return false;
                }
                case 'chatMemberStatusCreator': {
                    return is_member;
                }
                case 'chatMemberStatusLeft': {
                    return false;
                }
                case 'chatMemberStatusMember': {
                    return true;
                }
                case 'chatMemberStatusRestricted': {
                    return is_member && permissions && permissions.can_send_messages;
                }
            }

            break;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return can_send_messages;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);
            if (!supergroup) return false;

            const { status } = supergroup;
            if (!status) return false;

            const { is_member, permissions } = status;

            switch (status['@type']) {
                case 'chatMemberStatusAdministrator': {
                    return true;
                }
                case 'chatMemberStatusBanned': {
                    return false;
                }
                case 'chatMemberStatusCreator': {
                    return is_member; //can_send_messages && is_member;
                }
                case 'chatMemberStatusLeft': {
                    return false;
                }
                case 'chatMemberStatusMember': {
                    return can_send_messages && !supergroup.is_channel;
                }
                case 'chatMemberStatusRestricted': {
                    return can_send_messages && is_member && permissions && permissions.can_send_messages;
                }
            }
        }
    }

    return false;
}

function showChatDraft(chatId) {
    const chat = ChatStore.get(chatId);
    const draft = getChatDraft(chatId);

    return draft && chat.unread_count === 0 && chat.unread_mention_count === 0;
}

function getChatDraft(chatId) {
    const chat = ChatStore.get(chatId);

    if (chat) {
        const { draft_message } = chat;
        if (draft_message) {
            const { input_message_text } = draft_message;
            if (input_message_text) {
                return input_message_text.text;
            }
        }
    }

    return null;
}

function getChatDraftReplyToMessageId(chatId) {
    let replyToMessageId = 0;
    const chat = ChatStore.get(chatId);
    if (chat) {
        const { draft_message } = chat;
        if (draft_message) {
            replyToMessageId = draft_message.reply_to_message_id;
        }
    }

    return replyToMessageId;
}

function canPinMessages(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type, permissions: globalPermissions } = chat;
    if (!type) return false;
    if (!globalPermissions) return false;

    const { can_pin_messages } = globalPermissions;

    switch (type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(type.basic_group_id);
            if (!basicGroup) return false;

            const { status } = basicGroup;
            if (!status) return false;

            const { is_member, permissions } = status;

            switch (status['@type']) {
                case 'chatMemberStatusAdministrator': {
                    return status.can_pin_messages;
                }
                case 'chatMemberStatusBanned': {
                    return false;
                }
                case 'chatMemberStatusCreator': {
                    return false;
                }
                case 'chatMemberStatusLeft': {
                    return false;
                }
                case 'chatMemberStatusMember': {
                    return false;
                }
                case 'chatMemberStatusRestricted': {
                    return is_member && permissions && permissions.can_pin_messages;
                }
            }

            break;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return can_pin_messages;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);
            if (!supergroup) return false;

            const { status } = supergroup;
            if (!status) return false;

            const { is_member, permissions } = status;

            switch (status['@type']) {
                case 'chatMemberStatusAdministrator': {
                    return can_pin_messages || status.can_pin_messages;
                }
                case 'chatMemberStatusBanned': {
                    return false;
                }
                case 'chatMemberStatusCreator': {
                    return is_member; //can_pin_messages && is_member;
                }
                case 'chatMemberStatusLeft': {
                    return false;
                }
                case 'chatMemberStatusMember': {
                    return false;
                }
                case 'chatMemberStatusRestricted': {
                    return can_pin_messages && is_member && permissions && permissions.can_pin_messages;
                }
            }
        }
    }

    return false;
}

function isChatVerified(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;
    if (!type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return false;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            const user = UserStore.get(type.user_id);

            return user && user.is_verified;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);

            return supergroup && supergroup.is_verified;
        }
    }

    return false;
}

function isChatSecret(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;
    if (!type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return false;
        }
        case 'chatTypePrivate': {
            return false;
        }
        case 'chatTypeSecret': {
            return true;
        }
        case 'chatTypeSupergroup': {
            return false;
        }
    }

    return false;
}

export function isCreator(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;
    if (!type) return false;

    switch (type['@type']) {
        case 'chatTypeBasicGroup': {
            const { basic_group_id } = type;
            const basicGroup = BasicGroupStore.get(basic_group_id);
            if (!basicGroup) return false;

            const { status } = basicGroup;
            if (status) return false;

            return status['@type'] === 'chatMemberStatusCreator';
        }
        case 'chatTypePrivate': {
            return false;
        }
        case 'chatTypeSecret': {
            return false;
        }
        case 'chatTypeSupergroup': {
            const { supergroup_id } = type;
            const supergroup = SupergroupStore.get(supergroup_id);
            if (!supergroup) return false;

            const { status } = supergroup;
            if (!status) return false;

            return status['@type'] === 'chatMemberStatusCreator';
        }
    }

    return false;
}

export function getChatTypeId(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return 0;

    const { type } = chat;
    if (!type) return 0;

    switch (type['@type']) {
        case 'chatTypeSupergroup': {
            return type.supergroup_id;
        }
        case 'chatTypeBasicGroup': {
            return type.basic_group_id;
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return type.user_id;
        }
    }
}

export {
    showChatDraft,
    getChatDraft,
    getChatDraftReplyToMessageId,
    getChatTypingString,
    showChatUnreadMessageIcon,
    showChatUnreadMentionCount,
    showChatUnreadCount,
    getChatMuteFor,
    getChatSubtitle,
    getChatSubtitleWithoutTyping,
    getLastMessageSenderName,
    getMessageSenderName,
    getMessageSenderFullName,
    getLastMessageContent,
    getLastMessageDate,
    getMessageDate,
    getChatLetters,
    isAccentChatSubtitle,
    isAccentChatSubtitleWithoutTyping,
    isChatMuted,
    getChatUsername,
    getChatPhoneNumber,
    getChatBio,
    isPrivateChat,
    isGroupChat,
    isChannelChat,
    isChatUnread,
    isChatMember,
    isChatVerified,
    isChatSecret,
    getChatTitle,
    getGroupChatMembers,
    getChatFullInfo,
    hasBasicGroupId,
    hasSupergroupId,
    isSupergroup,
    getSupergroupId,
    hasUserId,
    getChatUserId,
    getPhotoFromChat,
    getChatShortTitle,
    getGroupChatMembersCount,
    isMeChat,
    canClearHistory,
    canDeleteChat,
    canPinMessages,
    canSendMediaMessages,
    canSendMessages,
    canSendPolls
};
