/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import { getLocationId } from '../Utils/Message';
import { FILE_PRIORITY, THUMBNAIL_PRIORITY } from '../Constants';
import TdLibController from '../Controllers/TdLibController';

const useReadFile = true;

class FileStore extends EventEmitter {
    constructor() {
        super();

        this.callbacks = [];

        this.db = null;
        this.urls = new WeakMap();
        this.items = new Map();
        this.blobItems = new Map();
        this.locationItems = new Map();

        this.downloads = new Map();
        this.uploads = new Map();

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    onUpdate = async update => {
        switch (update['@type']) {
            case 'updateFile': {
                this.set(update.file);

                this.onUpdateFile(update);

                this.emit(update['@type'], update);
                break;
            }
            case 'updateAuthorizationState': {
                await this.onUpdateAuthorizationState(update);

                break;
            }
            default:
                break;
        }
    };

    onClientUpdate = update => {
        switch (update['@type']) {
            case 'clientUpdateAudioThumbnailBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateAudioBlob': {
                this.emit(update['@type'], update);
                break;
            }
            case 'clientUpdateDocumentBlob': {
                this.emit(update['@type'], update);
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

    onUpdateAuthorizationState = async update => {
        if (!update) return;
        if (!update.authorization_state) return;

        if (update.authorization_state['@type'] === 'authorizationStateWaitTdlibParameters') {
            await this.initDB();
        }
    };

    onUpdateFile = update => {
        if (!update) return;

        const { file } = update;
        if (!file) return;

        if (this.downloads.has(file.id)) {
            if (file.local.is_downloading_completed) {
                if (!useReadFile) {
                    if (!(file.idb_key || file.arr) || !file.remote.id) {
                        return;
                    }
                }

                const { arr, idb_key } = file;
                delete file.arr;

                let items = this.downloads.get(file.id);
                if (items) {
                    this.downloads.delete(file.id);

                    const store = this.getStore();

                    for (let i = 0; i < items.length; i++) {
                        let obj = items[i];
                        switch (obj['@type']) {
                            case 'chat': {
                                this.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    arr,
                                    () => this.updateChatPhotoBlob(obj.id, file.id),
                                    () => this.getRemoteFile(file.id, 1, obj)
                                );

                                break;
                            }
                            case 'user': {
                                this.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    arr,
                                    () => this.updateUserPhotoBlob(obj.id, file.id),
                                    () => this.getRemoteFile(file.id, 1, obj)
                                );

                                break;
                            }
                            case 'message':
                                switch (obj.content['@type']) {
                                    case 'messageText': {
                                        const { web_page } = obj.content;
                                        if (web_page) {
                                            const { photo } = web_page;
                                            if (photo) {
                                                this.handlePhoto(store, photo, file, idb_key, arr, obj);
                                            }

                                            const { animation } = web_page;
                                            if (animation) {
                                                this.handleAnimation(store, animation, file, idb_key, arr, obj);
                                            }

                                            const { audio } = web_page;
                                            if (audio) {
                                                this.handleAudio(store, audio, file, idb_key, arr, obj);
                                            }

                                            const { document } = web_page;
                                            if (document) {
                                                this.handleDocument(store, document, file, idb_key, arr, obj);
                                            }

                                            const { sticker } = web_page;
                                            if (sticker) {
                                                this.handleSticker(store, sticker, file, idb_key, arr, obj);
                                            }

                                            const { video } = web_page;
                                            if (video) {
                                                this.handleVideo(store, video, file, idb_key, arr, obj);
                                            }

                                            const { voice_note } = web_page;
                                            if (voice_note) {
                                                this.handleVoiceNote(store, voice_note, file, idb_key, arr, obj);
                                            }

                                            const { video_note } = web_page;
                                            if (video_note) {
                                                this.handleVideoNote(store, video_note, file, idb_key, arr, obj);
                                            }
                                        }

                                        break;
                                    }
                                    case 'messageChatChangePhoto': {
                                        const { photo } = obj.content;

                                        this.handlePhoto(store, photo, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messagePhoto': {
                                        const { photo } = obj.content;

                                        this.handlePhoto(store, photo, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageGame': {
                                        const { game } = obj.content;

                                        this.handleGame(store, game, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageSticker': {
                                        const { sticker } = obj.content;

                                        this.handleSticker(store, sticker, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageVoiceNote': {
                                        const { voice_note } = obj.content;

                                        this.handleVoiceNote(store, voice_note, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageVideoNote': {
                                        const { video_note } = obj.content;

                                        this.handleVideoNote(store, video_note, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageAnimation': {
                                        const { animation } = obj.content;

                                        this.handleAnimation(store, animation, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageVideo': {
                                        const { video } = obj.content;

                                        this.handleVideo(store, video, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageAudio': {
                                        const { audio } = obj.content;

                                        this.handleAudio(store, audio, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageDocument': {
                                        const { document } = obj.content;

                                        this.handleDocument(store, document, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageLocation': {
                                        const { location } = obj.content;

                                        this.handleLocation(store, location, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageVenue': {
                                        const { venue } = obj.content;
                                        const { location } = venue;

                                        this.handleLocation(store, location, file, idb_key, arr, obj);
                                        break;
                                    }
                                    default:
                                        break;
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }
            } else {
                //this.emit('file_update', file);
            }
        } else if (this.uploads.has(file.id)) {
            if (file.remote.is_uploading_completed) {
                this.uploads.delete(file.id);
                //this.emit('file_upload_update', file);
            } else {
                //this.emit('file_upload_update', file);
            }
        }
    };

    handleGame = (store, game, file, idb_key, arr, obj) => {
        if (game) {
            const { photo } = game;
            if (photo) {
                this.handlePhoto(store, photo, file, idb_key, arr, obj);
            }

            const { animation } = game;
            if (animation) {
                this.handleAnimation(store, animation, file, idb_key, arr, obj);
            }
        }
    };

    handlePhoto = (store, photo, file, idb_key, arr, obj) => {
        if (photo) {
            for (let i = 0; i < photo.sizes.length; i++) {
                const photoSize = photo.sizes[i];
                if (photoSize) {
                    const source = photoSize.photo;
                    if (source && source.id === file.id) {
                        this.getLocalFile(
                            store,
                            source,
                            idb_key,
                            arr,
                            () => this.updatePhotoBlob(obj.chat_id, obj.id, file.id),
                            () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                        );
                        break;
                    }
                }
            }
        }
    };

    handleAudio = (store, audio, file, idb_key, arr, obj) => {
        if (audio.album_cover_thumbnail) {
            const source = audio.album_cover_thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateAudioThumbnailBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj)
                );
            }
        }

        if (audio.audio) {
            const source = audio.audio;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateAudioBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleDocument = (store, document, file, idb_key, arr, obj) => {
        if (document.thumbnail) {
            const { photo: source } = document.thumbnail;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateDocumentThumbnailBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj)
                );
            }
        }

        if (document.document) {
            const { document: source } = document;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateDocumentBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleLocation = (store, location, file, idb_key, arr, obj) => {
        const locationId = getLocationId(location);
        if (locationId) {
            const source = this.getLocationFile(locationId);
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateLocationBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj)
                );
            }
        }
    };

    handleSticker = (store, sticker, file, idb_key, arr, obj) => {
        if (sticker.thumbnail) {
            const source = sticker.thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateStickerThumbnailBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj)
                );
            }
        }

        if (sticker.sticker) {
            const source = sticker.sticker;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateStickerBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleVoiceNote = (store, voiceNote, file, idb_key, arr, obj) => {
        if (voiceNote.voice) {
            const source = voiceNote.voice;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateVoiceNoteBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleVideoNote = (store, videoNote, file, idb_key, arr, obj) => {
        if (videoNote.thumbnail) {
            const source = videoNote.thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateVideoNoteThumbnailBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj)
                );
            }
        }

        if (videoNote.video) {
            const source = videoNote.video;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateVideoNoteBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleVideo = (store, video, file, idb_key, arr, obj) => {
        if (video.thumbnail) {
            const source = video.thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateVideoThumbnailBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj)
                );
            }
        }

        if (video.video) {
            const source = video.video;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateVideoBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleAnimation = (store, animation, file, idb_key, arr, obj) => {
        if (animation.thumbnail) {
            const source = animation.thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateAnimationThumbnailBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj)
                );
            }
        }

        if (animation.animation) {
            const source = animation.animation;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    idb_key,
                    arr,
                    () => this.updateAnimationBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
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
            console.log('[FileStore] db exists');
            if (callback) callback();
            return;
        }

        if (this.initiatingDB) {
            console.log('[FileStore] add callback');
            if (callback) this.callbacks.push(callback);
            return;
        }

        console.log('[FileStore] start initDB');

        this.initiatingDB = true;
        this.db = await this.openDB().catch(error => console.log('[FileStore] initDB error', error));
        this.initiatingDB = false;

        console.log('[FileStore] stop initDB');

        if (this.callbacks.length) {
            console.log('[FileStore] invoke callbacks count=' + this.callbacks.length);
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
        return this.db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');
    }

    getReadWriteStore() {
        if (useReadFile) {
            return undefined;
        }
        return this.db.transaction(['keyvaluepairs'], 'readwrite').objectStore('keyvaluepairs');
    }

    deleteLocalFile = (store, file) => {
        if (useReadFile) {
            return;
        }
        if (!file.idb_key) {
            return;
        }

        delete file.blob;

        this.deleteBlob(file.id);

        const request = store.delete(file.idb_key);
        request.onsuccess = event => {
            // alert('Local file deleted');
        };
        request.onerror = () => {};
    };

    getLocalFile(store, file, idb_key, arr, callback, faultCallback) {
        if (useReadFile) {
            (async file => {
                let response = await TdLibController.send({
                    '@type': 'readFile',
                    file_id: file.id
                });
                console.log(`readFile file_id=${file.id} result`, response);
                this.setBlob(file.id, response.data);
            })(file).then(callback, faultCallback);
            return;
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
        if (this.downloads.has(fileId)) {
            const items = this.downloads.get(fileId);

            for (let i = 0; i < items.length; i++) {
                if (items[i] === obj) {
                    return;
                }
            }

            items.push(obj);
        } else {
            this.downloads.set(fileId, [obj]);
        }

        //console.log('[perf] downloadFile file_id=' + fileId);
        TdLibController.send({
            '@type': 'downloadFile',
            file_id: fileId,
            priority: priority
        });
    }

    cancelGetRemoteFile(fileId, obj) {
        if (this.downloads.has(fileId)) {
            const items = this.downloads.get(fileId).filter(x => x !== obj);
            this.downloads.set(fileId, items);

            console.log('cancel_download_message id=' + obj.id);
            TdLibController.send({
                '@type': 'cancelDownloadFile',
                file_id: fileId,
                only_if_pending: false
            });
        }
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

    updatePhotoBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdatePhotoBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateAudioThumbnailBlob = (chatId, messageId, fileId) => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateAudioThumbnailBlob',
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });

        // this.emit('clientUpdateAudioThumbnailBlob', {
        //     chatId: chatId,
        //     messageId: messageId,
        //     fileId: fileId
        // });
    };

    updateAudioBlob = (chatId, messageId, fileId) => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateAudioBlob',
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });

        // this.emit('clientUpdateAudioBlob', {
        //     chatId: chatId,
        //     messageId: messageId,
        //     fileId: fileId
        // });
    };

    updateVoiceNoteBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateVoiceNoteBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateVideoNoteThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateVideoNoteThumbnailBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateVideoNoteBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateVideoNoteBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateAnimationThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateAnimationThumbnailBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateAnimationBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateAnimationBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateDocumentBlob = (chatId, messageId, fileId) => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateDocumentBlob',
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateVideoThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateVideoThumbnailBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateVideoBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateVideoBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateStickerThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateStickerThumbnailBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateStickerBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateStickerBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateLocationBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateLocationBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateDocumentThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateDocumentThumbnailBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateUserPhotoBlob(userId, fileId) {
        this.emit('clientUpdateUserBlob', {
            userId: userId,
            fileId: fileId
        });
    }

    updateChatPhotoBlob(chatId, fileId) {
        this.emit('clientUpdateChatBlob', {
            chatId: chatId,
            fileId: fileId
        });
    }
}

const store = new FileStore();
window.file = store;
export default store;
