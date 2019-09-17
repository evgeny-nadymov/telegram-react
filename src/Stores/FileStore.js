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
const useDownloadFile = true;

class FileStore extends EventEmitter {
    constructor() {
        super();

        this.reset();

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    reset = () => {
        this.callbacks = [];

        //this.transactionCount = 0;
        this.db = null;
        this.urls = new WeakMap();
        this.items = new Map();
        this.blobItems = new Map();
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

                this.emit(update['@type'], update);
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
                case 'chat': {
                    this.handleChat(store, item, file, arr);
                    break;
                }
                case 'message': {
                    this.handleMessage(store, item, file, arr);
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
            const source = animation.thumbnail.photo;
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
        if (audio.album_cover_thumbnail) {
            const source = audio.album_cover_thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
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
                    arr,
                    () => this.updateAudioBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
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
        if (document.thumbnail) {
            const { photo: source } = document.thumbnail;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
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
                    arr,
                    () => this.updateDocumentBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleLocation = (store, location, file, arr, obj) => {
        const locationId = getLocationId(location);
        if (locationId) {
            const source = this.getLocationFile(locationId);
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateLocationBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, THUMBNAIL_PRIORITY, obj)
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
            const source = sticker.thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateStickerThumbnailBlob(chatId, messageId, file.id),
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
                    () => this.updateStickerBlob(chatId, messageId, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj || sticker)
                );
            }
        }
    };

    handleVoiceNote = (store, voiceNote, file, arr, obj) => {
        if (voiceNote.voice) {
            const source = voiceNote.voice;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
                    arr,
                    () => this.updateVoiceNoteBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleVideoNote = (store, videoNote, file, arr, obj) => {
        if (videoNote.thumbnail) {
            const source = videoNote.thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
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
                    arr,
                    () => this.updateVideoNoteBlob(obj.chat_id, obj.id, file.id),
                    () => this.getRemoteFile(file.id, FILE_PRIORITY, obj)
                );
            }
        }
    };

    handleVideo = (store, video, file, arr, obj) => {
        if (video.thumbnail) {
            const source = video.thumbnail.photo;
            if (source && source.id === file.id) {
                this.getLocalFile(
                    store,
                    source,
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
                    arr,
                    () => this.updateVideoBlob(obj.chat_id, obj.id, file.id),
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
        if (callback) this.callbacks.push(callback);

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
                const response = await TdLibController.send({
                    '@type': 'readFile',
                    file_id: file.id
                });

                console.log(`readFile result file_id=${file.id}`, file, response);
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
    };

    updateAudioBlob = (chatId, messageId, fileId) => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateAudioBlob',
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
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
