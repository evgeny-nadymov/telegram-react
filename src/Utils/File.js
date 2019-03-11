/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getPhotoSize, getSize } from './Common';
import { getChatUserId } from './Chat';
import { getProfilePhotoFromPhoto } from './User';
import { getLocationId, getVenueId } from './Message';
import {
    LOCATION_HEIGHT,
    LOCATION_SCALE,
    LOCATION_WIDTH,
    LOCATION_ZOOM,
    PHOTO_BIG_SIZE,
    PHOTO_SIZE,
    PRELOAD_ANIMATION_SIZE,
    PRELOAD_VIDEO_SIZE,
    PRELOAD_VIDEONOTE_SIZE,
    THUMBNAIL_PRIORITY
} from '../Constants';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import MessageStore from '../Stores/MessageStore';
import FileStore from '../Stores/FileStore';
import TdLibController from '../Controllers/TdLibController';

function getSizeString(size) {
    if (!size) return `0 B`;

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
        return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }

    return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getFileSize(file) {
    if (!file) return null;

    let size = file.size;
    if (!size) return null;

    return getSizeString(size);
}

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

function getSmallPhoto(photo) {
    if (photo && photo.small && photo.small.remote) {
        return [photo.small.id, photo.small.remote.id, photo.small.idb_key];
    }

    return [0, '', ''];
}

function getBigPhoto(photo) {
    if (photo && photo.big && photo.big.remote) {
        return [photo.big.id, photo.big.remote.id, photo.big.idb_key];
    }

    return [0, '', ''];
}

function getStickerFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageSticker') {
        return [0, '', ''];
    }

    const { sticker } = content;
    if (!sticker) {
        return [0, '', ''];
    }

    const file = sticker.sticker;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getGameAnimationThumbnailFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageGame') {
        return [0, '', ''];
    }

    const { game } = content;
    if (!game) {
        return [0, '', ''];
    }

    const { animation } = game;
    if (!animation) {
        return [0, '', ''];
    }

    const { thumbnail } = animation;
    if (!thumbnail) {
        return [0, '', ''];
    }

    const file = thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageAnimationThumbnailFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageText') {
        return [0, '', ''];
    }

    const { web_page } = content;
    if (!web_page) {
        return [0, '', ''];
    }

    const { animation } = web_page;
    if (!animation) {
        return [0, '', ''];
    }

    const { thumbnail } = animation;
    if (!thumbnail) {
        return [0, '', ''];
    }

    const file = thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getVideoNoteThumbnailFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageVideoNote') {
        return [0, '', ''];
    }

    const { video_note } = content;
    if (!video_note) {
        return [0, '', ''];
    }

    const { thumbnail } = video_note;
    if (!thumbnail) {
        return [0, '', ''];
    }

    const file = thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getAnimationThumbnailFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageAnimation') {
        return [0, '', ''];
    }

    const { animation } = content;
    if (!animation) {
        return [0, '', ''];
    }

    const { thumbnail } = animation;
    if (!thumbnail) {
        return [0, '', ''];
    }

    const file = thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getVideoThumbnailFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageVideo') {
        return [0, '', ''];
    }

    const { video } = content;
    if (!video) {
        return [0, '', ''];
    }

    const { thumbnail } = video;
    if (!thumbnail) {
        return [0, '', ''];
    }

    const file = thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getDocumentThumbnailFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageDocument') {
        return [0, '', ''];
    }

    const { document } = content;
    if (!document) {
        return [0, '', ''];
    }

    const { thumbnail } = document;
    if (!thumbnail) {
        return [0, '', ''];
    }

    const file = thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getPhotoPreviewFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messagePhoto') {
        return [0, '', ''];
    }

    const { photo } = content;
    if (!photo) {
        return [0, '', ''];
    }

    const photoSize = getPreviewPhotoSize(photo.sizes);
    if (!photoSize || photoSize['@type'] !== 'photoSize') {
        return [0, '', ''];
    }

    const file = photoSize.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getGamePhotoFile(message, size = PHOTO_SIZE) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageGame') {
        return [0, '', ''];
    }

    const { game } = content;
    if (!game) {
        return [0, '', ''];
    }

    const { photo } = game;
    if (!photo) {
        return [0, '', ''];
    }

    const photoSize = getSize(photo.sizes, size);
    if (!photoSize || photoSize['@type'] !== 'photoSize') {
        return [0, '', ''];
    }

    const file = photoSize.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getGameAnimationFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageGame') {
        return [0, '', ''];
    }

    const { game } = content;
    if (!game) {
        return [0, '', ''];
    }

    const { animation } = game;
    if (!animation) {
        return [0, '', ''];
    }

    const file = animation.animation;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getGameAnimationFileSize(message) {
    if (message['@type'] !== 'message') {
        return 0;
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageGame') {
        return 0;
    }

    const { game } = content;
    if (!game) {
        return 0;
    }

    const file = game.animation;
    if (file) {
        return file.size;
    }

    return 0;
}

