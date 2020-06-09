/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import { getBlob } from '../Utils/File';
import FileStore from './FileStore';
import TdLibController from '../Controllers/TdLibController';

class MessageStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.items = new Map();
        this.selectedItems = new Map();
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                const { authorization_state } = update;
                if (!authorization_state) break;

                switch (authorization_state['@type']) {
                    case 'authorizationStateClosed': {
                        this.reset();
                        break;
                    }
                }

                break;
            }
            case 'updateNewMessage':
                this.set(update.message);
                this.emit('updateNewMessage', update);
                break;
            case 'updateDeleteMessages':
                this.emit('updateDeleteMessages', update);
                break;
            case 'updateMessageEdited': {
                const chat = this.items.get(update.chat_id);
                if (chat) {
                    const message = chat.get(update.message_id);
                    if (message) {
                        message.reply_markup = update.reply_markup;
                        message.edit_date = update.edit_date;
                    }
                }
                this.emit('updateMessageEdited', update);
                break;
            }
            case 'updateMessageViews': {
                const chat = this.items.get(update.chat_id);
                if (chat) {
                    const message = chat.get(update.message_id);
                    if (message && update.views > message.views) {
                        message.views = update.views;
                    }
                }
                this.emit('updateMessageViews', update);
                break;
            }
            case 'updateMessageContent': {
                const { chat_id, message_id, new_content } = update;

                const message = this.get(chat_id, message_id);
                if (message) {
                    update.old_content = message.content;
                    message.content = new_content;

                    switch (new_content['@type']) {
                        case 'messagePhoto': {
                            if (update.old_content['@type'] === 'messagePhoto') {
                                const { photo: oldPhoto } = update.old_content;
                                if (!oldPhoto) break;

                                const { photo: newPhoto } = new_content;
                                if (!newPhoto) break;

                                const oldSize = oldPhoto.sizes.find(x => x.type === 'i');
                                if (!oldSize) break;

                                const newSize = newPhoto.sizes.find(x => x.type === 'i');
                                if (newSize.photo.id === oldSize.photo.id) break;

                                const oldBlob = getBlob(oldSize.photo);
                                if (!oldBlob) break;

                                FileStore.setBlob(newSize.photo.id, oldBlob);
                            }

                            break;
                        }
                    }
                }

                this.emit('updateMessageContent', update);
                break;
            }
            case 'updateMessageContentOpened': {
                const { chat_id, message_id } = update;

                const message = this.get(chat_id, message_id);
                if (message) {
                    const { content } = message;
                    switch (content['@type']) {
                        case 'messageVoiceNote': {
                            message.content.is_listened = true;
                            break;
                        }
                        case 'messageVideoNote': {
                            message.content.is_viewed = true;
                            break;
                        }
                    }
                }

                this.emit('updateMessageContentOpened', update);
                break;
            }
            case 'updateMessageSendSucceeded': {
                const chat = this.items.get(update.message.chat_id);
                if (chat) {
                    const message = chat.get(update.old_message_id);
                    if (message) {
                        message.sending_state = update.message.sending_state;
                    }
                }

                this.set(update.message);
                this.emit('updateMessageSendSucceeded', update);
                break;
            }
            case 'updateMessageSendFailed': {
                if (update.message.sending_state) {
                    update.message.sending_state.error_code = update.error_code;
                    update.message.sending_state.error_message = update.error_message;
                }

                const chat = this.items.get(update.message.chat_id);
                if (chat) {
                    const message = chat.get(update.old_message_id);
                    if (message) {
                        message.sending_state = update.message.sending_state;
                        if (message.sending_state) {
                            message.sending_state.error_code = update.error_code;
                            message.sending_state.error_message = update.error_message;
                        }
                    }
                    if (update.old_message_id !== update.message.id) {
                        this.set(update.message);
                    }
                }
                this.emit('updateMessageSendFailed', update);
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateChatId': {
                if (this.selectedItems.size > 0) {
                    this.selectedItems.clear();

                    this.emit('clientUpdateClearSelection', { '@type': 'clientUpdateClearSelection' });
                }

                break;
            }
            case 'clientUpdateClearSelection': {
                this.selectedItems.clear();

                this.emit('clientUpdateClearSelection', update);
                break;
            }
            case 'clientUpdateEditMessage': {
                this.emit('clientUpdateEditMessage', update);
                break;
            }
            case 'clientUpdateMessageShake': {
                this.emit('clientUpdateMessageShake', update);
                break;
            }
            case 'clientUpdateMessageHighlighted': {
                this.emit('clientUpdateMessageHighlighted', update);
                break;
            }
            case 'clientUpdateMessageSelected': {
                if (update.selected) {
                    this.selectedItems.set(`chatId=${update.chatId}_messageId=${update.messageId}`, {
                        chatId: update.chatId,
                        messageId: update.messageId
                    });
                } else {
                    this.selectedItems.delete(`chatId=${update.chatId}_messageId=${update.messageId}`);
                }

                this.emit('clientUpdateMessageSelected', update);
                break;
            }
            case 'clientUpdateMessagesInView': {
                this.emit('clientUpdateMessagesInView', update);
                break;
            }
            case 'clientUpdateOpenReply': {
                this.emit('clientUpdateOpenReply', update);
                break;
            }
            case 'clientUpdateRecordStart': {
                this.emit('clientUpdateRecordStart', update);
                break;
            }
            case 'clientUpdateRecordStop': {
                this.emit('clientUpdateRecordStop', update);
                break;
            }
            case 'clientUpdateRecordError': {
                this.emit('clientUpdateRecordError', update);
                break;
            }
            case 'clientUpdateReply': {
                this.emit('clientUpdateReply', update);
                break;
            }
            case 'clientUpdateTryEditMessage': {
                this.emit('clientUpdateTryEditMessage', update);
                break;
            }
        }
    };

    hasSelectedMessage(chatId, messageId) {
        return this.selectedItems.has(`chatId=${chatId}_messageId=${messageId}`);
    }

    addTdLibListener = () => {
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    load(chatId, messageId) {
        TdLibController.send({
            '@type': 'getMessage',
            chat_id: chatId,
            message_id: messageId
        })
            .then(message => {
                this.set(message);
                this.emit('getMessageResult', message);
            })
            .catch(error => {
                const deletedMessage = {
                    '@type': 'deletedMessage',
                    chat_id: chatId,
                    id: messageId,
                    content: null
                };
                this.set(deletedMessage);
                this.emit('getMessageResult', deletedMessage);
            });
    }

    get(chatId, messageId) {
        let chat = this.items.get(chatId);
        if (!chat) {
            //this.load(chatId, messageId);
            return null;
        }

        let message = chat.get(messageId);
        if (!message) {
            //this.load(chatId, messageId);
            return null;
        }

        return message;
    }

    set(message) {
        if (!message) return;

        let chat = this.items.get(message.chat_id);
        if (!chat) {
            chat = new Map();
            this.items.set(message.chat_id, chat);
        }

        chat.set(message.id, message);
    }

    setItems(messages) {
        for (let i = 0; i < messages.length; i++) {
            this.set(messages[i]);
        }
    }
}

const store = new MessageStore();
window.message = store;
export default store;
