/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import ActionScheduler from '../Utils/ActionScheduler';
import { closeChat } from '../Actions/Client';
import TdLibController from '../Controllers/TdLibController';

class ApplicationStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
        this.addStatistics();
        this.setMaxListeners(Infinity);
    }

    reset = () => {
        this.dialogsReady = false;
        this.setPhoneNumberRequest = null;
        this.chatId = 0;
        this.dialogChatId = 0;
        this.messageId = null;
        this.statistics = new Map();
        this.scopeNotificationSettings = new Map();
        this.authorizationState = null;
        this.defaultPhone = null;
        this.connectionState = null;
        this.isChatDetailsVisible = false;
        this.mediaViewerContent = null;
        this.profileMediaViewerContent = null;
        this.dragging = false;
        this.actionScheduler = new ActionScheduler(this.handleScheduledAction, this.handleCancelScheduledAction);
    };

    addScheduledAction = (key, timeout, action, cancel) => {
        return this.actionScheduler.add(key, timeout, action, cancel);
    };

    invokeScheduledAction = async key => {
        await this.actionScheduler.invoke(key);
    };

    removeScheduledAction = key => {
        this.actionScheduler.remove(key);
    };

    handleScheduledAction = item => {
        console.log('Invoked scheduled action key=', item.key);
    };

    handleCancelScheduledAction = item => {
        console.log('Cancel scheduled action key=', item.key);
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                this.authorizationState = update.authorization_state;

                switch (update.authorization_state['@type']) {
                    case 'authorizationStateLoggingOut':
                        this.loggingOut = true;
                        break;
                    case 'authorizationStateWaitTdlibParameters':
                        TdLibController.sendTdParameters();
                        break;
                    case 'authorizationStateWaitEncryptionKey':
                        TdLibController.send({ '@type': 'checkDatabaseEncryptionKey' });
                        break;
                    case 'authorizationStateWaitPhoneNumber': {
                        if (this.setPhoneNumberRequest) {
                            this.setPhoneNumberRequest();

                            this.setPhoneNumberRequest = null;
                        }

                        break;
                    }
                    case 'authorizationStateWaitCode':
                        break;
                    case 'authorizationStateWaitPassword':
                        break;
                    case 'authorizationStateReady':
                        this.loggingOut = false;
                        this.setPhoneNumberRequest = null;
                        break;
                    case 'authorizationStateClosing':
                        break;
                    case 'authorizationStateClosed':
                        this.reset();

                        if (!this.loggingOut) {
                            document.title += ': Zzz…';
                            this.emit('clientUpdateAppInactive');
                        } else {
                            TdLibController.init();
                        }
                        break;
                    default:
                        break;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateChatIsMarkedAsUnread': {
                const { chat_id, is_marked_as_unread } = update;
                if (chat_id === this.chatId && is_marked_as_unread) {
                    closeChat();
                }

                break;
            }
            case 'updateConnectionState': {
                this.connectionState = update.state;

                this.emit(update['@type'], update);
                break;
            }
            case 'updateScopeNotificationSettings': {
                this.setNotificationSettings(update.scope['@type'], update.notification_settings);

                this.emit(update['@type'], update);
                break;
            }
            case 'updateFatalError': {
                this.emit(update['@type'], update);

                break;
            }
            case 'updateServiceNotification': {
                const { type, content } = update;

                if (!content) return;
                if (content['@type'] === 'messageText') {
                    const { text } = content;
                    if (!text) return;

                    if (text['@type'] === 'formattedText' && text.text) {
                        switch (type) {
                            case 'AUTH_KEY_DROP_DUPLICATE':
                                let result = window.confirm(text.text);
                                if (result) {
                                    TdLibController.logOut();
                                }
                                break;
                            default:
                                alert(text.text);
                                break;
                        }
                    }
                }

                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateChatId': {
                const extendedUpdate = {
                    '@type': 'clientUpdateChatId',
                    nextChatId: update.chatId,
                    nextMessageId: update.messageId,
                    previousChatId: this.chatId,
                    previousMessageId: this.messageId
                };

                this.chatId = update.chatId;
                this.messageId = update.messageId;

                this.emit('clientUpdateChatId', extendedUpdate);
                break;
            }
            case 'clientUpdateDatabaseExists': {
                this.emit('clientUpdateDatabaseExists', update);
                break;
            }
            case 'clientUpdateDialogsReady': {
                this.dialogsReady = true;
                this.emit('clientUpdateDialogsReady', update);
                break;
            }
            case 'clientUpdateInstantViewContent': {
                this.emit('clientUpdateInstantViewContent', update);
                break;
            }
            case 'clientUpdateMediaViewerContent': {
                const { content } = update;
                this.mediaViewerContent = content;

                this.emit('clientUpdateMediaViewerContent', update);
                break;
            }
            case 'clientUpdateProfileMediaViewerContent': {
                const { content } = update;
                this.profileMediaViewerContent = content;

                this.emit('clientUpdateProfileMediaViewerContent', update);
                break;
            }
            case 'clientUpdateSetPhone': {
                const { phone } = update;

                this.defaultPhone = phone;

                if (!phone) {
                    this.setPhoneNumberRequest = null;
                    TdLibController.clientUpdate({
                        '@type': 'clientUpdateSetPhoneCanceled'
                    });
                } else {
                    if (
                        this.authorizationState &&
                        this.authorizationState['@type'] === 'authorizationStateWaitPhoneNumber'
                    ) {
                        this.setPhoneNumber(phone);
                    } else {
                        this.setPhoneNumberRequest = () => this.setPhoneNumber(phone);
                    }
                }

                this.emit('clientUpdateSetPhone', update);
                break;
            }
            case 'clientUpdateSetPhoneResult': {
                this.emit('clientUpdateSetPhoneResult', update);
                break;
            }
            case 'clientUpdateSetPhoneError': {
                this.emit('clientUpdateSetPhoneError', update);
                break;
            }
            case 'clientUpdateDialogChatId': {
                const { chatId } = update;
                this.dialogChatId = chatId;

                this.emit('clientUpdateDialogChatId', update);
                break;
            }
            case 'clientUpdateFocusWindow': {
                TdLibController.send({
                    '@type': 'setOption',
                    name: 'online',
                    value: { '@type': 'optionValueBoolean', value: update.focused }
                });

                this.emit('clientUpdateFocusWindow', update);
                break;
            }
            case 'clientUpdateForward': {
                this.emit('clientUpdateForward', update);
                break;
            }
            case 'clientUpdateLeaveChat': {
                if (update.inProgress && this.chatId === update.chatId) {
                    TdLibController.setChatId(0);
                }

                break;
            }
        }
    };

    setPhoneNumber = phone => {
        TdLibController.send({
            '@type': 'setAuthenticationPhoneNumber',
            phone_number: phone
        })
            .then(result => {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateSetPhoneResult',
                    result
                });
            })
            .catch(error => {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateSetPhoneError',
                    error
                });
            });
    };

    onUpdateStatistics = update => {
        if (!update) return;

        if (this.statistics.has(update['@type'])) {
            const count = this.statistics.get(update['@type']);

            this.statistics.set(update['@type'], count + 1);
        } else {
            this.statistics.set(update['@type'], 1);
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

    addStatistics = () => {
        TdLibController.addListener('update', this.onUpdateStatistics);
    };

    setChatId = (chatId, messageId = null) => {
        const update = {
            '@type': 'clientUpdateChatId',
            nextChatId: chatId,
            nextMessageId: messageId,
            previousChatId: this.chatId,
            previousMessageId: this.messageId
        };

        this.chatId = chatId;
        this.messageId = messageId;
        this.emit(update['@type'], update);
    };

    getChatId() {
        return this.chatId;
    }

    getMessageId() {
        return this.messageId;
    }

    searchChat(chatId) {
        this.emit('clientUpdateSearchChat', { chatId: chatId });
    }

    changeChatDetailsVisibility(visibility) {
        this.isChatDetailsVisible = visibility;
        this.emit('clientUpdateChatDetailsVisibility', visibility);
    }

    getConnectionState() {
        return this.connectionState;
    }

    getAuthorizationState() {
        return this.authorizationState;
    }

    getNotificationSettings(scope) {
        return this.scopeNotificationSettings.get(scope);
    }

    setNotificationSettings(scope, notificationSettings) {
        return this.scopeNotificationSettings.set(scope, notificationSettings);
    }

    getDragging = () => {
        return this.dragging;
    };

    setDragging = value => {
        this.dragging = value;
        this.emit('clientUpdateDragging', value);
    };

    assign(source1, source2) {
        Object.assign(source1, source2);
        //this.set(Object.assign({}, source1, source2));
    }
}

const store = new ApplicationStore();
window.application = store;
export default store;
