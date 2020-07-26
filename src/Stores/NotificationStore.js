/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import { isMessageMuted } from '../Utils/Store';
import { APP_NAME, NOTIFICATION_AUDIO_DELAY_MS } from '../Constants';
import AppStore from './ApplicationStore';
import ChatStore from './ChatStore';
import MessageStore from './MessageStore';
import TdLibController from '../Controllers/TdLibController';
import { isChatMember, isMeChat } from '../Utils/Chat';

class NotificationStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        // depends on ChatStore and MessageStore updates
        this.chatStore = ChatStore;
        this.messageStore = MessageStore;

        this.appInactive = false;
        this.newMessages = new Map();
        this.settings = new Map();
        this.windowFocused = true;
        this.timerHandler = null;
        this.nextSoundAt = new Date();
        this.enableSound = false;
    };

    getUnreadCount() {
        let unreadCount = 0;
        this.newMessages.forEach(chat => {
            chat.forEach(m => {
                if (!m.is_outgoing && !isMessageMuted(m)) {
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
            document.title = APP_NAME + (this.appInactive ? ': Zzz…' : '');
            document.getElementById('favicon').href = 'favicon.ico';
        }
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
            case 'updateDeleteMessages': {
                const { windowFocused } = this;
                if (!windowFocused) {
                    const { chat_id, message_ids, is_permanent } = update;
                    if (is_permanent && message_ids.length > 0) {
                        const chatMap = this.newMessages.get(chat_id);
                        if (chatMap) {
                            const filterMap = new Map(message_ids.map(id => [id, id]));

                            const newChatMap = new Map([...chatMap].filter(([id, m]) => !filterMap.has(id)));
                            if (newChatMap.size < chatMap.size) {
                                this.newMessages.set(chat_id, newChatMap);
                                this.updateTimer();
                            }
                        }
                    }
                }

                break;
            }
            case 'updateNewMessage': {
                const { windowFocused } = this;
                if (!windowFocused) {
                    const { message } = update;
                    const { chat_id, id } = message;

                    // dismiss notifications for last visited public channels and groups
                    if (!isChatMember(chat_id)) {
                        break;
                    }

                    // dismiss notifications for me chat
                    if (isMeChat(chat_id)) {
                        break;
                    }

                    const chatMap = this.newMessages.get(chat_id) || new Map();
                    chatMap.set(id, message);
                    this.newMessages.set(chat_id, chatMap);
                    this.updateTimer();

                    if (!message.is_outgoing && !isMessageMuted(message) && this.enableSound) {
                        const now = new Date();
                        if (now > this.nextSoundAt) {
                            try {
                                const audio = new Audio('sound_a.mp3');
                                audio.play();
                            } catch {

                            }

                            const nextSoundAt = new Date();
                            nextSoundAt.setMilliseconds(nextSoundAt.getMilliseconds() + NOTIFICATION_AUDIO_DELAY_MS);
                            this.nextSoundAt = nextSoundAt;
                        }
                    }
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
            case 'clientUpdateAppInactive': {
                this.appInactive = true;
                this.newMessages = new Map();
                this.updateTimer();
                break;
            }
            case 'clientUpdateFocusWindow': {
                const { focused } = update;
                // console.log('[ns] clientUpdateFocusWindow', update);

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
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };
}

const store = new NotificationStore();
window.notifications = store;
export default store;
