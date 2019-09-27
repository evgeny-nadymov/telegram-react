/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getPhotoSize, getPhotoThumbnailSize, getSize } from './Common';
import { getChatUserId } from './Chat';
import { getProfilePhoto } from './User';
import { getLocationId } from './Message';
import {
    FILE_PRIORITY,
    IV_LOCATION_HEIGHT,
    IV_LOCATION_WIDTH,
    IV_PHOTO_SIZE,
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

function getBigPhoto(photo) {
    if (!photo) return null;

    return photo.big;
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

    let { audio: file } = audio;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateAudioBlob(chatId, messageId, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_AUDIO_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message || audio);
            }
        }
    );
}

function loadAudioThumbnailContent(store, audio, message) {
    if (!audio) return false;

    const { album_cover_thumbnail: photoSize } = audio;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return true;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateAudioThumbnailBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message || audio)
    );

    return true;
}

function loadAnimationContent(store, animation, message, useFileSize = true) {
    if (!animation) return;

    let { animation: file } = animation;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateAnimationBlob(chatId, messageId, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_ANIMATION_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message || animation);
            }
        }
    );
}

function loadAnimationThumbnailContent(store, animation, message) {
    if (!animation) return false;

    const { thumbnail: photoSize } = animation;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return true;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateAnimationThumbnailBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message || animation)
    );

    return true;
}

function loadContactContent(store, contact, message) {
    if (!contact) return;
    if (!message) return;

    const { user_id } = contact;
    const user = UserStore.get(user_id);
    if (!user) return;

    loadUserContent(store, user);
}

function loadDocumentContent(store, document, message, useFileSize = true) {
    if (!document) return;

    let { document: file } = document;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateDocumentBlob(chatId, messageId, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_DOCUMENT_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message || document);
            }
        }
    );
}

function loadDocumentThumbnailContent(store, document, message) {
    if (!document) return false;

    const { thumbnail: photoSize } = document;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return true;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateDocumentThumbnailBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message || document)
    );

    return true;
}

function loadGameContent(store, game, message, useFileSize = true) {
    if (!game) return;

    const { animation } = game;

    loadAnimationContent(store, animation, message, useFileSize);
}

function loadGameThumbnailContent(store, game, message) {
    if (!game) return false;

    const { photo, animation } = game;
    if (loadAnimationThumbnailContent(store, animation, message)) {
        return true;
    }

    loadPhotoContent(store, photo, message);
    return true;
}

async function loadPageBlockMapContent(store, pageBlockMap, message) {
    if (!pageBlockMap) return;

    const { location } = pageBlockMap;
    const locationId = getLocationId(location, IV_LOCATION_WIDTH, IV_LOCATION_HEIGHT);
    if (!locationId) return;

    let file = FileStore.getLocationFile(locationId);
    if (!file) {
        file = await TdLibController.send({
            '@type': 'getMapThumbnailFile',
            location,
            width: IV_LOCATION_WIDTH,
            height: IV_LOCATION_HEIGHT,
            zoom: LOCATION_ZOOM,
            scale: LOCATION_SCALE,
            chat_id: message ? message.chat_id : 0
        });
        FileStore.setLocationFile(locationId, file);

        store = FileStore.getStore();
    }

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateLocationBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, FILE_PRIORITY, message || pageBlockMap)
    );
}

async function loadLocationContent(store, location, message) {
    if (!location) return;

    const locationId = getLocationId(location);
    if (!locationId) return;

    let file = FileStore.getLocationFile(locationId);
    if (!file) {
        file = await TdLibController.send({
            '@type': 'getMapThumbnailFile',
            location,
            width: LOCATION_WIDTH,
            height: LOCATION_HEIGHT,
            zoom: LOCATION_ZOOM,
            scale: LOCATION_SCALE,
            chat_id: message ? message.chat_id : 0
        });
        FileStore.setLocationFile(locationId, file);

        store = FileStore.getStore();
    }

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateLocationBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, FILE_PRIORITY, message || location)
    );
}

function loadBigPhotoContent(store, photo, message) {
    if (!photo) return;

    const { sizes } = photo;
    if (!sizes) return;

    const photoSize = getSize(sizes, PHOTO_BIG_SIZE);
    if (!photoSize) return;

    let { photo: file } = photoSize;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updatePhotoBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, FILE_PRIORITY, message || photo)
    );
}

