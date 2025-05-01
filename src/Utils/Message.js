/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import emojiRegex from 'emoji-regex';
import MentionLink from '../Components/Additional/MentionLink';
// import Poll from '../Components/Message/Media/Poll';
import SafeLink from '../Components/Additional/SafeLink';
import dateFormat from '../Utils/Date';
import { searchChat, setMediaViewerContent } from '../Actions/Client';
import { getChatTitle, isMeChat } from './Chat';
import { openUser } from './../Actions/Client';
import { getFitSize, getPhotoSize, getSize } from './Common';
import { download, saveOrDownload, supportsStreaming } from './File';

// import { getAudioSubtitle, getAudioTitle } from './Media';
import { getAudioTitle } from './Media';

import { getDecodedUrl } from './Url';
import { getServiceMessageContent } from './ServiceMessage';
import { getUserFullName } from './User';
import { getBlockAudio } from './InstantView';
import { LOCATION_HEIGHT, LOCATION_SCALE, LOCATION_WIDTH, LOCATION_ZOOM, PHOTO_DISPLAY_SIZE, PHOTO_SIZE, PLAYER_AUDIO_2X_MIN_DURATION } from '../Constants';
import AppStore from '../Stores/ApplicationStore';
import ChatStore from '../Stores/ChatStore';
import FileStore from '../Stores/FileStore';
import MessageStore from '../Stores/MessageStore';
import PlayerStore from '../Stores/PlayerStore';
import UserStore from '../Stores/UserStore';
import TdLibController from '../Controllers/TdLibController';

export function isMetaBubble(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) {
        return false;
    }

    const { content } = message;
    if (!content) {
        return false;
    }

    const { caption } = content;
    if (caption && caption.text && caption.text.length > 0) {
        return false;
    }

    switch (content['@type']) {
        case 'messageAnimation': {
            return true;
        }
        case 'messageLocation': {
            return true;
        }
        case 'messagePhoto': {
            return true;
        }
        case 'messageSticker': {
            return true;
        }
        case 'messageVideo': {
            return true;
        }
        case 'messageVideoNote': {
            return true;
        }
    }

    return false;
}

export function isMessageUnread(chatId, messageId) {
    const chat = ChatStore.get(chatId);
    if (!chat) {
        return false;
    }

    const { last_read_inbox_message_id, last_read_outbox_message_id } = chat;

    const message = MessageStore.get(chatId, messageId);
    if (!message) {
        return false;
    }

    const { id, is_outgoing } = message;
    const isMe = isMeChat(chatId);
    if (is_outgoing && isMe) {
        return false;
    }

    return is_outgoing ? id > last_read_outbox_message_id : id > last_read_inbox_message_id;
}

function getAuthor(message, t = k => k) {
    if (!message) return null;

    const { forward_info } = message;

    if (forward_info) {
        switch (forward_info['@type']) {
            case 'messageForwardedFromUser': {
                if (forward_info.sender_user_id > 0) {
                    const user = UserStore.get(forward_info.sender_user_id);
                    if (user) {
                        return getUserFullName(forward_info.sender_user_id, null, t);
                    }
                }
                break;
            }
            case 'messageForwardedPost': {
                const chat = ChatStore.get(forward_info.chat_id);
                if (chat) {
                    return chat.title;
                }
                break;
            }
        }
    }

    return getTitle(message, t);
}

function getTitle(message, t = k => k) {
    if (!message) return null;

    const { sender_user_id, chat_id } = message;

    if (sender_user_id) {
        const user = UserStore.get(sender_user_id);
        if (user) {
            return getUserFullName(sender_user_id, null, t);
        }
    }

    if (chat_id) {
        const chat = ChatStore.get(chat_id);
        if (chat) {
            return chat.title;
        }
    }

    return null;
}

function substring(text, start, end) {
    if (start < 0) start = 0;
    if (start > text.length - 1) start = text.length - 1;
    if (end < start) end = start;
    if (end > text.length) end = text.length;

    return text.substring(start, end);
}

function stopPropagation(event) {
    event.stopPropagation();
}

function searchCurrentChat(event, text) {
    event.stopPropagation();
    event.preventDefault();

    const { chatId } = AppStore;

    searchChat(chatId, text);
}

function getFormattedText(formattedText, t = k => k) {
    if (formattedText['@type'] !== 'formattedText') return null;

    const { text, entities } = formattedText;
    if (!text) return null;
    if (!entities) return [text];
    if (!entities.length) return [text];

    let deleteLineBreakAfterPre = false;
    let result = [];
    let index = 0;
    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const { offset, length, type } = entity;

        // skip nested entities
        if (index > offset) {
            continue;
        }

        let textBefore = substring(text, index, offset);
        const textBeforeLength = textBefore.length;
        if (textBefore) {
            if (deleteLineBreakAfterPre && textBefore.length > 0 && textBefore[0] === '\n') {
                textBefore = textBefore.substr(1);
                deleteLineBreakAfterPre = false;
            }
            if (textBefore) {
                result.push(textBefore);
            }
        }

        const entityKey = offset;
        let entityText = substring(text, offset, offset + length);
        if (deleteLineBreakAfterPre && entityText.length > 0 && entityText[0] === '\n') {
            entityText = entityText.substr(1);
            deleteLineBreakAfterPre = false;
        }

        switch (type['@type']) {
            case 'textEntityTypeBold': {
                result.push(<strong key={entityKey}>{entityText}</strong>);
                break;
            }
            case 'textEntityTypeBotCommand': {
                const command = entityText.length > 0 && entityText[0] === '/' ? substring(entityText, 1) : entityText;
                result.push(
                    <a key={entityKey} onClick={stopPropagation} href={`tg://bot_command?command=${command}&bot=`}>
                        {entityText}
                    </a>
                );
                break;
            }
            case 'textEntityTypeCashtag': {
                result.push(
                    <a key={entityKey} onClick={event => searchCurrentChat(event, entityText)}>
                        {entityText}
                    </a>
                );
                break;
            }
            case 'textEntityTypeCode': {
                result.push(<code key={entityKey}>{entityText}</code>);
                break;
            }
            case 'textEntityTypeEmailAddress': {
                result.push(
                    <a
                        key={entityKey}
                        href={`mailto:${entityText}`}
                        onClick={stopPropagation}
                        target='_blank'
                        rel='noopener noreferrer'>
                        {entityText}
                    </a>
                );
                break;
            }
            case 'textEntityTypeHashtag': {
                result.push(
                    <a key={entityKey} onClick={event => searchCurrentChat(event, entityText)}>
                        {entityText}
                    </a>
                );
                break;
            }
            case 'textEntityTypeItalic': {
                result.push(<em key={entityKey}>{entityText}</em>);
                break;
            }
            case 'textEntityTypeMentionName': {
                result.push(
                    <MentionLink key={entityKey} userId={type.user_id} title={getUserFullName(type.user_id, null, t)}>
                        {entityText}
                    </MentionLink>
                );
                break;
            }
            case 'textEntityTypeMention': {
                result.push(
                    <MentionLink key={entityKey} username={entityText}>
                        {entityText}
                    </MentionLink>
                );
                break;
            }
            case 'textEntityTypePhoneNumber': {
                result.push(
                    <a key={entityKey} href={`tel:${entityText}`} onClick={stopPropagation}>
                        {entityText}
                    </a>
                );
                break;
            }
            case 'textEntityTypePre': {
                result.push(<pre key={entityKey}>{entityText}</pre>);
                deleteLineBreakAfterPre = true;
                break;
            }
            case 'textEntityTypePreCode': {
                result.push(
                    <pre key={entityKey}>
                        <code>{entityText}</code>
                    </pre>
                );
                deleteLineBreakAfterPre = true;
                break;
            }
            case 'textEntityTypeStrikethrough': {
                result.push(<strike key={entityKey}>{entityText}</strike>);
                break;
            }
            case 'textEntityTypeTextUrl': {
                const url = type.url ? type.url : entityText;

                result.push(
                    <SafeLink key={entityKey} url={url}>
                        {entityText}
                    </SafeLink>
                );
                break;
            }
            case 'textEntityTypeUrl': {
                result.push(
                    <SafeLink key={entityKey} url={entityText}>
                        {entityText}
                    </SafeLink>
                );
                break;
            }
            case 'textEntityTypeUnderline': {
                result.push(<u key={entityKey}>{entityText}</u>);
                break;
            }
            default:
                result.push(entityText);
                break;
        }

        index += textBeforeLength + entity.length;
    }

    if (index < text.length) {
        let textAfter = text.substring(index);
        if (deleteLineBreakAfterPre && textAfter.length > 0 && textAfter[0] === '\n') {
            textAfter = textAfter.substr(1);
        }
        if (textAfter) {
            result.push(textAfter);
        }
    }

    return result;
}

