import { EventEmitter } from "events";
import TdLibController from "../Controllers/TdLibController";
import InputTypingManager from "../Utils/InputTypingManager";

class ChatStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateUserChatAction':{
                let chat = this.items.get(update.chat_id);
                if (chat){
                    if (!chat.inputTypingManager){
                        chat.inputTypingManager = new InputTypingManager(update.chat_id);
                    }

                    let key = update.user_id;
                    if (update.action['@type'] === 'chatActionCancel'){
                        chat.inputTypingManager.clearAction(key);
                    }
                    else{
                        chat.inputTypingManager.addAction(key, update.action);
                    }

                    //this.updateChatTyping(update.chat_id);
                }
                break;
            }
            case 'updateChatReadInbox': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.last_read_inbox_message_id = update.last_read_inbox_message_id;
                    chat.unread_count = update.unread_count;
                }
                break;
            }
            case 'updateChatReadOutbox': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.last_read_outbox_message_id = update.last_read_outbox_message_id;
                }
                break;
            }
            case 'updateChatUnreadMentionCount': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.unread_mention_count = update.unread_mention_count;
                }
                break;
            }
            case 'updateMessageMentionRead': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.unread_mention_count = update.unread_mention_count;
                }
                break;
            }
            case 'updateNotificationSettings':
                if (update.scope['@type'] === 'notificationSettingsScopeChat'
                    && update.notification_settings){
                    let chat = this.items.get(update.chat_id);
                    if (chat){
                        chat.notification_settings = update.notification_settings;
                    }
                }
                break;
            case 'updateNewChat':
                this.items.set(update.chat.id, update.chat);
                break;
            case 'updateChatDraftMessage': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                    chat.draft_message = update.draft_message;
                }
                break;
            }
            case 'updateChatLastMessage': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                    chat.last_message = update.last_message;
                }
                break;
            }
            case 'updateChatIsPinned': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                    chat.is_pinned = update.is_pinned;
                }
                break;
            }
            case 'updateChatOrder': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                }
                break;
            }
            default:
                break;
        }
    }

    get(chatId){
        return this.items.get(chatId);
    }

    updatePhoto(chatId){
        this.emit('chat_photo_changed', {chatId: chatId});
    }

    updateMessagePhoto(messageId){
        this.emit('message_photo_changed', {messageId: messageId});
    }

    updateMessageSticker(messageId){
        this.emit('message_sticker_changed', {messageId: messageId});
    }

    updateChatTyping(chatId){
        this.emit("chat_typing_changed", {chatId: chatId});
    }
}

const store = new ChatStore();
export default store;