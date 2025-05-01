/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Currency from './Currency';
import MessageAuthor from '../Components/Message/MessageAuthor';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import MessageStore from '../Stores/MessageStore';

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

    return serviceMap.has(message.content['@type']) || message.ttl > 0;
}

function getTTLString(ttl) {
    if (ttl < 60) {
        const seconds = ttl === 1 ? 'second' : 'seconds';
        return `${ttl} ${seconds}`;
    }
    if (ttl < 60 * 60) {
        const minutes = Math.floor(ttl / 60) === 1 ? 'minute' : 'minutes';
        return `${ttl} ${minutes}`;
    }
    if (ttl < 24 * 60 * 60) {
        const hours = Math.floor(ttl / 60 / 60) === 1 ? 'hour' : 'hours';
        return `${ttl} ${hours}`;
    }
    if (ttl < 7 * 24 * 60 * 60) {
        const days = Math.floor(ttl / 60 / 60 / 24) === 1 ? 'day' : 'days';
        return `${ttl} ${days}`;
    }
    if (ttl === 7 * 24 * 60 * 60) {
        return '1 week';
    }

    return `${ttl} seconds`;
}

function getPassportElementTypeString(type) {
    switch (type['@type']) {
        case 'passportElementTypeAddress': {
            return 'Address';
        }
        case 'passportElementTypeBankStatement': {
            return 'Bank Statement';
        }
        case 'passportElementTypeDriverLicense': {
            return 'Driver Licence';
        }
        case 'passportElementTypeEmailAddress': {
            return 'Email';
        }
        case 'passportElementTypeIdentityCard': {
            return 'Identity Card';
        }
        case 'passportElementTypeInternalPassport': {
            return 'Internal Passport';
        }
        case 'passportElementTypePassport': {
            return 'Passport';
        }
        case 'passportElementTypePassportRegistration': {
            return 'Passport Registration';
        }
        case 'passportElementTypePersonalDetails': {
            return 'Personal details';
        }
        case 'passportElementTypePhoneNumber': {
            return 'Phone Number';
        }
        case 'passportElementTypeRentalAgreement': {
            return 'Tenancy Agreement';
        }
        case 'passportElementTypeTemporaryRegistration': {
            return 'Temporary Registration';
        }
        case 'passportElementTypeUtilityBill': {
            return 'Utility Bill';
        }
    }

    return '';
}

function getMessageAuthor(message, openUser) {
    if (!message) return null;

    const { chat_id, sender_user_id } = message;

    if (sender_user_id !== 0) {
        return <MessageAuthor userId={sender_user_id} openUser={openUser} />;
    }

    const chat = ChatStore.get(chat_id);
    if (!chat) return null;

    return chat.title;
}