function getText(message, meta, t = k => k) {
    if (!message) return null;

    let result = [];

    const { content } = message;
    if (!content) return [meta];

    const { text, caption } = content;

    if (text && text['@type'] === 'formattedText' && text.text) {
        result = getFormattedText(text, t);
    } else if (caption && caption['@type'] === 'formattedText' && caption.text) {
        const formattedText = getFormattedText(caption, t);
        if (formattedText) {
            result = result.concat(formattedText);
        }
    }

    return result && result.length > 0 ? [...result, meta] : [];
}

function getWebPage(message) {
    if (!message) return null;
    if (!message.content) return null;

    return message.content.web_page;
}

export function getViews(views) {
    if (views < 1000) {
        return views
    }


    if (views < 1000000) {
        views = Math.trunc(views / 100);
        const fractionDigits = views % 10 < 1 ? 0 : 1;

        return (views / 10).toFixed(fractionDigits) + 'K';
    }

    views = Math.trunc(views / 100000);
    const fractionDigits = views % 10 < 1 ? 0 : 1;

    return (views / 10).toFixed(fractionDigits) + 'M';
}

window.getViews = getViews;

function getDate(date) {
    if (!date) return null;

    const d = new Date(date * 1000);

    return dateFormat(d, 'H:MM'); //date.toDateString();
}

function getDateHint(date) {
    if (!date) return null;

    const d = new Date(date * 1000);
    return dateFormat(d, 'H:MM:ss d.mm.yyyy'); //date.toDateString();
}

function isForwardOriginHidden(forwardInfo) {
    if (!forwardInfo) return false;

    const { origin } = forwardInfo;
    if (!origin) return false;

    switch (origin['@type']) {
        case 'messageForwardOriginUser': {
            return false;
        }
        case 'messageForwardOriginHiddenUser': {
            return true;
        }
        case 'messageForwardOriginChannel': {
            return false;
        }
    }

    return false;
}

function getForwardTitle(forwardInfo, t = key => key) {
    if (!forwardInfo) return '';

    const { origin } = forwardInfo;
    if (!origin) return '';

    switch (origin['@type']) {
        case 'messageForwardOriginUser': {
            const { sender_user_id } = origin;

            return getUserFullName(sender_user_id, null, t);
        }
        case 'messageForwardOriginHiddenUser': {
            const { sender_name } = origin;

            return sender_name;
        }
        case 'messageForwardOriginChannel': {
            const { chat_id, author_signature } = origin;

            return getChatTitle(chat_id, false, t) + (author_signature ? ` (${author_signature})` : '');
        }
    }

    return '';
}

function getUnread(message) {
    if (!message) return false;
    if (!message.chat_id) return false;
    if (!message.is_outgoing) return false;

    let chat = ChatStore.get(message.chat_id);
    if (!chat) return false;

    return chat.last_read_outbox_message_id < message.id;
}

function getSenderUserId(message) {
    if (!message) return null;

    return message.sender_user_id;
}

function filterDuplicateMessages(result, history) {
    if (result.messages.length === 0) return;
    if (history.length === 0) return;

    const map = history.reduce(function(accumulator, current) {
        accumulator.set(current.id, current.id);
        return accumulator;
    }, new Map());

    result.messages = result.messages.filter(x => !map.has(x.id));
}

function filterMessages(messages) {
    return messages.filter(x => x.content['@type'] !== 'messageChatUpgradeTo');
}

function getContent(message, t = key => key) {
    if (!message) return null;

    const { content } = message;
    if (!content) return null;

    let caption = '';
    if (content.caption && content.caption.text) {
        caption = `, ${content.caption.text}`;
    }

    if (message.ttl > 0) {
        return getServiceMessageContent(message);
    }

    switch (content['@type']) {
        case 'messageAnimation': {
            return t('AttachGif') + caption;
        }
        case 'messageAudio': {
            const { audio } = content;
            const title = getAudioTitle(audio) || t('AttachMusic');

            return title + caption;
        }
        case 'messageBasicGroupChatCreate': {
            return getServiceMessageContent(message);
        }
        case 'messageCall': {
            return t('Call') + caption;
        }
        case 'messageChatAddMembers': {
            return getServiceMessageContent(message);
        }
        case 'messageChatChangePhoto': {
            return getServiceMessageContent(message);
        }
        case 'messageChatChangeTitle': {
            return getServiceMessageContent(message);
        }
        case 'messageChatDeleteMember': {
            return getServiceMessageContent(message);
        }
        case 'messageChatDeletePhoto': {
            return getServiceMessageContent(message);
        }
        case 'messageChatJoinByLink': {
            return getServiceMessageContent(message);
        }
        case 'messageChatSetTtl': {
            return getServiceMessageContent(message);
        }
        case 'messageChatUpgradeFrom': {
            return getServiceMessageContent(message);
        }
        case 'messageChatUpgradeTo': {
            return getServiceMessageContent(message);
        }
        case 'messageContact': {
            return t('AttachContact') + caption;
        }
        case 'messageContactRegistered': {
            return getServiceMessageContent(message);
        }
        case 'messageCustomServiceAction': {
            return getServiceMessageContent(message);
        }
        case 'messageDocument': {
            const { document } = content;
            if (document && document.file_name) {
                return document.file_name + caption;
            }

            return t('AttachDocument') + caption;
        }
        case 'messageExpiredPhoto': {
            return t('AttachPhoto') + caption;
        }
        case 'messageExpiredVideo': {
            return t('AttachVideo') + caption;
        }
        case 'messageGame': {
            return t('AttachGame') + caption;
        }
        case 'messageGameScore': {
            return getServiceMessageContent(message);
        }
        case 'messageInvoice': {
            return getServiceMessageContent(message);
        }
        case 'messageLocation': {
            return t('AttachLocation') + caption;
        }
        case 'messagePassportDataReceived': {
            return getServiceMessageContent(message);
        }
        case 'messagePassportDataSent': {
            return getServiceMessageContent(message);
        }
        case 'messagePaymentSuccessful': {
            return getServiceMessageContent(message);
        }
        case 'messagePaymentSuccessfulBot': {
            return getServiceMessageContent(message);
        }
        case 'messagePhoto': {
            return t('AttachPhoto') + caption;
        }
        case 'messagePoll': {
            const { poll } = content;

            return '📊 ' + (poll.question || t('Poll')) + caption;
        }
        case 'messagePinMessage': {
            return getServiceMessageContent(message);
        }
        case 'messageScreenshotTaken': {
            return getServiceMessageContent(message);
        }
        case 'messageSticker': {
            const { sticker } = content;
            let emoji = '';
            if (sticker && sticker.emoji) {
                emoji = sticker.emoji;
            }

            return t('AttachSticker') + (emoji ? ` ${emoji}` : '') + caption;
        }
        case 'messageSupergroupChatCreate': {
            return getServiceMessageContent(message);
        }
        case 'messageText': {
            return content.text.text + caption;
        }
        case 'messageUnsupported': {
            return getServiceMessageContent(message);
        }
        case 'messageVenue': {
            return t('AttachLocation') + caption;
        }
        case 'messageVideo': {
            return t('AttachVideo') + caption;
        }
        case 'messageVideoNote': {
            return t('AttachRound') + caption;
        }
        case 'messageVoiceNote': {
            return t('AttachAudio') + caption;
        }
        case 'messageWebsiteConnected': {
            return getServiceMessageContent(message);
        }
        default: {
            return t('UnsupportedAttachment');
        }
    }
}

