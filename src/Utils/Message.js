import React from 'react';
import PhotoControl from '../Components/Media/PhotoControl';
import StickerControl from '../Components/Media/StickerControl';
import LocationControl from '../Components/Media/LocationControl';
import VenueControl from '../Components/Media/VenueControl';
import ContactControl from '../Components/Media/ContactControl';
import DocumentControl from '../Components/Media/DocumentControl';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import SupergroupStore from '../Stores/SupergroupStore';
import MessageStore from '../Stores/MessageStore';
import dateFormat from "dateformat";
import { getUserFullName } from './User';
import MessageAuthorControl from '../Components/MessageAuthorControl';
import Currency from '../Utils/Currency';

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

let serviceMap = new Map();
serviceMap.set('messageBasicGroupChatCreate', 'messageBasicGroupChatCreate');
serviceMap.set('messageChatAddMembers', 'messageChatAddMembers');
serviceMap.set('messageChatChangePhoto', 'messageChatChangePhoto');
serviceMap.set('messageChatChangeTitle', 'messageChatChangeTitle');
serviceMap.set('messageChatDeleteMember', 'messageChatDeleteMember');
serviceMap.set('messageChatDeletePhoto', 'messageChatDeletePhoto');
serviceMap.set('messageChatJoinByLink', 'messageChatJoinByLink');
serviceMap.set('messageChatSetTtl', 'messageChatSetTtl');
serviceMap.set('messageChatUpgradeFrom', 'messageChatUpgradeFrom');
serviceMap.set('messageChatUpgradeTo', 'messageChatUpgradeTo');
serviceMap.set('messageContactRegistered', 'messageContactRegistered');
serviceMap.set('messageCustomServiceAction', 'messageCustomServiceAction');
serviceMap.set('messageGameScore', 'messageGameScore');
serviceMap.set('messagePassportDataReceived', 'messagePassportDataReceived');
serviceMap.set('messagePassportDataSent', 'messagePassportDataSent');
serviceMap.set('messagePaymentSuccessful', 'messagePaymentSuccessful');
serviceMap.set('messagePaymentSuccessfulBot', 'messagePaymentSuccessfulBot');
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

function getTTLString(ttl){
    if (ttl < 60){
        const seconds = ttl === 1 ? 'second' : 'seconds';
        return `${ttl} ${seconds}`;
    }
    if (ttl < 60 * 60){
        const minutes = Math.floor(ttl / 60) === 1 ? 'minute' : 'minutes';
        return `${ttl} ${minutes}`;
    }
    if (ttl < 24 * 60 * 60){
        const hours = Math.floor(ttl / 60 / 60) === 1 ? 'hour' : 'hours';
        return `${ttl} ${hours}`;
    }
    if (ttl < 7 * 24 * 60 * 60){
        const days = Math.floor(ttl / 60 / 60 / 24) === 1 ? 'day' : 'days';
        return `${ttl} ${days}`;
    }
    if (ttl === 7 * 24 * 60 * 60){
        return '1 week';
    }

    return `${ttl} seconds`;
}

function getPassportElementTypeString(type){
    switch (type['@type']) {
        case 'passportElementTypeAddress' : {
            return 'Address';
        }
        case 'passportElementTypeBankStatement' : {
            return 'Bank Statement';
        }
        case 'passportElementTypeDriverLicense' : {
            return 'Driver Licence';
        }
        case 'passportElementTypeEmailAddress' : {
            return 'Email';
        }
        case 'passportElementTypeIdentityCard' : {
            return 'Identity Card';
        }
        case 'passportElementTypeInternalPassport' : {
            return 'Internal Passport';
        }
        case 'passportElementTypePassport' : {
            return 'Passport';
        }
        case 'passportElementTypePassportRegistration' : {
            return 'Passport Registration';
        }
        case 'passportElementTypePersonalDetails' : {
            return 'Personal details';
        }
        case 'passportElementTypePhoneNumber' : {
            return 'Phone Number';
        }
        case 'passportElementTypeRentalAgreement' : {
            return 'Tenancy Agreement';
        }
        case 'passportElementTypeTemporaryRegistration' : {
            return 'Temporary Registration';
        }
        case 'passportElementTypeUtilityBill' : {
            return 'Utility Bill';
        }
    }

    return '';
}

function getMessageAuthor(message, onSelectUser) {
    if (!message) return null;

    const chat = ChatStore.get(message.chat_id);
    if (!chat) return null;

    if (message.sender_user_id !== 0){
        return (<MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>);
    }

    return chat.title;
}

