import UserStore from '../Stores/UserStore';
import dateFormat from 'dateformat';
import ChatStore from '../Stores/ChatStore';

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
            if (!secondUser) {
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
        case 'chatTypeSecret':
            return this.getPrivateChatTypingString(typingManager);
        case 'chatTypeBasicGroup':
        case 'chatTypeSupergroup':
            return this.getGroupChatTypingString(typingManager);
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
    if (!chat.last_message) return '[last_message undefined]';
    const content = chat.last_message.content;
    if (!content) return '[content undefined]';

    switch (content['@type']) {
        case 'messageText':
            return content.text.text;
        case 'messageDocument':
            return 'document';
        default:
            return '[' + content['@type'] + ']';
    }
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

function getChatMuteFor(chat){
    if (!chat) return 0;
    if (!chat.notification_settings) return 0;
    if (chat.notification_settings['@type'] !== 'notificationSettings') return 0;
    if (!chat.notification_settings.mute_for) return 0;

    return chat.notification_settings.mute_for;
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

export {
    getChatDraft,
    getChatTypingString,
    getChatUnreadMessageIcon,
    getChatUnreadCount,
    getChatUnreadMentionCount,
    getChatMuteFor,
    getLastMessageSenderName,
    getLastMessageContent,
    getLastMessageDate
};