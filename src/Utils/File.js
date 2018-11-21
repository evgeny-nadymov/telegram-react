/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getPhotoSize, getSize } from './Common';
import { PHOTO_SIZE } from '../Constants';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import MessageStore from '../Stores/MessageStore';
import FileController from '../Controllers/FileController';
import FileStore from '../Stores/FileStore';

function getChatPhoto(chat) {
    if (chat['@type'] !== 'chat') {
        return [0, '', ''];
    }

    return getSmallPhoto(chat.photo);
}

function getUserPhoto(user) {
    if (user['@type'] !== 'user') {
        return [0, '', ''];
    }

    return getSmallPhoto(user.profile_photo);
}

function getSmallPhoto(photo){

    if (photo && photo.small && photo.small.remote){
        return [photo.small.id, photo.small.remote.id, photo.small.idb_key];
    }

    return [0, '', ''];
}

function getStickerFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    if (!message.content || message.content['@type'] !== 'messageSticker'){
        return [0, '', ''];
    }

    if (message.content.sticker) {
        let file = message.content.sticker.sticker;
        if (file && file.remote.id) {
            return [file.id, file.remote.id, file.idb_key];
        }
    }

    return [0, '', ''];
}

function getDocumentThumbnailFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    if (!message.content || message.content['@type'] !== 'messageDocument'){
        return [0, '', ''];
    }

    let document = message.content.document;
    if (!document){
        return [0, '', ''];
    }

    let thumbnail = document.thumbnail;
    if (!thumbnail){
        return [0, '', ''];
    }

    if (thumbnail.photo) {
        let file = thumbnail.photo;
        if (file && file.remote.id) {
            return [file.id, file.remote.id, file.idb_key];
        }
    }

    return [0, '', ''];
}

function getPhotoPreviewFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    if (!message.content || message.content['@type'] !== 'messagePhoto'){
        return [0, '', ''];
    }

    if (message.content.photo) {
        let photoSize = getPreviewPhotoSize(message.content.photo.sizes);
        if (photoSize && photoSize['@type'] === 'photoSize'){
            let file = photoSize.photo;
            if (file && file.remote.id) {
                return [file.id, file.remote.id, file.idb_key];
            }
        }
    }

    return [0, '', ''];
}

function getPhotoFile(message, size = PHOTO_SIZE) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    if (!message.content || message.content['@type'] !== 'messagePhoto'){
        return [0, '', ''];
    }

    if (message.content.photo) {
        let photoSize = getSize(message.content.photo.sizes, size);
        if (photoSize && photoSize['@type'] === 'photoSize'){
            let file = photoSize.photo;
            if (file && file.remote.id) {
                return [file.id, file.remote.id, file.idb_key];
            }
        }
    }

    return [0, '', ''];
}

function getContactFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    if (!message.content || message.content['@type'] !== 'messageContact'){
        return [0, '', ''];
    }

    if (message.content.contact && message.content.contact.user_id > 0) {
        let user = UserStore.get(message.content.contact.user_id);
        if (user){
            return getUserPhoto(user);
        }
    }

    return [0, '', ''];
}

function getPreviewPhotoSize(sizes){
    return sizes.length > 0 ? sizes[0] : null;
}

function saveData(data, filename, mime) {
    var blob = new Blob([data], {type: mime || 'application/octet-stream'});
    if (typeof window.navigator.msSaveBlob !== 'undefined') {
        // IE workaround for "HTML7007: One or more blob URLs were
        // revoked by closing the blob for which they were created.
        // These URLs will no longer resolve as the data backing
        // the URL has been freed."
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        var blobURL = window.URL.createObjectURL(blob);
        var tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        tempLink.href = blobURL;
        tempLink.setAttribute('download', filename);

        // Safari thinks _blank anchor are pop ups. We only want to set _blank
        // target if the browser does not support the HTML5 download attribute.
        // This allows you to download files in desktop safari if pop up blocking
        // is enabled.
        if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank');
        }

        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(blobURL);
    }
}

function saveBlob(blob, filename) {
    if (typeof window.navigator.msSaveBlob !== 'undefined') {
        // IE workaround for "HTML7007: One or more blob URLs were
        // revoked by closing the blob for which they were created.
        // These URLs will no longer resolve as the data backing
        // the URL has been freed."
        window.navigator.msSaveBlob(blob, filename);
    }
    else {
        var blobURL = window.URL.createObjectURL(blob);
        var tempLink = document.createElement('a');
        tempLink.style.display = 'none';
        tempLink.href = blobURL;
        tempLink.setAttribute('download', filename);

        // Safari thinks _blank anchor are pop ups. We only want to set _blank
        // target if the browser does not support the HTML5 download attribute.
        // This allows you to download files in desktop safari if pop up blocking
        // is enabled.
        if (typeof tempLink.download === 'undefined') {
            tempLink.setAttribute('target', '_blank');
        }

        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);
        window.URL.revokeObjectURL(blobURL);
    }
}

function loadUserPhotos(store, userIds) {
    if (!userIds) return;
    if (!userIds.length) return;

    for (let i = 0; i < userIds.length; i++) {
        let user = UserStore.get(userIds[i]);
        if (user){
            let [id, pid, idb_key] = getUserPhoto(user);
            if (pid) {
                FileController.getLocalFile(store, user.profile_photo.small, idb_key, null,
                    () => FileStore.updateUserPhotoBlob(user.id, id),
                    () => FileController.getRemoteFile(id, 1, user));
            }
        }
    }
}

