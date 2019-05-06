/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getPhotoSize, getPhotoThumbnailSize, getSize } from './Common';
import { getChatUserId } from './Chat';
import { getProfilePhotoFromPhoto } from './User';
import { getLocationId } from './Message';
import {
    FILE_PRIORITY,
    LOCATION_HEIGHT,
    LOCATION_SCALE,
    LOCATION_WIDTH,
    LOCATION_ZOOM,
    PHOTO_BIG_SIZE,
    PHOTO_SIZE,
    PRELOAD_ANIMATION_SIZE,
    PRELOAD_AUDIO_SIZE,
    PRELOAD_DOCUMENT_SIZE,
    PRELOAD_STICKER_SIZE,
    PRELOAD_VIDEO_SIZE,
    PRELOAD_VIDEONOTE_SIZE,
    PRELOAD_VOICENOTE_SIZE,
    THUMBNAIL_PRIORITY
} from '../Constants';
import ChatStore from '../Stores/ChatStore';
import FileStore from '../Stores/FileStore';
import MessageStore from '../Stores/MessageStore';
import UserStore from '../Stores/UserStore';
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

function saveData(data, filename, mime) {
    let blob = new Blob([data], { type: mime || 'application/octet-stream' });
    if (typeof window.navigator.msSaveBlob !== 'undefined') {
        // IE workaround for "HTML7007: One or more blob URLs were
        // revoked by closing the blob for which they were created.
        // These URLs will no longer resolve as the data backing
        // the URL has been freed."
        window.navigator.msSaveBlob(blob, filename);
    } else {
        let blobURL = window.URL.createObjectURL(blob);
        let tempLink = document.createElement('a');
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
        let blobURL = window.URL.createObjectURL(blob);
        let tempLink = document.createElement('a');
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
                null,
                () => FileStore.updateUserPhotoBlob(user.id, id),
                () => FileStore.getRemoteFile(id, FILE_PRIORITY, user)
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
                null,
                () => FileStore.updateChatPhotoBlob(chat.id, id),
                () => FileStore.getRemoteFile(id, FILE_PRIORITY, chat)
            );
        }
    }
}

async function loadReplies(store, chatId, messageIds) {
    if (!chatId) return;
    if (!messageIds) return;
    if (!messageIds.length) return;

    const result = await TdLibController.send({
        '@type': 'getMessages',
        chat_id: chatId,
        message_ids: messageIds
    });

    result.messages = result.messages.map((message, i) => {
        return (
            message || {
                '@type': 'deletedMessage',
                chat_id: chatId,
                id: messageIds[i],
                content: null
            }
        );
    });

    MessageStore.setItems(result.messages);

    for (let i = messageIds.length - 1; i >= 0; i--) {
        MessageStore.emit('getMessageResult', MessageStore.get(chatId, messageIds[i]));
    }

    store = FileStore.getStore();

    loadReplyContents(store, result.messages);
}

function loadReplyContents(store, messages) {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (!message) {
            continue;
        }

        const { content } = message;
        if (content) {
            switch (content['@type']) {
                case 'messageAnimation': {
                    const { animation } = content;

                    loadAnimationThumbnailContent(store, animation, message);
                    break;
                }
                case 'messageAudio': {
                    const { audio } = content;

                    loadAudioThumbnailContent(store, audio, message);
                    break;
                }
                case 'messageChatChangePhoto': {
                    const { photo } = content;

                    loadPhotoContent(store, photo, message);
                    break;
                }
                case 'messageDocument': {
                    const { document } = content;

                    loadDocumentThumbnailContent(store, document, message);
                    break;
                }
                case 'messageGame': {
                    const { game } = content;

                    loadGameThumbnailContent(store, game, message);
                    break;
                }
                case 'messagePhoto': {
                    const { photo } = content;

                    loadPhotoContent(store, photo, message);
                    break;
                }
                case 'messageSticker': {
                    const { sticker } = content;

                    loadStickerThumbnailContent(store, sticker, message);
                    break;
                }
                case 'messageText': {
                    const { web_page } = content;
                    if (!web_page) break;

                    const { animation, audio, document, photo, sticker, video, video_note } = web_page;

                    if (photo) {
                        loadPhotoContent(store, photo, message);
                        break;
                    }

                    if (animation) {
                        loadAnimationThumbnailContent(store, animation, message);
                        break;
                    }

                    if (audio) {
                        loadAudioThumbnailContent(store, audio, message);
                        break;
                    }

                    if (document) {
                        loadDocumentThumbnailContent(store, document, message);
                        break;
                    }

                    if (sticker) {
                        loadStickerThumbnailContent(store, sticker, message);
                        break;
                    }

                    if (video) {
                        loadVideoThumbnailContent(store, video, message);
                        break;
                    }

                    if (video_note) {
                        loadVideoNoteThumbnailContent(store, video_note, message);
                        break;
                    }

                    break;
                }
                case 'messageVideo': {
                    const { video } = content;

                    loadVideoThumbnailContent(store, video, message);
                    break;
                }
                case 'messageVideoNote': {
                    const { video_note } = content;

                    loadVideoNoteThumbnailContent(store, video_note, message);
                    break;
                }
            }
        }
    }
}

