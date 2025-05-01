/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Animation from '../Components/Message/Media/Animation';
import Audio from '../Components/Message/Media/Audio';
import Call from '../Components/Message/Media/Call';
import Contact from '../Components/Message/Media/Contact';
import Document from '../Components/Message/Media/Document';
import Game from '../Components/Message/Media/Game';
import Location from '../Components/Message/Media/Location';
import Photo from '../Components/Message/Media/Photo';
import Poll from '../Components/Message/Media/Poll';
import Sticker, { StickerSourceEnum } from '../Components/Message/Media/Sticker';
import Venue from '../Components/Message/Media/Venue';
import Video from '../Components/Message/Media/Video';
import VideoNote from '../Components/Message/Media/VideoNote';
import VoiceNote from '../Components/Message/Media/VoiceNote';
import { ID3Parser } from '../Components/Player/Steaming/MP3/ID3Parser';
import { getRandomInt, readImageSize } from './Common';
import { PHOTO_DISPLAY_SIZE, THUMBNAIL_BLURRED_SIZE_90 } from '../Constants';
import FileStore from '../Stores/FileStore';
import MessageStore from '../Stores/MessageStore';
import { getSrc } from './File';
import classNames from 'classnames';
import UserStore from '../Stores/UserStore';

const waveformCache = new Map();

export function getNormalizedWaveform(data) {
    if (waveformCache.has(data)) {
        return waveformCache.get(data);
    }

    const bytes = Array.from(atob(data)).map(x => x.charCodeAt(0) & 0xFF);
    const waveform = [];
    const barsCount = Math.floor(bytes.length * 8 / 5);
    for (let i = 0; i < barsCount; i++) {
        const byteIndex = Math.floor(i * 5 / 8);
        const barPadding = i * 5 % 8;

        const bits = bytes[byteIndex] | (((byteIndex + 1 < bytes.length) ? bytes[byteIndex + 1] : 0) << 8);
        waveform.push(((bits >>> barPadding) & 0x1F) / 31.0);
    }

    for (let i = 0; i < (100 - barsCount); i++) {
        waveform.push(0);
    }

    waveformCache.set(data, waveform);

    return waveform;
}

export function getThumb(thumbnail, minithumbnail, width, height) {
    const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
    const thumbnailSrc = getSrc(thumbnail ? thumbnail.file : null);
    const isBlurred = thumbnailSrc ? isBlurredThumbnail({ width: thumbnail.width, height: thumbnail.height }) : Boolean(miniSrc);

    let thumb;
    if (thumbnailSrc) {
        switch (thumbnail.format['@type']) {
            case 'thumbnailFormatJpeg':
            case 'thumbnailFormatPng':
            case 'thumbnailFormatWebp':
            case 'thumbnailFormatGif': {
                thumb = (
                    <img
                        className={classNames('media-viewer-content-video-thumbnail', {
                            'media-blurred': isBlurred
                        })}
                        src={thumbnailSrc}
                        alt=''
                        width={width}
                        height={height}
                    />
                );
                break;
            }
            case 'thumbnailFormatTgs': {
                thumb = (
                    <div
                        className='media-viewer-content-video-thumbnail'
                        style={{ width, height }}
                    />
                );
                break;
            }
            case 'thumbnailFormatMpeg4': {
                thumb = (
                    <video
                        className={classNames('media-viewer-content-video-thumbnail', {
                            'media-blurred': isBlurred
                        })}
                        src={thumbnailSrc}
                        autoPlay={false}
                        loop
                        playsInline
                        width={width}
                        height={height}
                    >
                        <source src={thumbnailSrc} type='video/mp4'/>
                    </video>
                );
                break;
            }
            default: {
                thumb = (
                    <div
                        className='media-viewer-content-video-thumbnail'
                        style={{ width, height }}
                    />
                );
            }
        }
    } else if (miniSrc) {
        thumb = (
            <img
                className={classNames('media-viewer-content-video-thumbnail', {
                    'media-blurred': isBlurred
                })}
                src={miniSrc}
                alt=''
                width={width}
                height={height}
            />
        );
    } else {
        thumb = (
            <div
                className='media-viewer-content-video-thumbnail'
                style={{ width, height }}
            />
        );
    }

    return thumb;
}

