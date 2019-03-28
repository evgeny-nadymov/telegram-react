/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import MessageStore from './MessageStore';
import TdLibController from '../Controllers/TdLibController';

class PlayerStore extends EventEmitter {
    constructor() {
        super();

        this.playlist = [];
        this.message = null;
        this.time = null;
        this.videoStream = null;

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    addTdLibListener = () => {
        TdLibController.addListener('update', this.onUpdate);
        TdLibController.addListener('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.removeListener('update', this.onUpdate);
        TdLibController.removeListener('clientUpdate', this.onClientUpdate);
    };

    onUpdate = async update => {
        switch (update['@type']) {
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateActiveMedia': {
                const { chatId, messageId } = update;

                const message = MessageStore.get(chatId, messageId);
                if (!message) return;

                this.message = message;

                this.getPlaylist();

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPlay': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPause': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaStop': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaNext': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPrev': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaEnd': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaTimeUpdate': {
                const { duration, currentTime, timestamp } = update;

                this.time = {
                    currentTime: currentTime,
                    duration: duration,
                    timestamp: timestamp
                };

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaCaptureStream': {
                this.videoStream = update.stream;

                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    };

    getPlaylist = () => {};
}

const store = new PlayerStore();
window.player = store;
export default store;
