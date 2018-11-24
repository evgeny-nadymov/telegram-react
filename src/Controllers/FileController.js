/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {EventEmitter} from 'events';
import FileStore from '../Stores/FileStore';
import ApplicationStore from '../Stores/ApplicationStore';
import TdLibController from './TdLibController';

class FileController extends EventEmitter{
    constructor(){
        super();

        this.downloads = new Map();
        this.uploads = new Map();

        this.setMaxListeners(Infinity);

        FileStore.on('updateFile', this.onUpdateFile);
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    onUpdateFile = (update) => {
        if (!update) return;

        const {file} = update;
        if (!file) return;

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
                                    this.getLocalFile(store, source, idb_key, file.arr,
                                        () => FileStore.updateChatPhotoBlob(obj.id, file.id),
                                        () => this.getRemoteFile(file.id, 1));
                                }
                                break;
                            }
                            case 'user':{
                                let source = obj.profile_photo.small;
                                if (source && source.id === file.id){
                                    this.getLocalFile(store, source, idb_key, file.arr,
                                        () => FileStore.updateUserPhotoBlob(obj.id, file.id),
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
                                            FileController.getLocalFile(store, preview, idb_key,
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
                                                    this.getLocalFile(store, source, idb_key, file.arr,
                                                        () => FileStore.updatePhotoBlob(obj.chat_id, obj.id, file.id),
                                                        () => { });
                                                }
                                            }
                                        }

                                        break;
                                    case 'messageSticker': {
                                        let source = obj.content.sticker.sticker;
                                        if (source && source.id === file.id){
                                            this.getLocalFile(store, source, idb_key, file.arr,
                                                () => FileStore.updateStickerBlob(obj.chat_id, obj.id, file.id),
                                                () => this.getRemoteFile(file.id, 1, obj));
                                        }
                                        break;
                                    }
                                    case 'messageDocument': {
                                        if (obj.content.document.thumbnail){
                                            let source = obj.content.document.thumbnail.photo;
                                            if (source && source.id === file.id){
                                                this.getLocalFile(store, source, idb_key, file.arr,
                                                    () => FileStore.updateDocumentThumbnailBlob(obj.chat_id, obj.id, file.id),
                                                    () => this.getRemoteFile(file.id, 1, obj));
                                            }
                                        }

                                        if (obj.content.document.document){
                                            let source = obj.content.document.document;
                                            if (source && source.id === file.id){
                                                this.emit('file_update', file);
                                                // this.getLocalFile(store, source, idb_key, file.arr,
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

    onUpdateAuthorizationState = async (update) => {
        if (!update) return;
        if (!update.authorization_state) return;

        if (update.authorization_state['@type'] === 'authorizationStateWaitTdlibParameters'){
            await this.initDB();
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

        console.log('[FileController] start initDB');

        this.initiatingDB = true;
        this.db = await this.openDB();
        this.initiatingDB = false;

        console.log('[FileController] stop initDB');
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
            FileStore.setBlob(file.id, file.blob);
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
                FileStore.setBlob(file.id, file.blob);
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
}

const controller = new FileController();

export default controller;