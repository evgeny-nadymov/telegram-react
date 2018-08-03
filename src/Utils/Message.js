import React from 'react';
import PhotoControl from '../Components/Media/PhotoControl';
import StickerControl from '../Components/Media/StickerControl';
import LocationControl from '../Components/Media/LocationControl';
import VenueControl from '../Components/Media/VenueControl';
import ContactControl from '../Components/Media/ContactControl';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import dateFormat from "dateformat";

function getTitle(message){
    if (!message) return null;

    let from = null;
    let title = null;
    if (message.sender_user_id && message.sender_user_id !== 0){
        from = UserStore.get(message.sender_user_id);
        if (from) {
            if (from.first_name
                && from.last_name)
            {
                title = from.first_name + ' ' + from.last_name;
            }
            else if (from.first_name){
                title = from.first_name;
            }
            else{
                title = from.last_name;
            }
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
                result.push((<a key={text.entities[i].offset} href={url} target='_blank' rel='noopener noreferrer'>{decodeURI(entityText)}</a>));
                break; }
            case 'textEntityTypeTextUrl': {
                let url = text.entities[i].type.url.startsWith('http') ? text.entities[i].type.url : 'http://' + text.entities[i].type.url;
                result.push((<a key={text.entities[i].offset} href={url} target='_blank' rel='noopener noreferrer'>{decodeURI(entityText)}</a>));
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

    if (message.content
        && message.content['@type'] === 'messageText'
        && message.content.text
        && message.content.text['@type'] === 'formattedText'
        && message.content.text.text) {
        text = getFormattedText(message.content.text);
    }
    else {
        //text.push('[' + message.content['@type'] + ']');//JSON.stringify(x);
        if (message.content && message.content.caption
            && message.content.caption['@type'] === 'formattedText'
            && message.content.caption.text){
            text.push("\n");
            let formattedText = getFormattedText(message.content.caption);
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
    let dateFormatted = dateFormat(date, 'H:MM');//date.toDateString();

    return dateFormatted;
}

function getDateHint(message){
    if (!message) return null;
    if (!message.date) return null;

    let date = new Date(message.date * 1000);
    let dateFormatted = dateFormat(date, 'H:MM:ss d.mm.yyyy');//date.toDateString();

    return dateFormatted;
}

function getMedia(message, openMedia){
    if (!message) return null;
    if (!message.content) return null;

    switch (message.content['@type']){
        case 'messageText':
            return null;
        case 'messagePhoto':
            return (<PhotoControl message={message}/>);
        case 'messageSticker':
            return (<StickerControl message={message}/>);
        case 'messageLocation':
            return (<LocationControl message={message}/>);
        case 'messageVenue':
            return (<VenueControl message={message}/>);
        case 'messageContact':
            return (<ContactControl message={message} openMedia={openMedia}/>);
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
                if (user.first_name && user.last_name) return user.first_name + ' ' + user.last_name;
                if (user.first_name) return user.first_name;
                if (user.last_name) return user.last_name;
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

    return chat.last_read_outbox_message_id && chat.last_read_outbox_message_id < message.id;
}

let serviceMap = new Map();
serviceMap.set('messageBasicGroupChatCreate', 'messageBasicGroupChatCreate');
serviceMap.set('messageChatAddMembers', 'messageChatAddMembers');
serviceMap.set('messageChatChangePhoto', 'messageChatChangePhoto');
serviceMap.set('messageChatChangeTitle', 'messageChatChangeTitle');
serviceMap.set('messageChatDeleteMember', 'messageChatDeleteMember');
serviceMap.set('messageChatDeletePhoto', 'messageChatDeletePhoto');
serviceMap.set('messageChatJoinByLink', 'messageChatJoinByLink');
serviceMap.set('messageChatUpgradeFrom', 'messageChatUpgradeFrom');
serviceMap.set('messageChatUpgradeTo', 'messageChatUpgradeTo');
serviceMap.set('messageContactRegistered', 'messageContactRegistered');
serviceMap.set('messageCustomServiceAction', 'messageCustomServiceAction');
serviceMap.set('messagePaymentSuccessful', 'messagePaymentSuccessful');
serviceMap.set('messagePinMessage', 'messagePinMessage');
serviceMap.set('messageScreenshotTaken', 'messageScreenshotTaken');
serviceMap.set('messageSupergroupChatCreate', 'messageSupergroupChatCreate');
serviceMap.set('messageUnsupported', 'messageUnsupported');
serviceMap.set('messageWebsiteConnected', 'messageWebsiteConnected');

function isServiceMessage(message) {
    if (!message) return false;
    if (!message.content) return false;

    return serviceMap.has(message.content['@type']);
}

export {getTitle, getText, getDate, getDateHint, getMedia, getReply, getForward, getUnread, isServiceMessage};