import { EventEmitter } from "events";
import TdLibController from "../Controllers/TdLibController";
import InputTypingManager from "../Utils/InputTypingManager";

class ChatStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();
        this.typingManagers = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateChatDefaultDisableNotification':{

                //TODO: handle updateChatDefaultDisableNotification

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatDraftMessage': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                    chat.draft_message = update.draft_message;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatIsMarkedAsUnread': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.is_marked_as_unread = update.is_marked_as_unread;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatIsPinned': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                    chat.is_pinned = update.is_pinned;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatIsSponsored': {

                //TODO: handle updateChatIsSponsored

                this.emit('updateChatIsSponsored', update);
                break;
            }
            case 'updateChatLastMessage': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                    chat.last_message = update.last_message;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatNotificationSettings': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.notification_settings = update.notification_settings;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatOrder': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatPhoto': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.photo = update.photo;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatReadInbox': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.last_read_inbox_message_id = update.last_read_inbox_message_id;
                    chat.unread_count = update.unread_count;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatReadOutbox': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.last_read_outbox_message_id = update.last_read_outbox_message_id;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatReplyMarkup': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.reply_markup_message_id = update.reply_markup_message_id;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatTitle': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.title = update.title;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatUnreadMentionCount': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.unread_mention_count = update.unread_mention_count;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateNewChat': {
                this.set(update.chat);

                this.emit(update['@type'], update);
                break;
            }
            case 'updateSecretChat': {

                //TODO: handle updateSecretChat

                this.emit('updateSecretChat', update);
                break;
            }
            case 'updateUnreadChatCount': {

                //TODO: handle updateUnreadChatCount

                this.emit(update['@type'], update);
                break;
            }
            case 'updateUserChatAction':{
                let typingManager = this.getTypingManager(update.chat_id);
                if (!typingManager){
                    typingManager = new InputTypingManager(update.chat_id);
                    this.setTypingManager(typingManager);
                }

                let key = update.user_id;
                if (update.action['@type'] === 'chatActionCancel'){
                    typingManager.clearAction(key);
                }
                else{
                    typingManager.addAction(key, update.action);
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateMessageMentionRead': {
                let chat = this.get(update.chat_id);
                if (chat){
                    chat.unread_mention_count = update.unread_mention_count;
                }

                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    }

    get(chatId){
        return this.items.get(chatId);
    }

    set(chat){
        this.items.set(chat.id, chat);
    }

    getTypingManager(chatId){
        return this.typingManagers.get(chatId);
    }

    setTypingManager(chatId, typingManager){
        return this.typingManagers.set(chatId, typingManager);
    }

    updatePhoto(chatId){
        this.emit('chat_photo_changed', {chatId: chatId});
    }

    updateChatTyping(update){
        this.emit('updateUserChatAction', update);
    }
}

const store = new ChatStore();
export default store;