/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import ActionScheduler from '../Utils/ActionScheduler';
import { closeChat } from '../Actions/Client';
import { subscribeNotifications } from '../registerServiceWorker';
import { PAGE_WIDTH_SMALL } from '../Constants';
import TdLibController from '../Controllers/TdLibController';

class ApplicationStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
        this.addStatistics();

        this.isSmallWidth = window.innerWidth < PAGE_WIDTH_SMALL;
        window.addEventListener('resize', this.onWindowResize);
    }

    onWindowResize = () => {
        const { isSmallWidth } = this;

        const nextIsSmallWidth = window.innerWidth < PAGE_WIDTH_SMALL;
        if (nextIsSmallWidth !== isSmallWidth) {
            this.isSmallWidth = nextIsSmallWidth;
            TdLibController.clientUpdate({
                '@type': 'clientUpdatePageWidth',
                isSmallWidth: nextIsSmallWidth
            })
        }
    };

    reset = () => {
        this.dialogsReady = false;
        this.cacheLoaded = false;
        this.setPhoneNumberRequest = null;
        this.chatId = 0;
        this.dialogChatId = 0;
        this.messageId = null;
        this.statistics = new Map();
        this.authorizationState = null;
        this.defaultPhone = null;
        this.connectionState = null;
        this.isChatDetailsVisible = false;
        this.mediaViewerContent = null;
        this.profileMediaViewerContent = null;
        this.dragParams = null;
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
                        subscribeNotifications();
                        break;
                    case 'authorizationStateClosing':
                        break;
                    case 'authorizationStateClosed':
                        this.reset();

                        if (!this.loggingOut) {
                            document.title += ': Zzz…';

                            TdLibController.clientUpdate({
                                '@type': 'clientUpdateAppInactive'
                            });
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
            case 'clientUpdateAppInactive': {
                this.emit('clientUpdateAppInactive');
                break;
            }
            case 'clientUpdateCacheLoaded': {
                this.cacheLoaded = true;
                this.emit('clientUpdateCacheLoaded');
                break;
            }
            case 'clientUpdateChatDetailsVisibility': {
                const { visibility } = update;

                this.isChatDetailsVisible = visibility;
                this.emit('clientUpdateChatDetailsVisibility', update);
                break;
            }
            case 'clientUpdateChatId': {
                if (this.recording) {
                    this.emit('clientUpdateInputShake');
                    break;
                }

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
            case 'clientUpdateTdLibDatabaseExists': {
                this.emit('clientUpdateTdLibDatabaseExists', update);
                break;
            }
            case 'clientUpdateDeleteMessages': {
                this.emit('clientUpdateDeleteMessages', update);
                break;
            }
            case 'clientUpdateDialogsReady': {
                this.dialogsReady = true;
                this.emit('clientUpdateDialogsReady', update);
                break;
            }
            case 'clientUpdateDragging': {
                const { dragging, files } = update;

                this.dragParams = dragging ? { dragging, files } : null;
                this.emit('clientUpdateDragging', update);
                break;
            }
            case 'clientUpdateMediaViewerContent': {
                const { content } = update;
                this.mediaViewerContent = content;

                this.emit('clientUpdateMediaViewerContent', update);
                break;
            }
            case 'clientUpdateNewContentAvailable': {
                this.emit('clientUpdateNewContentAvailable', update);
                break;
            }
            case 'clientUpdatePageWidth': {
                this.emit('clientUpdatePageWidth', update);
                break;
            }
            case 'clientUpdateProfileMediaViewerContent': {
                const { content } = update;
                this.profileMediaViewerContent = content;

                this.emit('clientUpdateProfileMediaViewerContent', update);
                break;
            }
            case 'clientUpdateRecordStart': {
                this.recording = true;
                break;
            }
            case 'clientUpdateRecordStop': {
                this.recording = false;
                break;
            }
            case 'clientUpdateRecordError': {
                this.recording = false;
                break;
            }
            case 'clientUpdateRequestClearHistory': {
                this.emit('clientUpdateRequestClearHistory', update);
                break;
            }
            case 'clientUpdateRequestLeaveChat': {
                this.emit('clientUpdateRequestLeaveChat', update);
                break;
            }
            case 'clientUpdateSearchChat': {
                this.emit('clientUpdateSearchChat', update);
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
                        (this.authorizationState['@type'] === 'authorizationStateWaitPhoneNumber' || this.authorizationState['@type'] === 'authorizationStateWaitOtherDeviceConfirmation')
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
                if (!this.authorizationState) {
                    break;
                }

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
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    addStatistics = () => {
        TdLibController.on('update', this.onUpdateStatistics);
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

    getConnectionState() {
        return this.connectionState;
    }

    getAuthorizationState() {
        return this.authorizationState;
    }

    assign(source1, source2) {
        Object.assign(source1, source2);
        //this.set(Object.assign({}, source1, source2));
    }
}

const store = new ApplicationStore();
window.app = store;
export default store;
