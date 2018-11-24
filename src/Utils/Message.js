/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import dateFormat from 'dateformat';
import PhotoControl from '../Components/Message/Media/PhotoControl';
import StickerControl from '../Components/Message/Media/StickerControl';
import LocationControl from '../Components/Message/Media/LocationControl';
import VenueControl from '../Components/Message/Media/VenueControl';
import ContactControl from '../Components/Message/Media/ContactControl';
import DocumentControl from '../Components/Message/Media/DocumentControl';
import { getUserFullName } from './User';
import { getServiceMessageContent } from './ServiceMessage';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';

function getTitle(message){
    if (!message) return null;

    let from = null;
    let title = null;
    if (message.sender_user_id && message.sender_user_id !== 0){
        from = UserStore.get(message.sender_user_id);
        if (from) {
            title = getUserFullName(from);
        }
    }
    else if (message.chat_id){
        from = ChatStore.get(message.chat_id);
        if (from) title = from.title;
    }

    return title;
}

function substring(text, start, end){
    if (start < 0) start = 0;
    if (start > text.length - 1) start = text.length - 1;
    if (end < start) end = start;
    if (end > text.length) end = text.length;

    return text.substring(start, end);
}

function getFormattedText(text){
    if (text['@type'] !== 'formattedText') return null;
    if (!text.text) return null;
    if (!text.entities) return text.text;

    let result = [];
    let index = 0;
    for (let i = 0; i < text.entities.length; i++){
        let beforeEntityText = substring(text.text, index, text.entities[i].offset);
        if (beforeEntityText){
            result.push(beforeEntityText);
        }

        let entityText = substring(text.text, text.entities[i].offset, text.entities[i].offset + text.entities[i].length);
        switch (text.entities[i].type['@type']){
            case 'textEntityTypeUrl': {
                let url = entityText.startsWith('http') ? entityText : 'http://' + entityText;
                let decodedUrl;
                try{
                    decodedUrl = decodeURI(entityText);
                }
                catch (error) {
                    console.error('uri: ' + entityText + '\n' +  error);
                    decodedUrl = entityText;
                }

                result.push((<a key={text.entities[i].offset} href={url} title={url} target='_blank' rel='noopener noreferrer'>{decodedUrl}</a>));
                break; }
            case 'textEntityTypeTextUrl': {
                let url = text.entities[i].type.url.startsWith('http') ? text.entities[i].type.url : 'http://' + text.entities[i].type.url;
                result.push((<a key={text.entities[i].offset} href={url} title={url} target='_blank' rel='noopener noreferrer'>{entityText}</a>));
                break; }
            case 'textEntityTypeBold':
                result.push((<strong key={text.entities[i].offset}>{entityText}</strong>));
                break;
            case 'textEntityTypeItalic':
                result.push((<em key={text.entities[i].offset}>{entityText}</em>));
                break;
            case 'textEntityTypeCode':
                result.push((<code key={text.entities[i].offset}>{entityText}</code>));
                break;
            case 'textEntityTypePre':
                result.push((<pre key={text.entities[i].offset}><code>{entityText}</code></pre>));
                break;
            case 'textEntityTypeMention':
                result.push((<a key={text.entities[i].offset} href={`#/im?p=${entityText}`}>{entityText}</a>));
                break;
            case 'textEntityTypeMentionName':
                result.push((<a key={text.entities[i].offset} href={`#/im?p=u${text.entities[i].type.user_id}`}>{entityText}</a>));
                break;
            case 'textEntityTypeHashtag':
                let hashtag = entityText.length > 0 && entityText[0] === '#' ? substring(entityText, 1) : entityText;
                result.push((<a key={text.entities[i].offset} href={`tg://search_hashtag?hashtag=${hashtag}`}>{entityText}</a>));
                break;
            case 'textEntityTypeEmailAddress':
                result.push((<a key={text.entities[i].offset} href={`mailto:${entityText}`} target='_blank' rel='noopener noreferrer'>{entityText}</a>));
                break;
            case 'textEntityTypeBotCommand':
                let command = entityText.length > 0 && entityText[0] === '/' ? substring(entityText, 1) : entityText;
                result.push((<a key={text.entities[i].offset} href={`tg://bot_command?command=${command}&bot=`}>{entityText}</a>));
                break;
            default :
                result.push(entityText);
                break;
        }

        index += beforeEntityText.length + entityText.length;
    }

    if (index < text.text.length){
        let afterEntityText = text.text.substring(index);
        if (afterEntityText){
            result.push(afterEntityText);
        }
    }

    return result;
}