function loadAudioContent(store, audio, message, useFileSize = true) {
    if (!audio) return;
    if (!message) return;

    let { audio: file } = audio;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateAudioBlob(message.chat_id, message.id, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_AUDIO_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message);
            }
        }
    );
}

function loadAudioThumbnailContent(store, audio, message) {
    if (!audio) return false;
    if (!message) return false;

    const { album_cover_thumbnail: photoSize } = audio;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return true;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateAudioThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );

    return true;
}

function loadAnimationContent(store, animation, message, useFileSize = true) {
    if (!animation) return;
    if (!message) return;

    let { animation: file } = animation;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateAnimationBlob(message.chat_id, message.id, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_ANIMATION_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message);
            }
        }
    );
}

function loadAnimationThumbnailContent(store, animation, message) {
    if (!animation) return false;
    if (!message) return false;

    const { thumbnail: photoSize } = animation;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return true;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateAnimationThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );

    return true;
}

function loadContactContent(store, contact, message) {
    if (!contact) return;
    if (!message) return;

    const { user_id } = contact;
    const user = UserStore.get(user_id);
    if (!user) return;

    const { profile_photo } = user;
    if (!profile_photo) return;

    let { small: file } = profile_photo;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateUserPhotoBlob(user_id, id),
        () => FileStore.getRemoteFile(id, FILE_PRIORITY, user)
    );
}

function loadDocumentContent(store, document, message, useFileSize = true) {
    if (!document) return;
    if (!message) return;

    let { document: file } = document;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateDocumentBlob(message.chat_id, message.id, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_DOCUMENT_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message);
            }
        }
    );
}

function loadDocumentThumbnailContent(store, document, message) {
    if (!document) return false;
    if (!message) return false;

    const { thumbnail: photoSize } = document;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return true;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateDocumentThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );

    return true;
}

function loadGameContent(store, game, message, useFileSize = true) {
    if (!game) return;
    if (!message) return;

    const { animation } = game;

    loadAnimationContent(store, animation, message, useFileSize);
}

function loadGameThumbnailContent(store, game, message) {
    if (!game) return false;
    if (!message) return false;

    const { photo, animation } = game;
    if (loadAnimationThumbnailContent(store, animation, message)) {
        return true;
    }

    loadPhotoContent(store, photo, message);
    return true;
}

async function loadLocationContent(store, location, message) {
    if (!location) return;
    if (!message) return;

    const locationId = getLocationId(location);
    if (!locationId) return;

    let file = FileStore.getLocationFile(locationId);
    if (!file) {
        file = await TdLibController.send({
            '@type': 'getMapThumbnailFile',
            location: location,
            zoom: LOCATION_ZOOM,
            width: LOCATION_WIDTH,
            height: LOCATION_HEIGHT,
            scale: LOCATION_SCALE,
            chat_id: message.chat_id
        });
        FileStore.setLocationFile(locationId, file);

        store = FileStore.getStore();
    }

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateLocationBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, FILE_PRIORITY, message)
    );
}

function loadPhotoContent(store, photo, message) {
    if (!photo) return;
    if (!message) return;

    const { sizes } = photo;
    if (!sizes) return;

    const photoSize = getPhotoSize(sizes);
    if (!photoSize) return;

    let { photo: file } = photoSize;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updatePhotoBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, FILE_PRIORITY, message)
    );
}

