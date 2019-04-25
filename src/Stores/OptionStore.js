/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class OptionStore extends EventEmitter {
    constructor() {
        super();

        this.items = new Map();

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    onUpdate = update => {
        switch (update['@type']) {
            case 'updateOption':
                this.items.set(update.name, update.value);

                this.emit('updateOption', update);
                break;
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

    get(name) {
        return this.items.get(name);
    }
}

const store = new OptionStore();
window.option = store;
export default store;