function loadPhotoContent(store, photo, message, displaySize = PHOTO_SIZE) {
    if (!photo) return;

    const { sizes } = photo;
    if (!sizes) return;

    const photoSize = getPhotoSize(sizes, displaySize);
    if (!photoSize) return;

    let { photo: file } = photoSize;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updatePhotoBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, FILE_PRIORITY, message || photo)
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

    let { sticker: file } = sticker;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateStickerBlob(chatId, messageId, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_STICKER_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message || sticker);
            }
        }
    );
}

function loadStickerThumbnailContent(store, sticker, message) {
    if (!sticker) return false;

    const { thumbnail: photoSize } = sticker;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return true;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateStickerThumbnailBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message || sticker)
    );

    return true;
}

function loadVideoContent(store, video, message, useFileSize = true) {
    if (!video) return;

    let { video: file } = video;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVideoBlob(chatId, messageId, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_VIDEO_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message || video);
            }
        }
    );
}

function loadVideoThumbnailContent(store, video, message) {
    if (!video) return false;

    const { thumbnail: photoSize } = video;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return true;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVideoThumbnailBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message || video)
    );

    return true;
}

function loadVideoNoteContent(store, videoNote, message, useFileSize = true) {
    if (!videoNote) return;

    let { video: file } = videoNote;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVideoNoteBlob(chatId, messageId, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_VIDEONOTE_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message || videoNote);
            }
        }
    );
}

function loadVideoNoteThumbnailContent(store, videoNote, message) {
    if (!videoNote) return false;

    const { thumbnail: photoSize } = videoNote;
    if (!photoSize) return false;

    let { photo: file } = photoSize;
    if (!file) return false;

    file = FileStore.get(file.id) || file;
    const { id } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return true;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVideoNoteThumbnailBlob(chatId, messageId, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message || videoNote)
    );

    return true;
}

