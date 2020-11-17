/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import { getSearchMessagesFilter, openMedia } from '../Utils/Message';
import { getRandomInt } from '../Utils/Common';
import { isCurrentSource, playlistItemEquals } from '../Utils/Player';
import { supportsStreaming } from '../Utils/File';
import { getValidBlocks, isValidAudioBlock, isValidVoiceNoteBlock, openInstantViewMedia } from '../Utils/InstantView';
import { AUDIO_MIN_BUFFERED_TIME_S, PLAYER_PLAYBACKRATE_MAX, PLAYER_PLAYBACKRATE_NORMAL, PLAYER_PRELOAD_MAX_SIZE, PLAYER_PRELOAD_PRIORITY, PLAYER_VOLUME_MAX, PLAYER_VOLUME_MIN, PLAYER_VOLUME_NORMAL } from '../Constants';
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

        this.pipParams = { left: document.documentElement.clientWidth - 300, top: document.documentElement.clientHeight - 300 };
        this.times = new Map();

        this.closeInternal();
    };

    closeInternal = () => {
        this.playlist = null;
        this.message = null;
        this.time = null;
        this.videoStream = null;
        this.instantView = null;
        this.block = null;
    }

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
                this.closeInternal();

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaActive': {
                const { source } = update;

                switch (source['@type']) {
                    case 'message': {
                        this.message = source;
                        this.emit(update['@type'], update);
                        this.getPlaylist(source);
                        break;
                    }
                    case 'instantViewSource': {
                        const { block, instantView } = source;
                        this.instantView = instantView;
                        this.block = block;
                        this.getPlaylist(source);
                        // this.playlist = null;
                        // TdLibController.clientUpdate({
                        //     '@type': 'clientUpdateMediaPlaylistLoading',
                        //     source: { '@type': 'instantViewSource', block, instantView }
                        // });
                        this.emit(update['@type'], update);
                        break;
                    }
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
                const { source, duration, currentTime, buffered, timestamp } = update;

                if (this.time) {
                    const { chatId, messageId, block } = this.time;
                    if (isCurrentSource(chatId, messageId, block, source)) {
                        this.time = {
                            ...this.time,
                            currentTime,
                            duration,
                            buffered,
                            timestamp
                        };
                    }
                }

                if (buffered && currentTime && duration && supportsStreaming()) {
                    for (let i = 0; i < buffered.length; i++) {
                        const start = buffered.start(i);
                        const end = buffered.end(i);
                        if (start <= currentTime && currentTime <= end && (currentTime + AUDIO_MIN_BUFFERED_TIME_S < end || end === duration)) {
                            this.preloadNextMedia();
                            break;
                        }
                    }
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaProgress': {
                const { source, buffered } = update;

                if (this.time) {
                    const { chatId, messageId, block } = this.time;
                    if (isCurrentSource(chatId, messageId, block, source)) {
                        this.time = { ...this.time, buffered };
                    }
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateMediaLoadedMetadata': {
                const { source, duration, videoWidth, videoHeight } = update;
                const { block } = source;

                this.time = {
                    chatId: source['@type'] === 'message' ? source.chat_id : 0,
                    messageId: source['@type'] === 'message' ? source.id : 0,
                    block,
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
        const { message, block, playlist, repeat, shuffle } = this;

        if (!playlist) return;
        if (!message && !block) return;
        if (repeat !== RepeatEnum.NONE) return;
        if (shuffle) return;

        const { items } = playlist;
        if (!items) return;

        const index = items.findIndex(x => playlistItemEquals(x, message || block));
        if (index === -1) return;

        const nextIndex = index - 1;
        if (nextIndex === -1) return;

        const nextItem = items[nextIndex];
        if (!nextItem) return;

        let audio = null;
        switch (nextItem['@type']) {
            case 'pageBlockAudio': {
                audio = nextItem.audio;
                break;
            }
            case 'message': {
                const { content } = nextItem;
                switch (content['@type']) {
                    case 'messageAudio': {
                        audio = content.audio;
                        break;
                    }
                }
            }
        }

        if (!audio) return;

        let { audio: file } = audio;
        if (!file) return;
        file = FileStore.get(file.id) || file;

        const { id, local, expected_size } = file;

        const offset = 0;
        const limit = expected_size > PLAYER_PRELOAD_MAX_SIZE ? PLAYER_PRELOAD_MAX_SIZE : 0;

        const { is_downloading_active, is_downloading_completed, download_offset, downloaded_prefix_size } = local;
        if (is_downloading_completed) {
            // console.log('[cache] preload cancel completed', id, [offset, limit], [download_offset, downloaded_prefix_size]);
            return;
        }
        if (is_downloading_active) {
            // console.log('[cache] preload cancel active', id, [offset, limit], [download_offset, downloaded_prefix_size]);
            return;
        }

        if (download_offset <= offset && limit > 0 && limit <= downloaded_prefix_size) {
            // console.log('[cache] preload cancel size', id, [offset, limit], [download_offset, downloaded_prefix_size]);
            return;
        }

        // console.log('[cache] preload start', id, [offset, limit], [download_offset, downloaded_prefix_size], file);
        const result = await TdLibController.send({
            '@type': 'downloadFile',
            file_id: id,
            offset,
            limit,
            priority: PLAYER_PRELOAD_PRIORITY,
            synchronous: true
        });

        // console.log('[cache] preload stop', id, [offset, limit], [download_offset, downloaded_prefix_size], result);
    };

    openPlaylistItem(item) {
        const { instantView } = this;

        switch (item['@type']) {
            case 'message': {
                openMedia(item.chat_id, item.id, false);
                break;
            }
            case 'pageBlockAudio': {
                openInstantViewMedia(item.audio, item.caption, item, instantView, false);
                break;
            }
            case 'pageBlockVoiceNote': {
                openInstantViewMedia(item.voice_note, item.caption, item, instantView, false);
                break;
            }
        }
    }

    moveToPrevMedia = () => {
        const { playlist, message, block } = this;
        if (!playlist) return;
        if (!message && !block) return;

        const { items } = playlist;
        if (!items) return;

        const index = items.findIndex(x => playlistItemEquals(x, message || block));
        if (index === -1) return;

        if (index + 1 < items.length) {
            this.openPlaylistItem(items[index + 1]);
        }
    };

    moveToNextMedia = useRepeatShuffle => {
        const { playlist, message, block } = this;

        if (!playlist) return false;
        if (!message && !block) return false;

        const { items } = playlist;
        if (!items) return false;

        const index = items.findIndex(x => playlistItemEquals(x, message || block));
        if (index === -1) return false;

        let nextIndex = -1;
        if (!useRepeatShuffle) {
            nextIndex = index - 1;
        } else {
            switch (this.repeat) {
                case RepeatEnum.NONE: {
                    if (this.shuffle) {
                        nextIndex = getRandomInt(0, items.length);
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
                        nextIndex = getRandomInt(0, items.length);
                    } else {
                        nextIndex = index - 1 >= 0 ? index - 1 : items.length - 1;
                    }
                    break;
                }
            }
        }

        if (nextIndex >= 0) {
            this.openPlaylistItem(items[nextIndex])
            return true;
        }

        return false;
    };

    getCurrentTime = (uniqueId) => {
        return this.times.get(uniqueId) || { currentTime: 0, duration: 0 };
    };

    setCurrentTime = (uniqueId, info) => {
        if (info.currentTime < 30 || info.currentTime > info.duration - 10) {
            info.currentTime = 0;
        }

        this.times.set(uniqueId, info);
    };

    clearCurrentTime = (uniqueId) => {
        this.times.delete(uniqueId);
    };

    getPlaylist = async source => {
        const { playlist: currentPlaylist } = this;

        if (currentPlaylist) {
            const { items } = currentPlaylist;
            if (items && items.find(x => playlistItemEquals(x, source['@type'] === 'instantViewSource' ? source.block : source))) {
                return;
            }
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlaylistLoading',
            source
        });

        let items = [];
        let totalCount = 0;
        switch (source['@type']) {
            case 'message': {
                const { chat_id: chatId, id: messageId } = source;
                const filter = getSearchMessagesFilter(chatId, messageId);
                if (!filter) {
                    this.playlist = {
                        source,
                        totalCount: 1,
                        items: [source]
                    };

                    TdLibController.clientUpdate({
                        '@type': 'clientUpdateMediaPlaylist',
                        source,
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
                    filter
                });

                MessageStore.setItems(result.messages);

                items = result.messages;
                totalCount = result.total_count;
                break;
            }
            case 'instantViewSource': {
                const { block, instantView } = source;
                items = getValidBlocks(instantView, block['@type'] === 'pageBlockAudio' ? isValidAudioBlock : isValidVoiceNoteBlock).reverse();
                totalCount = items.length;
            }
        }

        this.playlist = {
            source,
            totalCount,
            items
        };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlaylist',
            source,
            playlist: this.playlist
        });
    };
}

const store = new PlayerStore();
window.player = store;
export default store;
