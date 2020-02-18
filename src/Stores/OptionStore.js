/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import { KEY_SUGGESTED_LANGUAGE_PACK_ID } from '../Constants';
import TdLibController from '../Controllers/TdLibController';

class OptionStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.items = new Map();
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
            case 'updateOption':
                const { name, value } = update;

                this.set(name, value);

                if (name === KEY_SUGGESTED_LANGUAGE_PACK_ID) {
                    localStorage.setItem(name, value.value);
                }

                this.emit('updateOption', update);
                break;
            default:
                break;
        }
    };

    onClientUpdate = update => {};

    addTdLibListener = () => {
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    get(name) {
        return this.items.get(name);
    }

    set(name, value) {
        this.items.set(name, value);
    }
}

const store = new OptionStore();
window.option = store;
export default store;