function loadPhotoThumbnailContent(store, photo, message) {
    if (!photo) return false;
    if (!message) return false;

    const photoSize = getPhotoThumbnailSize(photo.sizes);
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return true;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updatePhotoBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );

    return true;
}

function loadStickerContent(store, sticker, message, useFileSize = true) {
    if (!sticker) return;
    if (!message) return;

    let { sticker: file } = sticker;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateStickerBlob(message.chat_id, message.id, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_STICKER_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message);
            }
        }
    );
}

function loadStickerThumbnailContent(store, sticker, message) {
    if (!sticker) return false;
    if (!message) return false;

    const { thumbnail: photoSize } = sticker;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return true;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateStickerThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );

    return true;
}

function loadVideoContent(store, video, message, useFileSize = true) {
    if (!video) return;
    if (!message) return;

    let { video: file } = video;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVideoBlob(message.chat_id, message.id, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_VIDEO_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message);
            }
        }
    );
}

function loadVideoThumbnailContent(store, video, message) {
    if (!video) return false;
    if (!message) return false;

    const { thumbnail: photoSize } = video;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return true;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVideoThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );

    return true;
}

function loadVideoNoteContent(store, videoNote, message, useFileSize = true) {
    if (!videoNote) return;
    if (!message) return;

    let { video: file } = videoNote;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVideoNoteBlob(message.chat_id, message.id, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_VIDEONOTE_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message);
            }
        }
    );
}

function loadVideoNoteThumbnailContent(store, videoNote, message) {
    if (!videoNote) return false;
    if (!message) return false;

    const { thumbnail: photoSize } = videoNote;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return true;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVideoNoteThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );

    return true;
}

function loadVoiceNoteContent(store, voiceNote, message, useFileSize = true) {
    if (!voiceNote) return;
    if (!message) return;

    let { voice: file } = voiceNote;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVoiceNoteBlob(message.chat_id, message.id, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_VOICENOTE_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message);
            }
        }
    );
}

