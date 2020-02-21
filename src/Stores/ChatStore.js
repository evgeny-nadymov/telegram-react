/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import InputTypingManager from '../Utils/InputTypingManager';
import UserStore from './UserStore';
import TdLibController from '../Controllers/TdLibController';

class ChatStore extends EventEmitter {
    constructor() {
        super();

        this.reset();
        this.loadClientData();

        this.addTdLibListener();
    }

    reset = () => {
        this.items = new Map();
        this.typingManagers = new Map();
        this.onlineMemberCount = new Map();
        this.counters = new Map();
        this.skippedUpdates = [];
        this.chatList = new Map();
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

    updateChatChatList(chatId, chatList) {
        if (!chatList) {
            for (const key of this.chatList.keys()) {
                this.chatList.get(key).delete(chatId);
            }

            return;
        }

        let idMap = this.chatList.get(chatList['@type']);
        if (!idMap) {
            idMap = new Map();
            this.chatList.set(chatList['@type'], idMap);
        }

        idMap.set(chatId, chatId);
        for (const key of this.chatList.keys()) {
            if (key !== chatList['@type']) {
                this.chatList.get(key).delete(chatId);
            }
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
            case 'updateChatChatList': {
                const { chat_id, chat_list } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { chat_list });
                }

                this.updateChatChatList(chat_id, chat_list);

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
                const { chat_id, order, draft_message } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, {
                        order: order === '0' ? chat.order : order,
                        draft_message
                    });
                }

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
            case 'updateChatIsPinned': {
                const { chat_id, order, is_pinned } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { order, is_pinned });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatIsSponsored': {
                const { chat_id, order, is_sponsored } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { order, is_sponsored });
                }

                this.emitFastUpdate(update);
                break;
            }
            case 'updateChatLastMessage': {
                const { chat_id, order, last_message } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, {
                        order: order === '0' ? chat.order : order,
                        last_message
                    });
                }

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
            case 'updateChatOrder': {
                const { chat_id, order } = update;

                const chat = this.get(chat_id);
                if (chat) {
                    this.assign(chat, { order });
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
            case 'clientUpdateActiveSessionsPage': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateClearHistory': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateCloseArchive': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateCloseContacts': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateCloseEditProfile': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateCloseSettings': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateLanguagePage': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateLeaveChat': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateNotificationsPage': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateOpenArchive': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateOpenChat': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateOpenContacts': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateOpenEditProfile': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdateOpenSettings': {
                this.emitUpdate(update);
                break;
            }
            case 'clientUpdatePrivacySecurityPage': {
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
}

const store = new ChatStore();
window.chat = store;
export default store;
