/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Currency from './Currency';
import MessageAuthor from '../Components/Message/MessageAuthor';
import { isChannelChat, isSupergroup } from './Chat';
import { getUserShortName, isMeUser } from './User';
import ChatStore from '../Stores/ChatStore';
import LStore from '../Stores/LocalizationStore';
import MessageStore from '../Stores/MessageStore';

const serviceMap = new Map();
serviceMap.set('messageText', false);
serviceMap.set('messageAnimation', false);
serviceMap.set('messageAudio', false);
serviceMap.set('messageDocument', false);
serviceMap.set('messagePhoto', false);
serviceMap.set('messageExpiredPhoto', true);
serviceMap.set('messageSticker', false);
serviceMap.set('messageVideo', false);
serviceMap.set('messageExpiredVideo', true);
serviceMap.set('messageVideoNote', false);
serviceMap.set('messageVoiceNote', false);
serviceMap.set('messageLocation', false);
serviceMap.set('messageVenue', false);
serviceMap.set('messageContact', false);
serviceMap.set('messageDice', false);
serviceMap.set('messageGame', false);
serviceMap.set('messagePoll', false);
serviceMap.set('messageInvoice', false);
serviceMap.set('messageCall', false);
serviceMap.set('messageBasicGroupChatCreate', true);
serviceMap.set('messageSupergroupChatCreate', true);
serviceMap.set('messageChatChangeTitle', true);
serviceMap.set('messageChatChangePhoto', true);
serviceMap.set('messageChatDeletePhoto', true);
serviceMap.set('messageChatAddMembers', true);
serviceMap.set('messageChatJoinByLink', true);
serviceMap.set('messageChatDeleteMember', true);
serviceMap.set('messageChatUpgradeTo', true);
serviceMap.set('messageChatUpgradeFrom', true);
serviceMap.set('messagePinMessage', true);
serviceMap.set('messageScreenshotTaken', true);
serviceMap.set('messageChatSetTtl', true);
serviceMap.set('messageCustomServiceAction', true);
serviceMap.set('messageGameScore', true);
serviceMap.set('messagePaymentSuccessful', true);
serviceMap.set('messagePaymentSuccessfulBot', true);
serviceMap.set('messageContactRegistered', true);
serviceMap.set('messageWebsiteConnected', true);
serviceMap.set('messagePassportDataSent', true);
serviceMap.set('messagePassportDataReceived', true);
serviceMap.set('messageLiveLocationApproached', true);
serviceMap.set('messageUnsupported', true);
serviceMap.set('messageVoiceChatStarted', true);
serviceMap.set('messageVoiceChatEnded', true);
serviceMap.set('messageInviteVoiceChatParticipants', true);

export function isServiceMessage(message) {
    if (!message) return false;
    if (!message.content) return false;

    return serviceMap.has(message.content['@type']) && serviceMap.get(message.content['@type']) || message.ttl > 0;
}

function getTTLString(ttl) {
    if (ttl < 60) {
        return LStore.formatPluralString('Seconds', Math.floor(ttl));
    }
    if (ttl < 60 * 60) {
        return LStore.formatPluralString('Minutes', Math.floor(ttl / 60));
    }
    if (ttl < 24 * 60 * 60) {
        return LStore.formatPluralString('Hours', Math.floor(ttl / 60 / 60));
    }

    const days = ttl / 60 / 60 / 24;
    if (ttl % 7 === 0) {
        return LStore.formatPluralString('Weeks', Math.floor(days / 7));
    }

    return `${LStore.formatPluralString('Weeks', Math.floor(days / 7))} ${LStore.formatPluralString('Days', Math.floor(days % 7))}`
}

function getCallDuration(duration) {
    const days = Math.floor(duration / (3600 * 24));
    if (days > 0) {
        return LStore.formatPluralString('Days', days);
    }

    const hours = Math.floor(duration / 3600);
    if (hours > 0) {
        return LStore.formatPluralString('Hours', hours);
    }

    const minutes = Math.floor(duration / 60);
    if (minutes > 0) {
        return LStore.formatPluralString('Minutes', minutes);
    }

    return LStore.formatPluralString('Seconds', duration);
}

