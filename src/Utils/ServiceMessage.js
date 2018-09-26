import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import SupergroupStore from '../Stores/SupergroupStore';
import MessageStore from '../Stores/MessageStore';
import MessageAuthorControl from '../Components/MessageAuthorControl';
import Currency from './Currency';
import React from 'react';
import { getUserFullName } from './User';

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
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` created group «${title}»`}
                </React.Fragment>
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
                        <React.Fragment>
                            {'You added '}
                            {members}
                        </React.Fragment>
                    );
            }

            return content.member_user_ids.length === 1
            && content.member_user_ids[0] === message.sender_user_id
                ? (
                    <React.Fragment>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' joined the group'}
                    </React.Fragment>
                )
                : (
                    <React.Fragment>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' added '}
                        {members}
                    </React.Fragment>
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
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` updated group photo`}
                </React.Fragment>
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
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` changed group name to «${title}»`}
                </React.Fragment>
            );
        }
        case 'messageChatDeleteMember' : {

            if (isOutgoing) {
                return me && content.user_id === me.id
                    ? 'You left the group'
                    : (
                        <React.Fragment>
                            {'You removed '}
                            <MessageAuthorControl userId={content.user_id} onSelect={onSelectUser}/>
                        </React.Fragment>
                    );
            }

            return content.user_id === message.sender_user_id
                ? (
                    <React.Fragment>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' left the group'}
                    </React.Fragment>
                )
                : (
                    <React.Fragment>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' removed '}
                        <MessageAuthorControl userId={content.user_id} onSelect={onSelectUser}/>
                    </React.Fragment>
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
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {' removed group photo'}
                </React.Fragment>
            );
        }
        case 'messageChatJoinByLink' : {

            if (isOutgoing) {
                return 'You joined the group via invite link';
            }

            return (
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {' joined the group via invite link'}
                </React.Fragment>
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
                    <React.Fragment>
                        <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                        {' disabled the self-destruct timer'}
                    </React.Fragment>
                );
            }

            if (isOutgoing) {
                return `You set the self-destruct timer to ${ttlString}`;
            }

            return (
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` set the self-destruct timer to ${ttlString}`}
                </React.Fragment>
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
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {' just joined Telegram'}
                </React.Fragment>
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
                    <React.Fragment>
                        <MessageAuthorControl userId={messageGame.sender_user_id} onSelect={onSelectUser}/>
                        {` scored ${content.score} in «${game.title}»`}
                    </React.Fragment>
                );
            }

            if (isOutgoing){
                return `You scored ${content.score}`;
            }

            return (
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` scored ${content.score}`}
                </React.Fragment>
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
                <React.Fragment>
                    <MessageAuthorControl userId={chat.type.user_id} onSelect={onSelectUser}/>
                    {' received the following documents: '}
                    {passportElementTypes}
                </React.Fragment>
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
                    <React.Fragment>
                        {`You have just successfully transferred ${Currency.getString(content.total_amount, content.currency)} to `}
                        <MessageAuthorControl userId={chat.type.user_id} onSelect={onSelectUser}/>
                        {` for ${invoice.title}`}
                    </React.Fragment>
                );
            }

            return (
                <React.Fragment>
                    {`You have just successfully transferred ${Currency.getString(content.total_amount, content.currency)} to `}
                    <MessageAuthorControl userId={chat.type.user_id} onSelect={onSelectUser}/>
                </React.Fragment>
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
                    <React.Fragment>
                        {author}
                        {' pinned a message'}
                    </React.Fragment>
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
                <React.Fragment>
                    {author}
                    {pinnedContent}
                </React.Fragment>
            );
        }
        case 'messageScreenshotTaken' : {
            if (isOutgoing) {
                return 'You took a screenshot!';
            }

            return (
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {' took a screenshot!'}
                </React.Fragment>
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
                <React.Fragment>
                    <MessageAuthorControl userId={message.sender_user_id} onSelect={onSelectUser}/>
                    {` created group «${title}»`}
                </React.Fragment>
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
    isServiceMessage,
    getServiceMessageContent
};