function getWebPagePhotoFile(message, size = PHOTO_SIZE) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageText') {
        return [0, '', ''];
    }

    const { web_page } = content;
    if (!web_page) {
        return [0, '', ''];
    }

    const { photo } = web_page;
    if (!photo) {
        return [0, '', ''];
    }

    const photoSize = getSize(photo.sizes, size);
    if (!photoSize || photoSize['@type'] !== 'photoSize') {
        return [0, '', ''];
    }

    const file = photoSize.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageAnimationFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageText') {
        return [0, '', ''];
    }

    const { web_page } = content;
    if (!web_page) {
        return [0, '', ''];
    }

    const { animation } = web_page;
    if (!animation) {
        return [0, '', ''];
    }

    const file = animation.animation;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageAnimationFileSize(message) {
    if (message['@type'] !== 'message') {
        return 0;
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageText') {
        return 0;
    }

    const { web_page } = content;
    if (!web_page) {
        return 0;
    }

    const file = web_page.animation;
    if (file) {
        return file.size;
    }

    return 0;
}

function getPhotoFile(message, size = PHOTO_SIZE) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messagePhoto') {
        return [0, '', ''];
    }

    const { photo } = content;
    if (!photo) {
        return [0, '', ''];
    }

    const photoSize = getSize(content.photo.sizes, size);
    if (!photoSize || photoSize['@type'] !== 'photoSize') {
        return [0, '', ''];
    }

    const file = photoSize.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getVideoNoteFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageVideoNote') {
        return [0, '', ''];
    }

    const { video_note } = content;
    if (!video_note) {
        return [0, '', ''];
    }

    const file = video_note.video;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getVideoNoteFileSize(message) {
    if (message['@type'] !== 'message') {
        return 0;
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageVideoNote') {
        return 0;
    }

    const { video_note } = content;
    if (!video_note) {
        return 0;
    }

    const file = video_note.video;
    if (file) {
        return file.size;
    }

    return 0;
}

function getAnimationFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageAnimation') {
        return [0, '', ''];
    }

    const { animation } = content;
    if (!animation) {
        return [0, '', ''];
    }

    const file = animation.animation;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getAnimationFileSize(message) {
    if (message['@type'] !== 'message') {
        return 0;
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageAnimation') {
        return 0;
    }

    const { animation } = content;
    if (!animation) {
        return 0;
    }

    const file = animation.animation;
    if (file) {
        return file.size;
    }

    return 0;
}

function getVideoFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageVideo') {
        return [0, '', ''];
    }

    const { video } = content;
    if (!video) {
        return [0, '', ''];
    }

    const file = video.video;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getVideoFileSize(message) {
    if (message['@type'] !== 'message') {
        return 0;
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageVideo') {
        return 0;
    }

    const { video } = content;
    if (!video) {
        return 0;
    }

    const file = video.video;
    if (file) {
        return file.size;
    }

    return 0;
}

function getContactFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageContact') {
        return [0, '', ''];
    }

    const { contact } = content;
    if (!contact || contact.user_id <= 0) {
        return [0, '', ''];
    }

    const user = UserStore.get(contact.user_id);
    if (user) {
        return getUserPhoto(user);
    }

    return [0, '', ''];
}

function getPreviewPhotoSize(sizes) {
    return sizes.length > 0 ? sizes[0] : null;
}

function saveData(data, filename, mime) {
    var blob = new Blob([data], { type: mime || 'application/octet-stream' });
    if (typeof window.navigator.msSaveBlob !== 'undefined') {
        // IE workaround for "HTML7007: One or more blob URLs were
        // revoked by closing the blob for which they were created.
        // These URLs will no longer resolve as the data backing
        // the URL has been freed."
        window.navigator.msSaveBlob(blob, filename);
    } else {
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
    } else {
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
        if (user) {
            let [id, pid, idb_key] = getUserPhoto(user);
            if (pid) {
                const blob = FileStore.getBlob(id);
                if (!blob) {
                    FileStore.getLocalFile(
                        store,
                        user.profile_photo.small,
                        idb_key,
                        null,
                        () => FileStore.updateUserPhotoBlob(user.id, id),
                        () => FileStore.getRemoteFile(id, 1, user)
                    );
                }
            }
        }
    }
}