function getPassportElementTypeString(type) {
    switch (type['@type']) {
        case 'passportElementTypeAddress': {
            return LStore.getString('ActionBotDocumentAddress');
        }
        case 'passportElementTypeBankStatement': {
            return LStore.getString('ActionBotDocumentBankStatement');
        }
        case 'passportElementTypeDriverLicense': {
            return LStore.getString('ActionBotDocumentDriverLicence');
        }
        case 'passportElementTypeEmailAddress': {
            return LStore.getString('ActionBotDocumentEmail');
        }
        case 'passportElementTypeIdentityCard': {
            return LStore.getString('ActionBotDocumentIdentityCard');
        }
        case 'passportElementTypeInternalPassport': {
            return LStore.getString('ActionBotDocumentInternalPassport');
        }
        case 'passportElementTypePassport': {
            return LStore.getString('ActionBotDocumentPassport');
        }
        case 'passportElementTypePassportRegistration': {
            return LStore.getString('ActionBotDocumentPassportRegistration');
        }
        case 'passportElementTypePersonalDetails': {
            return LStore.getString('ActionBotDocumentIdentity');
        }
        case 'passportElementTypePhoneNumber': {
            return LStore.getString('ActionBotDocumentPhone');
        }
        case 'passportElementTypeRentalAgreement': {
            return LStore.getString('ActionBotDocumentRentalAgreement');
        }
        case 'passportElementTypeTemporaryRegistration': {
            return LStore.getString('ActionBotDocumentTemporaryRegistration');
        }
        case 'passportElementTypeUtilityBill': {
            return LStore.getString('ActionBotDocumentUtilityBill');
        }
    }

    return '';
}

function getMessageAuthor(key, message, openUser) {
    if (!message) return null;

    const { chat_id, sender_id } = message;

    if (sender_id) {
        return <MessageAuthor key={key} sender={sender_id} openUser={openUser} />;
    }

    const chat = ChatStore.get(chat_id);
    if (!chat) return null;

    return chat.title;
}