export function getCallTitle(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return null;

    const { content, is_outgoing } = message;
    if (content['@type'] !== 'messageCall') return null;

    const { discard_reason, duration } = content;
    if (is_outgoing) {
        return discard_reason['@type'] === 'callDiscardReasonMissed' ? 'Cancelled Call' : 'Outgoing Call';
    } else if (discard_reason['@type'] === 'callDiscardReasonMissed') {
        return 'Missed Call';
    } else if (discard_reason['@type'] === 'callDiscardReasonDeclined') {
        return 'Declined Call';
    }

    return 'Incoming Call';
}

export function isEditedMedia(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return;

    const { content } = message;
    switch (content['@type']) {
        case 'messageAnimation': {
            return true;
        }
        case 'messageAudio': {
            return true;
        }
        case 'messageDocument': {
            return true;
        }
        case 'messagePhoto': {
            return true;
        }
        case 'messageVideo': {
            return true;
        }
    }

    return false;
}

export function isValidAnimatedSticker(sticker, chatId, messageId) {
    if (!sticker) return false;
    if (!sticker.is_animated) return false;

    const message = MessageStore.get(chatId, messageId);
    if (message) {
        const { sending_state } = message;
        if (sending_state && !sticker.set_id) return false;
    }

    return true;
}

export function isBlurredThumbnail(thumbnail, displaySize = PHOTO_DISPLAY_SIZE, blurredSize = THUMBNAIL_BLURRED_SIZE_90) {
    if (!thumbnail) return false;
    // if (displaySize <= blurredSize * 2) return false;

    return Math.max(thumbnail.width, thumbnail.height) <= blurredSize;
}

export function getAudioTitle(audio) {
    if (!audio) return null;

    const { file_name, title, performer } = audio;
    const trimmedTitle = title ? title.trim() : '';
    const trimmedPerformer = performer ? performer.trim() : '';

    return trimmedTitle || trimmedPerformer
        ? `${trimmedPerformer || 'Unknown Artist'} — ${trimmedTitle || 'Unknown Track'}`
        : file_name;
}

export function getAudioShortTitle(audio) {
    if (!audio) return null;

    const { file_name, title, performer } = audio;
    const trimmedTitle = title ? title.trim() : '';
    const trimmedPerformer = performer ? performer.trim() : '';

    return trimmedTitle || trimmedPerformer ? `${trimmedPerformer || 'Unknown Artist'}` : file_name;
}

export function getAudioSubtitle(audio) {
    if (!audio) return null;

    const { title } = audio;
    const trimmedTitle = title ? title.trim() : '';

    return trimmedTitle || 'Unknown Track';
}

export function getStickers(sets) {
    return sets.reduce((stickers, set) => stickers.concat(set.stickers), []);
}

