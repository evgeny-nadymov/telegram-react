/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getPhotoSize, getPhotoThumbnailSize, getSize } from './Common';
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
    PRELOAD_VOICENOTE_SIZE,
    PRELOAD_VIDEONOTE_SIZE,
    FILE_PRIORITY,
    THUMBNAIL_PRIORITY,
    PHOTO_THUMBNAIL_SIZE,
    PRELOAD_AUDIO_SIZE
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

function getStickerThumbnailFile(message) {
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

    const { thumbnail } = sticker;
    if (!thumbnail) {
        return [0, '', ''];
    }

    const file = thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
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

function getWebPageStickerThumbnailFile(message) {
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

    const { sticker } = web_page;
    if (!sticker) {
        return [0, '', ''];
    }

    const { thumbnail } = sticker;
    if (!thumbnail) {
        return [0, '', ''];
    }

    const file = thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageVideoNoteThumbnailFile(message) {
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

    const { video_note } = web_page;
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

function getWebPageAudioThumbnailFile(message) {
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

    const { audio } = web_page;
    if (!audio) {
        return [0, '', ''];
    }

    const { cover_album_thumbnail } = audio;
    if (!cover_album_thumbnail) {
        return [0, '', ''];
    }

    const file = cover_album_thumbnail.photo;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageDocumentThumbnailFile(message) {
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

    const { document } = web_page;
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

function getWebPageVideoThumbnailFile(message) {
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

    const { video } = web_page;
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

function getAudioThumbnailFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageAudio') {
        return [0, '', ''];
    }

    const { audio } = content;
    if (!audio) {
        return [0, '', ''];
    }

    const { album_cover_thumbnail } = audio;
    if (!album_cover_thumbnail) {
        return [0, '', ''];
    }

    const file = album_cover_thumbnail.photo;
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

function getWebPageVideoFile(message) {
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

    const { video } = web_page;
    if (!video) {
        return [0, '', ''];
    }

    const file = video.video;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageVideoFileSize(message) {
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

    const { video } = web_page;
    if (!video) {
        return 0;
    }

    const file = video.video;
    if (file) {
        return file.size;
    }

    return 0;
}

function getWebPageStickerFile(message) {
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

    const { sticker } = web_page;
    if (!sticker) {
        return [0, '', ''];
    }

    const file = sticker.sticker;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageVoiceNoteFile(message) {
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

    const { voice_note } = web_page;
    if (!voice_note) {
        return [0, '', ''];
    }

    const file = voice_note.voice;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageVoiceNoteFileSize(message) {
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

    const { voice_note } = web_page;
    if (!voice_note) {
        return 0;
    }

    const file = voice_note.voice;
    if (file) {
        return file.size;
    }

    return 0;
}

function getWebPageVideoNoteFile(message) {
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

    const { video_note } = web_page;
    if (!video_note) {
        return [0, '', ''];
    }

    const file = video_note.video;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageVideoNoteFileSize(message) {
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

    const { video_note } = web_page;
    if (!video_note) {
        return 0;
    }

    const file = video_note.video;
    if (file) {
        return file.size;
    }

    return 0;
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

    const { animation } = web_page;
    if (!animation) {
        return 0;
    }

    const file = animation.animation;
    if (file) {
        return file.size;
    }

    return 0;
}

function getWebPageAudioFile(message) {
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

    const { audio } = web_page;
    if (!audio) {
        return [0, '', ''];
    }

    const file = audio.audio;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getWebPageAudioFileSize(message) {
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

    const { audio } = web_page;
    if (!audio) {
        return 0;
    }

    const file = audio.audio;
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

function getVoiceNoteFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageVoiceNote') {
        return [0, '', ''];
    }

    const { voice_note } = content;
    if (!voice_note) {
        return [0, '', ''];
    }

    const file = voice_note.voice;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getVoiceNoteFileSize(message) {
    if (message['@type'] !== 'message') {
        return 0;
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageVoiceNote') {
        return 0;
    }

    const { voice_note } = content;
    if (!voice_note) {
        return 0;
    }

    const file = voice_note.voice;
    if (file) {
        return file.size;
    }

    return 0;
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

function getAudioFile(message) {
    if (message['@type'] !== 'message') {
        return [0, '', ''];
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageAudio') {
        return [0, '', ''];
    }

    const { audio } = content;
    if (!audio) {
        return [0, '', ''];
    }

    const file = audio.audio;
    if (file && file.remote.id) {
        return [file.id, file.remote.id, file.idb_key];
    }

    return [0, '', ''];
}

function getAudioFileSize(message) {
    if (message['@type'] !== 'message') {
        return 0;
    }

    const { content } = message;
    if (!content || content['@type'] !== 'messageAudio') {
        return 0;
    }

    const { audio } = content;
    if (!audio) {
        return 0;
    }

    const file = audio.audio;
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
                idb_key,
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

    MessageStore.setItems(result.messages);

    for (let i = messageIds.length - 1; i >= 0; i--) {
        MessageStore.emit('getMessageResult', MessageStore.get(chatId, messageIds[i]));
    }

    store = FileStore.getStore();

    loadReplyContents(store, result.messages);
}

function loadReplyAnimationContent(store, animation, message) {
    if (!animation) return;

    const { thumbnail: photoSize } = animation;
    if (!photoSize) return;

    let { photo: file } = photoSize;
    file = FileStore.get(file.id) || file;
    if (!file) return;

    const { id, idb_key } = file;
    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        idb_key,
        null,
        () => FileStore.updateAnimationThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );
}

function loadReplyAudioContent(store, audio, message) {
    if (!audio) return;

    const { album_cover_thumbnail: photoSize } = audio;
    if (!photoSize) return;

    let { photo: file } = photoSize;
    file = FileStore.get(file.id) || file;
    if (!file) return;

    const { id, idb_key } = file;
    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        idb_key,
        null,
        () => FileStore.updateAudioThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );
}

function loadReplyDocumentContent(store, document, message) {
    if (!document) return;

    const { thumbnail: photoSize } = document;
    if (!photoSize) return;

    let { photo: file } = photoSize;
    file = FileStore.get(file.id) || file;
    if (!file) return;

    const { id, idb_key } = file;
    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        idb_key,
        null,
        () => FileStore.updateDocumentThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );
}

function loadReplyPhotoContent(store, photo, message) {
    if (!photo) return;

    const { sizes } = photo;
    if (!sizes) return;

    const photoSize = getPhotoSize(sizes);
    if (!photoSize) return;

    let { photo: file } = photoSize;
    file = FileStore.get(file.id) || file;
    if (!file) return;

    const { id, idb_key } = file;
    const blob = FileStore.getBlob(id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        idb_key,
        null,
        () => FileStore.updatePhotoBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, FILE_PRIORITY, message)
    );
}

function loadReplyStickerContent(store, sticker, message) {
    if (!sticker) return;

    const { thumbnail: photoSize } = sticker;
    if (!photoSize) return;

    let { photo: file } = photoSize;
    file = FileStore.get(file.id) || file;
    if (!file) return;

    const { id, idb_key } = file;
    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        idb_key,
        null,
        () => FileStore.updateStickerThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );
}

function loadReplyVideoContent(store, video, message) {
    if (!video) return;

    const { thumbnail: photoSize } = video;
    if (!photoSize) return;

    let { photo: file } = photoSize;
    file = FileStore.get(file.id) || file;
    if (!file) return;

    const { id, idb_key } = file;
    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        idb_key,
        null,
        () => FileStore.updateVideoThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );
}

function loadReplyVideoNoteContent(store, videoNote, message) {
    if (!videoNote) return;

    const { thumbnail: photoSize } = videoNote;
    if (!photoSize) return;

    let { photo: file } = photoSize;
    file = FileStore.get(file.id) || file;
    if (!file) return;

    const { id, idb_key } = file;
    const blob = FileStore.getBlob(file.id);
    if (blob) return;

    FileStore.getLocalFile(
        store,
        file,
        idb_key,
        null,
        () => FileStore.updateVideoNoteThumbnailBlob(message.chat_id, message.id, id),
        () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, message)
    );
}

function loadReplyGameContent(store, game, message) {
    if (!game) return;

    const { photo, animation } = game;

    if (animation) {
        const { thumbnail } = animation;
        if (thumbnail) {
            loadReplyAnimationContent(store, animation, message);
            return;
        }
    }

    loadReplyPhotoContent(store, photo, message);
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

                    loadReplyAnimationContent(store, animation, message);
                    break;
                }
                case 'messageAudio': {
                    const { audio } = content;

                    loadReplyAudioContent(store, audio, message);
                    break;
                }
                case 'messageDocument': {
                    const { document } = content;

                    loadReplyDocumentContent(store, document, message);
                    break;
                }
                case 'messageGame': {
                    const { game } = content;

                    loadReplyGameContent(store, game, message);
                    break;
                }
                case 'messagePhoto': {
                    const { photo } = content;

                    loadReplyPhotoContent(store, photo, message);
                    break;
                }
                case 'messageSticker': {
                    const { sticker } = content;

                    loadReplyStickerContent(store, sticker, message);
                    break;
                }
                case 'messageText': {
                    const { web_page } = content;
                    if (!web_page) break;

                    const { animation, audio, document, photo, sticker, video, video_note } = web_page;

                    if (photo) {
                        loadReplyPhotoContent(store, photo, message);
                        break;
                    }

                    if (animation) {
                        loadReplyAnimationContent(store, animation, message);
                        break;
                    }

                    if (audio) {
                        loadReplyAudioContent(store, audio, message);
                        break;
                    }

                    if (document) {
                        loadReplyDocumentContent(store, document, message);
                        break;
                    }

                    if (sticker) {
                        loadReplyStickerContent(store, sticker, message);
                        break;
                    }

                    if (video) {
                        loadReplyVideoContent(store, video, message);
                        break;
                    }

                    if (video_note) {
                        loadReplyVideoNoteContent(store, video_note, message);
                        break;
                    }

                    break;
                }
                case 'messageVideo': {
                    const { video } = content;

                    loadReplyVideoContent(store, video, message);
                    break;
                }
                case 'messageVideoNote': {
                    const { video_note } = content;

                    loadReplyVideoNoteContent(store, video_note, message);
                    break;
                }
            }
        }
    }
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
                case 'messageGame': {
                    const { game } = content;
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
                                        () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, id),
                                        () => FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage)
                                    );
                                }
                            }
                        }
                    }

                    const [id, pid, idb_key] = getGameAnimationFile(message);
                    if (pid) {
                        const file = animation.animation;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateAnimationBlob(localMessage.chat_id, localMessage.id, id),
                                () => {
                                    const fileSize = getGameAnimationFileSize(message);
                                    if (fileSize && fileSize < PRELOAD_ANIMATION_SIZE) {
                                        FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                    }
                                }
                            );
                        }
                    }

                    const [previewId, previewPid, previewIdbKey] = getGameAnimationThumbnailFile(message);
                    if (previewPid) {
                        const file = animation.thumbnail.photo;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                previewIdbKey,
                                null,
                                () =>
                                    FileStore.updateAnimationThumbnailBlob(
                                        localMessage.chat_id,
                                        localMessage.id,
                                        previewId
                                    ),
                                () => FileStore.getRemoteFile(previewId, FILE_PRIORITY, localMessage)
                            );
                        }
                    }
                    break;
                }
                case 'messageText': {
                    const { web_page } = content;
                    if (!web_page) {
                        break;
                    }

                    const { photo, animation, video, audio, document, voice_note, video_note, sticker } = web_page;
                    let loadPhoto = true;

                    if (sticker) {
                        const [id, pid, idb_key] = getWebPageStickerFile(message);
                        if (pid) {
                            loadPhoto = false;
                            const file = sticker.sticker;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updateStickerBlob(localMessage.chat_id, localMessage.id, id),
                                    () => {
                                        FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getWebPageStickerThumbnailFile(message);
                        if (previewPid) {
                            const file = sticker.thumbnail.photo;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateStickerThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            previewId
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                    }

                    if (voice_note) {
                        const [id, pid, idb_key] = getWebPageVoiceNoteFile(message);
                        if (pid) {
                            const file = voice_note.voice;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updateVoiceNoteBlob(localMessage.chat_id, localMessage.id, id),
                                    () => {
                                        const fileSize = getWebPageVoiceNoteFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_VOICENOTE_SIZE) {
                                            FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                        }
                                    }
                                );
                            }
                        }
                    }

                    if (video_note) {
                        const [id, pid, idb_key] = getWebPageVideoNoteFile(message);
                        if (pid) {
                            const file = video_note.video;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updateVideoNoteBlob(localMessage.chat_id, localMessage.id, id),
                                    () => {
                                        const fileSize = getWebPageVideoNoteFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_VIDEONOTE_SIZE) {
                                            FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getWebPageVideoNoteThumbnailFile(message);
                        if (previewPid) {
                            loadPhoto = false;
                            const file = video_note.thumbnail.photo;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateVideoNoteThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            previewId
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                    }

                    if (audio) {
                        const [id, pid, idb_key] = getWebPageAudioFile(message);
                        if (pid) {
                            const file = audio.audio;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updateAudioBlob(localMessage.chat_id, localMessage.id, id),
                                    () => {
                                        const fileSize = getWebPageAudioFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_AUDIO_SIZE) {
                                            FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getWebPageAudioThumbnailFile(message);
                        if (previewPid) {
                            loadPhoto = false;
                            const file = audio.album_cover_thumbnail.photo;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateAudioThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            previewId
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                    }

                    if (document) {
                        const [previewId, previewPid, previewIdbKey] = getWebPageDocumentThumbnailFile(message);
                        if (previewPid) {
                            loadPhoto = false;
                            const file = document.thumbnail.photo;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateDocumentThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            previewId
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                    }

                    if (video) {
                        const [previewId, previewPid, previewIdbKey] = getWebPageVideoThumbnailFile(message);
                        if (previewPid) {
                            loadPhoto = false;
                            const file = video.thumbnail.photo;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateVideoThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            previewId
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                    }

                    if (animation) {
                        const [id, pid, idb_key] = getWebPageAnimationFile(message);
                        if (pid) {
                            const file = animation.animation;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    idb_key,
                                    null,
                                    () => FileStore.updateAnimationBlob(localMessage.chat_id, localMessage.id, id),
                                    () => {
                                        const fileSize = getWebPageAnimationFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_ANIMATION_SIZE) {
                                            FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getWebPageAnimationThumbnailFile(message);
                        if (previewPid) {
                            loadPhoto = false;
                            const file = animation.thumbnail.photo;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateAnimationThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            previewId
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                    }

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
                                        () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, id),
                                        () => FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage)
                                    );
                                }
                            }
                        }
                    }
                    break;
                }
                case 'messagePhoto': {
                    const [previewId, previewPid, previewIdbKey] = getPhotoFile(message, PHOTO_THUMBNAIL_SIZE);
                    if (previewPid) {
                        const photoSize = getPhotoThumbnailSize(message.content.photo.sizes);
                        if (photoSize) {
                            const file = photoSize.photo;
                            const blob = FileStore.getBlob(file.id);
                            if (!blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    file,
                                    previewIdbKey,
                                    null,
                                    () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, previewId),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                    }

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
                                    () => FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage)
                                );
                            }
                        }
                    }
                    break;
                }
                case 'messageSticker': {
                    const { sticker } = content;
                    if (!sticker) {
                        break;
                    }

                    const [id, pid, idb_key] = getStickerFile(message);
                    if (pid) {
                        const file = sticker.sticker;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            let localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateStickerBlob(localMessage.chat_id, localMessage.id, id),
                                () => FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage)
                            );
                        }
                    }

                    const [previewId, previewPid, previewIdbKey] = getStickerThumbnailFile(message);
                    if (previewPid) {
                        const file = sticker.thumbnail.photo;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                previewIdbKey,
                                null,
                                () =>
                                    FileStore.updateStickerThumbnailBlob(
                                        localMessage.chat_id,
                                        localMessage.id,
                                        file.id
                                    ),
                                () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                            );
                        }
                    }
                    break;
                }
                case 'messageContact': {
                    const { contact } = content;
                    if (!contact) {
                        break;
                    }

                    const { user_id } = contact;
                    if (user_id > 0) {
                        const user = UserStore.get(user_id);
                        if (user) {
                            let [id, pid, idb_key] = getContactFile(message);
                            if (pid) {
                                const file = user.profile_photo.small;
                                const blob = FileStore.getBlob(file.id);
                                if (!blob) {
                                    FileStore.getLocalFile(
                                        store,
                                        file,
                                        idb_key,
                                        null,
                                        () => FileStore.updateUserPhotoBlob(user.id, id),
                                        () => FileStore.getRemoteFile(id, FILE_PRIORITY, user)
                                    );
                                }
                            }
                        }
                    }
                    break;
                }
                case 'messageVoiceNote': {
                    const { voice_note } = content;
                    if (!voice_note) {
                        break;
                    }

                    const [id, pid, idb_key] = getVoiceNoteFile(message);
                    if (pid) {
                        const file = voice_note.voice;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateVoiceNoteBlob(localMessage.chat_id, localMessage.id, id),
                                () => {
                                    const fileSize = getVoiceNoteFileSize(message);
                                    if (fileSize && fileSize < PRELOAD_VOICENOTE_SIZE) {
                                        FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                    }
                                }
                            );
                        }
                    }
                    break;
                }
                case 'messageVideoNote': {
                    const { video_note } = content;
                    if (!video_note) {
                        break;
                    }

                    const [id, pid, idb_key] = getVideoNoteFile(message);
                    if (pid) {
                        const file = video_note.video;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateVideoNoteBlob(localMessage.chat_id, localMessage.id, id),
                                () => {
                                    const fileSize = getVideoNoteFileSize(message);
                                    if (fileSize && fileSize < PRELOAD_VIDEONOTE_SIZE) {
                                        FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                    }
                                }
                            );
                        }
                    }

                    const [previewId, previewPid, previewIdbKey] = getVideoNoteThumbnailFile(message);
                    if (previewPid) {
                        const file = video_note.thumbnail.photo;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                previewIdbKey,
                                null,
                                () =>
                                    FileStore.updateVideoNoteThumbnailBlob(
                                        localMessage.chat_id,
                                        localMessage.id,
                                        previewId
                                    ),
                                () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                            );
                        }
                    }
                    break;
                }
                case 'messageAnimation': {
                    const { animation } = content;
                    if (!animation) {
                        break;
                    }

                    const [id, pid, idb_key] = getAnimationFile(message);
                    if (pid) {
                        const file = animation.animation;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateAnimationBlob(localMessage.chat_id, localMessage.id, id),
                                () => {
                                    const fileSize = getAnimationFileSize(message);
                                    if (fileSize && fileSize < PRELOAD_ANIMATION_SIZE) {
                                        FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                    }
                                }
                            );
                        }
                    }

                    const [previewId, previewPid, previewIdbKey] = getAnimationThumbnailFile(message);
                    if (previewPid) {
                        const file = animation.thumbnail.photo;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                previewIdbKey,
                                null,
                                () =>
                                    FileStore.updateAnimationThumbnailBlob(
                                        localMessage.chat_id,
                                        localMessage.id,
                                        previewId
                                    ),
                                () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                            );
                        }
                    }
                    break;
                }
                case 'messageVideo': {
                    const { video } = content;
                    if (!video) {
                        break;
                    }

                    const [id, pid, idb_key] = getVideoThumbnailFile(message);
                    if (pid) {
                        const file = video.thumbnail.photo;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateVideoThumbnailBlob(localMessage.chat_id, localMessage.id, id),
                                () => FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage)
                            );
                        }
                    }
                    break;
                }
                case 'messageAudio': {
                    const { audio } = content;
                    if (!audio) {
                        break;
                    }

                    const [id, pid, idb_key] = getAudioFile(message);
                    if (pid) {
                        const file = audio.audio;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateAudioBlob(localMessage.chat_id, localMessage.id, id),
                                () => {
                                    const fileSize = getAudioFileSize(message);
                                    if (fileSize && fileSize < PRELOAD_AUDIO_SIZE) {
                                        FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                    }
                                }
                            );
                        }
                    }

                    const [previewId, previewPid, previewIdbKey] = getAudioThumbnailFile(message);
                    if (previewPid) {
                        const file = audio.album_cover_thumbnail.photo;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                previewIdbKey,
                                null,
                                () =>
                                    FileStore.updateAudioThumbnailBlob(
                                        localMessage.chat_id,
                                        localMessage.id,
                                        previewId
                                    ),
                                () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                            );
                        }
                    }
                    break;
                }
                case 'messageDocument': {
                    const { document } = content;
                    if (!document) {
                        break;
                    }

                    const [id, pid, idb_key] = getDocumentThumbnailFile(message);
                    if (pid) {
                        const file = document.thumbnail.photo;
                        const blob = FileStore.getBlob(file.id);
                        if (!blob) {
                            const localMessage = message;
                            FileStore.getLocalFile(
                                store,
                                file,
                                idb_key,
                                null,
                                () => FileStore.updateDocumentThumbnailBlob(localMessage.chat_id, localMessage.id, id),
                                () => FileStore.getRemoteFile(id, THUMBNAIL_PRIORITY, localMessage)
                            );
                        }
                    }
                    break;
                }
                case 'messageLocation': {
                    const { location } = content;
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
                                    () => FileStore.updateLocationBlob(localMessage.chat_id, localMessage.id, file.id),
                                    () => FileStore.getRemoteFile(file.id, FILE_PRIORITY, localMessage)
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
                                            () => FileStore.getRemoteFile(result.id, FILE_PRIORITY, localMessage)
                                        );
                                    }
                                }
                            });
                        }
                    }
                    break;
                }
                case 'messageVenue': {
                    const { venue } = content;
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
                                    () => FileStore.updateLocationBlob(localMessage.chat_id, localMessage.id, file.id),
                                    () => FileStore.getRemoteFile(file.id, FILE_PRIORITY, localMessage)
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
                                            () => FileStore.getRemoteFile(result.id, FILE_PRIORITY, localMessage)
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

    loadUserPhotos(store, [...users.keys()]);
    loadReplies(store, chatId, [...replies.keys()]);
}

