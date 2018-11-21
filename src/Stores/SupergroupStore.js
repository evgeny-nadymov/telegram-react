/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class SupergroupStore extends EventEmitter{
    constructor(){
        super();

        this.items = new Map();
        this.fullInfoItems = new Map();

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    onUpdate = (update) => {
        switch (update['@type']) {
            case 'updateSupergroup':
                this.set(update.supergroup);

                this.emit(update['@type'], update);
                break;
            case 'updateSupergroupFullInfo':
                this.setFullInfo(update.supergroup_id, update.supergroup_full_info);

                this.emit(update['@type'], update);
                break;
            default:
                break;
        }
    };

    addTdLibListener = () => {
        TdLibController.addListener('tdlib_update', this.onUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.removeListener('tdlib_update', this.onUpdate);
    };

    get(id){
        return this.items.get(id);
    }

    set(supergroup){
        this.items.set(supergroup.id, supergroup);
    }

    getFullInfo(id){
        return this.fullInfoItems.get(id);
    }

    setFullInfo(id, fullInfo){
        this.fullInfoItems.set(id, fullInfo);
    }
}

const store = new SupergroupStore();
window.supergroup = store;
export default store;