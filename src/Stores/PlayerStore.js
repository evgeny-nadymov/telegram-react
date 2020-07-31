/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import { getSearchMessagesFilter, openMedia } from '../Utils/Message';
import { getRandomInt } from '../Utils/Common';
import { PLAYER_PLAYBACKRATE_MAX, PLAYER_PLAYBACKRATE_NORMAL, PLAYER_PRELOAD_MAX_SIZE, PLAYER_PRELOAD_PRIORITY, PLAYER_VOLUME_MAX, PLAYER_VOLUME_MIN, PLAYER_VOLUME_NORMAL } from '../Constants';
import FileStore from './FileStore';
import MessageStore from './MessageStore';
import TdLibController from '../Controllers/TdLibController';

const RepeatEnum = Object.freeze({
    NONE: 'NONE',
    REPEAT: 'REPEAT',
    REPEAT_ONE: 'REPEAT_ONE'
});

export { RepeatEnum };

class PlayerStore extends EventEmitter {
    constructor() {
        super();

        const { playbackRate, audioPlaybackRate, volume } = this.loadPlayerSettings();

        this.reset();

        this.playbackRate = playbackRate;
        this.audioPlaybackRate = audioPlaybackRate;
        this.volume = volume;

        this.addTdLibListener();
    }

    reset = () => {
        this.playbackRate = PLAYER_PLAYBACKRATE_NORMAL;
        this.audioPlaybackRate = PLAYER_PLAYBACKRATE_NORMAL;
        this.volume = PLAYER_VOLUME_NORMAL;
        this.repeat = RepeatEnum.NONE;
        this.shuffle = false;

        this.playlist = null;
        this.message = null;
        this.time = null;
        this.videoStream = null;
        this.instantView = null;
        this.pageBlock = null;
        this.pipParams = { left: document.documentElement.clientWidth - 300, top: document.documentElement.clientHeight - 300 };
        this.times = new Map();
    };

    addTdLibListener = () => {
        TdLibController.on('update', this.onUpdate);
        TdLibController.on('clientUpdate', this.onClientUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.off('update', this.onUpdate);
        TdLibController.off('clientUpdate', this.onClientUpdate);
    };

    onUpdate = async update => {
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
            default:
                break;
        }
    };

