/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import EventEmitter from './EventEmitter';
import TdLibController from '../Controllers/TdLibController';
import { isValidPoll } from '../Utils/Poll';

class FilterStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
    }

    reset = () => {
        this.chatList = { '@type': 'chatListMain' };
        this.filters = null;
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
            case 'updateChatFilters': {
                const { chat_filters } = update;

                this.filters = chat_filters;
                this.emit('updateChatFilters', update);
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateChatList': {
                const { chatList } = update;

                this.chatList = chatList;

                this.emit('clientUpdateChatList', update);
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
}

const store = new FilterStore();
window.filter = store;
export default store;