function saveOrDownload(file, fileName, obj, onDownload) {
    if (!file) return;
    if (!fileName) return;

    if (file.arr) {
        saveData(file.arr, fileName);
        if (onDownload) onDownload();
        return;
    }

    if (file.blob) {
        saveBlob(file.blob, fileName);
        if (onDownload) onDownload();
        return;
    }

    const blob = FileStore.getBlob(file.id);
    if (blob) {
        saveBlob(blob, fileName);
        if (onDownload) onDownload();
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
                    if (onDownload) onDownload();
                }
            },
            () => {
                if (file.local.can_be_downloaded) {
                    FileStore.getRemoteFile(file.id, FILE_PRIORITY, obj);
                }
            }
        );
        return;
    }

    if (file.local.can_be_downloaded) {
        FileStore.getRemoteFile(file.id, FILE_PRIORITY, obj);
    }
}

function download(file, obj) {
    const blob = FileStore.getBlob(file.id);
    if (blob) {
        return;
    }

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
                    FileStore.getRemoteFile(file.id, FILE_PRIORITY, obj);
                }
            }
        );
        return;
    }

    if (file.local.can_be_downloaded) {
        FileStore.getRemoteFile(file.id, FILE_PRIORITY, obj);
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

                    // file
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
                case 'messageText': {
                    const { web_page } = message.content;
                    if (web_page) {
                        const { video } = web_page;

                        if (video) {
                            // preview
                            const [previewId, previewPid, previewIdbKey] = getWebPageVideoThumbnailFile(message);
                            if (previewPid) {
                                const file = video.thumbnail.photo;
                                const blob = file.blob || FileStore.getBlob(file.id);
                                if (!blob) {
                                    TdLibController.send({
                                        '@type': 'cancelDownloadFile',
                                        file_id: file.id,
                                        only_if_pending: false
                                    });
                                }
                            }

                            // file
                            const [id, pid, idb_key] = getWebPageVideoFile(message);
                            if (pid) {
                                const file = video.video;
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

                    const { photo, animation, video } = web_page;
                    let loadPhoto = true;

                    if (video) {
                        const [id, pid, idb_key] = getWebPageVideoFile(message);
                        if (pid) {
                            const obj = video.video;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    idb_key,
                                    null,
                                    () => FileStore.updateVideoBlob(localMessage.chat_id, localMessage.id, obj.id),
                                    () => {
                                        const fileSize = getWebPageVideoFileSize(message);
                                        if (fileSize && fileSize < PRELOAD_VIDEO_SIZE) {
                                            FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getWebPageVideoThumbnailFile(message);
                        if (previewPid) {
                            loadPhoto = false;
                            const obj = video.thumbnail.photo;
                            if (!obj.blob) {
                                const localMessage = message;
                                FileStore.getLocalFile(
                                    store,
                                    obj,
                                    previewIdbKey,
                                    null,
                                    () =>
                                        FileStore.updateVideoThumbnailBlob(
                                            localMessage.chat_id,
                                            localMessage.id,
                                            obj.id
                                        ),
                                    () => FileStore.getRemoteFile(previewId, THUMBNAIL_PRIORITY, localMessage)
                                );
                            }
                        }
                    }

                    if (animation) {
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
                                            FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
                                        }
                                    }
                                );
                            }
                        }

                        const [previewId, previewPid, previewIdbKey] = getWebPageAnimationThumbnailFile(message);
                        if (previewPid) {
                            loadPhoto = false;
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
                    }

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
                                        () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, id),
                                        () => FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage)
                                    );
                                }
                            }
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
                                    () => FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage)
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
                                () => FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage)
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
                                        FileStore.getRemoteFile(id, FILE_PRIORITY, localMessage);
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
                                    idb_key,
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
                                    idb_key,
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
            idb_key,
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
            idb_key,
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
    getSrc,
    getBlob,
    getDownloadedSize,
    getUploadedSize,
    getExtension
};
