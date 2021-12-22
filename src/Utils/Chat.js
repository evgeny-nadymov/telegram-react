/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import dateFormat from '../Utils/Date';
import { getUserFullName, getUserShortName, getUserStatus, isMeUser, isUserOnline } from './User';
import { getSupergroupStatus } from './Supergroup';
import { getBasicGroupStatus } from './BasicGroup';
import { getLetters } from './Common';
import { getContent, isMessageUnread } from './Message';
import { isServiceMessage } from './ServiceMessage';
import { formatPhoneNumber } from './Phone';
import { getChannelStatus } from './Channel';
import { loadReplyContents } from './File';
import { SERVICE_NOTIFICATIONS_USER_IDS } from '../Constants';
import BasicGroupStore from '../Stores/BasicGroupStore';
import CallStore from '../Stores/CallStore';
import ChatStore from '../Stores/ChatStore';
import FileStore from '../Stores/FileStore';
import LStore from '../Stores/LocalizationStore';
import MessageStore from '../Stores/MessageStore';
import NotificationStore from '../Stores/NotificationStore';
import SupergroupStore from '../Stores/SupergroupStore';
import UserStore from '../Stores/UserStore';
import TdLibController from '../Controllers/TdLibController';

export function canBeReported(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    return chat.can_be_reported;
}

export function canBeCalled(chatId) {
    const userId = getChatUserId(chatId);
    const fullInfo = UserStore.getFullInfo(userId);
    if (!fullInfo) return false;

    return fullInfo.can_be_called;
}

export function canManageVoiceChats(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    let status = null;
    const { type } = chat;
    switch (type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(getBasicGroupId(chatId));
            if (!basicGroup) return false;

            status = basicGroup.status;
            break;
        }
        case 'chatTypeSupergroup': {
            if (isChannelChat(chatId)) return false;
            
            const supergroup = SupergroupStore.get(getSupergroupId(chatId));
            if (!supergroup) return false;

            status = supergroup.status;
            break;
        }
    }

    if (!status) {
        return false;
    }

    switch (status['@type']) {
        case 'chatMemberStatusAdministrator': {
            return status.can_manage_voice_chats;
        }
        case 'chatMemberStatusCreator': {
            return status.is_member;
        }
    }

    return false;
}

export function getChatSender(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return { '@type': 'messageSenderChat', chat_id: chatId };
        }
        case 'chatTypeSupergroup': {
            return { '@type': 'messageSenderChat', chat_id: chatId };
        }
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return { '@type': 'messageSenderUser', user_id: getChatUserId(chatId) };
        }
    }

    return null;
}

export function getChatLocation(chatId) {
    const supergoupId = getSupergroupId(chatId);
    if (!supergoupId) return null;

    const fullInfo = SupergroupStore.getFullInfo(supergoupId);
    if (!fullInfo) return null;

    return fullInfo.location;
}

export function canSwitchBlocked(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return false;
        }
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

