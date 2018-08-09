import {getPhotoSize} from "./Common";
import UserStore from "../Stores/UserStore";

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

function getPhotoFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    if (!message.content || message.content['@type'] !== 'messagePhoto'){
        return [0, '', ''];
    }

    if (message.content.photo) {
        let photoSize = getPhotoSize(message.content.photo.sizes);
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

export { getUserPhoto, getChatPhoto, getContactFile, getStickerFile, getPhotoFile, getPhotoPreviewFile };