function getServiceMessageContent(message, openUser = false) {
    if (!message) return null;
    if (!message.content) return null;

    const chat = ChatStore.get(message.chat_id);
    const isChannel = chat.type['@type'] === 'chatTypeSupergroup' && chat.type.is_channel;

    const { ttl, sender_user_id, content, is_outgoing: isOutgoing } = message;
    if (ttl > 0) {
        switch (content['@type']) {
            case 'messagePhoto': {
                if (isOutgoing) {
                    return 'You sent a self-destructing photo. Please view it on your mobile';
                }

                return (
                    <>
                        <MessageAuthor userId={sender_user_id} openUser={openUser} />
                        {' sent a self-destructing photo. Please view it on your mobile'}
                    </>
                );
            }
            case 'messageVideo': {
                if (isOutgoing) {
                    return 'You sent a self-destructing video. Please view it on your mobile';
                }

                return (
                    <>
                        <MessageAuthor userId={sender_user_id} openUser={openUser} />
                        {' sent a self-destructing video. Please view it on your mobile'}
                    </>
                );
            }
            default: {
                if (isOutgoing) {
                    return 'You sent a self-destructing message. Please view it on your mobile';
                }

                return (
                    <>
                        <MessageAuthor userId={sender_user_id} openUser={openUser} />
                        {' sent a self-destructing message. Please view it on your mobile'}
                    </>
                );
            }
        }
    }

    switch (content['@type']) {
        case 'messageBasicGroupChatCreate': {
            const { title } = ChatStore.get(message.chat_id);

            if (isOutgoing) {
                return `You created group «${title}»`;
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {` created group «${title}»`}
                </>
            );
        }
        case 'messageChatAddMembers': {
            const members = content.member_user_ids
                .map(x => <MessageAuthor key={x} userId={x} openUser={openUser} />)
                .reduce((accumulator, current, index, array) => {
                    const separator = index === array.length - 1 ? ' and ' : ', ';
                    return accumulator === null ? [current] : [...accumulator, separator, current];
                }, null);

            if (isOutgoing) {
                return content.member_user_ids.length === 1 && content.member_user_ids[0] === UserStore.getMyId() ? (
                    'You joined the group'
                ) : (
                    <>
                        {'You added '}
                        {members}
                    </>
                );
            }

            return content.member_user_ids.length === 1 && content.member_user_ids[0] === message.sender_user_id ? (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {' joined the group'}
                </>
            ) : (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {' added '}
                    {members}
                </>
            );
        }
        case 'messageChatChangePhoto': {
            if (isChannel) {
                return 'Channel photo updated';
            }

            if (isOutgoing) {
                return 'You updated group photo';
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {` updated group photo`}
                </>
            );
        }
        case 'messageChatChangeTitle': {
            const { title } = content;

            if (isChannel) {
                return `Channel name was changed to «${title}»`;
            }

            if (isOutgoing) {
                return `You changed group name to «${title}»`;
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {` changed group name to «${title}»`}
                </>
            );
        }
        case 'messageChatDeleteMember': {
            if (isOutgoing) {
                return content.user_id === UserStore.getMyId() ? (
                    'You left the group'
                ) : (
                    <>
                        {'You removed '}
                        <MessageAuthor userId={content.user_id} openUser={openUser} />
                    </>
                );
            }

            return content.user_id === sender_user_id ? (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {' left the group'}
                </>
            ) : (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {' removed '}
                    <MessageAuthor userId={content.user_id} openUser={openUser} />
                </>
            );
        }
        case 'messageChatDeletePhoto': {
            if (isChannel) {
                return 'Channel photo removed';
            }

            if (isOutgoing) {
                return 'You removed group photo';
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {' removed group photo'}
                </>
            );
        }
        case 'messageChatJoinByLink': {
            if (isOutgoing) {
                return 'You joined the group via invite link';
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {' joined the group via invite link'}
                </>
            );
        }
        case 'messageChatSetTtl': {
            const { ttl } = content;
            const ttlString = getTTLString(ttl);

            if (ttl <= 0) {
                if (isOutgoing) {
                    return 'You disabled the self-destruct timer';
                }

                return (
                    <>
                        <MessageAuthor userId={sender_user_id} openUser={openUser} />
                        {' disabled the self-destruct timer'}
                    </>
                );
            }

            if (isOutgoing) {
                return `You set the self-destruct timer to ${ttlString}`;
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {` set the self-destruct timer to ${ttlString}`}
                </>
            );
        }
        case 'messageChatUpgradeFrom': {
            return 'The group was upgraded to a supergroup';
        }
        case 'messageChatUpgradeTo': {
            return 'Group migrated to a supergroup';
        }
        case 'messageContactRegistered': {
            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {' just joined Telegram'}
                </>
            );
        }
        case 'messageCustomServiceAction': {
            return content.text;
        }
        case 'messageGameScore': {
            const messageGame = MessageStore.get(message.chat_id, content.game_message_id);
            if (
                messageGame &&
                messageGame.content &&
                messageGame.content['@type'] === 'messageGame' &&
                messageGame.content.game
            ) {
                const { game } = messageGame.content;

                if (isOutgoing) {
                    return `You scored ${content.score} in «${game.title}»`;
                }

                return (
                    <>
                        <MessageAuthor userId={messageGame.sender_user_id} openUser={openUser} />
                        {` scored ${content.score} in «${game.title}»`}
                    </>
                );
            }

            if (isOutgoing) {
                return `You scored ${content.score}`;
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {` scored ${content.score}`}
                </>
            );
        }
        case 'messagePassportDataReceived': {
            return 'Telegram Passport data received';
        }
        case 'messagePassportDataSent': {
            const chat = ChatStore.get(message.chat_id);

            const passportElementTypes = content.types
                .map(x => getPassportElementTypeString(x))
                .reduce((accumulator, current) => {
                    return accumulator === null ? [current] : [...accumulator, ', ', current];
                }, null);

            return (
                <>
                    <MessageAuthor userId={chat.type.user_id} openUser={openUser} />
                    {' received the following documents: '}
                    {passportElementTypes}
                </>
            );
        }
        case 'messagePaymentSuccessful': {
            const chat = ChatStore.get(message.chat_id);

            const messageInvoice = MessageStore.get(message.chat_id, content.invoice_message_id);
            if (
                messageInvoice &&
                messageInvoice.content &&
                messageInvoice.content['@type'] === 'messageInvoice' &&
                messageInvoice.content.invoice
            ) {
                const { invoice } = messageInvoice.content;

                return (
                    <>
                        {`You have just successfully transferred ${Currency.getString(
                            content.total_amount,
                            content.currency
                        )} to `}
                        <MessageAuthor userId={chat.type.user_id} openUser={openUser} />
                        {` for ${invoice.title}`}
                    </>
                );
            }

            return (
                <>
                    {`You have just successfully transferred ${Currency.getString(
                        content.total_amount,
                        content.currency
                    )} to `}
                    <MessageAuthor userId={chat.type.user_id} openUser={openUser} />
                </>
            );
        }
        case 'messagePaymentSuccessfulBot': {
            return 'Payment successful';
        }
        case 'messagePinMessage': {
            const author = getMessageAuthor(message, openUser);
            const pinnedMessage = MessageStore.get(message.chat_id, content.message_id);
            if (!pinnedMessage || !pinnedMessage.content) {
                return (
                    <>
                        {author}
                        {' pinned a message'}
                    </>
                );
            }

            let pinnedContent = ' pinned a message';
            if (isServiceMessage(pinnedMessage)) {
                pinnedContent = ' pinned a service message';
            } else {
                switch (pinnedMessage.content['@type']) {
                    case 'messageAnimation': {
                        pinnedContent = ' pinned a GIF';
                        break;
                    }
                    case 'messageAudio': {
                        pinnedContent = ' pinned a track';
                        break;
                    }
                    case 'messageCall': {
                        pinnedContent = ' pinned a call';
                        break;
                    }
                    case 'messageContact': {
                        pinnedContent = ' pinned a contact';
                        break;
                    }
                    case 'messageDocument': {
                        pinnedContent = ' pinned a file';
                        break;
                    }
                    case 'messageExpiredPhoto': {
                        pinnedContent = ' pinned a photo';
                        break;
                    }
                    case 'messageExpiredVideo': {
                        pinnedContent = ' pinned a video';
                        break;
                    }
                    case 'messageGame': {
                        pinnedContent = ' pinned a game';
                        break;
                    }
                    case 'messageInvoice': {
                        pinnedContent = ' pinned an invoice';
                        break;
                    }
                    case 'messageLocation': {
                        pinnedContent = ' pinned a map';
                        break;
                    }
                    case 'messagePhoto': {
                        pinnedContent = ' pinned a photo';
                        break;
                    }
                    case 'messagePoll': {
                        pinnedContent = ' pinned a poll';
                        break;
                    }
                    case 'messageSticker': {
                        pinnedContent = ' pinned a sticker';
                        break;
                    }
                    case 'messageText': {
                        const maxLength = 16;
                        const text = pinnedMessage.content.text.text;
                        if (text.length <= maxLength) {
                            pinnedContent = ` pinned «${text}»`;
                        } else {
                            pinnedContent = ` pinned «${text.substring(0, maxLength)}...»`;
                        }

                        break;
                    }
                    case 'messageUnsupported': {
                        pinnedContent = ' pinned unsupported message';
                        break;
                    }
                    case 'messageVenue': {
                        pinnedContent = ' pinned a venue';
                        break;
                    }
                    case 'messageVideo': {
                        pinnedContent = ' pinned a video';
                        break;
                    }
                    case 'messageVideoNote': {
                        pinnedContent = ' pinned a video message';
                        break;
                    }
                    case 'messageVoiceNote': {
                        pinnedContent = ' pinned a voice message';
                        break;
                    }
                }
            }

            return (
                <>
                    {author}
                    {pinnedContent}
                </>
            );
        }
        case 'messageScreenshotTaken': {
            if (isOutgoing) {
                return 'You took a screenshot!';
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {' took a screenshot!'}
                </>
            );
        }
        case 'messageSupergroupChatCreate': {
            const { title } = content;

            if (isChannel) {
                return 'Channel created';
            }

            if (isOutgoing) {
                return `You created group «${title}»`;
            }

            return (
                <>
                    <MessageAuthor userId={sender_user_id} openUser={openUser} />
                    {` created group «${title}»`}
                </>
            );
        }
        case 'messageUnsupported': {
            return 'Unsupported message';
        }
        case 'messageWebsiteConnected': {
            return `You allowed this bot to message you when you logged in on ${content.domain_name}.`;
        }
    }

    return `[${message.content['@type']}]`;
}

export { isServiceMessage, getServiceMessageContent };