    close = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaClose'
        });
    };

    loadPlayerSettings() {
        const player = JSON.parse(localStorage.getItem('player')) || {};

        let { playbackRate, audioPlaybackRate, volume } = player;

        playbackRate = +playbackRate;
        audioPlaybackRate = +audioPlaybackRate;
        volume = +volume;

        playbackRate =
            playbackRate >= PLAYER_PLAYBACKRATE_NORMAL && playbackRate <= PLAYER_PLAYBACKRATE_MAX
                ? playbackRate
                : PLAYER_PLAYBACKRATE_NORMAL;
        audioPlaybackRate =
            audioPlaybackRate >= PLAYER_PLAYBACKRATE_NORMAL && audioPlaybackRate <= PLAYER_PLAYBACKRATE_MAX
                ? audioPlaybackRate
                : PLAYER_PLAYBACKRATE_NORMAL;
        volume = volume >= PLAYER_VOLUME_MIN && volume <= PLAYER_VOLUME_MAX ? volume : PLAYER_VOLUME_NORMAL;

        return { playbackRate, audioPlaybackRate, volume };
    }

    savePlayerSettings() {
        const { volume, playbackRate, audioPlaybackRate } = this;

        localStorage.setItem('player', JSON.stringify({ volume, playbackRate, audioPlaybackRate }));
    }

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateMediaClose': {
                // this.reset();

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaActive': {
                const { chatId, messageId, instantView, pageBlock } = update;

                const message = MessageStore.get(chatId, messageId);
                if (message) {
                    this.message = message;
                    this.emit(update['@type'], update);
                    this.getPlaylist(chatId, messageId, () => {
                        // this.preloadNextMedia();
                    });

                    return;
                } else if (instantView && pageBlock) {
                    this.instantView = instantView;
                    this.pageBlock = pageBlock;
                    this.emit(update['@type'], update);
                }

                break;
            }
            case 'clientUpdateMediaVolume': {
                const { volume } = update;

                this.volume = volume;

                this.savePlayerSettings();

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaRepeat': {
                const { repeat } = update;

                this.repeat = repeat;

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaShuffle': {
                const { shuffle } = update;

                this.shuffle = shuffle;

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPlaybackRate': {
                const { playbackRate } = update;

                this.playbackRate = playbackRate;

                this.savePlayerSettings();

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaAudioPlaybackRate': {
                const { audioPlaybackRate } = update;

                this.audioPlaybackRate = audioPlaybackRate;

                this.savePlayerSettings();

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPlay': {
                this.playing = true;

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaTitleMouseOver': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPause': {
                this.playing = false;

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaSeek': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaSeeking': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaStop': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaNext': {
                this.emit(update['@type'], update);

                this.moveToNextMedia(false);
                break;
            }
            case 'clientUpdateMediaPrev': {
                this.emit(update['@type'], update);

                this.moveToPrevMedia();
                break;
            }
            case 'clientUpdateMediaEnding': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaEnd': {
                this.emit(update['@type'], update);

                if (update.moveNext) {
                    if (this.moveToNextMedia(true)) {
                    } else {
                        this.close();
                    }
                } else {
                    this.close();
                }
                break;
            }
            case 'clientUpdateMediaShortcut': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaHint': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaTime': {
                const { chatId, messageId, duration, currentTime, buffered, timestamp } = update;

                if (this.time && this.time.chatId === chatId && this.time.messageId === messageId) {
                    this.time = {
                        ...this.time,
                        currentTime,
                        duration,
                        buffered,
                        timestamp
                    };
                }

                if (buffered && currentTime && duration) {
                    for (let i = 0; i < buffered.length; i++) {
                        const start = buffered.start(i);
                        const end = buffered.end(i);
                        if (start <= currentTime && currentTime <= end && currentTime + 30 < end) {
                            this.preloadNextMedia();
                            break;
                        }
                    }
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaProgress': {
                const { chatId, messageId, buffered } = update;

                if (this.time && this.time.chatId === chatId && this.time.messageId === messageId) {
                    this.time = { ...this.time, buffered };
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaLoadedMetadata': {
                const { chatId, messageId, duration, videoWidth, videoHeight } = update;

                this.time = {
                    chatId,
                    messageId,
                    duration,
                    videoWidth,
                    videoHeight
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
            case 'clientUpdateMediaPlaylistLoading': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPlaylistPrev': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPlaylist': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaPlaylistNext': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdatePictureInPicture': {
                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    };

    preloadNextMedia = async () => {
        if (!this.playlist) return;
        if (!this.message) return;
        if (this.repeat !== RepeatEnum.NONE) return;
        if (this.shuffle) return;

        const { chat_id, id } = this.message;
        const { messages } = this.playlist;
        if (!messages) return;

        const index = messages.findIndex(x => x.chat_id === chat_id && x.id === id);
        if (index === -1) return;

        const nextIndex = index - 1;
        if (nextIndex === -1) return;

        const nextMessage = messages[nextIndex];
        if (!nextMessage) return;

        const { content } = nextMessage;
        switch (content['@type']) {
            case 'messageAudio': {
                const { audio } = content;
                if (!audio) return;

                let { audio: file } = audio;
                if (!file) return;

                file = FileStore.get(file.id) || file;

                const { id, local, expected_size } = file;

                const { is_downloading_active, is_downloading_completed, download_offset, downloaded_prefix_size } = local;
                if (is_downloading_completed) return;
                if (is_downloading_active) return;

                const offset = 0;
                const limit = 3 * 1024 * 1024; //expected_size > PLAYER_PRELOAD_MAX_SIZE ? PLAYER_PRELOAD_MAX_SIZE : 0; //
                if (download_offset <= offset && limit <= downloaded_prefix_size) return;

                console.log('[cache] preload start', id, limit, expected_size);
                await TdLibController.send({
                    '@type': 'downloadFile',
                    file_id: id,
                    offset: 0,
                    limit,
                    priority: PLAYER_PRELOAD_PRIORITY,
                    synchronous: true
                });

                console.log('[cache] preload stop', id, limit, expected_size);

                break;
            }
        }
    };

    moveToPrevMedia = () => {
        if (!this.playlist) return;
        if (!this.message) return;

        const { chat_id, id } = this.message;
        const { messages } = this.playlist;
        if (!messages) return;

        const index = messages.findIndex(x => x.chat_id === chat_id && x.id === id);
        if (index === -1) return;

        if (index + 1 < messages.length) {
            const message = messages[index + 1];

            openMedia(message.chat_id, message.id, false);
        }
    };

    moveToNextMedia = useRepeatShuffle => {
        if (!this.playlist) return false;
        if (!this.message) return false;

        const { chat_id, id } = this.message;
        const { messages } = this.playlist;
        if (!messages) return false;

        const index = messages.findIndex(x => x.chat_id === chat_id && x.id === id);
        if (index === -1) return false;

        let nextIndex = -1;
        if (!useRepeatShuffle) {
            nextIndex = index - 1;
        } else {
            switch (this.repeat) {
                case RepeatEnum.NONE: {
                    if (this.shuffle) {
                        nextIndex = getRandomInt(0, messages.length);
                    } else {
                        nextIndex = index - 1;
                    }
                    break;
                }
                case RepeatEnum.REPEAT_ONE: {
                    nextIndex = index;
                    break;
                }
                case RepeatEnum.REPEAT: {
                    if (this.shuffle) {
                        nextIndex = getRandomInt(0, messages.length);
                    } else {
                        nextIndex = index - 1 >= 0 ? index - 1 : messages.length - 1;
                    }
                    break;
                }
            }
        }

        if (nextIndex >= 0) {
            const message = messages[nextIndex];

            openMedia(message.chat_id, message.id, false);
            return true;
        }

        return false;
    };

    getCurrentTime = (uniqueId) => {
        return this.times.get(uniqueId) || { currentTime: 0, duration: 0 };
    };

    setCurrentTime = (uniqueId, currentTime) => {
        if (currentTime < 30) return;

        this.times.set(uniqueId, currentTime);
    };

    clearCurrentTime = (uniqueId) => {
        this.times.delete(uniqueId);
    };

    getPlaylist = async (chatId, messageId, callback) => {
        const { playlist: currentPlaylist } = this;

        if (currentPlaylist) {
            const { messages } = currentPlaylist;
            if (messages && messages.findIndex(x => x.chat_id === chatId && x.id === messageId) !== -1) {
                callback && callback();
                return;
            }
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlaylistLoading',
            chatId: chatId,
            messageId: messageId
        });

        const filter = getSearchMessagesFilter(chatId, messageId);
        if (!filter) {
            this.playlist = {
                chatId: chatId,
                messageId: messageId,
                totalCount: 1,
                messages: [MessageStore.get(chatId, messageId)]
            };

            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaPlaylist',
                playlist: this.playlist
            });

            return;
        }

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

        MessageStore.setItems(result.messages);

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

        callback && callback();
    };
}

const store = new PlayerStore();
window.player = store;
export default store;
