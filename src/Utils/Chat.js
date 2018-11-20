/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import dateFormat from 'dateformat';
import {getUserStatus, isAccentUserSubtitle} from './User';
import {getSupergroupStatus} from './Supergroup';
import {getBasicGroupStatus} from './BasicGroup';
import {getLetters} from './Common';
import {getContent} from './Message';
import {isServiceMessage} from './ServiceMessage';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import ApplicationStore from '../Stores/ApplicationStore';
import TdLibController from '../Controllers/TdLibController';

function getGroupChatTypingString(inputTypingManager){
    if (!inputTypingManager) return null;

    let size = inputTypingManager.actions.size;
    if (size > 2){
        return `${size} people are typing`;
    }
    else if (size > 1){
        let firstUser;
        let secondUser;
        for (let userId of inputTypingManager.actions.keys())
        {
            if (!firstUser) {
                firstUser = UserStore.get(userId);
            }
            else if (!secondUser) {
                secondUser = UserStore.get(userId);
                break;
            }
        }

        if (!firstUser || !secondUser){
            return `${size} people are typing`;
        }

        firstUser = firstUser.first_name ? firstUser.first_name : firstUser.second_name;
        secondUser = secondUser.first_name ? secondUser.first_name : secondUser.second_name;

        if (!firstUser || !secondUser){
            return `${size} people are typing`;
        }

        return `${firstUser} and ${secondUser} are typing`;
    }
    else{
        let firstUser;
        if (inputTypingManager.actions.size >= 1){

            for (let userId of inputTypingManager.actions.keys())
            {
                if (!firstUser) {
                    firstUser = UserStore.get(userId);
                    break;
                }
            }

            if (!firstUser){
                return `1 person is typing`;
            }

            firstUser = firstUser.first_name ? firstUser.first_name : firstUser.second_name;

            if (!firstUser){
                return `1 person is typing`;
            }

            let action = inputTypingManager.actions.values().next().value.action;
            switch (action['@type']){
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

function getPrivateChatTypingString(inputTypingManager){
    if (!inputTypingManager) return null;

    if (inputTypingManager.actions.size >= 1){
        let action = inputTypingManager.actions.values().next().value.action;
        switch (action['@type']){
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

function getChatTypingString(chat){
    if (!chat) return null;
    if (!chat.type) return null;

    let typingManager = ChatStore.getTypingManager(chat.id);
    if (!typingManager) return null;

    switch (chat.type['@type']){
        case 'chatTypePrivate':
        case 'chatTypeSecret':{
            const typingString = getPrivateChatTypingString(typingManager);
            return typingString ? typingString + '...' : null;
        }
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup':{
            const typingString = getGroupChatTypingString(typingManager);
            return typingString ? typingString + '...' : null;
        }
    }

    return null;
}

function getChatDraft(chat){
    if (chat
        && chat.draft_message
        && chat.draft_message.input_message_text
        && chat.draft_message.input_message_text.text){
        return chat.draft_message.input_message_text.text;
    }
    return null;
}

function getLastMessageSender(chat){
    if (!chat) return null;
    if (!chat.last_message) return null;
    if (isServiceMessage(chat.last_message)) return null;
    if (!chat.last_message.sender_user_id) return null;

    return UserStore.get(chat.last_message.sender_user_id);
}

function getLastMessageSenderName(chat){
    const sender = getLastMessageSender(chat);
    let senderName = null;
    if (sender
        && (sender.first_name || sender.last_name)
        && (chat.type['@type'] === 'chatTypeBasicGroup' || chat.type['@type'] === 'chatTypeSupergroup')){
        senderName = sender.first_name ? sender.first_name : sender.last_name;
    }

    return senderName;
}

function getLastMessageContent(chat){
    if (!chat) return '[chat undefined]';

    const { last_message } = chat;
    if (!last_message) return null;

    return getContent(last_message);
}

function getChatUnreadMessageIcon(chat){
    if (!chat) return false;
    if (!chat.last_message) return false;

    return chat.last_message.is_outgoing && chat.last_message.id > chat.last_read_outbox_message_id;
}

function getChatUnreadCount(chat){
    if (!chat) return null;
    if (!chat.unread_count) return null;

    return chat.unread_count;
}

function getChatUnreadMentionCount(chat){
    if (!chat) return null;
    if (!chat.unread_mention_count) return null;

    return chat.unread_mention_count;
}

function isChatMuted(chat){
    return getChatMuteFor(chat) > 0;
}

function getChatMuteFor(chat){
    if (!chat) return 0;

    if (chat.use_default_mute_for){
        switch (chat.type) {
            case 'chatTypePrivate':
            case 'chatTypeSecret':{
                const notificationSettings = ApplicationStore.getNotificationSettings('notificationSettingsScopePrivateChats');
                if (notificationSettings){
                    return notificationSettings.mute_for;
                }

                return 0;
            }
            case 'chatTypeBasicGroup':
            case 'chatTypeSupergroup':{
                const notificationSettings = ApplicationStore.getNotificationSettings('notificationSettingsScopeGroupChats');
                if (notificationSettings){
                    return notificationSettings.mute_for;
                }

                return 0;
            }
        }
    }
    else{
        if (!chat.notification_settings) return 0;

        return chat.notification_settings.mute_for;
    }
}

function getLastMessageDate(chat){
    if (!chat) return null;
    if (!chat.last_message) return null;
    if (!chat.last_message.date) return null;
    if (chat.draft_message) return null;

    let date = new Date(chat.last_message.date * 1000);

    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date > yesterday){
        return dateFormat(date, 'H:MM');
    }

    let now = new Date();
    let weekStart = now.getDate() - now.getDay() + 1;
    let monday = new Date(now.setDate(weekStart));
    if (date > monday){
        return dateFormat(date, 'ddd');
    }

    return dateFormat(date, 'd.mm.yyyy');
}

function getChatSubtitleWithoutTyping(chat) {
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup' : {
            const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
            if (basicGroup){
                return getBasicGroupStatus(basicGroup);
            }
            break;
        }
        case 'chatTypePrivate' :
        case 'chatTypeSecret' : {
            const user = UserStore.get(chat.type.user_id);
            if (user){
                return getUserStatus(user);
            }

            break;
        }
        case 'chatTypeSupergroup' : {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup){
                return getSupergroupStatus(supergroup);
            }
            break;
        }
    }

    return null;
}

function getChatSubtitle(chat) {
    if (!chat) return null;

    const chatTypingString = getChatTypingString(chat);
    if (chatTypingString) {
        return chatTypingString;
    }

    return getChatSubtitleWithoutTyping(chat);
}

function getChatLetters(chat){
    if (!chat) return null;

    let title = chat.title || 'Deleted account';
    if (title.length === 0) return null;

    let letters = getLetters(title);
    if (letters && letters.length > 0){
        return letters;
    }

    return chat.title.charAt(0);
}

function isAccentChatSubtitleWithoutTyping(chat){
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup' : {
            return false;
        }
        case 'chatTypePrivate' :
        case 'chatTypeSecret' : {
            const user = UserStore.get(chat.type.user_id);
            if (user){
                return isAccentUserSubtitle(user);
            }

            break;
        }
        case 'chatTypeSupergroup' : {
            return false;
        }
    }

    return false;
}

