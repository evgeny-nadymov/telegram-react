/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class ApplicationStore extends EventEmitter{
    constructor(){
        super();

        this.chatId = 0;
        this.statistics = new Map();
        this.scopeNotificationSettings = new Map();
        this.authorizationState = null;
        this.connectionState = null;
        this.isChatDetailsVisible = false;
        this.mediaViewerContent = null;

        this.addTdLibListener();
        this.addStatistics();
        this.setMaxListeners(Infinity);
    }

    onUpdate = (update) => {
        switch (update['@type']) {
            case 'updateAuthorizationState':{
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
                    case 'authorizationStateWaitPhoneNumber':
                        break;
                    case 'authorizationStateWaitCode':
                        break;
                    case 'authorizationStateWaitPassword':
                        break;
                    case 'authorizationStateReady':
                        this.loggingOut = false;
                        break;
                    case 'authorizationStateClosing':
                        break;
                    case 'authorizationStateClosed':
                        if (!this.loggingOut) {
                            document.title += ': Zzz…';
                            this.emit('clientUpdateAppInactive');
                        }
                        else{
                            TdLibController.init();
                        }
                        break;
                    default:
                        break;
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'updateConnectionState':{
                this.connectionState = update.state;

                this.emit(update['@type'], update);
                break;
            }
            case 'updateScopeNotificationSettings':{
                this.setNotificationSettings(update.scope['@type'], update.notification_settings);

                this.emit(update['@type'], update);
                break;
            }
            case 'updateFatalError':{
                alert('Oops! Something went wrong. We need to refresh this page.');
                window.location.reload();

                break;
            }
            case 'updateServiceNotification':{
                const { type, content } = update;

                if (!content) return;
                if (content['@type'] === 'messageText') {

                    const { text } = content;
                    if (!text) return;

                    if (text['@type'] === 'formattedText'
                        && text.text) {
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

    onUpdateStatistics = (update) => {
        if (!update) return;

        if (this.statistics.has(update['@type'])){
            const count = this.statistics.get(update['@type']);

            this.statistics.set(update['@type'], count + 1);
        }
        else{
            this.statistics.set(update['@type'], 1);
        }
    };

    addTdLibListener = () => {
        TdLibController.addListener('tdlib_update', this.onUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.removeListener('tdlib_update', this.onUpdate);
    };

    addStatistics = () => {
        TdLibController.addListener('tdlib_update', this.onUpdateStatistics);
    };

    setChatId = (chatId) => {
        const update = {
            '@type' : 'clientUpdateChatId',
            nextChatId : chatId,
            previousChatId : this.chatId
        };

        this.chatId = chatId;
        this.emit(update['@type'], update);
    };

    getChatId(){
        return this.chatId;
    }

    changeChatDetailsVisibility(visibility){
        this.isChatDetailsVisible = visibility;
        this.emit('clientUpdateChatDetailsVisibility', visibility);
    }

    setMediaViewerContent(content){
        this.mediaViewerContent = content;
        this.emit('clientUpdateMediaViewerContent', content);
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

    assign(source1, source2) {
        Object.assign(source1, source2);
        //this.set(Object.assign({}, source1, source2));
    }
}

const store = new ApplicationStore();
window.application = store;
export default store;