function isMediaContent(content) {
    if (!content) return false;

    return content['@type'] === 'messagePhoto';
}

function getLocationId(
    location,
    width = LOCATION_WIDTH,
    height = LOCATION_HEIGHT,
    zoom = LOCATION_ZOOM,
    scale = LOCATION_SCALE
) {
    if (!location) return null;

    const { longitude, latitude } = location;
    return `loc=${latitude},${longitude}&size=${width},${height}&scale=${scale}&zoom=${zoom}`;
}

function isVideoMessage(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { content } = message;
    if (!content) return false;

    switch (content['@type']) {
        case 'messageVideo': {
            return true;
        }
        case 'messageText': {
            const { web_page } = content;
            return Boolean(web_page.video);
        }
        default: {
            return false;
        }
    }
}

function isLottieMessage(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { content } = message;
    if (!content) return false;

    switch (content['@type']) {
        case 'messageDocument': {
            const { document } = content;
            if (!document) return false;

            const { file_name } = document;

            return file_name && file_name.toLowerCase().endsWith('.json');
        }
        case 'messageText': {
            const { web_page } = content;
            if (!web_page) return false;

            const { document } = web_page;
            if (!document) return false;

            const { file_name } = document;

            return file_name && file_name.toLowerCase().endsWith('.json');
        }
        default: {
            return false;
        }
    }
}

export function isEmbedMessage(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { content } = message;
    if (!content) return false;

    switch (content['@type']) {
        case 'messageText': {
            const { web_page } = content;
            if (!web_page) return false;

            const { embed_url, site_name } = web_page;
            if (!embed_url) return false;
            if (!site_name) return false;

            switch (site_name) {
                case 'Coub': {
                    return true;
                }
                case 'SoundCloud': {
                    return true;
                }
                case 'Spotify': {
                    return true;
                }
                case 'Twitch': {
                    return true;
                }
                case 'YouTube': {
                    return true;
                }
                case 'Vimeo': {
                    return true;
                }
                case 'КиноПоиск': {
                    return true;
                }
                case 'Яндекс.Музыка': {
                    return true;
                }
            }

            return false;
        }
        default: {
            return false;
        }
    }
}

function isAnimationMessage(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { content } = message;
    if (!content) return false;

    switch (content['@type']) {
        case 'messageAnimation': {
            return true;
        }
        case 'messageText': {
            const { web_page } = content;
            return Boolean(web_page.animation);
        }
        default: {
            return false;
        }
    }
}

function isContentOpened(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return true;

    const { content } = message;
    if (!content) return true;

    switch (content['@type']) {
        case 'messageVoiceNote': {
            return content.is_listened;
        }
        case 'messageVideoNote': {
            return content.is_viewed;
        }
        default: {
            return true;
        }
    }
}

export function hasVoice(source) {
    if (!source) return false;

    switch (source['@type']) {
        case 'message': {
            const message = MessageStore.get(source.chat_id, source.id);
            if (!message) return false;

            const { content } = message;
            if (!content) return false;

            switch (content['@type']) {
                case 'messageVoiceNote': {
                    const { voice_note } = content;
                    if (voice_note) {
                        return true;
                    }

                    break;
                }
                case 'messageText': {
                    const { web_page } = content;
                    if (web_page) {
                        const { voice_note } = web_page;
                        if (voice_note) {
                            return true;
                        }
                    }

                    break;
                }
            }
            break;
        }
        case 'pageBlockVoiceNote': {
            return true;
        }
    }

    return false;
}

export function useAudioPlaybackRate(source) {
    if (!source) return false;

    let audio = null;
    switch (source['@type']) {
        case 'message': {
            audio = getMessageAudio(source.chat_id, source.id);
            break;
        }
        case 'pageBlockAudio': {
            audio = getBlockAudio(source);
            break;
        }
    }

    return audio && audio.duration > PLAYER_AUDIO_2X_MIN_DURATION;
}

export function getMessageAudio(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return null;

    const { content } = message;
    if (!content) return null;

    switch (content['@type']) {
        case 'messageAudio': {
            const { audio } = content;

            return audio;
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { audio } = web_page;

                return audio;
            }

            break;
        }
    }

    return null;
}

function hasAudio(source) {
    if (!source) return false;

    switch (source['@type']) {
        case 'message': {
            return !!getMessageAudio(source.chat_id, source.id);
        }
        case 'pageBlockAudio': {
            return !!getBlockAudio(source);
        }
    }

    return false;
}

function hasVideoNote(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { content } = message;
    if (!content) return false;

    switch (content['@type']) {
        case 'messageVideoNote': {
            const { video_note } = content;
            if (video_note) {
                return true;
            }

            break;
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { video_note } = web_page;
                if (video_note) {
                    return true;
                }
            }

            break;
        }
    }

    return false;
}

function getSearchMessagesFilter(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return null;

    const { content } = message;
    if (!content) return null;

    switch (content['@type']) {
        case 'messageAudio': {
            const { audio } = content;
            if (audio) {
                return {
                    '@type': 'searchMessagesFilterAudio'
                };
            }
            break;
        }
        case 'messageVoiceNote': {
            const { voice_note } = content;
            if (voice_note) {
                return {
                    '@type': 'searchMessagesFilterVoiceNote'
                };
            }
            break;
        }
        case 'messageVideoNote': {
            const { video_note } = content;
            if (video_note) {
                return null;

                return {
                    '@type': 'searchMessagesFilterVideoNote'
                };
            }
            break;
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { audio, voice_note, video_note } = web_page;
                if (audio) {
                    return null;

                    return {
                        '@type': 'searchMessagesFilterAudio'
                    };
                }

                if (voice_note) {
                    return null;

                    return {
                        '@type': 'searchMessagesFilterVoiceNote'
                    };
                }

                if (video_note) {
                    return null;

                    return {
                        '@type': 'searchMessagesFilterVideoNote'
                    };
                }
                break;
            }
        }
    }

    return null;
}

function openAnimation(animation, message, fileCancel) {
    if (!animation) return;
    if (!message) return;

    const { chat_id, id } = message;

    let { animation: file } = animation;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    if (fileCancel && file.local.is_downloading_active) {
        FileStore.cancelGetRemoteFile(file.id, message);
        return;
    } else if (fileCancel && file.remote.is_uploading_active) {
        FileStore.cancelUploadFile(file.id, message);
        return;
    } else {
        // download file at loadMediaViewerContent instead
        // download(file, message, FileStore.updateAnimationBlob(chat_id, id, file.id));
    }

    TdLibController.clientUpdate({
        '@type': 'clientUpdateActiveAnimation',
        chatId: chat_id,
        messageId: id
    });

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    setMediaViewerContent({
        chatId: chat_id,
        messageId: id
    });
}

function openAudio(audio, message, fileCancel) {
    if (!audio) return;
    if (!message) return;

    const { chat_id, id } = message;

    let { audio: file } = audio;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    if (fileCancel && file.local.is_downloading_active && !supportsStreaming()) {
        FileStore.cancelGetRemoteFile(file.id, message);
        return;
    } else if (fileCancel && file.remote.is_uploading_active) {
        FileStore.cancelUploadFile(file.id, message);
        return;
    } else {
        if (!supportsStreaming()) {
            download(file, message, () => FileStore.updateAudioBlob(chat_id, id, file.id));
        }
    }

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    const { remote } = file;
    const { unique_id } = remote;
    const { currentTime, duration } = PlayerStore.getCurrentTime(unique_id);

    TdLibController.clientUpdate({
        '@type': 'clientUpdateMediaActive',
        source: MessageStore.get(chat_id, id),
        currentTime,
        duration
    });
}

