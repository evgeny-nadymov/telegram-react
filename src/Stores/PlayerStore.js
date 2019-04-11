/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import Cookies from 'universal-cookie';
import { getSearchMessagesFilter, openMedia } from '../Utils/Message';
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

        this.playlist = null;
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

                this.getPlaylist(chatId, messageId);

                this.message = message;

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

                this.moveToNextMedia();
                break;
            }
            case 'clientUpdateMediaPrev': {
                this.emit(update['@type'], update);

                this.moveToPrevMedia();
                break;
            }
            case 'clientUpdateMediaEnd': {
                this.emit(update['@type'], update);

                if (this.moveToNextMedia()) {
                } else {
                    this.playlist = null;
                    this.message = null;
                    this.time = null;
                    this.videoStream = null;
                }
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
            case 'clientUpdateMediaPlaylist': {
                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    };

    moveToPrevMedia = () => {
        if (!this.playlist) return;

        const { chatId, messageId, messages } = this.playlist;
        if (!messages) return;

        const index = messages.findIndex(x => x.chat_id === chatId && x.id === messageId);
        if (index === -1) return;

        if (index + 1 < messages.length) {
            const message = messages[index + 1];

            openMedia(message.chat_id, message.id, null);
        }
    };

    moveToNextMedia = () => {
        if (!this.playlist) return false;

        const { chatId, messageId, messages } = this.playlist;
        if (!messages) return false;

        const index = messages.findIndex(x => x.chat_id === chatId && x.id === messageId);
        if (index === -1) return false;

        if (index - 1 >= 0) {
            const message = messages[index - 1];

            openMedia(message.chat_id, message.id, null);
            return true;
        }

        return false;
    };

    getPlaylist = async (chatId, messageId) => {
        if (this.message && this.message.chat_id === chatId && this.message.id === messageId) {
            return;
        }

        const filter = getSearchMessagesFilter(chatId, messageId);
        if (!filter) return;

        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: messageId,
            offset: -50,
            limit: 100,
            filter: filter
        });

        const { total_count, messages } = result;

        this.playlist = {
            chatId: chatId,
            messageId: messageId,
            totalCount: total_count,
            messages: messages
        };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlaylist',
            playlist: this.playlist
        });
    };
}

const store = new PlayerStore();
window.player = store;
export default store;