function getServiceMessageContent(message, onSelectUser){
    if (!message) return null;
    if (!message.content) return null;

    const me = UserStore.getMe();
    const isOutgoing = me && message.sender_user_id === me.id;
    const chat = ChatStore.get(message.chat_id);
    const isChannel = chat.type['@type'] === 'chatTypeSupergroup' && chat.type.is_channel;

    const {content} = message;
    switch (content['@type']) {
        case 'messageBasicGroupChatCreate' : {
            const {title} = ChatStore.get(message.chat_id);

            if (isOutgoing){
                return `You created group «${title}»`;
            }

            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` created group «${title}»`}
                </div>
            );
        }
        case 'messageChatAddMembers' : {
            const members = content.member_user_ids
                .map(x => <MessageAuthorControl userId={x} onSelect={onSelectUser}/>)
                .reduce((accumulator, current, index, array) => {
                    const separator = index === array.length - 1 ? ' and ': ', ';
                    return accumulator === null ? [current] : [...accumulator, separator, current]
                }, null);

            if (isOutgoing) {
                return me
                    && content.member_user_ids.length === 1
                    && content.member_user_ids[0] === me.id
                    ? 'You joined the group'
                    : (
                        <div>
                            {'You added '}
                            {members}
                        </div>
                    );
            }

            return content.member_user_ids.length === 1
                && content.member_user_ids[0] === message.sender_user_id
                ? (
                    <div>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' joined the group'}
                    </div>
                )
                : (
                    <div>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' added '}
                        {members}
                    </div>
                );
        }
        case 'messageChatChangePhoto' : {
            if (isChannel){
                return 'Channel photo updated';
            }

            if (isOutgoing){
                return 'You updated group photo';
            }

            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` updated group photo`}
                </div>
            );
        }
        case 'messageChatChangeTitle' : {
            const {title} = content;

            if (isChannel){
                return `Channel name was changed to «${title}»`;
            }

            if (isOutgoing){
                return `You changed group name to «${title}»`;
            }

            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` changed group name to «${title}»`}
                </div>
            );
        }
        case 'messageChatDeleteMember' : {

            if (isOutgoing) {
                return me && content.user_id === me.id
                    ? 'You left the group'
                    : (
                        <div>
                            {'You removed '}
                            <MessageAuthorControl userId={content.user_id} onSelect={onSelectUser}/>
                        </div>
                    );
            }

            return content.user_id === message.sender_user_id
                ? (
                    <div>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' left the group'}
                    </div>
                )
                : (
                    <div>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' removed '}
                        <MessageAuthorControl userId={content.user_id} onSelect={onSelectUser}/>
                    </div>
                );
        }
        case 'messageChatDeletePhoto' : {

            if (isChannel){
                return 'Channel photo removed';
            }

            if (isOutgoing){
                return 'You removed group photo';
            }

            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {' removed group photo'}
                </div>
            );
        }
        case 'messageChatJoinByLink' : {

            if (isOutgoing) {
                return 'You joined the group via invite link';
            }

            return (
                    <div>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' joined the group via invite link'}
                    </div>
                );
        }
        case 'messageChatSetTtl' : {
            const {ttl} = content;
            const ttlString = getTTLString(ttl);

            if (ttl <= 0){
                if (isOutgoing){
                    return 'You disabled the self-destruct timer';
                }

                return (
                    <div>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' disabled the self-destruct timer'}
                    </div>
                );
            }

            if (isOutgoing) {
                return `You set the self-destruct timer to ${ttlString}`;
            }

            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` set the self-destruct timer to ${ttlString}`}
                </div>
            );
        }
        case 'messageChatUpgradeFrom' : {
            return 'The group was upgraded to a supergroup';
        }
        case 'messageChatUpgradeTo' : {
            const supergroup = SupergroupStore.get(content.supergroup_id);
            const title = supergroup ? supergroup.title : '';

            return `Chat migrated to channel «${title}»`;
        }
        case 'messageContactRegistered' : {
            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {' just joined Telegram'}
                </div>
            );
        }
        case 'messageCustomServiceAction' : {
            return content.text;
        }
        case 'messageGameScore' : {
            const messageGame = MessageStore.get(message.chat_id, content.game_message_id);
            if (messageGame
                && messageGame.content
                && messageGame.content['@type'] === 'messageGame'
                && messageGame.content.game){

                const {game} = messageGame.content;

                if (isOutgoing){
                    return `You scored ${content.score} in «${game.title}»`;
                }

                return (
                    <div>
                        <MessageAuthorControl userId={messageGame.sender_user_id} onSelect={onSelectUser}/>
                        {` scored ${content.score} in «${game.title}»`}
                    </div>
                );
            }

            if (isOutgoing){
                return `You scored ${content.score}`;
            }

            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` scored ${content.score}`}
                </div>
            );
        }
        case 'messagePassportDataReceived' : {
            return 'Telegram Passport data received';
        }
        case 'messagePassportDataSent' : {
            const chat = ChatStore.get(message.chat_id);

            const passportElementTypes = content.types.map(x => getPassportElementTypeString(x))
                .reduce((accumulator, current) => {
                    return accumulator === null ? [current] : [...accumulator, ', ', current]
                }, null);

            return (
                <div>
                    <MessageAuthorControl userId={chat.type.user_id} onSelect={onSelectUser}/>
                    {' received the following documents: '}
                    {passportElementTypes}
                </div>
            );
        }
        case 'messagePaymentSuccessful' : {
            const chat = ChatStore.get(message.chat_id);

            const messageInvoice = MessageStore.get(message.chat_id, content.invoice_message_id);
            if (messageInvoice
                && messageInvoice.content
                && messageInvoice.content['@type'] === 'messageInvoice'
                && messageInvoice.content.invoice){

                const {invoice} = messageInvoice.content;

                return (
                    <div>
                        {`You have just successfully transferred ${Currency.getString(content.total_amount, content.currency)} to `}
                        <MessageAuthorControl userId={chat.type.user_id} onSelect={onSelectUser}/>
                        {` for ${invoice.title}`}
                    </div>
                );
            }

            return (
                <div>
                    {`You have just successfully transferred ${Currency.getString(content.total_amount, content.currency)} to `}
                    <MessageAuthorControl userId={chat.type.user_id} onSelect={onSelectUser}/>
                </div>
            );
        }
        case 'messagePaymentSuccessfulBot' : {
            return 'Payment successful';
        }
        case 'messagePinMessage' : {
            const author = getMessageAuthor(message, onSelectUser);
            const pinnedMessage = MessageStore.get(message.chat_id, content.message_id);
            if (!pinnedMessage){
                return (
                    <div>
                        {author}
                        {' pinned a message'}
                    </div>
                );
            }

            let pinnedContent = ' pinned a message';
            if (isServiceMessage(pinnedMessage)){
                pinnedContent = ' pinned a service message';
            }
            else{
                switch (pinnedMessage.content['@type']) {
                    case 'messageAnimation' : {
                        pinnedContent = ' pinned a GIF';
                        break;
                    }
                    case 'messageAudio' : {
                        pinnedContent = ' pinned a track';
                        break;
                    }
                    case 'messageCall' : {
                        pinnedContent = ' pinned a call';
                        break;
                    }
                    case 'messageContact' : {
                        pinnedContent = ' pinned a contact';
                        break;
                    }
                    case 'messageDocument' : {
                        pinnedContent = ' pinned a file';
                        break;
                    }
                    case 'messageExpiredPhoto' : {
                        pinnedContent = ' pinned a photo';
                        break;
                    }
                    case 'messageExpiredVideo' : {
                        pinnedContent = ' pinned a video';
                        break;
                    }
                    case 'messageGame' : {
                        pinnedContent = ' pinned a game';
                        break;
                    }
                    case 'messageInvoice' : {
                        pinnedContent = ' pinned an invoice';
                        break;
                    }
                    case 'messageLocation' : {
                        pinnedContent = ' pinned a map';
                        break;
                    }
                    case 'messagePhoto' : {
                        pinnedContent = ' pinned a photo';
                        break;
                    }
                    case 'messageSticker' : {
                        pinnedContent = ' pinned a sticker';
                        break;
                    }
                    case 'messageText' : {
                        const maxLength = 16;
                        const text = pinnedMessage.content.text.text;
                        if (text.length <= maxLength){
                            pinnedContent = ` pinned «${text}»`;
                        }
                        else{
                            pinnedContent = ` pinned «${text.substring(0, maxLength)}...»`;
                        }

                        break;
                    }
                    case 'messageUnsupported' : {
                        pinnedContent = ' pinned unsupported message';
                        break;
                    }
                    case 'messageVenue' : {
                        pinnedContent = ' pinned a venue';
                        break;
                    }
                    case 'messageVideo' : {
                        pinnedContent = ' pinned a video';
                        break;
                    }
                    case 'messageVideoNote' : {
                        pinnedContent = ' pinned a video message';
                        break;
                    }
                    case 'messageVoiceNote' : {
                        pinnedContent = ' pinned a voice message';
                        break;
                    }
                }
            }

            return (
                <div>
                    {author}
                    {pinnedContent}
                </div>
            );
        }
        case 'messageScreenshotTaken' : {
            if (isOutgoing) {
                return 'You took a screenshot!';
            }

            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {' took a screenshot!'}
                </div>
            );
        }
        case 'messageSupergroupChatCreate' : {
            const {title} = content;

            if (isChannel){
                return 'Channel created';
            }

            if (isOutgoing){
                return `You created group «${title}»`;
            }

            return (
                <div>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` created group «${title}»`}
                </div>
            );
        }
        case 'messageUnsupported' : {
            return 'Unsupported message';
        }
        case 'messageWebsiteConnected' : {
            return `You allowed this bot to message you when you logged in on ${content.domain_name}.`;
        }
    }

    return `[${message.content['@type']}]`;
}

export {
    getTitle,
    getText,
    getDate,
    getDateHint,
    getMedia,
    getReply,
    getForward,
    getUnread,
    isServiceMessage,
    getServiceMessageContent
};