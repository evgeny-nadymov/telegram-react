/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import InputTypingManager from '../Utils/InputTypingManager';
import { positionListEquals } from '../Utils/Chat';
import UserStore from './UserStore';
import MessageStore from './MessageStore';
import TdLibController from '../Controllers/TdLibController';

class ChatStore extends EventEmitter {
    constructor() {
        super();

        this.reset();
        this.loadClientData();

        this.addTdLibListener();
    }

    reset = () => {
        this.scrollPositions = new Map();
        this.items = new Map();
        this.typingManagers = new Map();
        this.onlineMemberCount = new Map();
        this.counters = new Map();
        this.skippedUpdates = [];
        this.chatList = new Map();
        this.wallpaper = null;
    };

    loadClientData = () => {
        const clientData = new Map();
        try {
            let data = localStorage.get('clientData');
            if (data) {
                data = JSON.parse(data);
                if (data) {
                    Object.keys(data).forEach(key => {
                        clientData.set(Number(key), data[key]);
                    });
                }
            }
        } catch {}

        this.clientData = clientData;
    };

    saveClientData = () => {
        const arr = Array.from(this.clientData.entries());
        const obj = arr.reduce((obj, [key, value]) => {
            if (value) {
                obj[String(key)] = value;
            }
            return obj;
        }, {});

        localStorage.setItem('clientData', JSON.stringify(obj));
    };

    updateChatChatLists(chatId) {
        const { chat } = this.get(chatId);
        if (!chat) return;

        const { positions } = chat;
        if (!positions) return;

        for (const key of this.chatList.keys()) {
            this.chatList.get(key).delete(chatId);
        }

        if (!positions.length) return;

        for (let i = 0; i < positions.length; i++) {
            const position = positions[i];

            const { list } = position;

            const key = `${list['@type']}_filter_id=${list.filter_id}`;
            let idMap = this.chatList.get(key);
            if (!idMap) {
                idMap = new Map();
                this.chatList.set(key, idMap);
            }

            idMap.set(chatId, chatId);
        }
    }

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
            case 'updateConnectionState': {
                if (update.state['@type'] === 'connectionStateUpdating') {
                    this.updating = true;
                    this.skippedUpdates = [];
                } else {
                    this.updating = false;
                    if (this.skippedUpdates.length > 0) {
                        TdLibController.parameters.fastUpdating = false;
                        this.emitUpdate({
                            '@type': 'clientUpdateFastUpdatingComplete',
                            updates: this.skippedUpdates
                        });
                        this.skippedUpdates = [];
                    }
                }
                break;
            }
            case 'updateChatActionBar': {
                const { chat_id, action_bar } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { action_bar });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatDefaultDisableNotification': {
                //TODO: handle updateChatDefaultDisableNotification

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatOnlineMemberCount': {
                this.setOnlineMemberCount(update.chat_id, update.online_member_count);

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatDraftMessage': {
                const { chat_id, positions, draft_message } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, {
                        positions: !positions.length ? chat.positions : positions,
                        draft_message
                    });
                }

                this.updateChatChatLists(chat_id);

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatIsMarkedAsUnread': {
                const { chat_id, is_marked_as_unread } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { is_marked_as_unread });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatLastMessage': {
                const { chat_id, positions, last_message } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, {
                        positions: !positions.length ? chat.positions : positions,
                        last_message,
                    });
                }

                this.updateChatChatLists(chat_id);
                MessageStore.set(last_message);

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatNotificationSettings': {
                const { chat_id, notification_settings } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { notification_settings });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatPhoto': {
                const { chat_id, photo } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { photo });

                    switch (chat.type['@type']) {
                        case 'chatTypeBasicGroup': {
                            break;
                        }
                        case 'chatTypeSupergroup': {
                            break;
                        }
                        case 'chatTypePrivate':
                        case 'chatTypeSecret': {
                            const user = UserStore.get(chat.type.user_id);
                            if (user) {
                                UserStore.assign(user, { profile_photo: update.photo });
                            }
                            break;
                        }
                    }
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatPinnedMessage': {
                const { chat_id, pinned_message_id } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { pinned_message_id });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatPosition': {
                const { chat_id, position } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { positions: [...chat.positions.filter(x => !positionListEquals(x, position)), position] });
                }

                this.updateChatChatLists(chat_id);

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatReadInbox': {
                const { chat_id, last_read_inbox_message_id, unread_count } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { last_read_inbox_message_id, unread_count });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatReadOutbox': {
                const { chat_id, last_read_outbox_message_id } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { last_read_outbox_message_id });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatReplyMarkup': {
                const { chat_id, reply_markup_message_id } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { reply_markup_message_id });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatTitle': {
                const { chat_id, title } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { title });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatUnreadMentionCount': {
                const { chat_id, unread_mention_count } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { unread_mention_count });
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
            case 'updateUserChatAction': {
                let typingManager = this.getTypingManager(update.chat_id);
                if (!typingManager) {
                    typingManager = new InputTypingManager(update.chat_id, update => this.emitUpdate(update));
                    this.setTypingManager(update.chat_id, typingManager);
                }

                const key = update.user_id;
                if (update.action['@type'] === 'chatActionCancel') {
                    typingManager.clearAction(key);
                } else {
                    typingManager.addAction(key, update.action);
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateMessageMentionRead': {
                const { chat_id, unread_mention_count } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { unread_mention_count });
                }

                this.emitFastUpdate(update);
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateChatBackground': {
                const { wallpaper } = update;
                this.wallpaper = wallpaper;

                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateClearHistory': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateLeaveChat': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateArchive': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateOpenChat': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateContacts': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateSettings': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateNewGroup': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateNewChannel': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateSetChatClientData': {
                const { chatId, clientData } = update;

                TdLibController.send({
                    '@type': 'setChatClientData',
                    chat_id: chatId,
                    client_data: JSON.stringify(clientData)
                });
                this.setClientData(chatId, clientData);
                this.saveClientData();

                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateUnpin': {
                this.emitUpdate(update);
                break;
            }
        }
    };

    emitUpdate = update => {
        this.emit(update['@type'], update);
    };

    emitFastUpdate = update => {
        if (this.updating && TdLibController.parameters.fastUpdating) {
            this.skippedUpdates.push(update);
            return;
        }

        this.emit(update['@type'], update);
    };

    addTdLibListener = () => {
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    assign(source1, source2) {
        //Object.assign(source1, source2);
        this.set(Object.assign({}, source1, source2));
    }

    get(chatId) {
        return this.items.get(chatId);
    }

    set(chat) {
        this.items.set(chat.id, chat);
    }

    getCounters(chatId) {
        return this.counters.get(chatId);
    }

    setCounters(chatId, counters) {
        this.counters.set(chatId, counters);
    }

    getClientData(chatId) {
        return this.clientData.get(chatId) || {};
    }

    setClientData(chatId, data) {
        this.clientData.set(chatId, data);
    }

    setOnlineMemberCount(chatId, onlineMemberCount) {
        this.onlineMemberCount.set(chatId, onlineMemberCount);
    }

    getOnlineMemberCount(chatId) {
        return this.onlineMemberCount.get(chatId) || 0;
    }

    getTypingManager(chatId) {
        return this.typingManagers.get(chatId);
    }

    setTypingManager(chatId, typingManager) {
        return this.typingManagers.set(chatId, typingManager);
    }

    setScrollPosition(chatId, position) {
        this.scrollPositions.set(chatId, position);
    }

    getScrollPosition(chatId) {
        return this.scrollPositions.get(chatId);
    }
}

const store = new ChatStore();
window.chat = store;
export default store;
