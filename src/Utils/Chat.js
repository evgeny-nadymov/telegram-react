/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import dateFormat from 'dateformat';
import { getUserFullName, getUserShortName, getUserStatus, isUserOnline } from './User';
import { getSupergroupStatus } from './Supergroup';
import { getBasicGroupStatus } from './BasicGroup';
import { getLetters } from './Common';
import { getContent } from './Message';
import { isServiceMessage } from './ServiceMessage';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import ApplicationStore from '../Stores/ApplicationStore';
import TdLibController from '../Controllers/TdLibController';
import InputBoxControl from '../Components/ColumnMiddle/Footer';

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

function getMessageSenderFullName(message) {
    if (!message) return null;
    if (isServiceMessage(message)) return null;
    if (!message.sender_user_id) return null;

    const user = UserStore.get(message.sender_user_id);
    if (!user) return null;

    return getUserFullName(user);
}

function getMessageSenderName(message) {
    if (!message) return null;
    if (isServiceMessage(message)) return null;

    const chat = ChatStore.get(message.chat_id);
    if (chat && chat.type['@type'] !== 'chatTypeBasicGroup' && chat.type['@type'] !== 'chatTypeSupergroup') {
        return null;
    }

    return getUserShortName(message.sender_user_id);
}

function getLastMessageSenderName(chat) {
    if (!chat) return null;

    return getMessageSenderName(chat.last_message);
}

function getLastMessageContent(chat, t = key => key) {
    if (!chat) return null;

    const { last_message } = chat;
    if (!last_message) return null;

    return getContent(last_message, t);
}

function getChatUnreadMessageIcon(chat) {
    if (!chat) return false;
    if (!chat.last_message) return false;

    return chat.last_message.is_outgoing && chat.last_message.id > chat.last_read_outbox_message_id;
}

function getChatUnreadCount(chat) {
    if (!chat) return null;
    if (!chat.unread_count) return null;

    return chat.unread_count;
}

function getChatUnreadMentionCount(chat) {
    if (!chat) return null;
    if (!chat.unread_mention_count) return null;

    return chat.unread_mention_count;
}

function isChatMuted(chat) {
    return getChatMuteFor(chat) > 0;
}

function getChatMuteFor(chat) {
    if (!chat) return 0;

    if (chat.use_default_mute_for) {
        switch (chat.type) {
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                const notificationSettings = ApplicationStore.getNotificationSettings(
                    'notificationSettingsScopePrivateChats'
                );
                if (notificationSettings) {
                    return notificationSettings.mute_for;
                }

                return 0;
            }
            case 'chatTypeBasicGroup':
            case 'chatTypeSupergroup': {
                const notificationSettings = ApplicationStore.getNotificationSettings(
                    'notificationSettingsScopeGroupChats'
                );
                if (notificationSettings) {
                    return notificationSettings.mute_for;
                }

                return 0;
            }
        }
    } else {
        if (!chat.notification_settings) return 0;

        return chat.notification_settings.mute_for;
    }
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
                return getSupergroupStatus(supergroup, chatId);
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

