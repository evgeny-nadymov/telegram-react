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

        /*for (let i = 0; i < this.chats.length; i++){
            if (this.chats[i].id === chatId){
                this.chats[i].blob = blob;

                this.emit("chat_photo_changed",);
                break;
            }
        }*/
    }
}

const store = new ChatStore();

export default store;