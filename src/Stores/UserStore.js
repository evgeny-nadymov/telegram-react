/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import OptionStore from '../Stores/OptionStore';
import TdLibController from '../Controllers/TdLibController';

class UserStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.items = new Map();
        this.fullInfoItems = new Map();
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
            case 'updateUser': {
                this.set(update.user);

                this.emit(update['@type'], update);
                break;
            }
            case 'updateUserFullInfo':
                this.setFullInfo(update.user_id, update.user_full_info);

                this.emit(update['@type'], update);
                break;
            case 'updateUserStatus': {
                let user = this.get(update.user_id);
                if (user) {
                    this.assign(user, { status: update.status });
                }

                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateOpenUser': {
                this.emit(update['@type'], update);
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

    assign(source1, source2) {
        Object.assign(source1, source2);
        //this.set(Object.assign({}, source1, source2));
    }

    getMyId() {
        const myId = OptionStore.get('my_id');
        if (!myId) return null;
        if (!myId.value) return null;

        return myId.value;
    }

    get(userId) {
        return this.items.get(userId);
    }

    set(user) {
        this.items.set(user.id, user);
    }

    getFullInfo(id) {
        return this.fullInfoItems.get(id);
    }

    setFullInfo(id, fullInfo) {
        this.fullInfoItems.set(id, fullInfo);
    }
}

const store = new UserStore();
window.user = store;
export default store;