function isAccentChatSubtitle(chat){
    if (!chat) return false;
    if (!chat.type) return false;

    const typingString = getChatTypingString(chat);
    if (typingString) return false;

    return isAccentChatSubtitleWithoutTyping(chat);
}

function getChatUsername(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup' : {
            return null;
        }
        case 'chatTypePrivate' :
        case 'chatTypeSecret' : {
            const user = UserStore.get(chat.type.user_id);
            if (user){
                return user.username;
            }

            break;
        }
        case 'chatTypeSupergroup' : {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup){
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
        case 'chatTypeBasicGroup' : {
            return null;
        }
        case 'chatTypePrivate' :
        case 'chatTypeSecret' : {
            const user = UserStore.get(chat.type.user_id);
            if (user){
                return user.phone_number;
            }

            break;
        }
        case 'chatTypeSupergroup' : {
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
        case 'chatTypeBasicGroup' : {
            return null;
        }
        case 'chatTypePrivate' :
        case 'chatTypeSecret' : {
            const fullInfo = UserStore.getFullInfo(chat.type.user_id);
            if (fullInfo){
                return fullInfo.bio;
            }

            break;
        }
        case 'chatTypeSupergroup' : {
            const fullInfo = SupergroupStore.getFullInfo(chat.type.supergroup_id);
            if (fullInfo){
                return fullInfo.description;
            }

            break;
        }
    }

    return null;
}

function isGroupChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup' :
        case 'chatTypeSupergroup' :{
            return true;
        }
        case 'chatTypePrivate' :
        case 'chatTypeSecret' : {
            return false;
        }
    }
}