function getChatLetters(chat) {
    if (!chat) return null;

    let title = chat.title || 'Deleted account';
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
                return user.phone_number;
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
            return null;
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
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup && supergroup.status) {
                switch (supergroup.status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return true;
                    }
                    case 'chatMemberStatusBanned': {
                        return false;
                    }
                    case 'chatMemberStatusCreator': {
                        return true;
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
        }
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
            if (basicGroup && basicGroup.status) {
                switch (basicGroup.status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return true;
                    }
                    case 'chatMemberStatusBanned': {
                        return false;
                    }
                    case 'chatMemberStatusCreator': {
                        return true;
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

function getChatTitle(chatId, showSavedMessages = false, t = key => key) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;

    if (isMeChat(chatId) && showSavedMessages) {
        return t('SavedMessages');
    }

    return chat.title || t('HiddenName');
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

function getChatFullInfo(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return;
    if (!chat.type) return;

    switch (chat.type['@type']) {
        case 'chatTypePrivate': {
            TdLibController.send({
                '@type': 'getUserFullInfo',
                user_id: chat.type.user_id
            });
            break;
        }
        case 'chatTypeSecret': {
            TdLibController.send({
                '@type': 'getUserFullInfo',
                user_id: chat.type.user_id
            });
            break;
        }
        case 'chatTypeBasicGroup': {
            TdLibController.send({
                '@type': 'getBasicGroupFullInfo',
                basic_group_id: chat.type.basic_group_id
            });
            break;
        }
        case 'chatTypeSupergroup': {
            TdLibController.send({
                '@type': 'getSupergroupFullInfo',
                supergroup_id: chat.type.supergroup_id
            });
            break;
        }
    }
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

function canSendFiles(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
            if (basicGroup && basicGroup.status) {
                switch (basicGroup.status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return true;
                    }
                    case 'chatMemberStatusBanned': {
                        return false;
                    }
                    case 'chatMemberStatusCreator': {
                        return true;
                    }
                    case 'chatMemberStatusLeft': {
                        return false;
                    }
                    case 'chatMemberStatusMember': {
                        return true;
                    }
                    case 'chatMemberStatusRestricted': {
                        if (basicGroup.status.can_send_media_messages) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }

            break;
        }
        case 'chatTypePrivate': {
            return true;
        }
        case 'chatTypeSecret': {
            return true;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup && supergroup.status) {
                switch (supergroup.status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return true;
                    }
                    case 'chatMemberStatusBanned': {
                        return false;
                    }
                    case 'chatMemberStatusCreator': {
                        return true;
                    }
                    case 'chatMemberStatusLeft': {
                        return false;
                    }
                    case 'chatMemberStatusMember': {
                        if (supergroup.is_channel) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                    case 'chatMemberStatusRestricted': {
                        if (supergroup.status.can_send_media_messages) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }
        }
    }

    return false;
}

function getChatShortTitle(chatId, showSavedMessages = false) {
    if (isMeChat(chatId) && showSavedMessages) {
        return 'Saved Messages';
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
            return getUserShortName(chat.type.user_id);
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
    return !isMeChat(chatId);
}

function canSendPhotos(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;
    if (!type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return true;
        }
        case 'chatTypePrivate': {
            return true;
        }
        case 'chatTypeSecret': {
            return true;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);
            if (supergroup) {
                const { status } = supergroup;
                if (status) {
                    switch (supergroup.status['@type']) {
                        case 'chatMemberStatusAdministrator': {
                            return true;
                        }
                        case 'chatMemberStatusBanned': {
                            return false;
                        }
                        case 'chatMemberStatusCreator': {
                            return true;
                        }
                        case 'chatMemberStatusLeft': {
                            return false;
                        }
                        case 'chatMemberStatusMember': {
                            return !supergroup.is_channel;
                        }
                        case 'chatMemberStatusRestricted': {
                            return status.can_send_media_messages;
                        }
                    }
                }
            }
        }
    }

    return false;
}

function canSendDocuments(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;
    if (!type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            return true;
        }
        case 'chatTypePrivate': {
            return true;
        }
        case 'chatTypeSecret': {
            return true;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);
            if (supergroup) {
                const { status } = supergroup;
                if (status) {
                    switch (supergroup.status['@type']) {
                        case 'chatMemberStatusAdministrator': {
                            return true;
                        }
                        case 'chatMemberStatusBanned': {
                            return false;
                        }
                        case 'chatMemberStatusCreator': {
                            return true;
                        }
                        case 'chatMemberStatusLeft': {
                            return false;
                        }
                        case 'chatMemberStatusMember': {
                            return !supergroup.is_channel;
                        }
                        case 'chatMemberStatusRestricted': {
                            return status.can_send_media_messages;
                        }
                    }
                }
            }
        }
    }

    return false;
}

function canSendPolls(chatId) {
    return true;
}

function canSendMessages(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;
    if (!type) return false;

    switch (chat.type['@type']) {
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
                        return true;
                    }
                    case 'chatMemberStatusLeft': {
                        return false;
                    }
                    case 'chatMemberStatusMember': {
                        return true;
                    }
                    case 'chatMemberStatusRestricted': {
                        if (basicGroup.status.can_send_messages) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }

            break;
        }
        case 'chatTypePrivate': {
            return true;
        }
        case 'chatTypeSecret': {
            return true;
        }
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
                        return true;
                    }
                    case 'chatMemberStatusLeft': {
                        return false;
                    }
                    case 'chatMemberStatusMember': {
                        if (supergroup.is_channel) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                    case 'chatMemberStatusRestricted': {
                        if (supergroup.status.can_send_messages) {
                            return true;
                        } else {
                            return false;
                        }
                    }
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

    console.log('getChatDraft', replyToMessageId);
    return replyToMessageId;
}

function canPinMessages(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;
    if (!type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            const basicGroup = BasicGroupStore.get(type.basic_group_id);
            if (basicGroup && basicGroup.status) {
                switch (basicGroup.status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return basicGroup.status.can_pin_messages;
                    }
                    case 'chatMemberStatusBanned': {
                        return false;
                    }
                    case 'chatMemberStatusCreator': {
                        return true;
                    }
                    case 'chatMemberStatusLeft': {
                        return false;
                    }
                    case 'chatMemberStatusMember': {
                        return false;
                    }
                    case 'chatMemberStatusRestricted': {
                        return false;
                    }
                }
            }

            break;
        }
        case 'chatTypePrivate': {
            return isMeChat(chatId);
        }
        case 'chatTypeSecret': {
            return false;
        }
        case 'chatTypeSupergroup': {
            const supergroup = SupergroupStore.get(type.supergroup_id);
            if (supergroup && supergroup.status) {
                switch (supergroup.status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return supergroup.status.can_pin_messages;
                    }
                    case 'chatMemberStatusBanned': {
                        return false;
                    }
                    case 'chatMemberStatusCreator': {
                        return true;
                    }
                    case 'chatMemberStatusLeft': {
                        return false;
                    }
                    case 'chatMemberStatusMember': {
                        return false;
                    }
                    case 'chatMemberStatusRestricted': {
                        return false;
                    }
                }
            }
        }
    }

    return false;
}

export {
    showChatDraft,
    getChatDraft,
    getChatDraftReplyToMessageId,
    getChatTypingString,
    getChatUnreadMessageIcon,
    getChatUnreadCount,
    getChatUnreadMentionCount,
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
    isChatMember,
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
    canSendFiles,
    canSendMessages,
    canSendPhotos,
    canSendDocuments,
    canSendPolls
};