function loadMessageContents(store, messages) {
    const users = new Map();
    let chatId = 0;
    const replies = new Map();

    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (!message) {
            continue;
        }

        const { chat_id, content, sender_user_id, reply_to_message_id } = message;

        if (sender_user_id) {
            users.set(sender_user_id, sender_user_id);
        }

        if (reply_to_message_id) {
            chatId = chat_id;
            replies.set(reply_to_message_id, reply_to_message_id);
        }

        if (content) {
            switch (content['@type']) {
                case 'messageAnimation': {
                    const { animation } = content;

                    loadAnimationContent(store, animation, message);
                    loadAnimationThumbnailContent(store, animation, message);
                    break;
                }
                case 'messageAudio': {
                    const { audio } = content;

                    loadAudioContent(store, audio, message);
                    loadAudioThumbnailContent(store, audio, message);
                    break;
                }
                case 'messageChatPhotoChange': {
                    const { photo } = content;

                    loadPhotoContent(store, photo, message);
                    break;
                }
                case 'messageContact': {
                    const { contact } = content;

                    loadContactContent(store, contact, message);
                    break;
                }
                case 'messageDocument': {
                    const { document } = content;

                    loadDocumentContent(store, document, message);
                    loadDocumentThumbnailContent(store, document, message);
                    break;
                }
                case 'messageGame': {
                    const { game } = content;

                    loadGameContent(store, game, message);
                    loadGameThumbnailContent(store, game, message);
                    break;
                }
                case 'messageLocation': {
                    const { location } = content;

                    loadLocationContent(store, location, message);
                    break;
                }
                case 'messageText': {
                    const { web_page } = content;
                    if (!web_page) {
                        break;
                    }

                    const { animation, audio, document, photo, sticker, video, video_note, voice_note } = web_page;
                    let loadPhoto = true;

                    if (animation) {
                        loadAnimationContent(store, animation, message);
                        loadPhoto = !loadAnimationThumbnailContent(store, animation, message);
                    }

                    if (audio) {
                        loadAudioContent(store, audio, message);
                        loadPhoto = !loadAudioThumbnailContent(store, audio, message);
                    }

                    if (document) {
                        loadDocumentContent(store, document, message);
                        loadPhoto = !loadDocumentThumbnailContent(store, document, message);
                    }

                    if (sticker) {
                        loadStickerContent(store, sticker, message);
                        loadPhoto = !loadStickerThumbnailContent(store, sticker, message);
                    }

                    if (video) {
                        // loadVideoContent(store, video, message); // start loading only on video click event
                        loadPhoto = !loadVideoThumbnailContent(store, video, message);
                    }

                    if (video_note) {
                        loadVideoNoteContent(store, video_note, message);
                        loadPhoto = !loadVideoNoteThumbnailContent(store, video_note, message);
                    }

                    if (voice_note) {
                        loadVoiceNoteContent(store, voice_note, message);
                    }

                    if (loadPhoto) {
                        loadPhotoContent(store, photo, message);
                    }
                    break;
                }
                case 'messagePhoto': {
                    const { photo } = content;

                    loadPhotoContent(store, photo, message);
                    loadPhotoThumbnailContent(store, photo, message);
                    break;
                }
                case 'messageSticker': {
                    const { sticker } = content;

                    loadStickerContent(store, sticker, message);
                    loadStickerThumbnailContent(store, sticker, message);
                    break;
                }
                case 'messageVenue': {
                    const { venue } = content;
                    const { location } = venue;

                    loadLocationContent(store, location, message);
                    break;
                }
                case 'messageVideo': {
                    const { video } = content;

                    // loadVideoContent(store, video, message); // start loading only on video click event
                    loadVideoThumbnailContent(store, video, message);
                    break;
                }
                case 'messageVideoNote': {
                    const { video_note } = content;

                    loadVideoNoteContent(store, video_note, message);
                    loadVideoNoteThumbnailContent(store, video_note, message);
                    break;
                }
                case 'messageVoiceNote': {
                    const { voice_note } = content;

                    loadVoiceNoteContent(store, voice_note, message);
                    break;
                }
                default: {
                    break;
                }
            }
        }
    }

    loadUserPhotos(store, [...users.keys()]);
    loadReplies(store, chatId, [...replies.keys()]);
}

function saveOrDownload(file, fileName, obj, callback) {
    if (!file) return;
    if (!fileName) return;

    if (file.arr) {
        saveData(file.arr, fileName);
        return;
    }

    let blob = FileStore.getBlob(file.id) || file.blob;
    if (blob) {
        saveBlob(blob, fileName);
        return;
    }

    download(file, obj, () => {
        if (callback) callback();

        blob = FileStore.getBlob(file.id) || file.blob;
        if (blob) {
            saveBlob(blob, fileName);
        }
    });
}

function download(file, obj, callback) {
    if (!file) return;
    const { id, local } = file;

    const blob = FileStore.getBlob(id);
    if (blob) {
        return;
    }

    if (local.is_downloading_completed) {
        const store = FileStore.getStore();

        FileStore.getLocalFile(store, file, null, callback, () => {
            if (local.can_be_downloaded) {
                FileStore.getRemoteFile(file.id, FILE_PRIORITY, obj);
            }
        });
        return;
    }

    if (local.can_be_downloaded) {
        FileStore.getRemoteFile(id, FILE_PRIORITY, obj);
    }
}

