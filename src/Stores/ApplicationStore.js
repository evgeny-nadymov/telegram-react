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

        this.scopeNotificationSettings = new Map();
        this.authorizationState = null;
        this.connectionState = null;
        this.isChatDetailsVisible = false;

        this.onUpdate = this.onUpdate.bind(this);
        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    changeChatDetailsVisibility(visibility){
        this.isChatDetailsVisible = visibility;
        this.emit('clientUpdateChatDetailsVisibility', visibility);
    }

    onUpdate(update){
        switch (update['@type']) {
            case 'updateAuthorizationState':{
                this.authorizationState = update.authorization_state;

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
            // case 'updateUserFullInfo':
            //     this.setFullInfo(update.user_id, update.user_full_info);
            //
            //     this.emit(update['@type'], update);
            //     break;
            // case 'updateUserStatus':{
            //     let user = this.get(update.user_id);
            //     if (user){
            //         this.assign(user, { status : update.status });
            //     }
            //
            //     this.emit(update['@type'], update);
            //     break;
            // }
            default:
                break;
        }
    }

    assign(source1, source2){
        Object.assign(source1, source2);
        //this.set(Object.assign({}, source1, source2));
    }

    getConnectionState(){
        return this.connectionState;
    }

    getAuthorizationState(){
        return this.authorizationState;
    }

    getNotificationSettings(scope){
        return this.scopeNotificationSettings.get(scope);
    }

    setNotificationSettings(scope, notificationSettings){
        return this.scopeNotificationSettings.set(scope, notificationSettings);
    }
}

const store = new ApplicationStore();

export default store;