function openChatPhoto(photo, message, fileCancel) {
    if (!photo) return;
    if (!message) return;

    const { chat_id, id } = message;

    const photoSize = getPhotoSize(photo.sizes);
    if (!photoSize) return;

    let { photo: file } = photoSize;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    if (fileCancel && file.local.is_downloading_active) {
        FileStore.cancelGetRemoteFile(file.id, message);
        return;
    } else if (fileCancel && file.remote.is_uploading_active) {
        FileStore.cancelUploadFile(file.id, message);
        return;
    }

    download(file, message, () => FileStore.updatePhotoBlob(chat_id, id, file.id));

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    setMediaViewerContent({
        chatId: chat_id,
        messageId: id
    });
}

function openContact(contact, message, fileCancel) {
    if (!contact) return;
    if (!message) return;

    const { chat_id, id } = message;

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    openUser(contact.user_id, true);
}

function openDocument(document, message, fileCancel) {
    if (!document) return;
    if (!message) return;

    const { chat_id, id } = message;

    let { document: file } = document;
    if (!file) return;
    
    file = FileStore.get(file.id) || file;
    if (fileCancel && file.local.is_downloading_active) {
        FileStore.cancelGetRemoteFile(file.id, message);
        return;
    } else if (fileCancel && file.remote.is_uploading_active) {
        FileStore.cancelUploadFile(file.id, message);
        return;
    }
    
    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    if (isLottieMessage(chat_id, id)) {
        TdLibController.send({
            '@type': 'openMessageContent',
            chat_id: chat_id,
            message_id: id
        });

        setMediaViewerContent({
            chatId: chat_id,
            messageId: id
        });
    } else {
        saveOrDownload(file, document.file_name, message);
    }
}

function openGame(game, message, fileCancel) {
    if (!game) return;
    if (!message) return;

    const { chat_id, id } = message;

    const { animation } = game;
    if (animation) {
        let { animation: file } = animation;
        if (!file) return;

        file = FileStore.get(file.id) || file;
        if (fileCancel && file.local.is_downloading_active) {
            FileStore.cancelGetRemoteFile(file.id, message);
            return;
        } else if (fileCancel && file.remote.is_uploading_active) {
            FileStore.cancelUploadFile(file.id, message);
            return;
        }

        download(file, message, () => FileStore.updateAnimationBlob(chat_id, id, file.id));
    }

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    TdLibController.clientUpdate({
        '@type': 'clientUpdateActiveAnimation',
        chatId: chat_id,
        messageId: id
    });
}

function openPhoto(photo, message, fileCancel) {
    if (!photo) return;
    if (!message) return;

    const { chat_id, id } = message;

    const photoSize = getPhotoSize(photo.sizes);
    if (!photoSize) return;

    let { photo: file } = photoSize;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    if (fileCancel && file.local.is_downloading_active) {
        FileStore.cancelGetRemoteFile(file.id, message);
        return;
    } else if (fileCancel && file.remote.is_uploading_active) {
        FileStore.cancelUploadFile(file.id, message);
        return;
    }

    download(file, message, () => FileStore.updatePhotoBlob(chat_id, id, file.id));

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    setMediaViewerContent({
        chatId: chat_id,
        messageId: id
    });
}

async function openSticker(sticker, message, fileCancel) {
    if (!sticker) return;
    if (!message) return;

    const { chat_id, id } = message;

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    const { set_id } = sticker;
    if (!set_id) return;

    const stickerSet = await TdLibController.send({
        '@type': 'getStickerSet',
        set_id
    });

    if (!stickerSet) return;

    TdLibController.clientUpdate({
        '@type': 'clientUpdateStickerSet',
        stickerSet
    });
}

function openVideo(video, message, fileCancel) {
    if (!video) return;
    if (!message) return;

    const { chat_id, id } = message;

    let { video: file } = video;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    if (fileCancel && file.local.is_downloading_active && !supportsStreaming()) {
        FileStore.cancelGetRemoteFile(file.id, message);
        return;
    } else if (fileCancel && file.remote.is_uploading_active) {
        FileStore.cancelUploadFile(file.id, message);
        return;
    }

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    setMediaViewerContent({
        chatId: chat_id,
        messageId: id
    });
}

function openVideoNote(videoNote, message, fileCancel) {
    if (!videoNote) return;
    if (!message) return;

    const { chat_id, id } = message;

    let { video: file } = videoNote;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    if (fileCancel && file.local.is_downloading_active) {
        FileStore.cancelGetRemoteFile(file.id, message);
        return;
    } else if (fileCancel && file.remote.is_uploading_active) {
        FileStore.cancelUploadFile(file.id, message);
        return;
    }

    download(file, message, () => FileStore.updateVideoNoteBlob(chat_id, id, file.id));

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    const { remote } = file;
    const { unique_id } = remote;
    const { currentTime, duration } = PlayerStore.getCurrentTime(unique_id);

    TdLibController.clientUpdate({
        '@type': 'clientUpdateMediaActive',
        source: MessageStore.get(chat_id, id),
        currentTime,
        duration
    });
}

function openVoiceNote(voiceNote, message, fileCancel) {
    if (!voiceNote) return;
    if (!message) return;

    const { chat_id, id } = message;

    let { voice: file } = voiceNote;
    if (!file) return;

    file = FileStore.get(file.id) || file;
    if (fileCancel && file.local.is_downloading_active) {
        FileStore.cancelGetRemoteFile(file.id, message);
        return;
    } else if (fileCancel && file.remote.is_uploading_active) {
        FileStore.cancelUploadFile(file.id, message);
        return;
    } else {
        download(file, message, () => FileStore.updateVoiceNoteBlob(chat_id, id, file.id));
    }

    TdLibController.send({
        '@type': 'openMessageContent',
        chat_id: chat_id,
        message_id: id
    });

    const { remote } = file;
    const { unique_id } = remote;
    const { currentTime, duration } = PlayerStore.getCurrentTime(unique_id);

    TdLibController.clientUpdate({
        '@type': 'clientUpdateMediaActive',
        source: MessageStore.get(chat_id, id),
        currentTime,
        duration
    });
}

function openMedia(chatId, messageId, fileCancel = true) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return;

    const { content } = message;
    if (!content) return null;

    switch (content['@type']) {
        case 'messageAnimation': {
            const { animation } = content;
            if (animation) {
                openAnimation(animation, message, fileCancel);
            }

            break;
        }
        case 'messageAudio': {
            const { audio } = content;
            if (audio) {
                // openDocument(audio, message, fileCancel);
                openAudio(audio, message, fileCancel);
            }

            break;
        }
        case 'messageChatChangePhoto': {
            const { photo } = content;
            if (photo) {
                openChatPhoto(photo, message, fileCancel);
            }

            break;
        }
        case 'messageContact': {
            const { contact } = content;
            if (contact) {
                openContact(contact, message, fileCancel);
            }

            break;
        }
        case 'messageDocument': {
            const { document } = content;
            if (document) {
                openDocument(document, message, fileCancel);
                // saveOrDownload(document.document, document.file_name, message);
            }

            break;
        }
        case 'messageGame': {
            const { game } = content;
            if (game) {
                openGame(game, message, fileCancel);
            }

            break;
        }
        case 'messagePhoto': {
            const { photo } = content;
            if (photo) {
                openPhoto(photo, message, fileCancel);
            }

            break;
        }
        case 'messageSticker': {
            const { sticker } = content;
            if (sticker) {
                openSticker(sticker, message, fileCancel);
            }

            break;
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { animation, audio, document, photo, sticker, video, video_note, voice_note } = web_page;

                if (animation) {
                    openAnimation(animation, message, fileCancel);
                    break;
                }

                if (audio) {
                    openAudio(audio, message, fileCancel);
                    break;
                }

                if (document) {
                    openDocument(document, message, fileCancel);
                    break;
                }

                if (sticker) {
                    openSticker(sticker, message, fileCancel);
                    break;
                }

                if (video) {
                    openVideo(video, message, fileCancel);
                    break;
                }

                if (video_note) {
                    openVideoNote(video_note, message, fileCancel);
                    break;
                }

                if (voice_note) {
                    openVoiceNote(voice_note, message, fileCancel);
                    break;
                }

                if (photo) {
                    openPhoto(photo, message, fileCancel);
                    break;
                }
            }

            break;
        }
        case 'messageVideo': {
            const { video } = content;
            if (video) {
                openVideo(video, message, fileCancel);
            }

            break;
        }
        case 'messageVideoNote': {
            const { video_note } = content;
            if (video_note) {
                openVideoNote(video_note, message, fileCancel);
            }

            break;
        }
        case 'messageVoiceNote': {
            const { voice_note } = content;
            if (voice_note) {
                openVoiceNote(voice_note, message, fileCancel);
            }

            break;
        }
    }
}

