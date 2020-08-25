/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from './EventEmitter';
import { getLocationId } from '../Utils/Message';
import { FILE_PRIORITY, IV_LOCATION_HEIGHT, IV_LOCATION_WIDTH, THUMBNAIL_PRIORITY } from '../Constants';
import WebpManager from './WebpManager';
import TdLibController from '../Controllers/TdLibController';

const useReadFile = true;
const useDownloadFile = true;

class FileStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();

        WebpManager.init();
        // this.suppressUpdateFile = true;
    }

    reset = () => {
        this.callbacks = [];

        //this.transactionCount = 0;
        this.db = null;
        this.urls = new WeakMap();
        this.dataUrls = new Map();
        this.items = new Map();
        this.blobItems = new Map();
        this.pngBlobItems = new Map();
        this.locationItems = new Map();

        this.downloads = new Map();
        this.uploads = new Map();
    };

    onUpdate = async update => {
        switch (update['@type']) {
            case 'updateAuthorizationState': {
                await this.onUpdateAuthorizationState(update);

                break;
            }
            case 'updateFile': {
                this.set(update.file);

                this.onUpdateFile(update);

                if (!this.suppressUpdateFile) {
                    this.emit(update['@type'], update);
                }
                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateAnimationBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateAnimationThumbnailBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateAudioBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateAudioThumbnailBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateChatBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateDocumentBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateDocumentThumbnailBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateLocationBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdatePhotoBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateStickerBlob': {
                const { fileId, source } = update;
                if (source) {
                    const { is_animated } = source;
                    if (!is_animated) {
                        WebpManager.decode(fileId, false);
                    }
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateStickerPngBlob': {
                const { fileId, blob } = update;

                this.setPngBlob(fileId, blob);
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateStickerThumbnailBlob': {
                const { fileId, source } = update;
                if (source) {
                    const { thumbnail } = source;
                    if (thumbnail) {
                        const { format } = thumbnail;
                        if (format && format['@type'] === 'thumbnailFormatWebp') {
                            WebpManager.decode(fileId, true);
                        }
                    }
                }

                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateStickerThumbnailPngBlob': {
                const { fileId, blob } = update;

                this.setPngBlob(fileId, blob);
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateUserBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateVideoBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateVideoThumbnailBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateVideoNoteBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateVideoNoteThumbnailBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateVoiceNoteBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateSendFiles': {
                this.emit(update['@type'], update);
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

    onUpdateAuthorizationState = async update => {
        if (!update) return;

        const { authorization_state } = update;
        if (!authorization_state) return;

        switch (authorization_state['@type']) {
            case 'authorizationStateWaitTdlibParameters': {
                await this.initDB();
                break;
            }
            case 'authorizationStateClosed': {
                this.reset();
                break;
            }
        }
    };

    onUpdateFile = update => {
        if (!update) return;

        const { file } = update;
        if (!file) return;

        this.handleDownloads(file);
        this.handleUploads(file);
    };

    handleDownloads = file => {
        const { arr, id, idb_key, local } = file;
        delete file.arr;

        if (!this.downloads.has(id)) return;
        if (!local.is_downloading_completed) return;
        if (!useReadFile && !idb_key && !arr) return;

        const items = this.downloads.get(id);
        if (!items) return;

        this.downloads.delete(id);

        const store = this.getStore();

        items.forEach(item => {
            switch (item['@type']) {
                case 'animation': {
                    this.handleAnimation(store, item, file, arr, null);
                    break;
                }
                case 'audio': {
                    this.handleAudio(store, item, file, arr, null);
                    break;
                }
                case 'chat': {
                    this.handleChat(store, item, file, arr);
                    break;
                }
                case 'document': {
                    this.handleDocument(store, item, file, arr, null);
                    break;
                }
                case 'game': {
                    this.handleGame(store, item, file, arr, null);
                    break;
                }
                case 'location': {
                    this.handleLocation(store, item, file, arr, null);
                    break;
                }
                case 'message': {
                    this.handleMessage(store, item, file, arr);
                    break;
                }
                case 'pageBlockMap': {
                    this.handlePageBlockMap(store, item, file, arr, null);
                    break;
                }
                case 'photo': {
                    this.handlePhoto(store, item, file, arr, null);
                    break;
                }
                case 'sticker': {
                    this.handleSticker(store, item, file, arr, null);
                    break;
                }
                case 'video': {
                    this.handleVideo(store, item, file, arr, null);
                    break;
                }
                case 'videoNote': {
                    this.handleVideoNote(store, item, file, arr, null);
                    break;
                }
                case 'voiceNote': {
                    this.handleVoiceNote(store, item, file, arr, null);
                    break;
                }
                case 'user': {
                    this.handleUser(store, item, file, arr);
                    break;
                }
                default:
                    console.error('FileStore.onUpdateFile unhandled item', item);
                    break;
            }
        });
    };

    handleUploads = file => {
        const { id, remote } = file;
        delete file.arr;

        if (!this.uploads.has(id)) return;
        if (remote.is_uploading_completed) return;

        this.uploads.delete(id);
    };

    handleChat = (store, chat, file, arr) => {
        if (!chat) return;

        this.getLocalFile(
            store,
            file,
            arr,
            () => this.updateChatPhotoBlob(chat.id, file.id),
            () => this.getRemoteFile(file.id, FILE_PRIORITY, chat)
        );
    };

    handleUser = (store, user, file, arr) => {
        if (!user) return;

        this.getLocalFile(
            store,
            file,
            arr,
            () => this.updateUserPhotoBlob(user.id, file.id),
            () => this.getRemoteFile(file.id, FILE_PRIORITY, user)
        );
    };

    handleMessage = (store, message, file, arr) => {
        if (!message) return;

        const { content } = message;
        if (!content) return;

        switch (content['@type']) {
            case 'messageAnimation': {
                const { animation } = content;

                this.handleAnimation(store, animation, file, arr, message);
                break;
            }
            case 'messageAudio': {
                const { audio } = content;

                this.handleAudio(store, audio, file, arr, message);
                break;
            }
            case 'messageChatChangePhoto': {
                const { photo } = content;

                this.handlePhoto(store, photo, file, arr, message);
                break;
            }
            case 'messageDocument': {
                const { document } = content;

                this.handleDocument(store, document, file, arr, message);
                break;
            }
            case 'messageGame': {
                const { game } = content;

                this.handleGame(store, game, file, arr, message);
                break;
            }
            case 'messageLocation': {
                const { location } = content;

                this.handleLocation(store, location, file, arr, message);
                break;
            }
            case 'messagePhoto': {
                const { photo } = content;

                this.handlePhoto(store, photo, file, arr, message);
                break;
            }
            case 'messageSticker': {
                const { sticker } = content;

                this.handleSticker(store, sticker, file, arr, message);
                break;
            }
            case 'messageText': {
                const { web_page } = content;
                if (!web_page) break;

                const { animation, audio, document, photo, sticker, video, video_note, voice_note } = web_page;

                if (animation) {
                    this.handleAnimation(store, animation, file, arr, message);
                }

                if (audio) {
                    this.handleAudio(store, audio, file, arr, message);
                }

                if (document) {
                    this.handleDocument(store, document, file, arr, message);
                }

                if (photo) {
                    this.handlePhoto(store, photo, file, arr, message);
                }

                if (sticker) {
                    this.handleSticker(store, sticker, file, arr, message);
                }

                if (video) {
                    this.handleVideo(store, video, file, arr, message);
                }

                if (voice_note) {
                    this.handleVoiceNote(store, voice_note, file, arr, message);
                }

                if (video_note) {
                    this.handleVideoNote(store, video_note, file, arr, message);
                }

                break;
            }
            case 'messageVenue': {
                const { venue } = content;
                const { location } = venue;

                this.handleLocation(store, location, file, arr, message);
                break;
            }
            case 'messageVideo': {
                const { video } = content;

                this.handleVideo(store, video, file, arr, message);
                break;
            }
            case 'messageVideoNote': {
                const { video_note } = content;

                this.handleVideoNote(store, video_note, file, arr, message);
                break;
            }
            case 'messageVoiceNote': {
                const { voice_note } = content;

                this.handleVoiceNote(store, voice_note, file, arr, message);
                break;
            }
            default:
                break;
        }
    };

    handleAnimation = (store, animation, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        if (animation.thumbnail) {
            const source = animation.thumbnail.file;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateAnimationThumbnailBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj || animation)
                );
            }
        }

        if (animation.animation) {
            const source = animation.animation;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateAnimationBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || animation)
                );
            }
        }
    };

    handleAudio = (store, audio, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        if (audio.album_cover_thumbnail) {
            const source = audio.album_cover_thumbnail.file;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateAudioThumbnailBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj || audio)
                );
            }
        }

        if (audio.audio) {
            const source = audio.audio;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateAudioBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || audio)
                );
            }
        }
    };

    handleGame = (store, game, file, arr, message) => {
        if (!game) return;

        const { animation, photo } = game;
        if (photo) {
            this.handlePhoto(store, photo, file, arr, message);
        }

        if (animation) {
            this.handleAnimation(store, animation, file, arr, message);
        }
    };

    handleDocument = (store, document, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        if (document.thumbnail) {
            const source = document.thumbnail.file;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateDocumentThumbnailBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj || document)
                );
            }
        }

        if (document.document) {
            const { document: source } = document;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateDocumentBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || document)
                );
            }
        }
    };

    handleLocation = (store, location, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        const locationId = getLocationId(location);
        if (locationId) {
            const source = this.getLocationFile(locationId);
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateLocationBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj || location)
                );
            }
        }
    };

    handlePageBlockMap = (store, pageBlockMap, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        const { location } = pageBlockMap;
        const locationId = getLocationId(location, IV_LOCATION_WIDTH, IV_LOCATION_HEIGHT);
        if (locationId) {
            const source = this.getLocationFile(locationId);
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateLocationBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj || pageBlockMap)
                );
            }
        }
    };

    handlePhoto = (store, photo, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        if (photo) {
            for (let i = 0; i < photo.sizes.length; i++) {
                const photoSize = photo.sizes[i];
                if (photoSize) {
                    const source = photoSize.photo;
                    if (source && source.id === file.id) {
                        this.getLocalFile(
                            store,
                            source,
                            arr,
                            () => this.updatePhotoBlob(chatId, messageId, file.id),
                            () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || photo)
                        );
                        break;
                    }
                }
            }
        }
    };

    handleSticker = (store, sticker, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        if (sticker.thumbnail) {
            const source = sticker.thumbnail.file;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateStickerThumbnailBlob(chatId, messageId, file.id, sticker),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj || sticker)
                );
            }
        }

        if (sticker.sticker) {
            const source = sticker.sticker;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateStickerBlob(chatId, messageId, file.id, sticker),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || sticker)
                );
            }
        }
    };

    handleVoiceNote = (store, voiceNote, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        if (voiceNote.voice) {
            const source = voiceNote.voice;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateVoiceNoteBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || voiceNote)
                );
            }
        }
    };

    handleVideoNote = (store, videoNote, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        if (videoNote.thumbnail) {
            const source = videoNote.thumbnail.file;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateVideoNoteThumbnailBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj || videoNote)
                );
            }
        }

        if (videoNote.video) {
            const source = videoNote.video;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateVideoNoteBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || videoNote)
                );
            }
        }
    };

    handleVideo = (store, video, file, arr, obj) => {
        const chatId = obj ? obj.chat_id : 0;
        const messageId = obj ? obj.id : 0;

        if (video.thumbnail) {
            const source = video.thumbnail.file;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateVideoThumbnailBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj || video)
                );
            }
        }

        if (video.video) {
            const source = video.video;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateVideoBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || video)
                );
            }
        }
    };

    async initDB(callback) {
        /*if (this.store) return;
            if (this.initiatingDB) return;

            this.initiatingDB = true;
            this.store = localForage.createInstance({
                name: 'tdlib'
            });
            this.initiatingDB = false;

            return;*/
        if (this.db) {
            // console.log('[FileStore] db exists');
            if (callback) callback();
            return;
        }

        if (this.initiatingDB) {
            // console.log('[FileStore] add callback');
            if (callback) this.callbacks.push(callback);
            return;
        }

        // console.log('[FileStore] start initDB');
        if (callback) this.callbacks.push(callback);

        this.initiatingDB = true;
        this.db = await this.openDB().catch(error => console.log('[FileStore] initDB error', error));
        this.initiatingDB = false;

        // console.log('[FileStore] stop initDB');

        if (this.callbacks.length) {
            // console.log('[FileStore] invoke callbacks count=' + this.callbacks.length);
            for (let i = 0; i < this.callbacks.length; i++) {
                this.callbacks[i]();
            }
            this.callbacks = [];
        }
    }

    openDB() {
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open('tdlib');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getStore() {
        if (useReadFile) {
            return undefined;
        }

        //console.log('FileStore.getStore ' + this.transactionCount++);
        return this.db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');
    }

    getReadWriteStore() {
        if (useReadFile) {
            return undefined;
        }

        return this.db.transaction(['keyvaluepairs'], 'readwrite').objectStore('keyvaluepairs');
    }

    deleteLocalFile = (store, file) => {};

    getLocalFile(store, file, arr, callback, faultCallback) {
        if (!useDownloadFile) {
            return;
        }

        if (useReadFile) {
            file = this.get(file.id) || file;
            if (file && file.local && !file.local.is_downloading_completed) {
                faultCallback();
                return;
            }

            (async file => {
                // console.log('[fs] readFile file_id=' + file.id);
                const response = await TdLibController.send({
                    '@type': 'readFile',
                    file_id: file.id
                });

                // console.log(`[fs] readFile result file_id=${file.id}`, file, response);
                this.setBlob(file.id, response.data);
            })(file).then(callback, faultCallback);

            return;
        }

        let idb_key = file.idb_key;
        if (!idb_key) {
            file = this.get(file.id) || file;
            idb_key = file.idb_key;
        }

        if (!idb_key && !arr) {
            faultCallback();
            return;
        }

        if (arr) {
            file.blob = new Blob([arr]);
            this.setBlob(file.id, file.blob);
            callback();
            return;
        }

        if (file.blob) {
            //callback();
            return;
        }

        // if (this.getBlob(file.id)){
        //     return;
        // }

        const request = store.get(idb_key);
        request.onsuccess = event => {
            const blob = event.target.result;

            if (blob) {
                file.blob = blob;
                this.setBlob(file.id, file.blob);
                callback();
            } else {
                faultCallback();
            }
        };
        request.onerror = () => {
            faultCallback();
        };
    }

    getRemoteFile(fileId, priority, obj) {
        if (!useDownloadFile) {
            return;
        }

        const items = this.downloads.get(fileId) || [];
        if (items.some(x => x === obj)) return;

        items.push(obj);
        this.downloads.set(fileId, items);

        TdLibController.send({
            '@type': 'downloadFile',
            file_id: fileId,
            priority: priority
        });
    }

    cancelGetRemoteFile(fileId, obj) {
        if (!this.downloads.has(fileId)) return;

        if (!obj) {
            this.downloads.delete(fileId);
        } else {
            const items = this.downloads.get(fileId).filter(x => x !== obj);
            this.downloads.set(fileId, items);
        }

        TdLibController.send({
            '@type': 'cancelDownloadFile',
            file_id: fileId,
            only_if_pending: false
        });
    }

    uploadFile(fileId, obj) {
        if (this.uploads.has(fileId)) {
            let items = this.uploads.get(fileId);
            items.push(obj);
        } else {
            this.uploads.set(fileId, [obj]);
        }

        console.log('[perf] uploadFile file_id=' + fileId);
    }

    cancelUploadFile(fileId, obj) {
        if (this.uploads.has(fileId)) {
            this.uploads.delete(fileId);
            console.log('cancel_upload_message id=' + obj.id);
            TdLibController.send({
                '@type': 'deleteMessages',
                chat_id: obj.chat_id,
                message_ids: [obj.id],
                revoke: true
            });
        }
    }

    get = fileId => {
        return this.items.get(fileId);
    };

    set = file => {
        this.items.set(file.id, file);
    };

    getBlob = fileId => {
        return this.blobItems.get(fileId);
    };

    setBlob = (fileId, blob) => {
        this.blobItems.set(fileId, blob);
    };

    getPngBlob = fileId => {
        return this.pngBlobItems.get(fileId);
    };

    setPngBlob = (fileId, blob) => {
        this.pngBlobItems.set(fileId, blob);
    }

    deleteBlob = fileId => {
        this.blobItems.delete(fileId);
    };

    getLocationFile = locationId => {
        const fileId = this.locationItems.get(locationId);

        return this.get(fileId);
    };

    setLocationFile = (locationId, file) => {
        this.locationItems.set(locationId, file.id);

        this.set(file);
    };

    getDataUrl = id => {
        if (!id) {
            return null;
        }

        if (this.dataUrls.has(id)) {
            return this.dataUrls.get(id);
        }

        return null;
    };

    setDataUrl = (id, dataUrl) => {
        this.dataUrls.set(id, dataUrl);
    };

    deleteDataUrl = id => {
        this.dataUrls.delete(id);
    };

    getBlobUrl = blob => {
        if (!blob) {
            return null;
        }

        if (this.urls.has(blob)) {
            return this.urls.get(blob);
        }

        const url = URL.createObjectURL(blob);
        this.urls.set(blob, url);

        return url;
    };

    deleteBlobUrl = blob => {
        if (this.urls.has(blob)) {
            this.urls.delete(blob);
        }
    };

    updateFileBlob = (type, chatId, messageId, fileId, source) => {
        TdLibController.clientUpdate({
            '@type': type,
            chatId,
            messageId,
            fileId,
            source
        });
    }

    updateAnimationBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateAnimationBlob', chatId, messageId, fileId);
    };

    updateAnimationThumbnailBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateAnimationThumbnailBlob', chatId, messageId, fileId);
    };

    updateAudioBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateAudioBlob', chatId, messageId, fileId);
    };

    updateAudioThumbnailBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateAudioThumbnailBlob', chatId, messageId, fileId);
    };

    updateChatPhotoBlob(chatId, fileId) {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateChatBlob',
            chatId,
            fileId
        });
    }

    updateDocumentBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateDocumentBlob', chatId, messageId, fileId);
    };

    updateDocumentThumbnailBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateDocumentThumbnailBlob', chatId, messageId, fileId);
    };

    updateLocationBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateLocationBlob', chatId, messageId, fileId);
    };

    updatePhotoBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdatePhotoBlob', chatId, messageId, fileId);
    };

    updateStickerBlob = (chatId, messageId, fileId, source) => {
        this.updateFileBlob('clientUpdateStickerBlob', chatId, messageId, fileId, source);
    };

    updateStickerThumbnailBlob = (chatId, messageId, fileId, source) => {
        this.updateFileBlob('clientUpdateStickerThumbnailBlob', chatId, messageId, fileId, source);
    };

    updateUserPhotoBlob(userId, fileId) {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateUserBlob',
            userId,
            fileId
        });
    }

    updateVideoBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateVideoBlob', chatId, messageId, fileId);
    };

    updateVideoThumbnailBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateVideoThumbnailBlob', chatId, messageId, fileId);
    };

    updateVideoNoteBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateVideoNoteBlob', chatId, messageId, fileId);
    };

    updateVideoNoteThumbnailBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateVideoNoteThumbnailBlob', chatId, messageId, fileId);
    };

    updateVoiceNoteBlob = (chatId, messageId, fileId) => {
        this.updateFileBlob('clientUpdateVoiceNoteBlob', chatId, messageId, fileId);
    };
}

const store = new FileStore();
window.file = store;
export default store;