export function getServiceMessageContent(message, openUser = false) {
    if (!message) return null;
    if (!message.content) return null;

    const { chat_id, ttl, sender_id, content, is_outgoing: isOutgoing } = message;
    const isChannel = isChannelChat(chat_id);
    if (ttl > 0) {
        switch (content['@type']) {
            case 'messagePhoto': {
                if (isOutgoing) {
                    return LStore.getString('ActionYouSendTTLPhoto');
                }

                return LStore.replace(LStore.getString('ActionSendTTLPhoto'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
            }
            case 'messageVideo': {
                if (isOutgoing) {
                    return LStore.getString('ActionYouSendTTLVideo');
                }

                return LStore.replace(LStore.getString('ActionSendTTLVideo'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
            }
        }
    }

    switch (content['@type']) {
        case 'messageExpiredPhoto': {
            return LStore.getString('AttachPhotoExpired');
        }
        case 'messageExpiredVideo': {
            return LStore.getString('AttachVideoExpired');
        }
        case 'messageBasicGroupChatCreate': {
            if (isOutgoing) {
                return LStore.getString('ActionYouCreateGroup');
            }

            return LStore.replace(LStore.getString('ActionCreateGroup'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messageSupergroupChatCreate': {
            if (isChannel) {
                return LStore.getString('ActionCreateChannel');
            }

            return LStore.getString('ActionCreateMega');
        }
        case 'messageChatChangeTitle': {
            const { title } = content;

            if (isChannel) {
                return LStore.getString('ActionChannelChangedTitle').replace('un2', title);
            }

            if (isOutgoing) {
                return LStore.getString('ActionYouChangedTitle').replace('un2', title);
            }

            return LStore.replace(LStore.getString('ActionChangedTitle').replace('un2', title), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messageChatChangePhoto': {
            if (isChannel) {
                return LStore.getString('ActionChannelChangedPhoto');
            }

            if (isOutgoing) {
                return LStore.getString('ActionYouChangedPhoto');
            }

            return LStore.replace(LStore.getString('ActionChangedPhoto'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messageChatDeletePhoto': {
            if (isChannel) {
                return LStore.getString('ActionChannelRemovedPhoto');
            }

            if (isOutgoing) {
                return LStore.getString('ActionYouRemovedPhoto');
            }

            return LStore.replace(LStore.getString('ActionRemovedPhoto'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messageChatAddMembers': {
            const singleMember = content.member_user_ids.length === 1;
            if (singleMember) {
                const memberUserId = content.member_user_ids[0];
                if (sender_id.user_id === memberUserId) {
                    if (isSupergroup(chat_id) && isChannel) {
                        return LStore.getString('ChannelJoined');
                    }

                    if (isSupergroup(chat_id) && !isChannel) {
                        if (isMeUser(memberUserId)) {
                            return LStore.getString('ChannelMegaJoined');
                        }

                        return LStore.replace(LStore.getString('ActionAddUserSelfMega'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
                    }

                    if (isOutgoing) {
                        return LStore.getString('ActionAddUserSelfYou');
                    }

                    return LStore.replace(LStore.getString('ActionAddUserSelf'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
                }

                if (isOutgoing) {
                    return LStore.replace(LStore.getString('ActionYouAddUser'), 'un2', <MessageAuthor key='un2' sender={{ '@type': 'messageSenderUser', user_id: memberUserId }} openUser={openUser} />);
                }

                if (isMeUser(memberUserId)) {
                    if (isSupergroup(chat_id)) {
                        if (!isChannel) {
                            return LStore.replace(LStore.getString('MegaAddedBy'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
                        }

                        return LStore.replace(LStore.getString('ChannelAddedBy'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
                    }

                    return LStore.replace(LStore.getString('ActionAddUserYou'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
                }

                return LStore.replaceTwo(LStore.getString('ActionAddUser'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />, 'un2', <MessageAuthor key='un2' sender={{ '@type': 'messageSenderUser', user_id: memberUserId }} openUser={openUser} />);
            }

            const members = content.member_user_ids
                .map(x => <MessageAuthor key={x} sender={{ '@type': 'messageSenderUser', user_id: x }} openUser={openUser} />)
                .reduce((accumulator, current, index, array) => {
                    // const separator = index === array.length - 1 ? ' and ' : ', ';
                    const separator = ', ';
                    return accumulator === null ? [current] : [...accumulator, separator, current];
                }, null);

            if (isOutgoing) {
                return LStore.replace(LStore.getString('ActionYouAddUser'), 'un2', members);
            }

            return LStore.replaceTwo(LStore.getString('ActionAddUser'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />, 'un2', members);
        }
        case 'messageChatJoinByLink': {
            if (isOutgoing) {
                return LStore.getString('ActionInviteYou');
            }

            return LStore.replace(LStore.getString('ActionInviteUser'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messageChatDeleteMember': {
            if (content.user_id === sender_id.user_id) {
                if (isOutgoing) {
                    return LStore.getString('ActionYouLeftUser');
                }

                return LStore.replace(LStore.getString('ActionLeftUser'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
            }

            if (isOutgoing) {
                return LStore.replace(LStore.getString('ActionYouKickUser'), 'un2', <MessageAuthor key='un2' sender={{ '@type': 'messageSenderUser', user_id: content.user_id }} openUser={openUser} />);
            } else if (isMeUser(content.user_id)) {
                return LStore.replace(LStore.getString('ActionKickUserYou'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
            }

            return LStore.replaceTwo(LStore.getString('ActionKickUser'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />, 'un2', <MessageAuthor key='un2' sender={{ '@type': 'messageSenderUser', user_id: content.user_id }} openUser={openUser} />);
        }
        case 'messageChatUpgradeTo': {
            return LStore.getString('ActionMigrateFromGroup');
        }
        case 'messageChatUpgradeFrom': {
            return LStore.getString('ActionMigrateFromGroup');
        }
        case 'messagePinMessage': {
            const author = getMessageAuthor('un1', message, openUser);
            const pinnedMessage = MessageStore.get(message.chat_id, content.message_id);
            if (!pinnedMessage || !pinnedMessage.content) {
                return LStore.replace(LStore.getString('ActionPinnedNoText'), 'un1', author);
            }

            switch (pinnedMessage.content['@type']) {
                case 'messageAnimation': {
                    return LStore.replace(LStore.getString('ActionPinnedGif'), 'un1', author);
                }
                case 'messageAudio': {
                    return LStore.replace(LStore.getString('ActionPinnedMusic'), 'un1', author);
                }
                case 'messageContact': {
                    return LStore.replace(LStore.getString('ActionPinnedContact'), 'un1', author);
                }
                case 'messageDocument': {
                    return LStore.replace(LStore.getString('ActionPinnedFile'), 'un1', author);
                }
                case 'messageExpiredPhoto': {
                    return LStore.replace(LStore.getString('ActionPinnedPhoto'), 'un1', author);
                }
                case 'messageExpiredVideo': {
                    return LStore.replace(LStore.getString('ActionPinnedVideo'), 'un1', author);
                }
                case 'messageGame': {
                    return LStore.replace(LStore.formatString('ActionPinnedGame', '\uD83C\uDFAE ' + pinnedMessage.content.game.title), 'un1', author);
                }
                case 'messageLocation': {
                    if (pinnedMessage.content.live_period > 0) {
                        return LStore.replace(LStore.getString('ActionPinnedGeoLive'), 'un1', author);
                    }

                    return LStore.replace(LStore.getString('ActionPinnedGeo'), 'un1', author);
                }
                case 'messagePhoto': {
                    return LStore.replace(LStore.getString('ActionPinnedPhoto'), 'un1', author);
                }
                case 'messagePoll': {
                    if (pinnedMessage.content.poll.type['@type'] === 'pollTypeQuiz') {
                        return LStore.replace(LStore.getString('ActionPinnedQuiz'), 'un1', author);
                    }

                    return LStore.replace(LStore.getString('ActionPinnedPoll'), 'un1', author);
                }
                case 'messageSticker': {
                    return LStore.replace(LStore.getString('ActionPinnedSticker'), 'un1', author);
                }
                case 'messageText': {
                    const maxLength = 20;
                    let text = pinnedMessage.content.text.text;
                    if (text.length >= maxLength) {
                        text = text.substring(0, maxLength);
                    }

                    return LStore.replace(LStore.formatString('ActionPinnedText', text), 'un1', author);
                }
                case 'messageVenue': {
                    return LStore.replace(LStore.getString('ActionPinnedGeo'), 'un1', author);
                }
                case 'messageVideo': {
                    return LStore.replace(LStore.getString('ActionPinnedVideo'), 'un1', author);
                }
                case 'messageVideoNote': {
                    return LStore.replace(LStore.getString('ActionPinnedRound'), 'un1', author);
                }
                case 'messageVoiceNote': {
                    return LStore.replace(LStore.getString('ActionPinnedVoice'), 'un1', author);
                }
            }

            return LStore.replace(LStore.getString('ActionPinnedNoText'), 'un1', author);
        }
        case 'messageScreenshotTaken': {
            if (isOutgoing) {
                return LStore.getString('ActionTakeScreenshootYou');
            }

            return LStore.replace(LStore.getString('ActionTakeScreenshoot'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messageChatSetTtl': {
            const { ttl } = content;
            const ttlString = getTTLString(ttl);

            if (ttl <= 0) {
                if (isOutgoing) {
                    return LStore.getString('MessageLifetimeYouRemoved');
                }

                return LStore.formatString('MessageLifetimeRemoved', getUserShortName(sender_id.user_id, LStore.i18n.t));
            }

            if (isOutgoing) {
                return LStore.formatString('MessageLifetimeChangedOutgoing', ttlString);
            }

            return LStore.formatString('MessageLifetimeChanged', getUserShortName(sender_id.user_id, LStore.i18n.t), ttlString);
        }
        case 'messageCustomServiceAction': {
            return content.text;
        }
        case 'messageGameScore': {
            const { score, game_message_id } = content;

            const messageGame = MessageStore.get(message.chat_id, game_message_id);
            if (messageGame) {
                const { content: messageGameContent } = messageGame;
                if (messageGameContent && messageGameContent['@type'] === 'messageGame') {
                    const { game } = messageGameContent;
                    if (game) {
                        if (isOutgoing) {
                            return LStore.formatString('ActionYouScoredInGame', LStore.formatPluralString('Points', score)).replace('un2', game.title);
                        }

                        const str = LStore.formatString('ActionUserScoredInGame', LStore.formatPluralString('Points', score)).replace('un2', game.title);
                        return LStore.replace(str, 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
                    }
                }
            }

            if (isOutgoing) {
                return LStore.formatString('ActionYouScored', LStore.formatPluralString('Points', score));
            }

            const str = LStore.formatString('ActionUserScored', LStore.formatPluralString('Points', score));
            return LStore.replace(str, 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messagePaymentSuccessful': {
            const chat = ChatStore.get(message.chat_id);

            const messageInvoice = MessageStore.get(message.chat_id, content.invoice_message_id);
            if (messageInvoice) {
                const { content } = messageInvoice;
                if (content && content['@type'] === 'messageInvoice') {
                    const { invoice, total_amount, currency } = content;
                    if (invoice) {
                        return LStore.formatString('PaymentSuccessfullyPaid', Currency.getString(total_amount, currency), getUserShortName(chat.type.user_id, LStore.i18n.t), invoice.title);
                    }

                    return LStore.formatString('PaymentSuccessfullyPaidNoItem', Currency.getString(total_amount, currency), getUserShortName(chat.type.user_id, LStore.i18n.t));
                }
            }
            break;
        }
        case 'messagePaymentSuccessfulBot': {
            // bots only
            break;
        }
        case 'messageContactRegistered': {
            return LStore.replace(LStore.formatString('NotificationContactJoined', 'un1'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messageWebsiteConnected': {
            return LStore.formatString('ActionBotAllowed', content.domain_name);
        }
        case 'messagePassportDataSent': {
            const chat = ChatStore.get(message.chat_id);

            const documents = content.types
                .map(x => getPassportElementTypeString(x))
                .reduce((accumulator, current) => {
                    return accumulator === null ? current : accumulator + ', ' + current;
                }, null);

            return LStore.formatString('ActionBotDocuments', getUserShortName(chat.type.user_id, LStore.i18n.t), documents);
        }
        case 'messagePassportDataReceived': {
            // bots only
            break;
        }
        case 'messageLiveLocationApproached': {
            const { approacher, observer, distance } = content;
            if (isMeUser(observer.user_id)) {
                return LStore.replace(LStore.formatString('ActionUserWithinRadius', LStore.formatDistance(distance, 2)), 'un1', <MessageAuthor key='un1' sender={approacher} openUser={openUser} />);
            }

            if (isMeUser(approacher.user_id)) {
                return LStore.replace(LStore.formatString('ActionUserWithinYouRadius', LStore.formatDistance(distance, 2)), 'un1', <MessageAuthor key='un1' sender={observer} openUser={openUser} />);
            }

            return LStore.replaceTwo(LStore.formatString('ActionUserWithinOtherRadius', LStore.formatDistance(distance, 2)), 'un1', <MessageAuthor key='un1' sender={approacher} openUser={openUser} />, 'un2', <MessageAuthor key='un2' sender={observer} openUser={openUser} />);
        }
        case 'messageUnsupported': {
            return LStore.getString('UnsupportedMedia');
        }
        case 'messageVoiceChatStarted': {
            if (isOutgoing) {
                return LStore.getString('ActionGroupCallStartedByYou');
            }

            return LStore.replace(LStore.getString('ActionGroupCallStarted'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
        }
        case 'messageVoiceChatEnded': {
            const { duration } = content;

            return LStore.formatString('ActionGroupCallEnded', getCallDuration(duration));
        }
        case 'messageInviteVoiceChatParticipants': {
            const singleMember = content.user_ids.length === 1;
            if (singleMember) {
                const memberUserId = content.user_ids[0];
                if (memberUserId !== 0) {
                    if (isOutgoing) {
                        return LStore.replace(LStore.getString('ActionGroupCallYouInvited'), 'un2', <MessageAuthor key='un2' sender={{ '@type': 'messageSenderUser', user_id: memberUserId }} openUser={openUser} />);
                    }

                    if (isMeUser(memberUserId)) {
                        return LStore.replace(LStore.getString('ActionGroupCallInvitedYou'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />);
                    }

                    return LStore.replaceTwo(LStore.getString('ActionGroupCallInvited'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />, 'un2', <MessageAuthor key='un2' sender={{ '@type': 'messageSenderUser', user_id: memberUserId }} openUser={openUser} />);
                }
            }

            const members = content.user_ids
                .map(x => <MessageAuthor key={x} sender={{ '@type': 'messageSenderUser', user_id: x }} openUser={openUser} />)
                .reduce((accumulator, current, index, array) => {
                    // const separator = index === array.length - 1 ? ' and ' : ', ';
                    const separator = ', ';
                    return accumulator === null ? [current] : [...accumulator, separator, current];
                }, null);

            if (isOutgoing) {
                return LStore.replace(LStore.getString('ActionGroupCallYouInvited'), 'un2', members);
            }

            return LStore.replaceTwo(LStore.getString('ActionAddUser'), 'un1', <MessageAuthor key='un1' sender={sender_id} openUser={openUser} />, 'un2', members);
        }
    }

    return LStore.getString('UnsupportedMedia');
}