function isChannelChat(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return null;
    if (!chat.type) return null;

    switch (chat.type['@type']) {
        case 'chatTypeSupergroup' : {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);

            return supergroup && supergroup.is_channel;
        }
        case 'chatTypeBasicGroup' :
        case 'chatTypePrivate' :
        case 'chatTypeSecret' : {
            return false;
        }
    }
}

function isChatMember(chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;
    if (!chat.type) return false;

    switch (chat.type['@type']) {
        case 'chatTypeSupergroup' : {
            const supergroup = SupergroupStore.get(chat.type.supergroup_id);
            if (supergroup && supergroup.status){
                switch (supergroup.status['@type']) {
                    case 'chatMemberStatusAdministrator' : {
                        return true;
                    }
                    case 'chatMemberStatusBanned' : {
                        return false;
                    }
                    case 'chatMemberStatusCreator' : {
                        return true;
                    }
                    case 'chatMemberStatusLeft' : {
                        return false;
                    }
                    case 'chatMemberStatusMember' : {
                        return true;
                    }
                    case 'chatMemberStatusRestricted' : {
                        return supergroup.status.is_member;
                    }
                }
            }
        }
        case 'chatTypeBasicGroup' : {
            const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
            if (basicGroup && basicGroup.status){
                switch (basicGroup.status['@type']) {
                    case 'chatMemberStatusAdministrator' : {
                        return true;
                    }
                    case 'chatMemberStatusBanned' : {
                        return false;
                    }
                    case 'chatMemberStatusCreator' : {
                        return true;
                    }
                    case 'chatMemberStatusLeft' : {
                        return false;
                    }
                    case 'chatMemberStatusMember' : {
                        return true;
                    }
                    case 'chatMemberStatusRestricted' : {
                        return basicGroup.status.is_member;
                    }
                }
            }
            break;
        }
        case 'chatTypePrivate' :
        case 'chatTypeSecret' : {
            return true;
        }
    }

    return false;
}

function getChatTitle(chat){
    if (!chat) return null;

    return chat.title || 'Deleted account';
}

function getGroupChatMembers(chatId){
    const fallbackValue = [];

    const chat = ChatStore.get(chatId);
    if (!chat) return fallbackValue;

    switch (chat.type['@type']) {
        case 'chatTypeBasicGroup': {
            const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
            if (fullInfo){
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

function getChatFullInfo(chatId){
    const chat = ChatStore.get(chatId);
    if (!chat) return;
    if (!chat.type) return;

    switch (chat.type['@type']){
        case 'chatTypePrivate' : {
            TdLibController.send(
                {
                    '@type': 'getUserFullInfo',
                    user_id: chat.type.user_id,
                });
            break;
        }
        case 'chatTypeSecret' : {
            TdLibController.send(
                {
                    '@type': 'getUserFullInfo',
                    user_id: chat.type.user_id,
                });
            break;
        }
        case 'chatTypeBasicGroup' : {
            TdLibController.send(
                {
                    '@type': 'getBasicGroupFullInfo',
                    basic_group_id: chat.type.basic_group_id,
                });
            break;
        }
        case 'chatTypeSupergroup' : {
            TdLibController.send(
                {
                    '@type': 'getSupergroupFullInfo',
                    supergroup_id: chat.type.supergroup_id,
                });
            break;
        }
    }
}

function hasBasicGroupId(chatId, basicGroupId){
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    return type
        && type['@type'] === 'chatTypeBasicGroup'
        && type.basic_group_id === basicGroupId;
}

function hasSupergroupId(chatId, supergroupId){
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    return type
        && type['@type'] === 'chatTypeSupergroup'
        && type.supergroup_id === supergroupId;
}


function hasUserId(chatId, userId){
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    const { type } = chat;

    return type
        && (type['@type'] === 'chatTypePrivate' || type['@type'] === 'chatTypeSecret')
        && type.user_id === userId;
}

export {
    getChatDraft,
    getChatTypingString,
    getChatUnreadMessageIcon,
    getChatUnreadCount,
    getChatUnreadMentionCount,
    getChatMuteFor,
    getChatSubtitle,
    getChatSubtitleWithoutTyping,
    getLastMessageSenderName,
    getLastMessageContent,
    getLastMessageDate,
    getChatLetters,
    isAccentChatSubtitle,
    isAccentChatSubtitleWithoutTyping,
    isChatMuted,
    getChatUsername,
    getChatPhoneNumber,
    getChatBio,
    isGroupChat,
    isChannelChat,
    isChatMember,
    getChatTitle,
    getGroupChatMembers,
    getChatFullInfo,
    hasBasicGroupId,
    hasSupergroupId,
    hasUserId
};