export function getNeighborStickersFromSets(sticker, sets, stickersPerRow) {
    const result = [];
    const [row, column] = toRowColumn(sticker, sets, stickersPerRow);
    if (row === -1) return [];
    if (column === -1) return [];

    const prevPrevRow = row - 2;
    const prevRow = row - 1;
    const nextRow = row + 1;
    const nextNextRow = row + 2;

    const prevColumn = column - 1;
    const nextColumn = column + 1;

    let skipPrevRow = prevRow < 0;
    let skipPrePrevRow = prevPrevRow < 0;
    if (!skipPrevRow) {
        if (prevColumn >= 0) {
            let index = toIndex(prevRow, prevColumn, sets, stickersPerRow);
            if (index === -1) {
                skipPrevRow = true;
                index = skipPrePrevRow ? -1 : toIndex(prevPrevRow, prevColumn, sets, stickersPerRow);
                skipPrePrevRow = index === -1;
            }
            if (index !== -1) {
                result.push(index);
            }
        }

        let index = skipPrevRow ? -1 : toIndex(prevRow, column, sets, stickersPerRow);
        if (index === -1) {
            skipPrevRow = true;
            index = skipPrePrevRow ? -1 : toIndex(prevPrevRow, column, sets, stickersPerRow);
            skipPrePrevRow = index === -1;
        }
        if (index !== -1) {
            result.push(index);
        }

        if (nextColumn < stickersPerRow) {
            let index = skipPrevRow ? -1 : toIndex(prevRow, nextColumn, sets, stickersPerRow);
            if (index === -1) {
                index = skipPrePrevRow ? -1 : toIndex(prevPrevRow, nextColumn, sets, stickersPerRow);
            }
            if (index !== -1) {
                result.push(index);
            }
        }
    }

    if (prevColumn >= 0) {
        const index = toIndex(row, prevColumn, sets, stickersPerRow);
        if (index !== -1) {
            result.push(index);
        }
    }

    if (nextColumn < stickersPerRow) {
        const index = toIndex(row, nextColumn, sets, stickersPerRow);
        if (index !== -1) {
            result.push(index);
        }
    }

    let totalRows = sets.reduce((totalRows, set) => totalRows + Math.ceil(set.stickers.length / stickersPerRow), 0);
    let skipNextRow = nextRow >= totalRows;
    let skipNextNextRow = nextRow >= totalRows;
    if (!skipNextRow) {
        if (prevColumn >= 0) {
            let index = toIndex(nextRow, prevColumn, sets, stickersPerRow);
            if (index === -1) {
                skipNextRow = true;
                index = skipNextNextRow ? -1 : toIndex(nextNextRow, prevColumn, sets, stickersPerRow);
                skipNextNextRow = index === -1;
            }
            if (index !== -1) {
                result.push(index);
            }
        }

        let index = skipNextRow ? -1 : toIndex(nextRow, column, sets, stickersPerRow);
        if (index === -1) {
            skipNextRow = true;
            index = skipNextNextRow ? -1 : toIndex(nextNextRow, column, sets, stickersPerRow);
            skipNextNextRow = index === -1;
        }
        if (index !== -1) {
            result.push(index);
        }

        if (nextColumn < stickersPerRow) {
            let index = skipNextRow ? -1 : toIndex(nextRow, nextColumn, sets, stickersPerRow);
            if (index === -1) {
                index = skipNextNextRow ? -1 : toIndex(nextNextRow, nextColumn, sets, stickersPerRow);
            }
            if (index !== -1) {
                result.push(index);
            }
        }
    }

    const items = getStickers(sets);
    return result.map(x => items[x]);
}

function toRowColumn(sticker, sets, stickersPerRow) {
    const setIndex = sets.findIndex(x => x.id === sticker.set_id);
    if (setIndex === -1) return [-1, -1];

    const stickerIndex = sets[setIndex].stickers.findIndex(x => x.sticker.id === sticker.sticker.id);
    if (stickerIndex === -1) return [-1, -1];

    let prevRows = 0;
    for (let i = 0; i < setIndex; i++) {
        prevRows += Math.ceil(sets[i].stickers.length / stickersPerRow);
    }

    return [prevRows + Math.floor(stickerIndex / stickersPerRow), stickerIndex % stickersPerRow];
}

function toIndex(row, column, sets, stickersPerRow) {
    let index = -1;
    let totalRows = 0;
    let setIndex = -1;
    for (let i = 0; i < sets.length; i++) {
        let setRows = Math.ceil(sets[i].stickers.length / stickersPerRow);
        totalRows += setRows;
        if (totalRows > row) {
            setIndex = i;
            break;
        }
    }
    if (setIndex === -1) return index;

    let setRow = row;
    let setColumn = column;
    for (let i = 0; i < setIndex; i++) {
        let setRows = Math.ceil(sets[i].stickers.length / stickersPerRow);
        setRow -= setRows;
    }

    index = stickersPerRow * setRow + setColumn;

    if (index >= sets[setIndex].stickers.length) return -1;

    for (let i = 0; i < setIndex; i++) {
        index += sets[i].stickers.length;
    }

    return index;
}

function getInputMediaThumbnail(thumbnail) {
    if (!thumbnail) return null;

    const { file, width, height } = thumbnail;
    if (!file) return null;

    return {
        '@type': 'inputThumbnail',
        thumbnail: {
            '@type': 'inputFileId',
            id: file.id
        },
        width,
        height
    };
}

function getInputMediaCaption(text) {
    if (!text) return null;

    return {
        '@type': 'formattedText',
        text: text,
        entities: null
    };
}

