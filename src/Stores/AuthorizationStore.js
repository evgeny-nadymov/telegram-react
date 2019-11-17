/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import { KEY_AUTH_STATE } from '../Constants';
import TdLibController from '../Controllers/TdLibController';

class AuthorizationStore extends EventEmitter {
    constructor() {
        super();

        this.reset();
        this.load();

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    load() {
        try {
            const value = localStorage.getItem(KEY_AUTH_STATE);
            if (value) {
                this.current = JSON.parse(value);
            } else {
                this.current = null;
            }
        } catch {}
    }

    save(state) {
        if (state) {
            localStorage.setItem(KEY_AUTH_STATE, JSON.stringify(state));
        } else {
            localStorage.removeItem(KEY_AUTH_STATE);
        }
    }

    reset = () => {
        this.current = null;
    };

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                const { authorization_state } = update;

                this.current = authorization_state;
                this.save(authorization_state);

                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {};

    addTdLibListener = () => {
        TdLibController.addListener('update', this.onUpdate);
        TdLibController.addListener('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.removeListener('update', this.onUpdate);
        TdLibController.removeListener('clientUpdate', this.onClientUpdate);
    };
}

const store = new AuthorizationStore();
window.authorization = store;
export default store;
