/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { getAuthor, getMessageAudio } from './Message';
import { getBlockAudio } from './InstantView';
import { getSrc, supportsStreaming } from './File';
import { getAudioTitle } from './Media';
import PlayerStore from '../Stores/PlayerStore';

export function playlistItemEquals(item1, item2) {
    if (!item1) return false;
    if (!item2) return false;
    if (item1['@type'] !== item2['@type']) return false;

    switch (item1['@type']) {
        case 'message': {
            return item1.chat_id === item2.chat_id && item1.id === item2.id;
        }
    }

    return item1 === item2;
}

export function getMediaTitle(source, t = k => k) {
    if (!source) return null;

    switch (source['@type']) {
        case 'message': {
            const { content } = source;
            if (!content) return null;

            switch (content['@type']) {
                case 'messageAudio': {
                    const { audio } = content;
                    if (audio) {
                        return getAudioTitle(audio);
                    }
                    break;
                }
                case 'messageText': {
                    const { web_page } = content;
                    if (web_page) {
                        const { audio } = web_page;
                        if (audio) {
                            return getAudioTitle(audio);
                        }
                    }
                    break;
                }
            }

            return getAuthor(source, t);
        }
        case 'pageBlockAudio': {
            const { audio } = source;
            if (audio) {
                return getAudioTitle(audio);
            }

            return null;
        }
        case 'pageBlockVoiceNote': {

            return t('AttachAudio');
        }
    }

    return null;
}

export function getAudio(source) {
    if (!source) return null;

    switch (source['@type']) {
        case 'message': {
            return getMessageAudio(source.chat_id, source.id);
        }
        case 'pageBlockAudio': {
            return getBlockAudio(source);
        }
    }

    return false;
}

export function isCurrentSource(chatId, messageId, block, source) {
    if (!source) return false;

    switch (source['@type']) {
        case 'message': {
            return source.chat_id === chatId && source.id === messageId;
        }
        case 'instantViewSource': {
            return source.block === block;
        }
    }

    return false;
}

export function getCurrentTime(source) {
    if (!source) return { currentTime: 0, duration: 0 };

    let audio = null;
    switch (source['@type']) {
        case 'message': {
            const { chat_id, id } = source;
            audio = getMessageAudio(chat_id, id);
            break;
        }
        case 'instantViewSource': {
            const { block } = source;
            audio = getBlockAudio(block);
            break;
        }
    }

    if (!audio) return { currentTime: 0, duration: 0 };

    const { audio: file } = audio;
    if (!file) return { currentTime: 0, duration: 0 };

    const { remote } = file;
    if (!remote) return { currentTime: 0, duration: 0 };

    const { unique_id } = remote;
    if (!unique_id) return { currentTime: 0, duration: 0 };

    return PlayerStore.getCurrentTime(unique_id);
}

export function getMediaMimeType(source) {
    if (!source) return '';

    switch (source['@type']) {
        case 'message': {
            const { content } = source;
            if (content) {
                const { audio, voice_note, video_note, web_page } = content;

                if (audio) {
                    return audio.mime_type;
                }

                if (voice_note) {
                    return voice_note.mime_type;
                }

                if (video_note) {
                    return 'video/mp4';
                }

                if (web_page) {
                    if (web_page.audio) {
                        return web_page.audio.mime_type;
                    }

                    if (web_page.voice_note) {
                        return web_page.voice_note.mime_type;
                    }

                    if (web_page.video_note) {
                        return 'video/mp4';
                    }
                }
            }

            break;
        }
        case 'instantViewSource': {
            const { block } = source;
            if (block) {
                const { audio, voice_note, video_note } = block;

                if (audio) {
                    return audio.mime_type;
                }

                if (voice_note) {
                    return voice_note.mime_type;
                }

                if (video_note) {
                    return 'video/mp4';
                }
            }

            break;
        }
    }

    return '';
}

export function getMediaSrc(source) {
    if (!source) return '';

    switch (source['@type']) {
        case 'message': {
            const { content } = source;
            if (content) {
                const { audio, voice_note, video_note, web_page } = content;

                if (audio) {
                    const { audio: file } = audio;
                    if (file) {
                        let src = getSrc(file);
                        if (!src && supportsStreaming()) {
                            src = `/streaming/file?id=${file.id}&size=${file.size}&mime_type=${audio.mime_type}`;
                        }

                        return src;
                    }
                }

                if (voice_note) {
                    const { voice } = voice_note;
                    if (voice) {
                        return getSrc(voice);
                    }
                }

                if (video_note) {
                    const { video } = video_note;
                    if (video) {
                        return getSrc(video);
                    }
                }

                if (web_page) {
                    if (web_page.audio) {
                        const { audio: file } = web_page.audio;
                        if (file) {
                            let src = getSrc(file);
                            if (!src && supportsStreaming()) {
                                src = `/streaming/file?id=${file.id}&size=${file.size}&mime_type=${web_page.audio.mime_type}`;
                            }

                            return src;
                        }
                    }

                    if (web_page.voice_note) {
                        const { voice } = web_page.voice_note;
                        if (voice) {
                            return getSrc(voice);
                        }
                    }

                    if (web_page.video_note) {
                        const { video } = web_page.video_note;
                        if (video) {
                            return getSrc(video);
                        }
                    }
                }
            }

            break;
        }
        case 'instantViewSource': {
            const { block } = source;
            if (block) {
                const { audio, voice_note, video_note } = block;

                if (audio) {
                    const { audio: file } = audio;
                    if (file) {
                        let src = getSrc(file);
                        if (!src && supportsStreaming()) {
                            src = `/streaming/file?id=${file.id}&size=${file.size}&mime_type=${audio.mime_type}`;
                        }

                        return src;
                    }
                }

                if (voice_note) {
                    const { voice } = voice_note;
                    if (voice) {
                        return getSrc(voice);
                    }
                }

                if (video_note) {
                    const { video } = video_note;
                    if (video) {
                        return getSrc(video);
                    }
                }
            }

            break;
        }
    }

    return '';
}