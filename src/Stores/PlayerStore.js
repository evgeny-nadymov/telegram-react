/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import Cookies from 'universal-cookie';
import { PLAYER_PLAYBACKRATE_NORMAL, PLAYER_VOLUME_NORMAL } from '../Constants';
import MessageStore from './MessageStore';
import TdLibController from '../Controllers/TdLibController';

class PlayerStore extends EventEmitter {
    constructor() {
        super();

        const cookies = new Cookies();
        let playbackRate = cookies.get('playbackRate');
        let volume = cookies.get('volume');
        playbackRate =
            playbackRate && Number(playbackRate) >= 1 && Number(playbackRate) <= 2
                ? Number(playbackRate)
                : PLAYER_PLAYBACKRATE_NORMAL;
        volume = volume && Number(volume) >= 0 && Number(volume) <= 1 ? Number(volume) : PLAYER_VOLUME_NORMAL;

        this.playlist = [];
        this.message = null;
        this.time = null;
        this.videoStream = null;
        this.playbackRate = playbackRate;
        this.volume = volume;

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
            case 'clientUpdateMediaActive': {
                const { chatId, messageId } = update;

                const message = MessageStore.get(chatId, messageId);
                if (!message) return;

                this.message = message;

                this.getPlaylist();

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaVolume': {
                const { volume } = update;

                this.volume = volume;

                const cookies = new Cookies();
                cookies.set('volume', volume);

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPlaybackRate': {
                const { playbackRate } = update;

                this.playbackRate = playbackRate;

                const cookies = new Cookies();
                cookies.set('playbackRate', playbackRate);

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPlay': {
                this.playing = true;

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPause': {
                this.playing = false;

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
                this.message = null;
                this.time = null;
                this.videoStream = null;

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaTime': {
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
            case 'clientUpdateMediaViewerPlay': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaViewerPause': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaViewerEnded': {
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