export function getInputMediaContent(media, text) {
    if (!media) return null;

    switch (media['@type']) {
        case 'animation': {
            const { animation: file, thumbnail, width, height, duration } = media;

            return {
                '@type': 'inputMessageAnimation',
                animation: {
                    '@type': 'inputFileId',
                    id: file.id
                },
                thumbnail: getInputMediaThumbnail(thumbnail),
                duration,
                width,
                height,
                caption: getInputMediaCaption(text)
            };
        }
        case 'audio': {
            const { audio: file, album_cover_thumbnail: thumbnail, title, performer, duration } = media;

            return {
                '@type': 'inputMessageAudio',
                audio: {
                    '@type': 'inputFileId',
                    id: file.id
                },
                album_cover_thumbnail: getInputMediaThumbnail(thumbnail),
                duration,
                title,
                performer,
                caption: getInputMediaCaption(text)
            };
        }
        case 'contact': {
            return {
                '@type': 'inputMessageContact',
                contact: media
            };
        }
        case 'document': {
            const { document: file, thumbnail } = media;

            return {
                '@type': 'inputMessageDocument',
                document: {
                    '@type': 'inputFileId',
                    id: file.id
                },
                thumbnail: getInputMediaThumbnail(thumbnail),
                caption: getInputMediaCaption(text)
            };
        }
        case 'game': {
            return null;
        }
        case 'invoice': {
            return null;
        }
        case 'location': {
            return {
                '@type': 'inputMessageLocation',
                location: media,
                live_period: 0
            };
        }
        case 'photo': {
            const { sizes } = media;
            if (!sizes.length) return null;

            const thumbnail = sizes[0];
            const photo = sizes[sizes.length - 1];
            if (!photo) return null;

            const { photo: file, width, height } = photo;

            return {
                '@type': 'inputMessagePhoto',
                photo: {
                    '@type': 'inputFileId',
                    id: file.id
                },
                thumbnail: getInputMediaThumbnail(thumbnail),
                added_sticker_file_ids: [],
                width,
                height,
                caption: getInputMediaCaption(text),
                ttl: 0
            };
        }
        case 'poll': {
            return null;
        }
        case 'sticker': {
            const { sticker: file, thumbnail, width, height } = media;

            return {
                '@type': 'inputMessageSticker',
                sticker: {
                    '@type': 'inputFileId',
                    id: file.id
                },
                thumbnail: getInputMediaThumbnail(thumbnail),
                width,
                height,
                caption: getInputMediaCaption(text)
            };
        }
        case 'venue': {
            return {
                '@type': 'inputMessageVenue',
                venue: media
            };
        }
        case 'video': {
            const { video: file, thumbnail, width, height, duration, supports_streaming } = media;

            return {
                '@type': 'inputMessageVideo',
                video: {
                    '@type': 'inputFileId',
                    id: file.id
                },
                thumbnail: getInputMediaThumbnail(thumbnail),
                added_sticker_file_ids: [],
                duration,
                width,
                height,
                supports_streaming,
                caption: getInputMediaCaption(text),
                ttl: 0
            };
        }
        case 'videoNote': {
            const { video: file, thumbnail, duration, length } = media;

            return {
                '@type': 'inputMessageVideoNote',
                video: {
                    '@type': 'inputFileId',
                    id: file.id
                },
                thumbnail: getInputMediaThumbnail(thumbnail),
                duration,
                length,
                ttl: 0
            };
        }
        case 'voiceNote': {
            const { voice: file, duration, waveform } = media;

            return {
                '@type': 'inputMessageVideoNote',
                voice_note: {
                    '@type': 'inputFileId',
                    id: file.id
                },
                duration,
                waveform
            };
        }
    }

    return null;
}