function isDeletedMessage(message) {
    return message && message['@type'] === 'deletedMessage';
}

export function getReplyMinithumbnail(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return;

    const { content } = message;
    if (!content) return null;

    switch (content['@type']) {
        case 'messageAnimation': {
            const { animation } = content;
            if (!animation) return null;

            const { minithumbnail } = animation;
            return minithumbnail || null;
        }
        case 'messageAudio': {
            return null;
        }
        case 'messageChatChangePhoto': {
            const { photo } = content;
            if (!photo) return null;

            return photo.minithumbnail || null;
        }
        case 'messageDocument': {
            const { document } = content;
            if (!document) return null;

            const { minithumbnail } = document;
            return minithumbnail || null;
        }
        case 'messageGame': {
            const { game } = content;
            if (!game) return null;

            const { animation, photo } = game;
            if (animation) {
                const { minithumbnail } = animation;
                if (minithumbnail) {
                    return minithumbnail;
                }
            }

            if (photo) {
                return photo.minithumbnail || null;
            }

            return null;
        }
        case 'messagePhoto': {
            const { photo } = content;
            if (!photo) return null;

            return photo.minithumbnail || null;
        }
        case 'messageSticker': {
            return null;
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { animation, audio, document, photo, sticker, video, video_note } = web_page;
                if (photo) {
                    return photo.minithumbnail || null;
                }
                if (animation) {
                    const { minithumbnail } = animation;
                    return minithumbnail || null;
                }
                if (audio) {
                    return null;
                }
                if (document) {
                    const { minithumbnail } = document;
                    return minithumbnail || null;
                }
                if (sticker) {
                    return null;
                }
                if (video) {
                    const { minithumbnail } = video;
                    return minithumbnail || null;
                }
                if (video_note) {
                    const { minithumbnail } = video_note;
                    return minithumbnail || null;
                }
            }

            break;
        }
        case 'messageVideo': {
            const { video } = content;
            if (!video) return null;

            const { minithumbnail } = video;
            return minithumbnail || null;
        }
        case 'messageVideoNote': {
            const { video_note } = content;
            if (!video_note) return null;

            const { minithumbnail } = video_note;
            return minithumbnail || null;
        }
    }

    return null;
}

function getReplyPhotoSize(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return;

    const { content } = message;
    if (!content) return null;

    switch (content['@type']) {
        case 'messageAnimation': {
            const { animation } = content;
            if (!animation) return null;

            const { thumbnail } = animation;
            return thumbnail || null;
        }
        case 'messageAudio': {
            const { audio } = content;
            if (!audio) return null;

            const { album_cover_thumbnail } = audio;
            return album_cover_thumbnail || null;
        }
        case 'messageChatChangePhoto': {
            const { photo } = content;
            if (!photo) return null;

            return getPhotoSize(photo.sizes);
        }
        case 'messageDocument': {
            const { document } = content;
            if (!document) return null;

            const { thumbnail } = document;
            return thumbnail || null;
        }
        case 'messageGame': {
            const { game } = content;
            if (!game) return null;

            const { animation, photo } = game;
            if (animation) {
                const { thumbnail } = animation;
                if (thumbnail) {
                    return thumbnail;
                }
            }

            if (photo) {
                return getPhotoSize(photo.sizes);
            }

            return null;
        }
        case 'messagePhoto': {
            const { photo } = content;
            if (!photo) return null;

            return getPhotoSize(photo.sizes);
        }
        case 'messageSticker': {
            const { sticker } = content;
            if (!sticker) return null;

            const { thumbnail } = sticker;
            return thumbnail || null;
        }
        case 'messageText': {
            const { web_page } = content;
            if (web_page) {
                const { animation, audio, document, photo, sticker, video, video_note } = web_page;
                if (photo) {
                    return getPhotoSize(photo.sizes);
                }
                if (animation) {
                    const { thumbnail } = animation;
                    return thumbnail || null;
                }
                if (audio) {
                    const { album_cover_thumbnail } = audio;
                    return album_cover_thumbnail || null;
                }
                if (document) {
                    const { thumbnail } = document;
                    return thumbnail || null;
                }
                if (sticker) {
                    const { thumbnail } = sticker;
                    return thumbnail || null;
                }
                if (video) {
                    const { thumbnail } = video;
                    return thumbnail || null;
                }
                if (video_note) {
                    const { thumbnail } = video_note;
                    return thumbnail || null;
                }
            }

            break;
        }
        case 'messageVideo': {
            const { video } = content;
            if (!video) return null;

            const { thumbnail } = video;
            return thumbnail || null;
        }
        case 'messageVideoNote': {
            const { video_note } = content;
            if (!video_note) return null;

            const { thumbnail } = video_note;
            return thumbnail || null;
        }
    }

    return null;
}

function getEmojiMatches(chatId, messageId) {
    return 0;

    const message = MessageStore.get(chatId, messageId);
    if (!message) return 0;

    const { content } = message;
    if (!content) return 0;
    if (content['@type'] !== 'messageText') return 0;

    const { text: textContent } = content;
    if (!textContent) return;
    if (textContent['@type'] !== 'formattedText') return 0;

    const { text, entities } = textContent;
    if (!text) return 0;
    if (entities && entities.length > 0) return 0;

    let lastIndex = 0;
    let emojiMatches = 0;
    let m;
    const re = emojiRegex();
    do {
        m = re.exec(text);

        if (m) {
            emojiMatches += 1;
            // none-emoji symbol between prev and current emojis or before first
            if (lastIndex !== m.index) {
                emojiMatches = 0;
                break;
            }
            // more than 3 emojis in a row
            if (emojiMatches > 3) {
                emojiMatches = 0;
                break;
            }
            lastIndex = re.lastIndex;
        }
        // none-emoji symbol at the end
        if (!m && lastIndex !== text.length) {
            emojiMatches = 0;
            break;
        }
    } while (m);

    return emojiMatches;
}

function messageComparatorDesc(left, right) {
    return left.id - right.id;
}

function checkInclusion(index, entities) {
    if (!entities) return false;
    if (!entities.length) return false;

    for (let i = 0; i < entities.length; i++) {
        if (index >= entities[i].offset && index < entities[i].offset + entities[i].length) {
            return true;
        }
    }

    return false;
}

function checkIntersection(startIndex, endIndex, entities) {
    if (!entities) return false;
    if (!entities.length) return false;

    for (let i = 0; i < entities.length; i++) {
        if (startIndex <= entities[i].offset && entities[i].offset + entities[i].length - 1 <= endIndex) {
            return true;
        }
    }

    return false;
}