function loadChatPhotos(store, chatIds) {
    if (!chatIds) return;
    if (!chatIds.length) return;

    for (let i = 0; i < chatIds.length; i++){
        let chat = ChatStore.get(chatIds[i]);
        let [id, pid, idb_key] = getChatPhoto(chat);
        if (pid) {
            FileController.getLocalFile(store, chat.photo.small, idb_key, null,
                () => FileStore.updateChatPhotoBlob(chat.id, id),
                () => FileController.getRemoteFile(id, 1, chat));
        }
    }
}


function loadMessageContents(store, messages){

    let users = new Map();
    for (let i = messages.length - 1; i >= 0; i--) {
        let message = messages[i];
        if (message) {
            if (message.sender_user_id){
                users.set(message.sender_user_id, message.sender_user_id);
            }

            if (message.content){
                switch (message.content['@type']) {
                    case 'messagePhoto': {

                        // preview
                        /*let [previewId, previewPid, previewIdbKey] = getPhotoPreviewFile(message);
                        if (previewPid) {
                            let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                            if (!preview.blob){
                                FileController.getLocalFile(store, preview, previewIdbKey, null,
                                    () => MessageStore.updateMessagePhoto(message.id),
                                    () => { if (loadRemote)  FileController.getRemoteFile(previewId, 2, message); },
                                    'load_contents_preview_',
                                    message.id);

                            }
                        }*/

                        const [id, pid, idb_key] = getPhotoFile(message);
                        if (pid) {
                            const photoSize = getPhotoSize(message.content.photo.sizes);
                            if (photoSize){
                                let obj = photoSize.photo;
                                if (!obj.blob){
                                    let localMessage = message;
                                    FileController.getLocalFile(store, obj, idb_key, null,
                                        () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, id),
                                        () => FileController.getRemoteFile(id, 1, localMessage));
                                }
                            }
                        }
                        break;
                    }
                    case 'messageSticker': {
                        const [id, pid, idb_key] = getStickerFile(message);
                        if (pid) {
                            const obj = message.content.sticker.sticker;
                            if (!obj.blob){
                                let localMessage = message;
                                FileController.getLocalFile(store, obj, idb_key, null,
                                    () => FileStore.updateStickerBlob(localMessage.chat_id, localMessage.id, id),
                                    () => FileController.getRemoteFile(id, 1, localMessage));
                            }
                        }
                        break;
                    }
                    case 'messageContact':{
                        let contact = message.content.contact;
                        if (contact && contact.user_id > 0){
                            let user = UserStore.get(contact.user_id);
                            if (user){
                                let [id, pid, idb_key] = getContactFile(message);
                                if (pid) {
                                    let obj = user.profile_photo.small;
                                    if (!obj.blob){
                                        FileController.getLocalFile(store, obj, idb_key, null,
                                            () => FileStore.updateUserPhotoBlob(user.id, id),
                                            () => FileController.getRemoteFile(id, 1, user));
                                    }
                                }
                            }
                        }
                        break;
                    }
                    case 'messageDocument': {
                        const [id, pid, idb_key] = getDocumentThumbnailFile(message);
                        if (pid) {
                            const obj = message.content.document.thumbnail.photo;
                            if (!obj.blob){
                                const localMessage = message;
                                FileController.getLocalFile(store, obj, idb_key, null,
                                    () => FileStore.updateDocumentThumbnailBlob(localMessage.chat_id, localMessage.id, obj.id),
                                    () => FileController.getRemoteFile(id, 1, localMessage));
                            }
                        }
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
        }
    }

    loadUserPhotos(store, [...users.keys()]);
}

function saveOrDownload(file, fileName, message){
    if (!file) return;
    if (!fileName) return;

    if (file.arr) {
        saveData(file.arr, fileName);
        return;
    }

    if (file.blob){
        saveBlob(file.blob, fileName);
        return;
    }

    if (file.idb_key){
        let store = FileController.getStore();

        FileController.getLocalFile(store, file, file.idb_key, null,
            () => {
                if (file.blob){
                    saveBlob(file.blob, fileName);
                }
            },
            () => {
                if (file.local.can_be_downloaded){
                    FileController.getRemoteFile(file.id, 1, message);
                }
            });
        return;
    }

    if (file.local.can_be_downloaded){
        FileController.getRemoteFile(file.id, 1, message);
    }
}



function getMediaFile(chatId, messageId, size){
    if (!size) return null;
    const message = MessageStore.get(chatId, messageId);
    if (!message) return null;

    const { content } = message;
    if (!content) return null;

    switch (content['@type']) {
        case 'messagePhoto': {
            const { photo } = content;
            if (photo){
                const photoSize = getSize(photo.sizes, size);
                if (photoSize){
                    return [photoSize.width, photoSize.height, photoSize.photo];
                }
            }
        }
    }

    return null;
}

export {
    getUserPhoto,
    getChatPhoto,
    getContactFile,
    getStickerFile,
    getPhotoFile,
    getPhotoPreviewFile,
    getDocumentThumbnailFile,
    saveData,
    saveBlob,
    loadUserPhotos,
    loadChatPhotos,
    loadMessageContents,
    saveOrDownload,
    getMediaFile
};