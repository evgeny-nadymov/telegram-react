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
import ChatStore from './ChatStore';

class MessageStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.items = new Map();
        this.media = new Map();
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
            case 'updateNewMessage': {
                this.set(update.message);
                this.addMediaMessage(update.message);

                this.emit('updateNewMessage', update);
                break;
            }
            case 'updateDeleteMessages':
                if (update.is_permanent) {
                    this.removeMediaMessages(update.chat_id, update.message_ids);
                }
                this.emit('updateDeleteMessages', update);
                break;
            case 'updateMessageEdited': {
                const chat = this.items.get(update.chat_id);
                if (chat) {
                    const message = chat.get(update.message_id);
                    if (message) {
                        const newMessage = {
                            ...message,
                            ...{
                                reply_markup: update.reply_markup,
                                edit_date: update.edit_date
                            }
                        };

                        this.set(newMessage);
                    }
                }
                this.emit('updateMessageEdited', update);
                break;
            }
            case 'updateMessageIsPinned': {
                const { chat_id, message_id, is_pinned } = update;

                const chat = this.items.get(chat_id);
                if (chat) {
                    const message = chat.get(message_id);
                    if (message && is_pinned !== message.is_pinned) {
                        const newMessage = { ...message, ...{ is_pinned } };

                        this.set(newMessage);
                        this.updateMediaMessage(newMessage);
                    }
                }

                if (is_pinned) {
                    const data = ChatStore.getClientData(chat_id);
                    if (data) {
                        ChatStore.setClientData(chat_id, { ...data, ...{ unpinned: false }});
                    }
                }

                this.emit('updateMessageIsPinned', update);
                break;
            }
            case 'updateMessageInteractionInfo': {
                const { chat_id, message_id, interaction_info } = update;

                const chat = this.items.get(chat_id);
                if (chat) {
                    const message = chat.get(message_id);
                    if (message) {
                        const newMessage = { ...message, ...{ interaction_info } };

                        this.set(newMessage);
                    }
                }
                this.emit('updateMessageInteractionInfo', update);
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
                                if (!newSize) break;
                                if (newSize.photo.id === oldSize.photo.id) break;

                                const oldBlob = getBlob(oldSize.photo);
                                if (!oldBlob) break;

                                FileStore.setBlob(newSize.photo.id, oldBlob);
                            }

                            break;
                        }
                    }

                    this.updateMediaMessage(message);
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
            case 'updateMessageSendAcknowledged': {
                this.emit('updateMessageSendAcknowledged', update);
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

                this.updateMediaMessageSend(update.message, update.old_message_id);
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
                this.updateMediaMessageSend(update.message, update.old_message_id);
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
            case 'clientUpdateChatMedia': {
                this.setMedia(update.chatId, update.media);

                this.emit('clientUpdateChatMedia', update);
                break;
            }
            case 'clientUpdateCurrentPinnedMessage': {
                this.emit('clientUpdateCurrentPinnedMessage', update);
                break;
            }
            case 'clientUpdateClearSelection': {
                this.selectedItems.clear();

                this.emit('clientUpdateClearSelection', update);
                break;
            }
            case 'clientUpdateClosePinned': {
                this.emit('clientUpdateClosePinned', update);
                break;
            }
            case 'clientUpdateEditMessage': {
                this.emit('clientUpdateEditMessage', update);
                break;
            }
            case 'clientUpdateSendText': {
                this.emit('clientUpdateSendText', update);
                break;
            }
            case 'clientUpdateStartMessageEditing': {
                this.emit('clientUpdateStartMessageEditing', update);
                break;
            }
            case 'clientUpdateStopMessageEditing': {
                this.emit('clientUpdateStopMessageEditing', update);
                break;
            }
            case 'clientUpdateMessageShake': {
                this.emit('clientUpdateMessageShake', update);
                break;
            }
            case 'clientUpdateMediaTab': {
                this.emit('clientUpdateMediaTab', update);
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
            case 'clientUpdateOpenPinned': {
                this.emit('clientUpdateOpenPinned', update);
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
                    sender_id: { },
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

    getMedia(chatId) {
        return this.media.get(chatId);
    }

    setMedia(chatId, media) {
        const { photoAndVideo, document, audio, url, voiceNote, pinned } = media;
        this.setItems(photoAndVideo);
        this.setItems(document);
        this.setItems(audio);
        this.setItems(url);
        this.setItems(voiceNote);
        this.setItems(pinned);

        return this.media.set(chatId, media);
    }

    removeMediaMessages(chatId, ids) {
        if (!chatId) return;
        if (!ids) return;

        const media = this.getMedia(chatId);
        if (!media) return;

        const map = new Map(ids.map(x => [x, x]));

        const audio = media.audio.filter(x => !map.has(x.id));
        media.audio = audio.length !== media.audio.length ? audio : media.audio;

        const document = media.document.filter(x => !map.has(x.id));
        media.document = document.length !== media.document.length ? document : media.document;

        const photoAndVideo = media.photoAndVideo.filter(x => !map.has(x.id));
        media.photoAndVideo = photoAndVideo.length !== media.photoAndVideo.length ? photoAndVideo : media.photoAndVideo;

        const url = media.url.filter(x => !map.has(x.id));
        media.url = url.length !== media.url.length ? url : media.url;

        const voiceNote = media.voiceNote.filter(x => !map.has(x.id));
        media.voiceNote = voiceNote.length !== media.voiceNote.length ? voiceNote : media.voiceNote;

        const pinned = media.pinned.filter(x => !map.has(x.id));
        media.pinned = pinned.length !== media.pinned.length ? pinned : media.pinned;
    }

    addMediaMessage(message) {
        if (!message) return;

        const { chat_id, content } = message;
        const media = this.getMedia(chat_id);
        if (!media) return;

        if (message.is_pinned) {
            const { pinned } = media;
            if (pinned) {
                media.pinned = this.insertMessage(message, pinned);
            }
        }

        switch (content['@type']) {
            case 'messageAudio': {
                const { audio: messages } = media;
                if (messages) {
                    media.audio = this.insertMessage(message, messages);
                }
                break;
            }
            case 'messageDocument': {
                const { document: messages } = media;
                if (messages) {
                    media.document = this.insertMessage(message, messages);
                }
                break;
            }
            case 'messagePhoto': {
                const { photoAndVideo: messages } = media;
                if (messages) {
                    media.photoAndVideo = this.insertMessage(message, messages);
                }
                break;
            }
            case 'messageText': {
                const { text, web_page } = content;
                let hasUrl = false;
                if (web_page) {
                    hasUrl = true;
                } else if (text) {
                    const { entities } = text;
                    if (entities) {
                        for (let i = 0; i < entities.length && !hasUrl; i++) {
                            switch (entities[i].type['@type']) {
                                case 'textEntityTypeEmailAddress': {
                                    hasUrl = true;
                                    break;
                                }
                                case 'textEntityTypeTextUrl': {
                                    hasUrl = true;
                                    break;
                                }
                                case 'textEntityTypeUrl': {
                                    hasUrl = true;
                                    break;
                                }
                            }
                        }
                    }
                }

                if (hasUrl) {
                    const { url: messages } = media;
                    if (messages) {
                        media.url = this.insertMessage(message, messages);
                    }
                }

                break;
            }
            case 'messageVideo': {
                const { photoAndVideo: messages } = media;
                if (messages) {
                    media.photoAndVideo = this.insertMessage(message, messages);
                }
                break;
            }
            case 'messageVoiceNote': {
                const { voiceNote: messages } = media;
                if (messages) {
                    media.voiceNote = this.insertMessage(message, messages);
                }
                break;
            }
        }
    }

    updateMediaMessage(message) {
        if (!message) return;

        const { chat_id, id } = message;
        this.removeMediaMessages(chat_id, [id]);
        this.addMediaMessage(message);
    }

    updateMediaMessageSend(message, oldMessageId) {
        if (!message) return;

        const { chat_id } = message;
        this.removeMediaMessages(chat_id, [oldMessageId]);
        this.addMediaMessage(message);
    }

    insertMessage = (message, messages) => {
        if (!messages) return null;
        if (!message) return messages;

        let index = -1;
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].id < message.id) {
                index = i;
                break;
            } else if (messages[i].id === message.id) {
                index = -2;
                break;
            } else if (messages[i].id > message.id) {
                continue;
            }
        }

        if (index === -2) {
            return messages;
        } else if (index === -1) {
            return [...messages, message];
        }

        const returnValue = [...messages];
        returnValue.splice(index, 0, message);
        return returnValue;
    }
}

const store = new MessageStore();
window.message = store;
export default store;
