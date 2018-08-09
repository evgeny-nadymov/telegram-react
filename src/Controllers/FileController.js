import TdLibController from './TdLibController';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import MessageStore from '../Stores/MessageStore';
import {getPhotoSize} from '../Utils/Common';

class FileController{
    constructor(){
        this.downloads = new Map();

        this.onUpdate = this.onUpdate.bind(this);
        this.onUpdateFile = this.onUpdateFile.bind(this);

        TdLibController.on('tdlib_update', this.onUpdate);
    }

    onUpdate(update) {
        switch (update['@type']) {
            case 'updateFile':
                this.onUpdateFile(update.file);
                break;
            default:
                break;
        }
    }

    onUpdateFile(file) {
        if (!file.idb_key || !file.remote.id) {
            return;
        }
        let idb_key = file.idb_key;

        if (file.local.is_downloading_completed
            && this.downloads.has(file.id)){

            let items = this.downloads.get(file.id);
            if (items){
                this.downloads.delete(file.id);

                let store = this.getStore();

                for (let i = 0; i < items.length; i++){
                    let obj = items[i];
                    switch (obj['@type']){
                        case 'chat':
                            this.getLocalFile(store, obj, idb_key, file.arr,
                                () => ChatStore.updatePhoto(obj.id),
                                () => this.getRemoteFile(file.id, 1));
                            break;
                        case 'user':
                            this.getLocalFile(store, obj, idb_key, file.arr,
                                () => UserStore.updatePhoto(obj.id),
                                () => this.getRemoteFile(file.id, 1));
                            break;
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
                                    let photo = getPhotoSize(obj.content.photo.sizes);
                                    if (photo && photo.photo.id === file.id)
                                    {
                                        this.getLocalFile(store, photo, idb_key, file.arr,
                                            () => MessageStore.updateMessagePhoto(obj.id),
                                            () => { },
                                            'update',
                                            obj.id);
                                    }
                                    break;
                                case 'messageSticker':
                                    this.getLocalFile(store, obj.content.sticker.sticker, idb_key, file.arr,
                                        () => MessageStore.updateMessageSticker(obj.id),
                                        () => this.getRemoteFile(file.id, 1, obj),
                                        'update',
                                        obj.id);
                                    break;
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
    }

    initDB(){
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

        console.log('initDB');

        this.initiatingDB = true;
        let request = window.indexedDB.open('/tdlib');
        request.onerror = function(event) {
            this.initiatingDB = false;
            console.log("error initDB");
            alert(JSON.stringify(event));
        }.bind(this);
        request.onsuccess = function(event) {
            this.db = request.result;

            this.initiatingDB = false;
            console.log("success initDB");
        }.bind(this);
    }

    getStore(){
        return this.db.transaction(['keyvaluepairs'], 'readonly').objectStore('keyvaluepairs');
    }

    getLocalFile(store, obj, idb_key, arr, callback, faultCallback, from, messageId) {
        if (!idb_key){
            faultCallback();
            return;
        }

        //obj.idb_key = idb_key;
        if (arr){
            let t0 = performance.now();
            obj.blob = new Blob([arr]);
            let t1 = performance.now();
            console.log('[perf]' + (from? ' ' + from : '') + ' id=' + messageId + ' blob=' + obj.blob + ' new_time=' + (t1 - t0));

            callback();
            return;
        }

        let t0 = performance.now();
        let getItem = store.get(idb_key);
        getItem.onsuccess = function (event) {
            let blob = event.target.result;
            let t1 = performance.now();
            console.log('[perf]' + (from? ' ' + from : '') + ' id=' + messageId + ' blob=' + blob + ' time=' + (t1 - t0));

            if (blob){
                obj.blob = blob;
                callback();
            }
            else{
                faultCallback();
            }
        };
    }

    getRemoteFile(fileId, priority, obj){
        if (this.downloads.has(fileId)){
            let items = this.downloads.get(fileId);
            items.push(obj);
        }
        else
        {
            this.downloads.set(fileId, [obj]);
        }

        console.log('[perf] downloadFile file_id=' + fileId);
        TdLibController.send({ '@type': 'downloadFile', file_id: fileId, priority: priority });
    }

    cancelGetRemoteFile(fileId, obj){
        if (this.downloads.has(fileId)){
            this.downloads.delete(fileId);
            console.log('cancel_download_message id=' + obj.id);
            TdLibController.send({ '@type': 'cancelDownloadFile', file_id: fileId, only_if_pending: false });
        }
    }
}

const controller = new FileController();

export default controller;