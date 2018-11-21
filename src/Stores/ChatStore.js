/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import InputTypingManager from '../Utils/InputTypingManager';
import TdLibController from '../Controllers/TdLibController';

class ChatStore extends EventEmitter{

    constructor(){
        super();

        this.items = new Map();
        this.typingManagers = new Map();
        this.selectedChatId = 0;
        this.skippedUpdates = [];

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    onUpdate = (update) => {
        switch (update['@type']) {
            case 'updateConnectionState': {
                if (update.state['@type'] === 'connectionStateUpdating'){
                    this.updating = true;
                    this.skippedUpdates = [];
                }
                else{
                    this.updating = false;
                    if (this.skippedUpdates.length > 0){
                        this.emitUpdate({ '@type': 'clientUpdateFastUpdatingComplete', updates: this.skippedUpdates });
                        this.skippedUpdates = [];
                    }
                }
                break;
            }
            case 'updateChatDefaultDisableNotification':{

                //TODO: handle updateChatDefaultDisableNotification

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatDraftMessage': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { order : update.order === '0' ? chat.order : update.order, draft_message : update.draft_message });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatIsMarkedAsUnread': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { is_marked_as_unread : update.is_marked_as_unread });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatIsPinned': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { order : update.order === '0' ? chat.order : update.order, is_pinned : update.is_pinned });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatIsSponsored': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { order : update.order === '0' ? chat.order : update.order, is_sponsored : update.is_sponsored });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatLastMessage': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { order : update.order === '0' ? chat.order : update.order, last_message : update.last_message });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatNotificationSettings': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { notification_settings : update.notification_settings });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatOrder': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { order : update.order });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatPhoto': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { photo : update.photo });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatReadInbox': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { last_read_inbox_message_id : update.last_read_inbox_message_id, unread_count : update.unread_count });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatReadOutbox': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { last_read_outbox_message_id : update.last_read_outbox_message_id });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatReplyMarkup': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { reply_markup_message_id : update.reply_markup_message_id });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatTitle': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { title : update.title });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatUnreadMentionCount': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { unread_mention_count : update.unread_mention_count });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateNewChat': {
                this.set(update.chat);

                this.emitFastUpdate(update);
                break;
            }
            case 'updateSecretChat': {

                //TODO: handle updateSecretChat

                this.emitFastUpdate(update);
                break;
            }
            case 'updateUnreadChatCount': {
                //TODO: handle updateUnreadChatCount

                this.emitFastUpdate(update);
                break;
            }
            case 'updateUserChatAction':{
                let typingManager = this.getTypingManager(update.chat_id);
                if (!typingManager){
                    typingManager = new InputTypingManager(update.chat_id, update => this.emitUpdate(update));
                    this.setTypingManager(update.chat_id, typingManager);
                }

                let key = update.user_id;
                if (update.action['@type'] === 'chatActionCancel'){
                    typingManager.clearAction(key);
                }
                else{
                    typingManager.addAction(key, update.action);
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateMessageMentionRead': {
                let chat = this.get(update.chat_id);
                if (chat){
                    this.assign(chat, { unread_mention_count : update.unread_mention_count });

                    //chat.unread_mention_count = update.unread_mention_count;
                }

                this.emitFastUpdate(update);
                break;
            }
            default:
                break;
        }
    };

    emitUpdate = (update) => {
        this.emit(update['@type'], update);
    };

    emitFastUpdate = (update) => {
        if (this.updating && TdLibController.parameters.fastUpdating){
            this.skippedUpdates.push(update);
            return;
        }

        this.emit(update['@type'], update);
    };

    addTdLibListener = () => {
        TdLibController.addListener('tdlib_update', this.onUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.removeListener('tdlib_update', this.onUpdate);
    };

    setSelectedChatId(chatId){
        const update = {
            '@type' : 'clientUpdateSelectedChatId',
            nextChatId : chatId,
            previousChatId : this.selectedChatId
        };

        this.selectedChatId = chatId;
        this.emit(update['@type'], update);
    }

    getSelectedChatId(){
        return this.selectedChatId;
    }

    assign(source1, source2){
        //Object.assign(source1, source2);
        this.set(Object.assign({}, source1, source2));
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
}

const store = new ChatStore();
window.chat = store;
export default store;