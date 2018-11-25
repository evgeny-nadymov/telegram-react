/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'events';
import TdLibController from '../Controllers/TdLibController';

class FileStore extends EventEmitter {
    constructor() {
        super();

        this.items = new Map();
        this.blobItems = new Map();

        this.downloads = new Map();
        this.uploads = new Map();

        this.addTdLibListener();
        this.setMaxListeners(Infinity);
    }

    onUpdate = async (update) => {
        switch (update['@type']) {
            case 'updateFile':{
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

    addTdLibListener = () => {
        TdLibController.addListener('tdlib_update', this.onUpdate);
    };

    removeTdLibListener = () => {
        TdLibController.removeListener('tdlib_update', this.onUpdate);
    };

    onUpdateAuthorizationState = async (update) => {
        if (!update) return;
        if (!update.authorization_state) return;

        if (update.authorization_state['@type'] === 'authorizationStateWaitTdlibParameters'){
            await this.initDB();
        }
    };

    onUpdateFile = (update) => {
        if (!update) return;

        const {file} = update;
        if (!file) return;

        const arr = file.arr;
        delete file.arr;

        if (this.downloads.has(file.id)){

            if (file.local.is_downloading_completed){

                if (!file.idb_key || !file.remote.id) {
                    return;
                }
                let idb_key = file.idb_key;

                let items = this.downloads.get(file.id);
                if (items){
                    this.downloads.delete(file.id);

                    let store = this.getStore();

                    for (let i = 0; i < items.length; i++){
                        let obj = items[i];
                        switch (obj['@type']){
                            case 'chat':{
                                let source = obj.photo.small;
                                if (source && source.id === file.id){
                                    this.getLocalFile(store, source, idb_key, arr,
                                        () => this.updateChatPhotoBlob(obj.id, file.id),
                                        () => this.getRemoteFile(file.id, 1));
                                }
                                break;
                            }
                            case 'user':{
                                let source = obj.profile_photo.small;
                                if (source && source.id === file.id){
                                    this.getLocalFile(store, source, idb_key, arr,
                                        () => this.updateUserPhotoBlob(obj.id, file.id),
                                        () => this.getRemoteFile(file.id, 1));
                                }

                                break;
                            }
                            case 'message':
                                switch (obj.content['@type']){
                                    case 'messagePhoto':
                                        // preview
                                        /*let preview = this.getPreviewPhotoSize(obj.content.photo.sizes);
                                        if (preview && preview.photo.id === file.id)
                                        {
                                            this.getLocalFile(store, preview, idb_key,
                                                () => MessageStore.updateMessagePhoto(obj.id),
                                                () => { },
                                                'update_',
                                                obj.id);
                                        }*/

                                        // regular
                                        for (let i = 0; i < obj.content.photo.sizes.length; i++){
                                            let photoSize = obj.content.photo.sizes[i];
                                            if (photoSize)
                                            {
                                                let source = photoSize.photo;
                                                if (source && source.id === file.id){
                                                    this.getLocalFile(store, source, idb_key, arr,
                                                        () => this.updatePhotoBlob(obj.chat_id, obj.id, file.id),
                                                        () => { });
                                                }
                                            }
                                        }

                                        break;
                                    case 'messageSticker': {
                                        let source = obj.content.sticker.sticker;
                                        if (source && source.id === file.id){
                                            this.getLocalFile(store, source, idb_key, arr,
                                                () => this.updateStickerBlob(obj.chat_id, obj.id, file.id),
                                                () => this.getRemoteFile(file.id, 1, obj));
                                        }
                                        break;
                                    }
                                    case 'messageDocument': {
                                        if (obj.content.document.thumbnail){
                                            let source = obj.content.document.thumbnail.photo;
                                            if (source && source.id === file.id){
                                                this.getLocalFile(store, source, idb_key, arr,
                                                    () => this.updateDocumentThumbnailBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj));
                                            }
                                        }

                                        if (obj.content.document.document){
                                            let source = obj.content.document.document;
                                            if (source && source.id === file.id){
                                                this.emit('file_update', file);
                                                // this.getLocalFile(store, source, idb_key, arr,
                                                //     () => this.emit('file_update', file),
                                                //     () => this.getRemoteFile(file.id, 1, obj));
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
            }
            else{
                this.emit('file_update', file);
            }
        }
        else if (this.uploads.has(file.id)){
            if (file.remote.is_uploading_completed){
                this.uploads.delete(file.id);
                this.emit('file_upload_update', file);
            }
            else{
                this.emit('file_upload_update', file);
            }
        }
    };

    async initDB(){
        /*if (this.store) return;
        if (this.initiatingDB) return;

        this.initiatingDB = true;
        this.store = localForage.createInstance({
            name: '/tdlib'
        });
        this.initiatingDB = false;

        return;*/
        if (this.db) return;
        if (this.initiatingDB) return;

        console.log('[FileStore] start initDB');

        this.initiatingDB = true;
        this.db = await this.openDB();
        this.initiatingDB = false;

        console.log('[FileStore] stop initDB');
    }

    openDB(){
        return new Promise((resolve, reject) =>{
            const request = window.indexedDB.open('/tdlib');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getStore(){
        return this.db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');
    }

    getReadWriteStore(){
        return this.db.transaction(['keyvaluepairs'], 'readwrite').objectStore('keyvaluepairs');
    }

    deleteLocalFile = (store, file) => {
        if (!file.idb_key){
            return;
        }

        delete file.blob;

        this.deleteBlob(file.id);

        const request = store.delete(file.idb_key);
        request.onsuccess = (event) => {
            alert('Local file deleted');
        };
        request.onerror = () => {

        };
    };

    getLocalFile(store, file, idb_key, arr, callback, faultCallback) {
        if (!idb_key){
            faultCallback();
            return;
        }

        if (arr){
            file.blob = new Blob([arr]);
            this.setBlob(file.id, file.blob);
            callback();
            return;
        }

        if (file.blob){
            //callback();
            return;
        }

        const request = store.get(idb_key);
        request.onsuccess = (event) => {
            const blob = event.target.result;

            if (blob){
                file.blob = blob;
                this.setBlob(file.id, file.blob);
                callback();
            }
            else{
                faultCallback();
            }
        };
        request.onerror = () => {
            faultCallback();
        };
    }

    getRemoteFile(fileId, priority, obj){
        if (this.downloads.has(fileId)){
            let items = this.downloads.get(fileId);

            for (let i = 0; i < items.length; i++){
                if (items[i] === obj){
                    return;
                }
            }

            items.push(obj);
        }
        else
        {
            this.downloads.set(fileId, [obj]);
        }

        //console.log('[perf] downloadFile file_id=' + fileId);
        TdLibController.send({ '@type': 'downloadFile', file_id: fileId, priority: priority });
    }

    cancelGetRemoteFile(fileId, obj){
        if (this.downloads.has(fileId)){
            //this.downloads.delete(fileId);
            console.log('cancel_download_message id=' + obj.id);
            TdLibController.send({ '@type': 'cancelDownloadFile', file_id: fileId, only_if_pending: false });
        }
    }

    uploadFile(fileId, obj){
        if (this.uploads.has(fileId)){
            let items = this.uploads.get(fileId);
            items.push(obj);
        }
        else{
            this.uploads.set(fileId, [obj]);
        }

        console.log('[perf] uploadFile file_id=' + fileId);
    }

    cancelUploadFile(fileId, obj){
        if (this.uploads.has(fileId)){
            this.uploads.delete(fileId);
            console.log('cancel_upload_message id=' + obj.id);
            TdLibController.send({ '@type': 'deleteMessages', chat_id: obj.chat_id, message_ids: [obj.id], revoke: true });
        }
    }

    get(fileId){
        return this.items.get(fileId);
    }

    set(file){
        this.items.set(file.id, file);
    }

    getBlob(fileId){
        return this.blobItems.get(fileId);
    }

    setBlob(fileId, blob){
        this.blobItems.set(fileId, blob);
    }

    deleteBlob(fileId){
        this.blobItems.delete(fileId);
    }

    updatePhotoBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdatePhotoBlob', { chatId: chatId, messageId: messageId, fileId: fileId });
    };

    updateStickerBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateStickerBlob', { chatId: chatId, messageId: messageId, fileId: fileId });
    };

    updateDocumentThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateDocumentThumbnailBlob', { chatId: chatId, messageId: messageId, fileId: fileId });
    };

    updateUserPhotoBlob(userId, fileId){
        this.emit('clientUpdatePhotoBlob', { userId: userId, fileId: fileId });
    }

    updateChatPhotoBlob(chatId, fileId){
        this.emit('clientUpdateChatBlob', { chatId: chatId, fileId: fileId });
    }
}

const store = new FileStore();
window.file = store;
export default store;