export function hasOnePinnedMessage(chatId) {
    const media = MessageStore.getMedia(chatId);
    if (!media) return false;

    const { pinned } = media;
    if (!pinned) return false;

    return pinned.length === 1;
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
    if (mainPosition && isMeChat(chatId) || SERVICE_NOTIFICATIONS_USER_IDS.some(x => x === chatId)) {
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
    if (!message.sender_id) return null;

    switch (message.sender_id['@type']) {
        case 'messageSenderUser': {
            return getUserFullName(message.sender_id.user_id, null, t);
        }
    }

    return getChatTitle(message.sender_id.chat_id, false, t);
}

function getMessageSenderName(message, t = k => k) {
    if (!message) return null;
    if (isServiceMessage(message)) return null;

    const { chat_id, sender_id } = message;

    const chat = ChatStore.get(chat_id);
    if (!chat) return null;

    switch (chat.type['@type']) {
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return null;
        }
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup': {
            if (isChannelChat(chat_id)) {
                return null;
            }

            if (!sender_id) {
                console.log('[sender_id] empty', message);
                return null;
            }

            switch (sender_id['@type']) {
                case 'messageSenderUser': {
                    if (isMeUser(sender_id.user_id)) {
                        return t('FromYou');
                    }

                    return getUserShortName(sender_id.user_id, t);
                }
                case 'messageSenderChat': {
                    return getChatTitle(sender_id.chat_id, false, t);
                }
            }
        }
    }

    return null;
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
        return dateFormat(date, LStore.formatterDay);
    }

    const now = new Date();
    const day = now.getDay();
    const weekStart = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(weekStart));
    if (date > monday) {
        return date.toLocaleString(LStore.i18n.language, { weekday: 'short' });
        //return dateFormat(date, 'ddd');
    }

    return dateFormat(date, LStore.formatterYear);
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
        case 'chatTypeBasicGroup': {
            return true;
        }
        case 'chatTypeSupergroup': {
            return !chat.type.is_channel;
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
            return chat.type.is_channel;
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

function getChatTitle(chatId, showSavedMessages = false) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    if (isMeChat(chatId) && showSavedMessages) {
        return LStore.i18n.t('SavedMessages');
    }

    return chat.title || LStore.i18n.t('HiddenName');
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

export function hasChatGroupCall(chatId) {
    const chat = ChatStore.get(chatId);

    return Boolean(chat && chat.voice_chat_group_call_id);
}

export async function getChatMedia(chatId) {
    // return;

    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    // console.log('[media] getChatMedia start', chatId);
    const { voice_chat_group_call_id } = chat;

    const promises = [];

    const limit = 100;
    promises.push(getChatFullInfoRequest(chatId) || Promise.resolve(null));
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
    promises.push(TdLibController.send({
        '@type': 'searchChatMessages',
        chat_id: chatId,
        query: '',
        sender_user_id: 0,
        from_message_id: 0,
        offset: 0,
        limit,
        filter: { '@type': 'searchMessagesFilterPinned' }
    }));
    if (isPrivateChat(chatId) && !isMeChat(chatId)) {
        promises.push(TdLibController.send({
            '@type': 'getGroupsInCommon',
            user_id: getChatUserId(chatId),
            offset_chat_id: 0,
            limit
        }));
    } else {
        promises.push(Promise.resolve(null));
    }
    const call = CallStore.get(voice_chat_group_call_id);
    if (hasChatGroupCall(chatId) && !call){
        promises.push(TdLibController.send({
            '@type': 'getGroupCall',
            group_call_id: voice_chat_group_call_id
        }));
    } else {
        promises.push(Promise.resolve(call));
    }
    if (isSupergroup(chatId) && !isChannelChat(chatId)){
        promises.push(TdLibController.send({
            '@type': 'getSupergroupMembers',
            supergroup_id: getSupergroupId(chatId),
            filter: { '@type': 'supergroupMembersFilterRecent' },
            offset: 0,
            limit: 200
        }));
    }

    const [fullInfo, photoAndVideo, document, audio, url, voiceNote, pinned, groupsInCommon, groupCall, supergroupMembers] = await Promise.all(promises);
    const media = {
        fullInfo,
        photoAndVideo: photoAndVideo.messages,
        document: document.messages,
        audio: audio.messages,
        url: url.messages,
        voiceNote: voiceNote.messages,
        pinned: pinned.messages,
        groupsInCommon: groupsInCommon ? groupsInCommon.chat_ids.map(x => ChatStore.get(x)) : [],
        groupCall,
        supergroupMembers
    }
    // console.log('[media] getChatMedia stop', chatId, media);

    const store = FileStore.getStore();
    loadReplyContents(store, pinned.messages);

    TdLibController.clientUpdate({
        '@type': 'clientUpdateChatMedia',
        chatId,
        media
    });
}

export async function getChatFullInfoRequest(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    const { type } = chat;
    if (!type) return null;

    switch (type['@type']) {
        case 'chatTypePrivate':
        case 'chatTypeSecret': {
            return TdLibController.send({
                '@type': 'getUserFullInfo',
                user_id: type.user_id
            });
        }
        case 'chatTypeBasicGroup': {
            return TdLibController.send({
                '@type': 'getBasicGroupFullInfo',
                basic_group_id: type.basic_group_id
            });
        }
        case 'chatTypeSupergroup': {
            return TdLibController.send({
                '@type': 'getSupergroupFullInfo',
                supergroup_id: type.supergroup_id
            });
        }
    }

    return null;
}

async function getChatFullInfo(chatId) {
    const request = getChatFullInfoRequest(chatId);
    if (!request) return null;

    return await request;
}

export function getBasicGroupId(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    if (type && type['@type'] === 'chatTypeBasicGroup') {
        return type.basic_group_id;
    }

    return 0;
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

    return chat.can_be_deleted_only_for_self || chat.can_be_deleted_for_all_users;
}

function canDeleteChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return true;
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
