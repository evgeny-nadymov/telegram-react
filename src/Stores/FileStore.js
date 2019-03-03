/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import TdLibController from '../Controllers/TdLibController';
import { getLocationId } from '../Utils/Message';
import { THUMBNAIL_PRIORITY } from '../Constants';

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

    onClientUpdate = update => {};

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

        const arr = file.arr;
        delete file.arr;

        if (this.downloads.has(file.id)) {
            if (file.local.is_downloading_completed) {
                if (!file.idb_key || !file.remote.id) {
                    return;
                }
                let idb_key = file.idb_key;

                let items = this.downloads.get(file.id);
                if (items) {
                    this.downloads.delete(file.id);

                    let store = this.getStore();

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
                                    case 'messageGame': {
                                        const { game } = obj.content;
                                        if (game) {
                                            const { photo } = game;
                                            if (photo) {
                                                for (let i = 0; i < photo.sizes.length; i++) {
                                                    const photoSize = photo.sizes[i];
                                                    if (photoSize) {
                                                        let source = photoSize.photo;
                                                        if (source && source.id === file.id) {
                                                            this.getLocalFile(
                                                                store,
                                                                source,
                                                                idb_key,
                                                                arr,
                                                                () => this.updateGameBlob(obj.chat_id, obj.id, file.id),
                                                                () => this.getRemoteFile(file.id, 1, obj)
                                                            );
                                                            break;
                                                        }
                                                    }
                                                }
                                            }

                                            const { animation } = game;
                                            if (animation) {
                                                this.handleAnimation(animation, file, idb_key, arr, obj);
                                            }
                                        }

                                        break;
                                    }
                                    case 'messageText': {
                                        const { web_page } = obj.content;
                                        if (web_page) {
                                            const { photo } = web_page;
                                            if (photo) {
                                                for (let i = 0; i < photo.sizes.length; i++) {
                                                    const photoSize = photo.sizes[i];
                                                    if (photoSize) {
                                                        let source = photoSize.photo;
                                                        if (source && source.id === file.id) {
                                                            this.getLocalFile(
                                                                store,
                                                                source,
                                                                idb_key,
                                                                arr,
                                                                () =>
                                                                    this.updateWebPageBlob(
                                                                        obj.chat_id,
                                                                        obj.id,
                                                                        file.id
                                                                    ),
                                                                () => this.getRemoteFile(file.id, 1, obj)
                                                            );
                                                            break;
                                                        }
                                                    }
                                                }
                                            }

                                            const { animation } = web_page;
                                            if (animation) {
                                                this.handleAnimation(animation, file, idb_key, arr, obj);
                                            }

                                            const { video_note } = web_page;
                                            if (video_note) {
                                                this.handleVideoNote(video_note, file, idb_key, arr, obj);
                                            }
                                        }

                                        break;
                                    }
                                    case 'messagePhoto': {
                                        const { photo } = obj.content;

                                        for (let i = 0; i < photo.sizes.length; i++) {
                                            let photoSize = photo.sizes[i];
                                            if (photoSize) {
                                                let source = photoSize.photo;
                                                if (source && source.id === file.id) {
                                                    this.getLocalFile(
                                                        store,
                                                        source,
                                                        idb_key,
                                                        arr,
                                                        () => this.updatePhotoBlob(obj.chat_id, obj.id, file.id),
                                                        () => this.getRemoteFile(file.id, 1, obj)
                                                    );
                                                    break;
                                                }
                                            }
                                        }

                                        break;
                                    }
                                    case 'messageSticker': {
                                        const { sticker } = obj.content;

                                        if (sticker.thumbnail) {
                                            let source = sticker.thumbnail.photo;
                                            if (source && source.id === file.id) {
                                                this.getLocalFile(
                                                    store,
                                                    source,
                                                    idb_key,
                                                    arr,
                                                    () => this.updateStickerThumbnailBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj)
                                                );
                                                break;
                                            }
                                        }

                                        if (sticker.sticker) {
                                            let source = sticker.sticker;
                                            if (source && source.id === file.id) {
                                                this.getLocalFile(
                                                    store,
                                                    source,
                                                    idb_key,
                                                    arr,
                                                    () => this.updateStickerBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj)
                                                );
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                    case 'messageVideoNote': {
                                        const { video_note } = obj.content;

                                        this.handleVideoNote(video_note, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageAnimation': {
                                        const { animation } = obj.content;

                                        this.handleAnimation(animation, file, idb_key, arr, obj);
                                        break;
                                    }
                                    case 'messageVideo': {
                                        const { video } = obj.content;

                                        if (video.thumbnail) {
                                            let source = video.thumbnail.photo;
                                            if (source && source.id === file.id) {
                                                this.getLocalFile(
                                                    store,
                                                    source,
                                                    idb_key,
                                                    arr,
                                                    () => this.updateVideoThumbnailBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj)
                                                );
                                                break;
                                            }
                                        }

                                        if (video.video) {
                                            let source = video.video;
                                            if (source && source.id === file.id) {
                                                this.getLocalFile(
                                                    store,
                                                    source,
                                                    idb_key,
                                                    arr,
                                                    () => this.updateVideoBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj)
                                                );
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                    case 'messageDocument': {
                                        const { document } = obj.content;

                                        if (document.thumbnail) {
                                            let source = document.thumbnail.photo;
                                            if (source && source.id === file.id) {
                                                this.getLocalFile(
                                                    store,
                                                    source,
                                                    idb_key,
                                                    arr,
                                                    () =>
                                                        this.updateDocumentThumbnailBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj)
                                                );
                                                break;
                                            }
                                        }

                                        if (document.document) {
                                            let source = document.document;
                                            if (source && source.id === file.id) {
                                                //this.emit('file_update', file);
                                                break;
                                                // this.getLocalFile(store, source, idb_key, arr,
                                                //     () => this.emit('file_update', file),
                                                //     () => this.getRemoteFile(file.id, 1, obj));
                                            }
                                        }
                                        break;
                                    }
                                    case 'messageLocation': {
                                        const { location } = obj.content;

                                        const locationId = getLocationId(location);
                                        if (locationId) {
                                            const source = this.getLocationFile(locationId);
                                            if (source && source.id === file.id) {
                                                this.getLocalFile(
                                                    store,
                                                    source,
                                                    idb_key,
                                                    null,
                                                    () => this.updateLocationBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj)
                                                );
                                            }
                                        }
                                        break;
                                    }
                                    case 'messageVenue': {
                                        const { venue } = obj.content;
                                        const { location } = venue;

                                        const locationId = getLocationId(location);
                                        if (locationId) {
                                            const source = this.getLocationFile(locationId);
                                            if (source && source.id === file.id) {
                                                this.getLocalFile(
                                                    store,
                                                    source,
                                                    idb_key,
                                                    null,
                                                    () => this.updateLocationBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj)
                                                );
                                            }
                                        }
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

    handleVideoNote = (videoNote, file, idb_key, arr, obj) => {
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
                    () => this.getRemoteFile(file.id, 1, obj)
                );
            }
        }
    };

    handleAnimation = (animation, file, idb_key, arr, obj) => {
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
                    () => this.getRemoteFile(file.id, 1, obj)
                );
            }
        }
    };

    async initDB(callback) {
        /*if (this.store) return;
            if (this.initiatingDB) return;

            this.initiatingDB = true;
            this.store = localForage.createInstance({
                name: '/tdlib'
            });
            this.initiatingDB = false;

            return;*/
        if (this.db) {
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
        this.db = await this.openDB();
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
            const request = window.indexedDB.open('/tdlib');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getStore() {
        return this.db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');
    }

    getReadWriteStore() {
        return this.db.transaction(['keyvaluepairs'], 'readwrite').objectStore('keyvaluepairs');
    }

    deleteLocalFile = (store, file) => {
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
        if (!idb_key) {
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

    updateGameBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateGameBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updateWebPageBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateWebPageBlob', {
            chatId: chatId,
            messageId: messageId,
            fileId: fileId
        });
    };

    updatePhotoBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdatePhotoBlob', {
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

    updateAnimationBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateAnimationBlob', {
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

    updateVideoNoteThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateVideoNoteThumbnailBlob', {
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

    updateVideoThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateVideoThumbnailBlob', {
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

    updateLocationBlob = (chatId, messageId, fileId) => {
        // console.log(`clientUpdateLocationBlob chat_id=${chatId} message_id=${messageId} file_id=${fileId}`);

        this.emit('clientUpdateLocationBlob', {
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