export function getMedia(message, openMedia, options = {}) {
    if (!message) return null;

    const { hasTitle = false, hasCaption = false, inlineMeta = null, meta = null, date = null } = options;

    const { chat_id, id, content } = message;
    if (!content) return null;

    switch (content['@type']) {
        case 'messageAnimation':
            return (
                <Animation
                    type='message'
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    animation={content.animation}
                    openMedia={openMedia}
                    stretch={true}
                />
            );
        case 'messageAudio':
            return (
                <Audio
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    audio={content.audio}
                    openMedia={openMedia}
                    meta={inlineMeta}
                    date={date}
                />
            );
        case 'messageCall':
            return (
                <Call
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    duraton={content.duration}
                    discardReason={content.discard_reason}
                    openMedia={openMedia}
                    meta={inlineMeta}
                />
            );
        case 'messageContact':
            return (
                <Contact
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    contact={content.contact}
                    openMedia={openMedia}
                    meta={inlineMeta}
                />
            );
        case 'messageDocument':
            return (
                <Document
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    document={content.document}
                    openMedia={openMedia}
                    meta={inlineMeta}
                    date={date}
                />
            );
        case 'messageGame':
            return (
                <Game
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    game={content.game}
                    openMedia={openMedia}
                    meta={inlineMeta}
                />
            );
        case 'messageLocation':
            return (
                <Location
                    type='message'
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    location={content.location}
                    openMedia={openMedia}
                />
            );
        case 'messagePhoto':
            return (
                <Photo
                    type='message'
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    photo={content.photo}
                    openMedia={openMedia}
                    stretch={true}
                />
            );
        case 'messagePoll':
            return <Poll chatId={chat_id} messageId={id} poll={content.poll} openMedia={openMedia} meta={inlineMeta} />;
        case 'messageSticker':
            return (
                <Sticker
                    chatId={chat_id}
                    messageId={id}
                    sticker={content.sticker}
                    openMedia={openMedia}
                    source={StickerSourceEnum.MESSAGE}
                    meta={meta}
                />
            );
        case 'messageText':
            return null;
        case 'messageVenue':
            return (
                <Venue
                    type='message'
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    venue={content.venue}
                    openMedia={openMedia}
                    meta={inlineMeta}
                />
            );
        case 'messageVideo':
            return (
                <Video
                    type='message'
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    video={content.video}
                    openMedia={openMedia}
                    stretch={true}
                />
            );
        case 'messageVideoNote':
            return (
                <VideoNote
                    type='message'
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    videoNote={content.video_note}
                    openMedia={openMedia}
                    meta={meta}
                />
            );
        case 'messageVoiceNote':
            return (
                <VoiceNote
                    type='message'
                    title={hasTitle}
                    caption={hasCaption}
                    chatId={chat_id}
                    messageId={id}
                    voiceNote={content.voice_note}
                    openMedia={openMedia}
                    meta={inlineMeta}
                />
            );
        default:
            return [`[${content['@type']}]`, inlineMeta];
    }
}

export async function getMediaTags(file) {
    return new Promise(async resolve => {
        const tag = await new ID3Parser().parse(file);

        const { tags } = tag;
        const { artist, title } = tags;

        const audio = document.createElement('audio');
        const url = URL.createObjectURL(file);

        audio.src = url;
        audio.addEventListener('loadedmetadata', function(){
            URL.revokeObjectURL(url);
            const duration = audio.duration;
            audio.src = null;
            resolve({ title, performer : artist, duration : Math.trunc(duration) });
        },false);
        audio.addEventListener('error', function() {
            resolve(null);
        });
    })
}

export async function getMediaDocumentFromFile(file) {
    if (!file) {
        return null;
    }

    const fileId = -getRandomInt(1, 1000000);
    FileStore.setBlob(fileId, file);

    const { name, type, size } = file;

    if (type === 'audio/mp3') {
        const tags = await getMediaTags(file);
        if (tags) {
            const { title, performer, duration } = tags;

            return ({
                '@type': 'messageAudio',
                audio: {
                    '@type': 'audio',
                    duration,
                    title,
                    performer,
                    file_name: name,
                    mime_type: type,
                    album_cover_minithumbnail: null,
                    album_cover_thumbnail: null,
                    audio: {
                        '@type': 'file',
                        id: fileId,
                        size,
                        expected_size: size,
                        local: {
                            is_downloading_completed: true
                        }
                    }
                }
            });
        }
    }

    return ({
        '@type': 'messageDocument',
        document: {
            '@type': 'document',
            file_name: name,
            mime_type: type,
            minithumbnail: null,
            thumbnail: null,
            document: {
                '@type': 'file',
                id: fileId,
                size,
                expected_size: size,
                local: {
                    is_downloading_completed: true
                }
            }
        }
    });
}

export async function getMediaPhotoFromFile(file) {
    if (!file) {
        return null;
    }

    if (file.type.startsWith('image')) {
        const [width, height] = await readImageSize(file);

        const fileId = -getRandomInt(1, 1000000);
        FileStore.setBlob(fileId, file);

        const photoSize = {
            '@type': 'photoSize',
            photo: {
                '@type': 'file',
                id: fileId,
                size: file.size,
                expected_size: file.expected_size,
                local: {
                    is_downloading_completed: true
                }
            },
            width,
            height
        };

        return ({
            '@type': 'messagePhoto',
            photo: {
                '@type': 'photo',
                has_stickers: false,
                minithumbnail: null,
                sizes: [ photoSize ]
            }
        });
    } else {
        return null;
    }
}