function loadUsersContent(store, userIds) {
    if (!userIds) return;
    if (!userIds.length) return;

    for (let i = 0; i < userIds.length; i++) {
        const user = UserStore.get(userIds[i]);
        const [id, pid, idb_key] = getUserPhoto(user);
        if (pid) {
            FileStore.getLocalFile(
                store,
                user.profile_photo.small,
                idb_key,
                null,
                () => FileStore.updateUserPhotoBlob(user.id, id),
                () => FileStore.getRemoteFile(id, 1, user)
            );
        }
    }
}

function loadChatsContent(store, chatIds) {
    if (!chatIds) return;
    if (!chatIds.length) return;

    for (let i = 0; i < chatIds.length; i++) {
        const chat = ChatStore.get(chatIds[i]);
        if (!chat) continue;

        const [id, pid, idb_key] = getChatPhoto(chat);
        if (pid) {
            FileStore.getLocalFile(
                store,
                chat.photo.small,
                idb_key,
                null,
                () => FileStore.updateChatPhotoBlob(chat.id, id),
                () => FileStore.getRemoteFile(id, 1, chat)
            );
        }
    }
}

function loadMessageContents(store, messages) {
    let users = new Map();
    for (let i = messages.length - 1; i >= 0; i--) {
        let message = messages[i];
        if (message) {
            if (message.sender_user_id) {
                users.set(message.sender_user_id, message.sender_user_id);
            }

            if (message.content) {
                switch (message.content['@type']) {
                    case 'messageGame': {
                        const { game } = message.content;
                        if (!game) {
                            break;
                        }

                        const { photo, animation } = game;
                        const loadPhoto = !animation || !animation.thumbnail;
                        if (loadPhoto) {
                            const [id, pid, idb_key] = getGamePhotoFile(message);
                            if (pid) {
                                const photoSize = getPhotoSize(photo.sizes);
                                if (photoSize) {
                                    const file = photoSize.photo;
                                    const blob = FileStore.getBlob(file.id);
                                    if (!blob) {
                                        let localMessage = message;
                                        FileStore.getLocalFile(
                                            store,
                                            file,
                                            idb_key,
                                            null,
                                            () => FileStore.updateGameBlob(localMessage.chat_id, localMessage.id, id),
                                            () => FileStore.getRemoteFile(id, 1, localMessage)
                                        );
                                    }
                                }
                            }
                        }

                        const [id, pid, idb_key] = getGameAnimationFile(message);
                        if (pid) {
                            const obj = message.content.game.animation.animation;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    idb_key,
                                    null,
                                    () => FileStore.updateAnimationBlob(localMessage.chat_id, localMessage.id, obj.id),
                                    () => {
                                        const fileSize = getGameAnimationFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_ANIMATION_SIZE) {
                                            FileStore.getRemoteFile(id, 1, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getGameAnimationThumbnailFile(message);
                        if (previewPid) {
                            const obj = animation.thumbnail.photo;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateAnimationThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            obj.id
                                        ),
                                    () => FileStore.getRemoteFile(previewId, 1, localMessage)
                                );
                            }
                        }
                        break;
                    }
                    case 'messageText': {
                        const { web_page } = message.content;
                        if (!web_page) {
                            break;
                        }

                        const { photo, animation } = web_page;
                        const loadPhoto = !animation || !animation.thumbnail;

                        if (loadPhoto) {
                            const [id, pid, idb_key] = getWebPagePhotoFile(message);
                            if (pid) {
                                const photoSize = getPhotoSize(photo.sizes);
                                if (photoSize) {
                                    const file = photoSize.photo;
                                    const blob = FileStore.getBlob(file.id);
                                    if (!blob) {
                                        let localMessage = message;
                                        FileStore.getLocalFile(
                                            store,
                                            file,
                                            idb_key,
                                            null,
                                            () =>
                                                FileStore.updateWebPageBlob(localMessage.chat_id, localMessage.id, id),
                                            () => FileStore.getRemoteFile(id, 1, localMessage)
                                        );
                                    }
                                }
                            }
                        }

                        const [id, pid, idb_key] = getWebPageAnimationFile(message);
                        if (pid) {
                            const obj = animation.animation;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    idb_key,
                                    null,
                                    () => FileStore.updateAnimationBlob(localMessage.chat_id, localMessage.id, obj.id),
                                    () => {
                                        const fileSize = getWebPageAnimationFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_ANIMATION_SIZE) {
                                            FileStore.getRemoteFile(id, 1, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getWebPageAnimationThumbnailFile(message);
                        if (previewPid) {
                            const obj = animation.thumbnail.photo;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateAnimationThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            obj.id
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                        break;
                    }
                    case 'messagePhoto': {
                        // preview
                        /*let [previewId, previewPid, previewIdbKey] = getPhotoPreviewFile(message);
                                                if (previewPid) {
                                                    let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                                                    if (!preview.blob){
                                                        FileStore.getLocalFile(store, preview, previewIdbKey, null,
                                                            () => MessageStore.updateMessagePhoto(message.id),
                                                            () => { if (loadRemote)  FileStore.getRemoteFile(previewId, 2, message); },
                                                            'load_contents_preview_',
                                                            message.id);

                                                    }
                                                }*/

                        const [id, pid, idb_key] = getPhotoFile(message);
                        if (pid) {
                            const photoSize = getPhotoSize(message.content.photo.sizes);
                            if (photoSize) {
                                const file = photoSize.photo;
                                const blob = FileStore.getBlob(file.id);
                                if (!blob) {
                                    let localMessage = message;
                                    FileStore.getLocalFile(
                                        store,
                                        file,
                                        idb_key,
                                        null,
                                        () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, id),
                                        () => FileStore.getRemoteFile(id, 1, localMessage)
                                    );
                                }
                            }
                        }
                        break;
                    }
                    case 'messageSticker': {
                        const [id, pid, idb_key] = getStickerFile(message);
                        if (pid) {
                            const file = message.content.sticker.sticker;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                let localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updateStickerBlob(localMessage.chat_id, localMessage.id, id),
                                    () => FileStore.getRemoteFile(id, 1, localMessage)
                                );
                            }
                        }
                        break;
                    }
                    case 'messageContact': {
                        let contact = message.content.contact;
                        if (contact && contact.user_id > 0) {
                            let user = UserStore.get(contact.user_id);
                            if (user) {
                                let [id, pid, idb_key] = getContactFile(message);
                                if (pid) {
                                    let obj = user.profile_photo.small;
                                    if (!obj.blob) {
                                        FileStore.getLocalFile(
                                            store,
                                            obj,
                                            idb_key,
                                            null,
                                            () => FileStore.updateUserPhotoBlob(user.id, id),
                                            () => FileStore.getRemoteFile(id, 1, user)
                                        );
                                    }
                                }
                            }
                        }
                        break;
                    }
                    case 'messageVideoNote': {
                        const [id, pid, idb_key] = getVideoNoteFile(message);
                        if (pid) {
                            const obj = message.content.video_note.video;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    idb_key,
                                    null,
                                    () => FileStore.updateVideoNoteBlob(localMessage.chat_id, localMessage.id, obj.id),
                                    () => {
                                        const fileSize = getVideoNoteFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_VIDEONOTE_SIZE) {
                                            FileStore.getRemoteFile(id, 1, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getVideoNoteThumbnailFile(message);
                        if (previewPid) {
                            const obj = message.content.video_note.thumbnail.photo;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateVideoNoteThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            obj.id
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                        break;
                    }
                    case 'messageAnimation': {
                        const [id, pid, idb_key] = getAnimationFile(message);
                        if (pid) {
                            const obj = message.content.animation.animation;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    idb_key,
                                    null,
                                    () => FileStore.updateAnimationBlob(localMessage.chat_id, localMessage.id, obj.id),
                                    () => {
                                        const fileSize = getAnimationFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_ANIMATION_SIZE) {
                                            FileStore.getRemoteFile(id, 1, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getAnimationThumbnailFile(message);
                        if (previewPid) {
                            const obj = message.content.animation.thumbnail.photo;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateAnimationThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            obj.id
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                        break;
                    }
                    case 'messageVideo': {
                        const [id, pid, idb_key] = getVideoThumbnailFile(message);
                        if (pid) {
                            const obj = message.content.video.thumbnail.photo;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    idb_key,
                                    null,
                                    () =>
                                        FileStore.updateVideoThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            obj.id
                                        ),
                                    () => FileStore.getRemoteFile(id, 1, localMessage)
                                );
                            }
                        }
                        break;
                    }
                    case 'messageDocument': {
                        const [id, pid, idb_key] = getDocumentThumbnailFile(message);
                        if (pid) {
                            const obj = message.content.document.thumbnail.photo;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    idb_key,
                                    null,
                                    () =>
                                        FileStore.updateDocumentThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            obj.id
                                        ),
                                    () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                        break;
                    }
                    case 'messageLocation': {
                        const { location } = message.content;
                        const locationId = getLocationId(location);
                        if (locationId) {
                            const file = FileStore.getLocationFile(locationId);
                            if (file) {
                                const blob = FileStore.getBlob(file.id);
                                if (!blob) {
                                    const localMessage = message;
                                    FileStore.getLocalFile(
                                        store,
                                        file,
                                        file.idb_key,
                                        null,
                                        () =>
                                            FileStore.updateLocationBlob(
                                                localMessage.chat_id,
                                                localMessage.id,
                                                file.id
                                            ),
                                        () => FileStore.getRemoteFile(file.id, 1, localMessage)
                                    );
                                }
                            } else {
                                const localMessage = message;
                                TdLibController.send({
                                    '@type': 'getMapThumbnailFile',
                                    location: location,
                                    zoom: LOCATION_ZOOM,
                                    width: LOCATION_WIDTH,
                                    height: LOCATION_HEIGHT,
                                    scale: LOCATION_SCALE,
                                    chat_id: message.chat_id
                                }).then(result => {
                                    FileStore.setLocationFile(locationId, result);

                                    if (result) {
                                        const blob = FileStore.getBlob(result.id);
                                        if (!blob) {
                                            store = FileStore.getStore();

                                            FileStore.getLocalFile(
                                                store,
                                                result,
                                                result.idb_key,
                                                null,
                                                () =>
                                                    FileStore.updateLocationBlob(
                                                        localMessage.chat_id,
                                                        localMessage.id,
                                                        result.id
                                                    ),
                                                () => FileStore.getRemoteFile(result.id, 1, localMessage)
                                            );
                                        }
                                    }
                                });
                            }
                        }
                        break;
                    }
                    case 'messageVenue': {
                        const { venue } = message.content;
                        const { location } = venue;
                        const locationId = getVenueId(location);
                        if (locationId) {
                            const file = FileStore.getLocationFile(locationId);
                            if (file) {
                                const blob = FileStore.getBlob(file.id);
                                if (!blob) {
                                    const localMessage = message;
                                    FileStore.getLocalFile(
                                        store,
                                        file,
                                        file.idb_key,
                                        null,
                                        () =>
                                            FileStore.updateLocationBlob(
                                                localMessage.chat_id,
                                                localMessage.id,
                                                file.id
                                            ),
                                        () => FileStore.getRemoteFile(file.id, 1, localMessage)
                                    );
                                }
                            } else {
                                const localMessage = message;
                                TdLibController.send({
                                    '@type': 'getMapThumbnailFile',
                                    location: location,
                                    zoom: LOCATION_ZOOM,
                                    width: LOCATION_WIDTH,
                                    height: LOCATION_HEIGHT,
                                    scale: LOCATION_SCALE,
                                    chat_id: message.chat_id
                                }).then(result => {
                                    FileStore.setLocationFile(locationId, result);

                                    if (result) {
                                        const blob = FileStore.getBlob(result.id);
                                        if (!blob) {
                                            store = FileStore.getStore();

                                            FileStore.getLocalFile(
                                                store,
                                                result,
                                                result.idb_key,
                                                null,
                                                () =>
                                                    FileStore.updateLocationBlob(
                                                        localMessage.chat_id,
                                                        localMessage.id,
                                                        result.id
                                                    ),
                                                () => FileStore.getRemoteFile(result.id, 1, localMessage)
                                            );
                                        }
                                    }
                                });
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

function saveOrDownload(file, fileName, obj) {
    if (!file) return;
    if (!fileName) return;

    if (file.arr) {
        saveData(file.arr, fileName);
        return;
    }

    if (file.blob) {
        saveBlob(file.blob, fileName);
        return;
    }

    const blob = FileStore.getBlob(file.id);
    if (blob) {
        saveBlob(blob, fileName);
        return;
    }

    if (file.idb_key) {
        let store = FileStore.getStore();

        FileStore.getLocalFile(
            store,
            file,
            file.idb_key,
            null,
            () => {
                if (file.blob) {
                    saveBlob(file.blob, fileName);
                }
            },
            () => {
                if (file.local.can_be_downloaded) {
                    FileStore.getRemoteFile(file.id, 1, obj);
                }
            }
        );
        return;
    }

    if (file.local.can_be_downloaded) {
        FileStore.getRemoteFile(file.id, 1, obj);
    }
}

function download(file, obj) {
    if (file.idb_key) {
        let store = FileStore.getStore();

        FileStore.getLocalFile(
            store,
            file,
            file.idb_key,
            null,
            () => {},
            () => {
                if (file.local.can_be_downloaded) {
                    FileStore.getRemoteFile(file.id, 1, obj);
                }
            }
        );
        return;
    }

    if (file.local.can_be_downloaded) {
        FileStore.getRemoteFile(file.id, 1, obj);
    }
}

function getMediaPreviewFile(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return [0, 0, null];

    const { content } = message;
    if (!content) return [0, 0, null];

    switch (content['@type']) {
        case 'messagePhoto': {
            return getMediaFile(chatId, messageId, PHOTO_SIZE);
        }
        case 'messageVideo': {
            const { video } = content;
            if (video.thumbnail) {
                return [video.thumbnail.width, video.thumbnail.height, video.thumbnail.photo];
            }
            break;
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { animation, video, photo } = web_page;
                if (animation && animation.thumbnail) {
                    return [animation.thumbnail.width, animation.thumbnail.height, animation.thumbnail.photo];
                }
                if (video && video.thumbnail) {
                    return [video.thumbnail.width, video.thumbnail.height, video.thumbnail.photo];
                }
                if (photo) {
                    return getMediaFile(chatId, messageId, PHOTO_SIZE);
                }
            }
            break;
        }
        case 'messageAnimation': {
            const { animation } = content;
            if (animation && animation.thumbnail) {
                return [animation.thumbnail.width, animation.thumbnail.height, animation.thumbnail.photo];
            }
            break;
        }
        default: {
            return [0, 0, null];
        }
    }

    return [0, 0, null];
}

function getMediaFile(chatId, messageId, size) {
    if (!size) return [0, 0, null];
    const message = MessageStore.get(chatId, messageId);
    if (!message) return [0, 0, null];

    const { content } = message;
    if (!content) return [0, 0, null];

    switch (content['@type']) {
        case 'messagePhoto': {
            const { photo } = content;
            if (photo) {
                const photoSize = getSize(photo.sizes, size);
                if (photoSize) {
                    return [photoSize.width, photoSize.height, photoSize.photo];
                }
            }
            break;
        }
        case 'messageVideo': {
            const { video } = content;
            if (video) {
                return [video.width, video.height, video.video];
            }
            break;
        }
        case 'messageAnimation': {
            const { animation } = content;
            if (animation) {
                return [animation.width, animation.height, animation.animation];
            }
            break;
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { animation, video, photo } = web_page;
                if (animation) {
                    return [animation.width, animation.height, animation.animation];
                }
                if (video) {
                    return [video.width, video.height, video.video];
                }
                if (photo) {
                    const photoSize = getSize(photo.sizes, size);
                    if (photoSize) {
                        return [photoSize.width, photoSize.height, photoSize.photo];
                    }
                    break;
                }
            }
            break;
        }
        default: {
        }
    }

    return [0, 0, null];
}

function cancelLoadMediaViewerContent(messages) {
    if (!messages) return;
    if (!messages.length) return;

    for (let i = 0; i < messages.length; i++) {
        let message = messages[i];
        const { content } = message;
        if (content) {
            switch (content['@type']) {
                case 'messagePhoto': {
                    // preview
                    /*let [previewId, previewPid, previewIdbKey] = getPhotoPreviewFile(message);
                                        if (previewPid) {
                                            let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                                            if (!preview.blob){
                                                FileStore.getLocalFile(store, preview, previewIdbKey, null,
                                                    () => MessageStore.updateMessagePhoto(message.id),
                                                    () => { if (loadRemote)  FileStore.getRemoteFile(previewId, 2, message); },
                                                    'load_contents_preview_',
                                                    message.id);

                                            }
                                        }*/

                    const [id, pid, idb_key] = getPhotoFile(message, PHOTO_BIG_SIZE);
                    if (pid) {
                        const photoSize = getSize(content.photo.sizes, PHOTO_BIG_SIZE);
                        if (photoSize) {
                            const file = photoSize.photo;
                            const blob = file.blob || FileStore.getBlob(file.id);
                            if (!blob) {
                                TdLibController.send({
                                    '@type': 'cancelDownloadFile',
                                    file_id: file.id,
                                    only_if_pending: false
                                });
                            }
                        }
                    }

                    break;
                }
                case 'messageVideo': {
                    // preview
                    const [previewId, previewPid, previewIdbKey] = getVideoThumbnailFile(message);
                    if (previewPid) {
                        const file = message.content.video.thumbnail.photo;
                        const blob = file.blob || FileStore.getBlob(file.id);
                        if (!blob) {
                            TdLibController.send({
                                '@type': 'cancelDownloadFile',
                                file_id: file.id,
                                only_if_pending: false
                            });
                        }
                    }

                    // video
                    const [id, pid, idb_key] = getVideoFile(message);
                    if (pid) {
                        const file = message.content.video.video;
                        const blob = file.blob || FileStore.getBlob(file.id);
                        if (!blob) {
                            TdLibController.send({
                                '@type': 'cancelDownloadFile',
                                file_id: file.id,
                                only_if_pending: false
                            });
                        }
                    }

                    break;
                }
            }
        }
    }
}

function loadMediaViewerContent(messages, useSizeLimit = false) {
    //console.log('loadMediaViewerContent userSizeLimit=' + useSizeLimit, messages.map(x => x.id));

    if (!messages) return;
    if (!messages.length) return;

    const store = FileStore.getStore();

    for (let i = 0; i < messages.length; i++) {
        let message = messages[i];
        const { content } = message;
        if (content) {
            switch (content['@type']) {
                case 'messageText': {
                    const { web_page } = message.content;
                    if (!web_page) {
                        break;
                    }

                    const { photo, animation } = web_page;
                    const loadPhoto = !animation || !animation.thumbnail;

                    if (loadPhoto) {
                        const [id, pid, idb_key] = getWebPagePhotoFile(message, PHOTO_BIG_SIZE);
                        if (pid) {
                            const photoSize = getSize(photo.sizes, PHOTO_BIG_SIZE);
                            if (photoSize) {
                                const file = photoSize.photo;
                                const blob = FileStore.getBlob(file.id);
                                if (!blob) {
                                    let localMessage = message;
                                    FileStore.getLocalFile(
                                        store,
                                        file,
                                        idb_key,
                                        null,
                                        () => FileStore.updateWebPageBlob(localMessage.chat_id, localMessage.id, id),
                                        () => FileStore.getRemoteFile(id, 1, localMessage)
                                    );
                                }
                            }
                        }
                    }

                    const [id, pid, idb_key] = getWebPageAnimationFile(message);
                    if (pid) {
                        const obj = animation.animation;
                        if (!obj.blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                obj,
                                idb_key,
                                null,
                                () => FileStore.updateAnimationBlob(localMessage.chat_id, localMessage.id, obj.id),
                                () => {
                                    const fileSize = getWebPageAnimationFileSize(message);
                                    if (fileSize && fileSize < PRELOAD_ANIMATION_SIZE) {
                                        FileStore.getRemoteFile(id, 1, localMessage);
                                    }
                                }
                            );
                        }
                    }

                    const [previewId, previewPid, previewIdbKey] = getWebPageAnimationThumbnailFile(message);
                    if (previewPid) {
                        const obj = animation.thumbnail.photo;
                        if (!obj.blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                obj,
                                previewIdbKey,
                                null,
                                () =>
                                    FileStore.updateAnimationThumbnailBlob(
                                        localMessage.chat_id,
                                        localMessage.id,
                                        obj.id
                                    ),
                                () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                            );
                        }
                    }

                    break;
                }
                case 'messagePhoto': {
                    // preview
                    /*let [previewId, previewPid, previewIdbKey] = getPhotoPreviewFile(message);
                                        if (previewPid) {
                                            let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                                            if (!preview.blob){
                                                FileStore.getLocalFile(store, preview, previewIdbKey, null,
                                                    () => MessageStore.updateMessagePhoto(message.id),
                                                    () => { if (loadRemote)  FileStore.getRemoteFile(previewId, 2, message); },
                                                    'load_contents_preview_',
                                                    message.id);

                                            }
                                        }*/

                    const [id, pid, idb_key] = getPhotoFile(message, PHOTO_BIG_SIZE);
                    if (pid) {
                        const photoSize = getSize(content.photo.sizes, PHOTO_BIG_SIZE);
                        if (photoSize) {
                            let file = photoSize.photo;
                            let blob = file.blob || FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, file.id),
                                    () => FileStore.getRemoteFile(id, 1, localMessage)
                                );
                            }
                        }
                    }

                    break;
                }
                case 'messageVideo': {
                    // preview
                    const [previewId, previewPid, previewIdbKey] = getVideoThumbnailFile(message);
                    if (previewPid) {
                        const obj = message.content.video.thumbnail.photo;
                        if (!obj.blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                obj,
                                previewIdbKey,
                                null,
                                () => FileStore.updateVideoThumbnailBlob(localMessage.chat_id, localMessage.id, obj.id),
                                () => FileStore.getRemoteFile(id, 1, localMessage)
                            );
                        }
                    }

                    // video
                    const [id, pid, idb_key] = getVideoFile(message);
                    if (pid) {
                        let file = message.content.video.video;
                        let blob = file.blob || FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateVideoBlob(localMessage.chat_id, localMessage.id, file.id),
                                () => {
                                    const videoFileSize = getVideoFileSize(message);
                                    if (!useSizeLimit || (videoFileSize && videoFileSize <= PRELOAD_VIDEO_SIZE)) {
                                        FileStore.getRemoteFile(id, 1, localMessage);
                                    }
                                }
                            );
                        }
                    }

                    break;
                }
            }
        }
    }
}

function cancelPreloadMediaViewerContent(index, history) {
    if (!history.length) return;

    const messages = [];
    if (index > 0) {
        messages.push(history[index - 1]);
    }
    if (index < history.length - 1) {
        messages.push(history[index + 1]);
    }

    cancelLoadMediaViewerContent([history[index]]);
    cancelLoadMediaViewerContent(messages);
}

function preloadMediaViewerContent(index, history) {
    if (!history.length) return;

    const messages = [];
    if (index > 0) {
        messages.push(history[index - 1]);
    }
    if (index < history.length - 1) {
        messages.push(history[index + 1]);
    }

    loadMediaViewerContent([history[index]], false);
    loadMediaViewerContent(messages, true);
}

function loadProfileMediaViewerContent(chatId, photos) {
    if (!photos) return;
    if (!photos.length) return;

    const store = FileStore.getStore();

    for (let i = 0; i < photos.length; i++) {
        let photo = photos[i];
        if (photo) {
            switch (photo['@type']) {
                case 'userProfilePhoto': {
                    photo = getProfilePhotoFromPhoto(photo);
                    if (photo) {
                        const [id, pid, idb_key] = getBigPhoto(photo);
                        if (pid) {
                            const userId = getChatUserId(chatId);
                            const user = UserStore.get(userId);

                            if (user) {
                                let file = photo.big;
                                let blob = file.blob || FileStore.getBlob(file.id);
                                if (!blob) {
                                    FileStore.getLocalFile(
                                        store,
                                        file,
                                        idb_key,
                                        null,
                                        () => FileStore.updateUserPhotoBlob(user.id, file.id),
                                        () => FileStore.getRemoteFile(id, 1, user)
                                    );
                                }
                            }
                        }
                    }

                    break;
                }
                case 'profilePhoto': {
                    const [id, pid, idb_key] = getBigPhoto(photo);
                    if (pid) {
                        const userId = getChatUserId(chatId);
                        const user = UserStore.get(userId);

                        if (user) {
                            let file = photo.big;
                            let blob = file.blob || FileStore.getBlob(file.id);
                            if (!blob) {
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updateUserPhotoBlob(user.id, file.id),
                                    () => FileStore.getRemoteFile(id, 1, user)
                                );
                            }
                        }
                    }

                    break;
                }
                case 'chatPhoto': {
                    const [id, pid, idb_key] = getBigPhoto(photo);
                    if (pid) {
                        const chat = ChatStore.get(chatId);

                        if (chat) {
                            let file = photo.big;
                            let blob = file.blob || FileStore.getBlob(file.id);
                            if (!blob) {
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updateChatPhotoBlob(chat.id, file.id),
                                    () => FileStore.getRemoteFile(id, 1, chat)
                                );
                            }
                        }
                    }

                    break;
                }
            }
        }
    }
}

function preloadProfileMediaViewerContent(chatId, index, history) {
    if (!history.length) return;

    const items = [];
    if (index > 0) {
        items.push(history[index - 1]);
    }
    if (index < history.length - 1) {
        items.push(history[index + 1]);
    }
    if (index >= 0 && index < history.length) {
        items.push(history[index]);
    }

    loadProfileMediaViewerContent(chatId, items);
}

function loadUserContent(user) {
    if (!user) return;

    const store = FileStore.getStore();

    let [id, pid, idb_key] = getUserPhoto(user);
    if (pid) {
        FileStore.getLocalFile(
            store,
            user.profile_photo.small,
            idb_key,
            null,
            () => FileStore.updateUserPhotoBlob(user.id, id),
            () => FileStore.getRemoteFile(id, 1, user)
        );
    }
}

function loadChatContent(chat) {
    if (!chat) return;

    let store = FileStore.getStore();

    let [id, pid, idb_key] = getChatPhoto(chat);
    if (pid) {
        FileStore.getLocalFile(
            store,
            chat.photo.small,
            idb_key,
            null,
            () => FileStore.updateChatPhotoBlob(chat.id, id),
            () => FileStore.getRemoteFile(id, 1, chat)
        );
    }
}

function isGifMimeType(mimeType) {
    return mimeType && mimeType.toLowerCase() === 'image/gif';
}

function getSrc(file) {
    const blob = file ? FileStore.getBlob(file.id) || file.blob : null;

    return FileStore.getBlobUrl(blob) || '';
}

export {
    getFileSize,
    getSizeString,
    getBigPhoto,
    getSmallPhoto,
    getUserPhoto,
    getChatPhoto,
    getContactFile,
    getStickerFile,
    getPhotoFile,
    getPhotoPreviewFile,
    getVideoNoteFile,
    getVideoNoteFileSize,
    getVideoNoteThumbnailFile,
    getAnimationFile,
    getAnimationFileSize,
    getAnimationThumbnailFile,
    getVideoFile,
    getVideoFileSize,
    getVideoThumbnailFile,
    getDocumentThumbnailFile,
    getWebPagePhotoFile,
    saveData,
    saveBlob,
    loadUserPhotos,
    loadChatsContent,
    loadUsersContent,
    loadMessageContents,
    loadMediaViewerContent,
    preloadMediaViewerContent,
    cancelLoadMediaViewerContent,
    cancelPreloadMediaViewerContent,
    loadProfileMediaViewerContent,
    preloadProfileMediaViewerContent,
    loadUserContent,
    loadChatContent,
    saveOrDownload,
    download,
    getMediaFile,
    getMediaPreviewFile,
    isGifMimeType,
    getSrc
};
