/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';

class InstantViewStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    reset = () => {
        this.items = [];
    };

    onUpdate = update => {};

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateInstantViewContent': {
                const { content } = update;

                if (content) {
                    this.items.push(content.instantView);
                } else {
                    this.items = [];
                }

                this.emit('clientUpdateInstantViewContent', update);

                break;
            }
            case 'clientUpdateInstantViewUrl': {
                this.emit('clientUpdateInstantViewUrl', update);
                break;
            }
            case 'clientUpdateInstantViewViewerContent': {
                this.emit('clientUpdateInstantViewViewerContent', update);
                break;
            }
            case 'clientUpdatePrevInstantView': {
                if (this.items.length <= 1) return;

                this.items.pop();
                const prevInstantView = this.items.pop();

                TdLibController.clientUpdate({
                    '@type': 'clientUpdateInstantViewContent',
                    content: {
                        instantView: prevInstantView
                    }
                });

                break;
            }
            default:
                break;
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

    hasPrev() {
        return this.items.length > 1;
    }

    getCurrent() {
        return this.items.length > 0 ? this.items[this.items.length - 1] : null;
    }
}

const store = new InstantViewStore();
window.instantView = store;
export default store;