function checkEntity(startIndex, endIndex, entities) {
    return (
        !checkInclusion(startIndex, entities) &&
        !checkInclusion(endIndex, entities) &&
        !checkIntersection(startIndex, endIndex, entities)
    );
}

function removeOffsetAfter(start, countToRemove, entities) {
    if (!entities) return;
    if (!entities.length) return;

    entities.forEach(e => {
        if (e.offset > start) {
            e.offset -= countToRemove;
        }
    });
}

function addOffsetAfter(start, countToAdd, entities) {
    if (!entities) return;
    if (!entities.length) return;

    entities.forEach(e => {
        if (e.offset > start) {
            e.offset += countToAdd;
        }
    });
}

function removeEntities(startIndex, endIndex, entities) {
    if (!entities) return;
    if (!entities.length) return;

    for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        const entityStart = entity.offset;
        const entityEnd = entity.offset + entity.length - 1;
        if (
            (startIndex <= entityStart && entityStart <= endIndex) ||
            (startIndex <= entityEnd && entityEnd <= endIndex) ||
            (entityStart < startIndex && endIndex > entityEnd)
        ) {
            entities.splice(i--, 1);
        }
    }
}

function addTextNode(offset, length, text, nodes) {
    const node = document.createTextNode(text.substr(offset, length));
    nodes.push(node);
}

export function getNodes(text, entities, t = k => k) {
    if (!text) return [];

    entities = (entities || []).sort((a, b) => {
        if (a.offset - b.offset !== 0) {
            return a.offset - b.offset;
        }

        return b.length - a.length;
    });

    let nodes = [];
    let offset = 0;
    let prevEntity = null;
    entities.forEach(x => {
        if (x.offset - offset > 0) {
            addTextNode(offset, x.offset - offset, text, nodes);
            offset = x.offset;
        }

        if (!(prevEntity && checkInclusion(x.offset, [prevEntity]))) {
            switch (x.type['@type']) {
                case 'textEntityTypeBold': {
                    const node = document.createElement('b');
                    node.innerText = text.substr(x.offset, x.length);
                    nodes.push(node);
                    break;
                }
                case 'textEntityTypeBotCommand': {
                    addTextNode(x.offset, x.length, text, nodes);
                    break;
                }
                case 'textEntityTypeCashtag': {
                    addTextNode(x.offset, x.length, text, nodes);
                    break;
                }
                case 'textEntityTypeCode': {
                    const node = document.createTextNode('`' + text.substr(x.offset, x.length) + '`');
                    nodes.push(node);
                    break;
                }
                case 'textEntityTypeEmailAddress': {
                    addTextNode(x.offset, x.length, text, nodes);
                    break;
                }
                case 'textEntityTypeHashtag': {
                    addTextNode(x.offset, x.length, text, nodes);
                    break;
                }
                case 'textEntityTypeItalic': {
                    const node = document.createElement('i');
                    node.innerText = text.substr(x.offset, x.length);
                    nodes.push(node);
                    break;
                }
                case 'textEntityTypeMention': {
                    addTextNode(x.offset, x.length, text, nodes);
                    break;
                }
                case 'textEntityTypeMentionName': {
                    try {
                        const { user_id } = x.type;
                        const user = UserStore.get(user_id);
                        if (user) {
                            const node = document.createElement('a');
                            // node.href = getDecodedUrl(url, false);
                            node.title = getUserFullName(user_id, null, t);
                            // node.target = '_blank';
                            // node.rel = 'noopener noreferrer';
                            node.dataset.userId = user_id;
                            node.innerText = text.substr(x.offset, x.length);
                            nodes.push(node);
                        } else {
                            addTextNode(x.offset, x.length, text, nodes);
                        }
                    } catch {
                        addTextNode(x.offset, x.length, text, nodes);
                    }
                    break;
                }
                case 'textEntityTypePhoneNumber': {
                    addTextNode(x.offset, x.length, text, nodes);
                    break;
                }
                case 'textEntityTypePre': {
                    const node = document.createTextNode('```' + text.substr(x.offset, x.length) + '```');
                    nodes.push(node);
                    break;
                }
                case 'textEntityTypePreCode': {
                    const node = document.createTextNode('```' + text.substr(x.offset, x.length) + '```');
                    nodes.push(node);
                    break;
                }
                case 'textEntityTypeStrikethrough': {
                    const node = document.createElement('strike');
                    node.innerText = text.substr(x.offset, x.length);
                    nodes.push(node);
                    break;
                }
                case 'textEntityTypeTextUrl': {
                    try {
                        const { url } = x.type;

                        const node = document.createElement('a');
                        node.href = getDecodedUrl(url, false);
                        node.title = getDecodedUrl(url, false);
                        node.target = '_blank';
                        node.rel = 'noopener noreferrer';
                        node.innerText = text.substr(x.offset, x.length);
                        nodes.push(node);
                    } catch {
                        addTextNode(x.offset, x.length, text, nodes);
                    }
                    break;
                }
                case 'textEntityTypeUrl': {
                    addTextNode(x.offset, x.length, text, nodes);
                    break;
                }
                case 'textEntityTypeUnderline': {
                    const node = document.createElement('u');
                    node.innerText = text.substr(x.offset, x.length);
                    nodes.push(node);
                    break;
                }
                default: {
                    addTextNode(x.offset, x.length, text, nodes);
                    break;
                }
            }

            prevEntity = x;
            offset += x.length;
        }
    });

    if (offset < text.length) {
        addTextNode(offset, text.length - offset, text, nodes);
    }

    return nodes;
}

// based on code from official Android Telegram client
// https://github.com/DrKLO/Telegram/blob/28eb8dfd0ef959fd5ad7d5d22f1d32879707c0a0/TMessagesProj/src/main/java/org/telegram/messenger/MediaDataController.java#L3782
export function getEntities(text) {
    const entities = [];
    if (!text) return { text, entities };

    text = text.replace(/<div><br><\/div>/gi, '<br>');
    text = text.replace(/<div>/gi, '<br>');
    text = text.replace(/<\/div>/gi, '');
    text = text.split('<br>').join('\n');

    // 0 looking for html entities
    text = getHTMLEntities(text, entities);

    // 1 looking for ``` and ` in order to find mono and pre entities
    text = getMonoPreEntities(text, entities);

    // 2 looking for bold, italic, etc. entities
    text = getSimpleMarkupEntities(text, entities);

    return { text, entities };
}

function compareEntities(a, b) {
    const { offset: offsetA } = a;
    const { offset: offsetB } = b;

    if (offsetA < offsetB) {
        return -1;
    }

    if (offsetA > offsetB) {
        return 1;
    }

    return 0;
}

export function getUrlMentionHashtagEntities(text, entities) {
    const { text: t1, entities: e1 } = getUrlEntities(text, entities);

    const { text: t2, entities: e2 } = getMentionHashtagEntities(t1, e1);

    return { text: t2, entities: e2 };
}

