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

        TdLibController.on('tdlib_update', this.onUpdate);

        this.setMaxListeners(Infinity);
    }

    onUpdate = (update) => {
        switch (update['@type']) {
            case 'updateFile':{
                this.set(update.file);
                if (update.file.arr){
                    //console.log(`updateFile id=${update.file.id} arr`);
                }
                this.emit(update['@type'], update);
                break;
            }
            default:
                break;
        }
    };

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

    updatePhotoBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdatePhotoBlob', { chatId: chatId, messageId: messageId, fileId: fileId });
    };

    updateStickerBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateStickerBlob', { chatId: chatId, messageId: messageId, fileId: fileId });
    };

    updateDocumentThumbnailBlob = (chatId, messageId, fileId) => {
        this.emit('clientUpdateDocumentThumbnailBlob', { chatId: chatId, messageId: messageId, fileId: fileId });
    };
}

const store = new FileStore();
export default store;