function getText(message){
    if (!message) return null;

    let text = [];

    const {content} = message;

    if (content
        && content['@type'] === 'messageText'
        && content.text
        && content.text['@type'] === 'formattedText'
        && content.text.text) {
        text = getFormattedText(content.text);
    }
    else {
        //text.push('[' + message.content['@type'] + ']');//JSON.stringify(x);
        if (content && content.caption
            && content.caption['@type'] === 'formattedText'
            && content.caption.text){
            text.push("\n");
            let formattedText = getFormattedText(content.caption);
            if (formattedText){
                text = text.concat(formattedText);
            }
        }
    }

    return text;
}

function getDate(message){
    if (!message) return null;
    if (!message.date) return null;

    let date = new Date(message.date * 1000);

    return dateFormat(date, 'H:MM');//date.toDateString();
}

function getDateHint(message){
    if (!message) return null;
    if (!message.date) return null;

    let date = new Date(message.date * 1000);
    return dateFormat(date, 'H:MM:ss d.mm.yyyy');//date.toDateString();
}

function getMedia(message, openMedia){
    if (!message) return null;
    if (!message.content) return null;

    switch (message.content['@type']){
        case 'messageText':
            return null;
        case 'messagePhoto':
            return (<PhotoControl message={message} openMedia={openMedia}/>);
        case 'messageSticker':
            return (<StickerControl message={message} openMedia={openMedia}/>);
        case 'messageLocation':
            return (<LocationControl message={message} openMedia={openMedia}/>);
        case 'messageVenue':
            return (<VenueControl message={message} openMedia={openMedia}/>);
        case 'messageContact':
            return (<ContactControl message={message} openMedia={openMedia}/>);
        case 'messageDocument':
            return (<DocumentControl message={message} openMedia={openMedia}/>);
        default :
            return '[' + message.content['@type'] + ']';
    }
}

function getReply(message){
    if (!message) return null;
    if (!message.reply_to_message_id) return null;

    return message.reply_to_message_id;
}

function getForward(message){
    if (!message) return null;
    if (!message.forward_info) return null;

    switch (message.forward_info['@type']) {
        case 'messageForwardedFromUser': {
            let user = UserStore.get(message.forward_info.sender_user_id);
            if (user) {
                return getUserFullName(user);
            }
            break;
        }
        case 'messageForwardedPost': {
            let chat = ChatStore.get(message.forward_info.chat_id);
            if (chat) return chat.title;
            break;
        }
    }

    return null;
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

function filterMessages(result, history){
    if (result.messages.length === 0) return;
    if (history.length === 0) return;

    const map = history.reduce(function(accumulator, current) {
        accumulator.set(current.id, current.id);
        return accumulator;
    }, new Map());

    result.messages = result.messages.filter(x => !map.has(x.id));
}

function getContent(message){
    if (!message) return null;

    const { content } = message;
    if (!content) return null;

    let caption = '';
    if (content.caption && content.caption.text){
        caption = `, ${content.caption.text}`;
    }

    switch (content['@type']) {
        case 'messageAnimation': {
            return 'GIF' + caption;
        }
        case 'messageAudio': {
            return 'Audio' + caption;
        }
        case 'messageBasicGroupChatCreate': {
            return getServiceMessageContent(message);
        }
        case 'messageCall': {
            return 'Call' + caption;
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
            return 'Contact' + caption;
        }
        case 'messageContactRegistered': {
            return getServiceMessageContent(message);
        }
        case 'messageCustomServiceAction': {
            return getServiceMessageContent(message);
        }
        case 'messageDocument':{
            return 'Document' + caption;
        }
        case 'messageExpiredPhoto':{
            return 'Photo' + caption;
        }
        case 'messageExpiredVideo':{
            return 'Video' + caption;
        }
        case 'messageGame': {
            return 'Game' + caption;
        }
        case 'messageGameScore': {
            return getServiceMessageContent(message);
        }
        case 'messageInvoice': {
            return 'Invoice' + caption;
        }
        case 'messageLocation': {
            return 'Location' + caption;
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
            return 'Photo' + caption;
        }
        case 'messagePinMessage': {
            return getServiceMessageContent(message);
        }
        case 'messageScreenshotTaken': {
            return getServiceMessageContent(message);
        }
        case 'messageSticker': {
            return 'Sticker' + caption;
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
            return 'Venue' + caption;
        }
        case 'messageVideo': {
            return 'Video' + caption;
        }
        case 'messageVideoNote': {
            return 'Video message' + caption;
        }
        case 'messageVoiceNote': {
            return 'Voice message' + caption;
        }
        case 'messageWebsiteConnected': {
            return getServiceMessageContent(message);
        }
        default: {
            return `[${content['@type']}]`;
        }
    }
}

export {
    getTitle,
    getText,
    getContent,
    getDate,
    getDateHint,
    getMedia,
    getReply,
    getForward,
    getUnread,
    getSenderUserId,
    filterMessages
};