function getMediaPreviewFile(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    console.log('getMediaViewerFile', message);
    if (!message) return [0, 0, null];

    const { content } = message;
    if (!content) return [0, 0, null];

    switch (content['@type']) {
        case 'messageAnimation': {
            const { animation } = content;
            if (animation && animation.thumbnail) {
                return [animation.thumbnail.width, animation.thumbnail.height, animation.thumbnail.photo];
            }
            break;
        }
        case 'messageDocument': {
            const { document } = content;
            if (document) {
                return [50, 50, document.document];
            }
            break;
        }
        case 'messagePhoto': {
            return getMediaFile(chatId, messageId, PHOTO_SIZE);
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { animation, document, video, photo } = web_page;

                if (animation && animation.thumbnail) {
                    return [animation.thumbnail.width, animation.thumbnail.height, animation.thumbnail.photo];
                }

                if (document) {
                    return [50, 50, document.document];
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
        case 'messageVideo': {
            const { video } = content;
            if (video.thumbnail) {
                return [video.thumbnail.width, video.thumbnail.height, video.thumbnail.photo];
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
        case 'messageAnimation': {
            const { animation } = content;
            if (animation) {
                return [animation.width, animation.height, animation.animation];
            }
            break;
        }
        case 'messageDocument': {
            const { document } = content;
            if (document) {
                return [50, 50, document.document];
            }
            break;
        }
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
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { animation, document, photo, video } = web_page;
                if (animation) {
                    return [animation.width, animation.height, animation.animation];
                }

                if (document) {
                    return [50, 50, document.document];
                }

                if (photo) {
                    const photoSize = getSize(photo.sizes, size);
                    if (photoSize) {
                        return [photoSize.width, photoSize.height, photoSize.photo];
                    }
                    break;
                }

                if (video) {
                    return [video.width, video.height, video.video];
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
                    const { photo } = content;
                    if (!photo) break;

                    // preview
                    /*let [previewId, previewPid, previewIdbKey] = getPhotoPreviewFile(message);
                    if (previewPid) {
                        let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                        if (!preview.blob){
                            FileStore.getLocalFile(store, preview, null,
                                () => MessageStore.updateMessagePhoto(message.id),
                                () => { if (loadRemote)  FileStore.getRemoteFile(previewId, 2, message); },
                                'load_contents_preview_',
                                message.id);

                        }
                    }*/

                    const photoSize = getSize(photo.sizes, PHOTO_BIG_SIZE);
                    if (!photoSize) break;

                    const { photo: file } = photoSize;
                    const blob = file.blob || FileStore.getBlob(file.id);
                    if (blob) return;

                    FileStore.cancelGetRemoteFile(file.id);
                    break;
                }
                case 'messageVideo': {
                    const { video } = content;
                    if (!video) break;

                    if (video.thumbnail) {
                        const { photo: file } = video.thumbnail;
                        const blob = file.blob || FileStore.getBlob(file.id);
                        if (blob) break;

                        FileStore.cancelGetRemoteFile(file.id);
                    }

                    const { video: file } = video;
                    if (!file) break;

                    const blob = file.blob || FileStore.getBlob(file.id);
                    if (blob) break;

                    FileStore.cancelGetRemoteFile(file.id);
                    break;
                }
                case 'messageText': {
                    const { web_page } = message.content;
                    if (web_page) {
                        const { video } = web_page;

                        if (video) {
                            if (video.thumbnail) {
                                const { photo: file } = video.thumbnail;
                                const blob = file.blob || FileStore.getBlob(file.id);
                                if (blob) break;

                                FileStore.cancelGetRemoteFile(file.id);
                            }

                            const { video: file } = video;
                            if (!file) break;

                            const blob = file.blob || FileStore.getBlob(file.id);
                            if (blob) break;

                            FileStore.cancelGetRemoteFile(file.id);
                        }
                    }

                    break;
                }
            }
        }
    }
}

function loadMediaViewerContent(messages, useSizeLimit = false) {
    if (!messages) return;
    if (!messages.length) return;

    const store = FileStore.getStore();

    for (let i = 0; i < messages.length; i++) {
        let message = messages[i];
        const { content } = message;
        if (content) {
            switch (content['@type']) {
                case 'messageAnimation': {
                    const { animation } = content;

                    loadAnimationContent(store, animation, message, useSizeLimit);
                    loadAnimationThumbnailContent(store, animation, message);
                    break;
                }
                case 'messageDocument': {
                    const { document } = content;

                    loadDocumentContent(store, document, message, useSizeLimit);
                    break;
                }
                case 'messagePhoto': {
                    const { photo } = content;

                    // preview
                    /*let [previewId, previewPid, previewIdbKey] = getPhotoPreviewFile(message);
                    if (previewPid) {
                        let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                        if (!preview.blob){
                            FileStore.getLocalFile(store, preview, null,
                                () => MessageStore.updateMessagePhoto(message.id),
                                () => { if (loadRemote)  FileStore.getRemoteFile(previewId, 2, message); },
                                'load_contents_preview_',
                                message.id);

                        }
                    }*/

                    const photoSize = getSize(photo.sizes, PHOTO_BIG_SIZE);
                    if (!photoSize) break;

                    const { photo: file } = photoSize;
                    if (!file) break;

                    const blob = file.blob || FileStore.getBlob(file.id);
                    if (blob) break;

                    const { id } = file;

                    FileStore.getLocalFile(
                        store,
                        file,
                        null,
                        () => FileStore.updatePhotoBlob(message.chat_id, message.id, id),
                        () => FileStore.getRemoteFile(id, FILE_PRIORITY, message)
                    );
                    break;
                }
                case 'messageText': {
                    const { web_page } = message.content;
                    if (!web_page) {
                        break;
                    }

                    const { animation, document, photo, video } = web_page;
                    let loadPhoto = true;

                    if (animation) {
                        loadAnimationContent(store, animation, message, useSizeLimit);
                        loadPhoto = !loadAnimationThumbnailContent(store, animation, message);
                    }

                    if (document) {
                        loadDocumentContent(store, document, message, useSizeLimit);
                        loadPhoto = false;
                    }

                    if (video) {
                        loadVideoContent(store, video, message, useSizeLimit);
                        loadPhoto = !loadVideoThumbnailContent(store, video, message);
                    }

                    if (loadPhoto) {
                        if (photo) {
                            const photoSize = getSize(photo.sizes, PHOTO_BIG_SIZE);
                            if (!photoSize) break;

                            const { photo: file } = photoSize;
                            if (!file) break;

                            const blob = file.blob || FileStore.getBlob(file.id);
                            if (blob) break;

                            const { id } = file;

                            FileStore.getLocalFile(
                                store,
                                file,
                                null,
                                () => FileStore.updatePhotoBlob(message.chat_id, message.id, id),
                                () => FileStore.getRemoteFile(id, FILE_PRIORITY, message)
                            );
                        }
                    }

                    break;
                }
                case 'messageVideo': {
                    const { video } = content;

                    loadVideoThumbnailContent(store, video, message);
                    loadVideoContent(store, video, message, useSizeLimit);
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
                                        null,
                                        () => FileStore.updateUserPhotoBlob(user.id, file.id),
                                        () => FileStore.getRemoteFile(id, FILE_PRIORITY, user)
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
                                    null,
                                    () => FileStore.updateUserPhotoBlob(user.id, file.id),
                                    () => FileStore.getRemoteFile(id, FILE_PRIORITY, user)
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
                                    null,
                                    () => FileStore.updateChatPhotoBlob(chat.id, file.id),
                                    () => FileStore.getRemoteFile(id, FILE_PRIORITY, chat)
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
            null,
            () => FileStore.updateUserPhotoBlob(user.id, id),
            () => FileStore.getRemoteFile(id, FILE_PRIORITY, user)
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
            null,
            () => FileStore.updateChatPhotoBlob(chat.id, id),
            () => FileStore.getRemoteFile(id, FILE_PRIORITY, chat)
        );
    }
}

function isGifMimeType(mimeType) {
    return mimeType && mimeType.toLowerCase() === 'image/gif';
}

function getSrc(file) {
    const blob = getBlob(file);

    return FileStore.getBlobUrl(blob) || '';
}

function getBlob(file) {
    return file ? FileStore.getBlob(file.id) || file.blob : null;
}

function getDownloadedSize(file) {
    if (!file) return '0';
    if (!file.local) return '0';
    if (!file.local.is_downloading_active) return '0';

    return getSizeString(file.local.downloaded_size);
}

function getUploadedSize(file) {
    if (!file) return '0';
    if (!file.remote) return '0';
    if (!file.remote.is_uploading_active) return '0';

    return getSizeString(file.remote.uploaded_size);
}

function getExtension(fileName) {
    if (!fileName) {
        return '';
    }

    const parts = fileName.split('.');
    if (parts.length === 1 || (parts[0] === '' && parts.length === 2)) {
        return '';
    }
    return parts.pop().toLowerCase();
}

export {
    getFileSize,
    getSizeString,
    getBigPhoto,
    getSmallPhoto,
    getUserPhoto,
    getChatPhoto,
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
    getSrc,
    getBlob,
    getDownloadedSize,
    getUploadedSize,
    getExtension
};
