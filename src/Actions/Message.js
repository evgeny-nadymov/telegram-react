/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TdLibController from '../Controllers/TdLibController';

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