function loadVoiceNoteContent(store, voiceNote, message, useFileSize = true) {
    if (!voiceNote) return;

    let { voice: file } = voiceNote;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    const { id, size } = file;

    const blob = FileStore.getBlob(id);
    if (blob) return;

    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateVoiceNoteBlob(chatId, messageId, id),
        () => {
            if (!useFileSize || (size && size < PRELOAD_VOICENOTE_SIZE)) {
                FileStore.getRemoteFile(id, FILE_PRIORITY, message || voiceNote);
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
                case 'messageChatChangePhoto': {
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
                        loadBigPhotoContent(store, photo, message);
                        loadPhotoContent(store, photo, message);
                        loadPhotoThumbnailContent(store, photo, message);
                    }
                    break;
                }
                case 'messagePhoto': {
                    const { photo } = content;

                    loadBigPhotoContent(store, photo, message);
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

    loadUsersContent(store, [...users.keys()]);
    loadReplies(store, chatId, [...replies.keys()]);
}

export function saveMedia(media, message) {
    if (!media) return;

    switch (media['@type']) {
        case 'animation': {
            saveAnimation(media, message);
            break;
        }
        case 'document': {
            saveDocument(media, message);
            break;
        }
        case 'photo': {
            savePhoto(media, message);
            break;
        }
        case 'video': {
            saveVideo(media, message);
            break;
        }
    }
}

function saveAnimation(animation, message) {
    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    if (!animation) return;

    const { animation: file, file_name } = animation;
    if (!file) return;

    const { id: fileId } = file;

    saveOrDownload(file, file_name || fileId, message || animation, () =>
        FileStore.updateAnimationBlob(chatId, messageId, fileId)
    );
}

function saveDocument(document, message) {
    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    if (!document) return;

    const { document: file, file_name } = document;
    if (!file) return;

    const { id: fileId } = file;

    saveOrDownload(file, file_name || fileId, message || document, () =>
        FileStore.updateDocumentBlob(chatId, messageId, fileId)
    );
}

function saveVideo(video, message) {
    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    if (!video) return;

    const { video: file, file_name } = video;
    if (!file) return;

    const { id: fileId } = file;

    saveOrDownload(file, file_name || fileId, message || video, () =>
        FileStore.updateVideoBlob(chatId, messageId, fileId)
    );
}

function savePhoto(photo, message) {
    const chatId = message ? message.chat_id : 0;
    const messageId = message ? message.id : 0;

    if (!photo) return;

    const photoSize = getSize(photo.sizes, PHOTO_BIG_SIZE);
    if (!photoSize) return;

    const { photo: file } = photoSize;
    if (!file) return;

    const { id: fileId } = file;

    saveOrDownload(file, fileId + '.jpg', message || photo, () => FileStore.updatePhotoBlob(chatId, messageId, fileId));
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

function getViewerThumbnail(media) {
    if (!media) return [0, 0, null];

    switch (media['@type']) {
        case 'animation': {
            const { thumbnail } = media;
            if (thumbnail) {
                return [thumbnail.width, thumbnail.height, thumbnail.photo];
            }
            break;
        }
        case 'document': {
            const { thumbnail } = media;
            if (thumbnail) {
                return [thumbnail.width, thumbnail.height, thumbnail.photo];
            }
            break;
        }
        case 'photo': {
            return getViewerFile(media, PHOTO_SIZE);
        }
        case 'video': {
            const { thumbnail } = media;
            if (thumbnail) {
                return [thumbnail.width, thumbnail.height, thumbnail.photo];
            }
            break;
        }
        default: {
            return [0, 0, null];
        }
    }

    return [0, 0, null];
}

function getMediaPreviewFile(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
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
        case 'messageChatChangePhoto': {
            return getMediaFile(chatId, messageId, PHOTO_SIZE);
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

function getViewerFile(media, size) {
    if (!size) return [0, 0, null];

    switch (media['@type']) {
        case 'animation': {
            return [media.width, media.height, media.animation];
        }
        case 'photo': {
            const photoSize = getSize(media.sizes, size);
            if (photoSize) {
                return [photoSize.width, photoSize.height, photoSize.photo];
            }
            break;
        }
        case 'document': {
            return [50, 50, document.document];
        }
        case 'video': {
            return [media.width, media.height, media.video];
        }
        default: {
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
        case 'messageChatChangePhoto': {
            const { photo } = content;
            if (photo) {
                const photoSize = getSize(photo.sizes, size);
                if (photoSize) {
                    return [photoSize.width, photoSize.height, photoSize.photo];
                }
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
                case 'messageChatChangePhoto': {
                    const { photo } = content;

                    loadBigPhotoContent(store, photo, message);
                    break;
                }
                case 'messageDocument': {
                    const { document } = content;

                    loadDocumentContent(store, document, message, useSizeLimit);
                    break;
                }
                case 'messagePhoto': {
                    const { photo } = content;

                    loadBigPhotoContent(store, photo, message);
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
                        loadBigPhotoContent(store, photo, message);
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

function loadUserFileContent(store, file, userId) {
    if (!file) return;

    const { id } = file;
    file = FileStore.get(id) || file;

    const user = UserStore.get(userId);
    if (!user) return;

    const blob = file.blob || FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateUserPhotoBlob(userId, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, user)
    );
}

function loadChatFileContent(store, file, chatId) {
    if (!file) return;

    const { id } = file;
    file = FileStore.get(id) || file;

    const chat = ChatStore.get(chatId);
    if (!chat) return;

    const blob = file.blob || FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        null,
        () => FileStore.updateChatPhotoBlob(chatId, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, chat)
    );
}

function loadProfileMediaViewerContent(chatId, photos) {
    if (!photos) return;

    const store = FileStore.getStore();

    photos.forEach(photo => {
        switch (photo['@type']) {
            case 'chatPhoto': {
                const { small, big } = photo;

                loadChatFileContent(store, small, chatId);
                loadChatFileContent(store, big, chatId);
                break;
            }
            case 'profilePhoto': {
                const userId = getChatUserId(chatId);

                const { small, big } = photo;

                loadUserFileContent(store, small, userId);
                loadUserFileContent(store, big, userId);
                break;
            }
            case 'userProfilePhoto': {
                photo = getProfilePhoto(photo);
                if (!photo) break;

                const userId = getChatUserId(chatId);

                const { small, big } = photo;

                loadUserFileContent(store, small, userId);
                loadUserFileContent(store, big, userId);
                break;
            }
        }
    });
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

function loadUserContent(store, userId) {
    const user = UserStore.get(userId);
    if (!user) return;

    const { profile_photo } = user;
    if (!profile_photo) return;

    const { small: file } = profile_photo;

    loadUserFileContent(store, file, userId);
}

function loadUsersContent(store, ids) {
    if (!ids) return;

    ids.forEach(id => loadUserContent(store, id));
}

function loadChatContent(store, chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return;

    const { photo } = chat;
    loadChatPhotoContent(store, photo, chat.id);
}

function loadChatPhotoContent(store, photo, chatId) {
    if (!photo) return;

    const { small: file } = photo;

    loadChatFileContent(store, file, chatId);
}

function loadChatsContent(store, ids) {
    if (!ids) return;

    ids.forEach(id => loadChatContent(store, id));
}

function loadDraftContent(store, chatId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return;

    const { draft_message } = chat;
    if (!draft_message) return;

    const { reply_to_message_id } = draft_message;
    if (!reply_to_message_id) return;

    loadReplies(store, chatId, [reply_to_message_id]);
}

function loadStickerSetContent(store, stickerSet) {
    console.log('Lottie.loadStickerSetContent');
    if (!stickerSet) return;

    const { stickers } = stickerSet;
    loadStickersContent(store, stickers);
}

function loadStickersContent(store, stickers) {
    if (!stickers) return;

    stickers.forEach(sticker => {
        console.log('Lottie.loadStickerThumbnailContent', sticker.sticker.id);
        loadStickerThumbnailContent(store, sticker, null);
        if (sticker.is_animated) {
            console.log('Lottie.loadStickerContent', sticker.sticker.id);
            loadStickerContent(store, sticker, null);
        }
    });
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

function loadInstantViewContent(instantView) {
    if (!instantView) return;

    const { page_blocks } = instantView;
    if (!page_blocks) return;

    const store = FileStore.getStore();

    page_blocks.forEach(pageBlock => loadPageBlockContent(store, pageBlock));
}

function loadPageBlockContent(store, b) {
    if (!b) return;

    switch (b['@type']) {
        case 'pageBlockAnchor': {
            break;
        }
        case 'pageBlockAnimation': {
            const { animation, caption } = b;

            loadAnimationThumbnailContent(store, animation, null);
            loadAnimationContent(store, animation, null);
            loadPageBlockContent(store, caption);
            break;
        }
        case 'pageBlockAudio': {
            const { audio, caption } = b;

            loadAudioThumbnailContent(store, audio, null);
            loadAudioContent(store, audio, null);
            loadPageBlockContent(store, caption);
            break;
        }
        case 'pageBlockAuthorDate': {
            const { author } = b;

            loadRichTextContent(store, author);
            break;
        }
        case 'pageBlockBlockQuote': {
            const { text, credit } = b;

            loadRichTextContent(store, text);
            loadRichTextContent(store, credit);
            break;
        }
        // actually not a pageBlock child but load content in the same way
        case 'pageBlockCaption': {
            const { text, credit } = b;

            loadRichTextContent(store, text);
            loadRichTextContent(store, credit);
            break;
        }
        case 'pageBlockChatLink': {
            const { photo } = b;

            loadChatPhotoContent(store, photo, 0);
            break;
        }
        case 'pageBlockCollage': {
            const { page_blocks, caption } = b;

            loadPageBlockContent(store, caption);
            page_blocks.forEach(x => loadPageBlockContent(store, x));
            break;
        }
        case 'pageBlockCover': {
            const { cover } = b;

            loadPageBlockContent(store, cover);
            break;
        }
        case 'pageBlockDetails': {
            const { header, page_blocks } = b;

            loadPageBlockContent(store, header);
            page_blocks.forEach(x => loadPageBlockContent(store, x));
            break;
        }
        case 'pageBlockDivider': {
            break;
        }
        case 'pageBlockEmbedded': {
            const { poster_photo, caption } = b;

            loadPhotoContent(store, poster_photo, null);
            loadPageBlockContent(store, caption);
            break;
        }
        case 'pageBlockEmbeddedPost': {
            const { author_photo, page_blocks, caption } = b;

            loadPhotoContent(store, author_photo, null);
            page_blocks.forEach(x => loadPageBlockContent(store, x));
            loadPageBlockContent(store, caption);
            break;
        }
        case 'pageBlockFooter': {
            const { footer } = b;

            loadRichTextContent(store, footer);
            break;
        }
        case 'pageBlockHeader': {
            const { header } = b;

            loadRichTextContent(store, header);
            break;
        }
        case 'pageBlockKicker': {
            const { kicker } = b;

            loadRichTextContent(store, kicker);
            break;
        }
        case 'pageBlockList': {
            const { items } = b;

            items.forEach(x => loadPageBlockContent(store, x));
            break;
        }
        // actually not a pageBlock child but load content in the same way
        case 'pageBlockListItem': {
            const { page_blocks } = b;

            page_blocks.forEach(x => loadPageBlockContent(store, x));
            break;
        }
        case 'pageBlockMap': {
            const { caption } = b;

            loadPageBlockMapContent(store, b, null);
            loadPageBlockContent(store, caption);
            break;
        }
        case 'pageBlockParagraph': {
            const { text } = b;

            loadRichTextContent(store, text);
            break;
        }
        case 'pageBlockPhoto': {
            const { photo, caption } = b;

            loadPhotoContent(store, photo, null, IV_PHOTO_SIZE);
            loadPageBlockContent(store, caption);
            break;
        }
        case 'pageBlockPreformatted': {
            const { text } = b;

            loadRichTextContent(store, text);
            break;
        }
        case 'pageBlockPullQuote': {
            const { text, credit } = b;

            loadRichTextContent(store, text);
            loadRichTextContent(store, credit);
            break;
        }
        case 'pageBlockRelatedArticles': {
            const { header, articles } = b;

            loadRichTextContent(store, header);
            articles.forEach(x => loadPageBlockContent(store, x));
            break;
        }
        // actually not a pageBlock child but load content in the same way
        case 'pageBlockRelatedArticle': {
            const { photo } = b;

            loadPhotoContent(store, photo, null);
            break;
        }
        case 'pageBlockSlideshow': {
            const { page_blocks, caption } = b;

            loadPageBlockContent(store, caption);
            page_blocks.forEach(x => loadPageBlockContent(store, x));
            break;
        }
        case 'pageBlockSubheader': {
            const { subheader } = b;

            loadRichTextContent(store, subheader);
            break;
        }
        case 'pageBlockSubtitle': {
            const { subtitle } = b;

            loadRichTextContent(store, subtitle);
            break;
        }
        case 'pageBlockTable': {
            const { caption, cells } = b;

            loadRichTextContent(store, caption);
            cells.forEach(row => row.forEach(x => loadPageBlockContent(store, x)));
            break;
        }
        // actually not a pageBlock child but load content in the same way
        case 'pageBlockTableCell': {
            const { text } = b;

            loadRichTextContent(store, text);
            break;
        }
        case 'pageBlockTitle': {
            const { title } = b;

            loadRichTextContent(store, title);
            break;
        }
        case 'pageBlockVideo': {
            const { video, caption } = b;

            loadVideoThumbnailContent(store, video, null);
            loadVideoContent(store, video, null);
            loadPageBlockContent(store, caption);
            break;
        }
    }
}

function loadRichTextContent(store, t) {
    if (!t) return;

    switch (t['@type']) {
        case 'richTextAnchor': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextBold': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextEmailAddress': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextFixed': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextIcon': {
            const { document } = t;

            loadDocumentThumbnailContent(store, document, null);
            loadDocumentContent(store, document, null, false);
            break;
        }
        case 'richTextItalic': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextMarked': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextPhoneNumber': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextPlain': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTexts': {
            const { texts } = t;

            texts.forEach(x => loadRichTextContent(store, x));
            break;
        }
        case 'richTextStrikethrough': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextSubscript': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextSuperscript': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextUnderline': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
        case 'richTextUrl': {
            const { text } = t;

            loadRichTextContent(store, text);
            break;
        }
    }
}

function getAnimationData(file) {
    return new Promise(resolve => {
        if (!file) {
            resolve(null);
            return;
        }

        const blob = FileStore.getBlob(file.id);
        if (!blob) {
            resolve(null);
            return;
        }

        const fileReader = new FileReader();
        fileReader.onload = event => resolve(JSON.parse(event.target.result));
        fileReader.onerror = () => resolve(null);
        fileReader.onabort = () => resolve(null);
        fileReader.readAsText(blob);
    });
}

export {
    getFileSize,
    getSizeString,
    saveData,
    saveBlob,
    loadMessageContents,
    loadMediaViewerContent,
    preloadMediaViewerContent,
    cancelLoadMediaViewerContent,
    cancelPreloadMediaViewerContent,
    loadProfileMediaViewerContent,
    preloadProfileMediaViewerContent,
    loadChatContent,
    loadChatsContent,
    loadDraftContent,
    loadInstantViewContent,
    loadStickerContent,
    loadStickersContent,
    loadStickerSetContent,
    loadStickerThumbnailContent,
    loadUserContent,
    loadUsersContent,
    saveOrDownload,
    download,
    getMediaFile,
    getMediaPreviewFile,
    isGifMimeType,
    getSrc,
    getBlob,
    getDownloadedSize,
    getUploadedSize,
    getExtension,
    getViewerFile,
    getViewerThumbnail,
    getAnimationData
};
