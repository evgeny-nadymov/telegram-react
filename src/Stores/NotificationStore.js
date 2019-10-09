/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import { isMessageMuted } from '../Utils/Message';
import { APP_NAME } from '../Constants';
import ChatStore from './ChatStore';
import MessageStore from './MessageStore';
import TdLibController from '../Controllers/TdLibController';

class NotificationStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    reset = () => {
        // depends on ChatStore and MessageStore updates
        this.chatStore = ChatStore;
        this.messageStore = MessageStore;

        this.newMessages = new Map();
        this.settings = new Map();
        this.windowFocused = true;
        this.timerHandler = null;
    };

    getUnreadCount() {
        let unreadCount = 0;
        this.newMessages.forEach(chat => {
            chat.forEach(m => {
                if (!isMessageMuted(m)) {
                    unreadCount++;
                }
            });
        });

        return unreadCount;
    }

    updateTimer() {
        const unreadCount = this.getUnreadCount();
        // console.log('[ns] updateTimer', unreadCount, this.newMessages);

        if (unreadCount > 0) {
            if (!this.timerHandler) {
                // console.log('[ns] setInterval');

                this.onTimer();
                this.timerHandler = setInterval(this.onTimer, 1000);
            }
        } else {
            if (this.timerHandler) {
                // console.log('[ns] clearInterval');

                clearInterval(this.timerHandler);
                this.timerHandler = null;
                this.onTimer();
            }
        }
    }

    onTimer = () => {
        // console.log('[ns] onTimer');

        const unreadCount = this.getUnreadCount();
        const showBadge = document.title === APP_NAME && unreadCount > 0;

        if (showBadge) {
            let title = '+99 notifications';
            if (unreadCount === 1) {
                title = '1 notification';
            } else if (unreadCount < 99) {
                title = `${unreadCount} notifications`;
            }
            document.title = title;
            document.getElementById('favicon').href = 'favicon_unread.ico';
        } else {
            document.title = APP_NAME;
            document.getElementById('favicon').href = 'favicon.ico';
        }
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateChatReadInbox': {
                const { windowFocused } = this;
                if (!windowFocused) {
                    const { chat_id, last_read_inbox_message_id } = update;

                    const chatMap = this.newMessages.get(chat_id);
                    if (chatMap) {
                        const newChatMap = new Map([...chatMap].filter(([id, m]) => m.id > last_read_inbox_message_id));
                        if (newChatMap.size < chatMap.size) {
                            this.newMessages.set(chat_id, newChatMap);
                            this.updateTimer();
                        }
                    }
                }

                break;
            }
            case 'updateChatNotificationSettings': {
                const { windowFocused } = this;
                if (!windowFocused) {
                    this.updateTimer();
                }

                break;
            }
            case 'updateNewMessage': {
                const { windowFocused } = this;
                if (!windowFocused) {
                    const { message } = update;

                    const { chat_id, id } = message;
                    let chatMap = this.newMessages.get(chat_id);
                    if (!chatMap) {
                        chatMap = new Map();
                        this.newMessages.set(chat_id, chatMap);
                    }
                    chatMap.set(id, message);
                    this.updateTimer();
                }

                break;
            }
            case 'updateScopeNotificationSettings': {
                const { scope, notification_settings } = update;

                this.settings.set(scope['@type'], notification_settings);

                const { windowFocused } = this;
                if (!windowFocused) {
                    this.updateTimer();
                }

                this.emit('updateScopeNotificationSettings', update);
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateFocusWindow': {
                const { focused } = update;

                this.windowFocused = focused;
                if (focused) {
                    this.newMessages = new Map();
                    this.updateTimer();
                }

                break;
            }
            default:
                break;
        }
    };

    addTdLibListener = () => {
        TdLibController.addListener('update', this.onUpdate);
        TdLibController.addListener('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.removeListener('update', this.onUpdate);
        TdLibController.removeListener('clientUpdate', this.onClientUpdate);
    };
}

const store = new NotificationStore();
window.notifications = store;
export default store;
