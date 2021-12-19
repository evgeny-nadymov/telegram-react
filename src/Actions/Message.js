/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import AppStore from '../Stores/ApplicationStore';
import { clearOpenChatOptions } from './Client';
import TdLibController from '../Controllers/TdLibController';

export async function sendBotStartMessage(chatId, botUserId, parameter) {
    clearOpenChatOptions();

    await AppStore.invokeScheduledAction(`clientUpdateClearHistory chatId=${chatId}`);
    return TdLibController.send({
        '@type': 'sendBotStartMessage',
        bot_user_id: botUserId,
        chat_id: chatId,
        parameter
    });
}

export function requestBlockSender(sender) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateRequestBlockSender',
        sender
    });
}

export function blockSender(sender) {
    toggleMessageSenderIsBlocked(sender, true);
}

export function unblockSender(sender) {
    toggleMessageSenderIsBlocked(sender, false);
}

function toggleMessageSenderIsBlocked(sender, isBlocked) {
    TdLibController.send({
        '@type': 'toggleMessageSenderIsBlocked',
        sender_id: sender,
        is_blocked: isBlocked
    });
}

export function openChatSelect(options) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateChatSelect',
        options
    });
}

export function closeChatSelect() {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateChatSelect',
        options: null
    });
}

export function startMessageEditing(chatId, messageId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateStartMessageEditing',
        chatId,
        messageId
    });
}

export function stopMessageEditing(chatId, messageId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateStopMessageEditing',
        chatId,
        messageId
    });
}

export function viewMessages(chatId, messageIds, forceRead) {
    TdLibController.send({
        '@type': 'viewMessages',
        chat_id: chatId,
        message_ids: messageIds,
        force_read: forceRead
    });
}

export function pinMessage(chatId, messageId, disableNotification = false, onlyForSelf = false) {
    TdLibController.send({
        '@type': 'pinChatMessage',
        chat_id: chatId,
        message_id: messageId,
        disable_notification: disableNotification,
        only_for_self: onlyForSelf
    });
}

export function unpinMessage(chatId, messageId) {
    return TdLibController.send({
        '@type': 'unpinChatMessage',
        chat_id: chatId,
        message_id: messageId,
    });
}

export function unpinAllMessages(chatId) {
    return TdLibController.send({
        '@type': 'unpinAllChatMessages',
        chat_id: chatId
    });
}