const urlRegExp = /((ftp|http|https):\/\/)?([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g;

export function getUrlEntities(text, entities) {
    let e = [];
    const regExp = urlRegExp;
    let result = regExp.exec(text);
    while (result) {
        const { index: offset } = result;
        const length = result[0].length;

        e.push({
            '@type': 'textEntity',
            type: { '@type': 'textEntityTypeUrl' },
            length,
            offset
        });

        result = regExp.exec(text);
    }

    return { text, entities: [...entities, ...e].sort(compareEntities) };
}

export function getMentionHashtagEntities(text, entities) {
    let e = [];
    const regExp = mentionHashtagRegExp;
    let result = regExp.exec(text);
    while (result) {
        let { index: offset } = result;
        let i = 1;

        let ch = text[offset];
        if (ch !== '#' && ch !== '@') {
            offset++;
            i++;
            ch = text[offset];
        }

        const length = result[0].length - i + 1;

        if (ch === '@') {
            e.push({
                '@type': 'textEntity',
                type: { '@type': 'textEntityTypeMention' },
                length,
                offset
            });
        } else if (ch === '#') {
            e.push({
                '@type': 'textEntity',
                type: { '@type': 'textEntityTypeHashtag' },
                length,
                offset
            });
        }

        result = regExp.exec(text);
    }

    return { text, entities: [...entities, ...e].sort(compareEntities) };
}

const twitterInstagramEntities = new Map();
const mentionHashtagRegExp = /(^|\s|\()@[a-zA-Z\d_.]{1,32}|(^|\s|\()#[\w]+/g;

// based on https://github.com/DrKLO/Telegram/blob/5a2a813dc029ba1b9a31b514a78eb85fced0183f/TMessagesProj/src/main/java/org/telegram/messenger/MessageObject.java#L3191
export function getTwitterInstagramEntities(patternType, text, entities) {
    const key = `${patternType}_${text}`;

    let e = [];
    if (!twitterInstagramEntities.has(key)) {
        let result = mentionHashtagRegExp.exec(text);
        while (result) {
            let { index: offset } = result;
            let i = 1;

            let ch = text[offset];
            if (ch !== '@' && ch !== '#') {
                offset++;
                i++;
                ch = text[offset];
            }

            const length = result[0].length - i + 1;
            const foundText = result[0].substr(i);
            let url = null;

            // instagram
            if (patternType === 1) {
                if (ch === '@') {
                    url = 'https://instagram.com/' + foundText;
                } else if (ch === '#') {
                    url = 'https://instagram.com/explore/tags/' + foundText;
                }
                // twitter
            } else if (patternType === 2) {
                if (ch === '@') {
                    url = 'https://twitter.com/' + foundText;
                } else if (ch === '#') {
                    url = 'https://twitter.com/hashtag/' + foundText;
                }
            }

            if (url) {
                e.push({
                    '@type': 'textEntity',
                    type: { '@type': 'textEntityTypeTextUrl', url },
                    length,
                    offset
                });
            }

            result = mentionHashtagRegExp.exec(text);
        }

        twitterInstagramEntities.set(key, e);
    } else {
        e = twitterInstagramEntities.get(key);
    }

    return { text, entities: [...entities, ...e].sort(compareEntities) };
}

export function getHTMLEntities(text, entities) {
    const result = new DOMParser().parseFromString(text, 'text/html');

    let offset = 0;
    let length = 0;

    let finalText = '';
    result.body.childNodes.forEach(node => {
        const { textContent, nodeName } = node;

        length = textContent.length;
        finalText += textContent;

        if (!checkEntity(offset, offset + length - 1, entities)) {
            return;
        }

        switch (nodeName) {
            case '#text': {
                offset += length;
                break;
            }
            case 'A': {
                if (node.dataset.userId) {
                    entities.push({
                        '@type': 'textEntity',
                        offset,
                        length,
                        type: { '@type': 'textEntityTypeMentionName', user_id: node.dataset.userId },
                        textContent: finalText.substring(offset, offset + length)
                    });
                } else if (node.href) {
                    entities.push({
                        '@type': 'textEntity',
                        offset,
                        length,
                        type: { '@type': 'textEntityTypeTextUrl', url: node.href },
                        textContent: finalText.substring(offset, offset + length)
                    });
                }
                offset += length;
                break;
            }
            case 'B':
            case 'STRONG': {
                entities.push({
                    '@type': 'textEntity',
                    offset,
                    length,
                    type: { '@type': 'textEntityTypeBold' },
                    textContent: finalText.substring(offset, offset + length)
                });
                offset += length;
                break;
            }
            case 'BR': {
                break;
            }
            case 'CODE': {
                entities.push({
                    '@type': 'textEntity',
                    offset,
                    length,
                    type: { '@type': 'textEntityTypeCode' },
                    textContent: finalText.substring(offset, offset + length)
                });
                offset += length;
                break;
            }
            case 'I':
            case 'EM': {
                entities.push({
                    '@type': 'textEntity',
                    offset,
                    length,
                    type: { '@type': 'textEntityTypeItalic' },
                    textContent: finalText.substring(offset, offset + length)
                });
                offset += length;
                break;
            }
            case 'PRE': {
                entities.push({
                    '@type': 'textEntity',
                    offset,
                    length,
                    type: { '@type': 'textEntityTypePre' },
                    textContent: finalText.substring(offset, offset + length)
                });
                offset += length;
                break;
            }
            case 'DEL':
            case 'S':
            case 'STRIKE': {
                entities.push({
                    '@type': 'textEntity',
                    offset,
                    length,
                    type: { '@type': 'textEntityTypeStrikethrough' },
                    textContent: finalText.substring(offset, offset + length)
                });
                offset += length;
                break;
            }
            case 'INS':
            case 'U': {
                entities.push({
                    '@type': 'textEntity',
                    offset,
                    length,
                    type: { '@type': 'textEntityTypeUnderline' },
                    textContent: finalText.substring(offset, offset + length)
                });
                offset += length;
                break;
            }
            default: {
                offset += length;
                break;
            }
        }
    });
    text = finalText;

    return text;
}

export function getMonoPreEntities(text, entities) {
    const mono = '`';
    const pre = '```';
    let isPre = false;

    let index = -1;     // first index of end tag
    let lastIndex = 0;  // first index after end tag
    let start = -1;     // first index of start tag

    let offset = 0, length = 0;

    while ((index = text.indexOf(isPre ? pre : mono, lastIndex)) !== -1) {
        if (start === -1) {
            // find start tag
            isPre = text.length - index > 2 && text[index + 1] === mono && text[index + 2] === mono;
            start = index;
            lastIndex = index + (isPre ? 3 : 1);
        } else {
            // find end tag
            for (let i = index + (isPre ? 3 : 1); i < text.length; i++) {
                if (text[i] === mono) {
                    index++;
                } else {
                    break;
                }
            }

            lastIndex = index + (isPre ? 3 : 1);
            if (isPre) {
                // add pre tag

                let textBefore = text.substring(0, start);
                let textContent = text.substring(start + 3, index);
                let textAfter = text.substring(index + 3, text.length);

                if (textContent.length > 0) {
                    offset = start;
                    length = index - start - 3;

                    text = textBefore + textContent + textAfter;

                    const entity = {
                        '@type': 'textEntity',
                        offset,
                        length,
                        language: '',
                        type: { '@type': 'textEntityTypePre' },
                        textContent: text.substring(offset, offset + length)
                    };
                    removeEntities(offset, offset + length - 1 + 6);
                    removeOffsetAfter(offset + length, 6, entities);
                    entities.push(entity);
                    lastIndex -= 6;

                    // clean text before
                    if (textBefore.length > 0) {
                        const lastChar = textBefore[textBefore.length - 1];
                        if (lastChar !== '\n') {
                            if (lastChar === ' ' || lastChar === '\xA0') {
                                textBefore = textBefore.substr(0, textBefore.length - 1) + '\n';
                                text = textBefore + textContent + textAfter;
                            } else {
                                textBefore += '\n';
                                text = textBefore + textContent + textAfter;
                                addOffsetAfter(offset - 1, 1, entities);
                                lastIndex += 1;
                            }
                        }
                    }

                    // clean text after
                    if (textAfter.length > 0) {
                        const firstChar = textAfter[0];
                        if (firstChar !== '\n') {
                            if (firstChar === ' ' || firstChar === '\xA0') {
                                textAfter = '\n' + textAfter.substr(1);
                                text = textBefore + textContent + textAfter;
                            } else {
                                textAfter = '\n' + textAfter;
                                text = textBefore + textContent + textAfter;
                                addOffsetAfter(offset + length - 1, 1, entities);
                                lastIndex += 1;
                            }
                        }
                    }

                    // clean text content
                    if (textContent.length > 2) {
                        if (textContent[0] === '\n') {
                            textContent = textContent.substring(1);
                            text = textBefore + textContent + textAfter;
                            entity.length -= 1;
                            entity.textContent = textContent;
                            removeOffsetAfter(entity.offset + entity.length - 1, 1, entities);
                            lastIndex -= 1;
                        }
                    }

                    if (textContent.length > 2) {
                        if (textContent[textContent.length - 1] === '\n') {
                            textContent = textContent.substring(0, textContent.length - 1);
                            text = textBefore + textContent + textAfter;
                            entity.length -= 1;
                            entity.textContent = textContent;
                            removeOffsetAfter(entity.offset + entity.length - 1, 1, entities);
                            lastIndex -= 1;
                        }
                    }
                }
            } else {
                // add code tag
                if (start + 1 !== index) {
                    offset = start;
                    length = index - start - 1;

                    text =
                        text.substring(0, start) +
                        text.substring(start + 1, index) +
                        text.substring(index + 1, text.length);

                    const entity = {
                        '@type': 'textEntity',
                        offset,
                        length,
                        type: { '@type': 'textEntityTypeCode' },
                        textContent: text.substring(offset, offset + length)
                    };
                    removeEntities(offset, offset + length - 1 + 2);
                    removeOffsetAfter(offset + length, 2, entities);
                    entities.push(entity);
                    lastIndex -= 2;
                }
            }

            start = -1;
            isPre = false;
        }
    }

    // 1.1 case when ``` is one ` mono symbol
    if (start !== -1 && isPre) {
        offset = start;
        length = 1;

        if (checkEntity(offset, offset + length + 2 - 1, entities)) {
            text = text.substring(0, start) + text.substring(start + 2, text.length);

            const entity = {
                '@type': 'textEntity',
                offset,
                length,
                type: { '@type': 'textEntityTypeCode' },
                textContent: text.substring(offset, offset + length)
            };
            removeEntities(offset, offset + length - 1 + 2);
            removeOffsetAfter(offset + length, 2, entities);
            entities.push(entity);
        }
    }

    return text;
}

export function getSimpleMarkupEntities(text, entities) {
    const entityTypes = {
        '*': 'textEntityTypeBold',
        '_': 'textEntityTypeItalic',
        '~': 'textEntityTypeStrikethrough'
    };

    let index = -1;     // first index of end tag
    let lastIndex = 0;  // first index after end tag
    let start = -1;     // first index of start tag

    let offset = 0, length = 0;

    Object.entries(entityTypes).forEach(([checkChar, type]) => {
        const checkString = checkChar + checkChar;
        lastIndex = 0;
        start = -1;
        while ((index = text.indexOf(checkString, lastIndex)) !== -1) {
            if (start === -1) {
                const prevChar = index === 0 ? ' ' : text[index - 1];
                if (
                    !checkInclusion(index, entities) &&
                    (prevChar === ' ' || prevChar === '\xA0' || prevChar === '\n')
                ) {
                    start = index;
                }
                lastIndex = index + 2;
            } else {
                for (let a = index + 2; a < text.length; a++) {
                    if (text[a] === checkChar) {
                        index++;
                    } else {
                        break;
                    }
                }
                lastIndex = index + 2;
                if (checkInclusion(index, entities) || checkIntersection(start, index, entities)) {
                    start = -1;
                    continue;
                }
                if (start + 2 !== index) {
                    offset = start;
                    length = index - start - 2;
                    text =
                        text.substring(0, start) +
                        text.substring(start + 2, index) +
                        text.substring(index + 2, text.length);

                    const entity = {
                        '@type': 'textEntity',
                        offset,
                        length,
                        language: '',
                        type: { '@type': type },
                        textContent: text.substring(offset, offset + length)
                    };
                    removeOffsetAfter(offset + length, 4, entities);
                    entities.push(entity);
                    lastIndex -= 4;
                }
                start = -1;
            }
        }
    })

    return text;
}

export function canMessageBeEdited(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { can_be_edited } = message;

    return can_be_edited;
}

export function showMessageForward(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { forward_info, content } = message;

    return forward_info && content && content['@type'] !== 'messageSticker' && content['@type'] !== 'messageAudio';
}

export function isTextMessage(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { content } = message;

    return content && content['@type'] === 'messageText';
}

export function isMessagePinned(chatId, messageId) {
    const chat = ChatStore.get(chatId);
    if (!chat) return false;

    return chat.pinned_message_id === messageId;
}

export function canMessageBeUnvoted(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { content } = message;
    if (!content) return;
    if (content['@type'] !== 'messagePoll') return;

    const { poll } = content;
    if (!poll) return false;

    const { type, is_closed, options } = poll;
    if (!type) return false;
    if (type['@type'] !== 'pollTypeRegular') return false;
    if (is_closed) return false;

    return options.some(x => x.is_chosen || x.is_being_chosen);
}

export function canMessageBeClosed(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return false;

    const { content, can_be_edited } = message;
    if (!content) return;
    if (content['@type'] !== 'messagePoll') return;

    return can_be_edited;
}

export function canMessageBeForwarded(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);

    return message && message.can_be_forwarded;
}

export function canMessageBeDeleted(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);

    return message && (message.can_be_deleted_only_for_self || message.can_be_deleted_for_all_users);
}

export function getMessageStyle(chatId, messageId) {
    const message = MessageStore.get(chatId, messageId);
    if (!message) return null;

    const { content } = message;
    if (!content) return null;

    switch (content['@type']) {
        case 'messageAnimation': {
            const { animation, caption } = content;
            if (caption && caption.text) {
                return { maxWidth: PHOTO_DISPLAY_SIZE };
            }
            if (!animation) return null;

            const { width, height, thumbnail } = animation;

            const size = thumbnail || { width, height };
            if (!size) return null;

            const fitSize = getFitSize(size, PHOTO_DISPLAY_SIZE, true);
            if (!fitSize) return null;

            return { width: fitSize.width };
        }
        case 'messageGame': {
            return { maxWidth : PHOTO_DISPLAY_SIZE + 10 + 9 * 2 };
        }
        case 'messagePhoto': {
            const { photo, caption } = content;
            if (caption && caption.text) {
                return { maxWidth: PHOTO_DISPLAY_SIZE };
            }
            if (!photo) return null;

            const size = getSize(photo.sizes, PHOTO_SIZE);
            if (!size) return null;

            const fitSize = getFitSize(size, PHOTO_DISPLAY_SIZE, true);
            if (!fitSize) return null;

            return { width: fitSize.width };
        }
        case 'messageText': {
            const { web_page } = content;
            if (!web_page) return null;

            return { maxWidth : PHOTO_DISPLAY_SIZE + 10 + 9 * 2 };
        }
        case 'messageVideo': {
            const { video, caption } = content;
            if (caption && caption.text) {
                return { maxWidth: PHOTO_DISPLAY_SIZE };
            }

            if (!video) return null;

            const { thumbnail, width, height } = video;

            const size = thumbnail || { width, height };
            if (!size) return null;

            const fitSize = getFitSize(size, PHOTO_DISPLAY_SIZE, true);
            if (!fitSize) return null;

            return { width: fitSize.width };
        }
    }

    return null;
}

export {
    getAuthor,
    getTitle,
    getText,
    getFormattedText,
    getWebPage,
    getContent,
    getDate,
    getDateHint,
    isForwardOriginHidden,
    getForwardTitle,
    getUnread,
    getSenderUserId,
    filterDuplicateMessages,
    filterMessages,
    isMediaContent,
    isDeletedMessage,
    isVideoMessage,
    isAnimationMessage,
    isLottieMessage,
    getLocationId,
    isContentOpened,
    hasAudio,
    hasVideoNote,
    getSearchMessagesFilter,
    openMedia,
    getReplyPhotoSize,
    getEmojiMatches,
    messageComparatorDesc,
    substring,
    stopPropagation
};
