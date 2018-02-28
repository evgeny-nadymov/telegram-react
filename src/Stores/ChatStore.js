import { EventEmitter } from "events";
import TdLibController from "../Controllers/TdLibController";

class ChatStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateNewChat':
                this.items.set(update.chat.id, update.chat);
                break;
            case 'updateChatLastMessage': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                    chat.last_message = update.last_message;
                }
                break; }
            case 'updateChatOrder': {
                let chat = this.items.get(update.chat_id);
                if (chat){
                    chat.order = update.order === '0' ? chat.order : update.order;
                }
                break; }
            default:
                break;
        }
    }

    get(chatId){
        return this.items.get(chatId);
    }

    updatePhoto(chatId){
        this.emit("chat_photo_changed", {chatId: chatId});
    }

    updateMessagePhoto(messageId){
        this.emit("message_photo_changed", {messageId: messageId});
    }

    updateMessageSticker(messageId){
        this.emit("message_sticker_changed", {messageId: messageId});
    }
}

const store = new ChatStore();

export default store;