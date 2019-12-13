/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TdLibController from '../Controllers/TdLibController';

export function viewMessages(chatId, messageIds, forceRead) {
    TdLibController.send({
        '@type': 'viewMessages',
        chat_id: chatId,
        message_ids: messageIds,
        force_read: forceRead
    });
}

export function pinMessage(chatId, messageId, disableNotification = false) {
    TdLibController.send({
        '@type': 'pinChatMessage',
        chat_id: chatId,
        message_id: messageId,
        disable_notification: disableNotification
    });
}

export function unpinMessage(chatId) {
    TdLibController.send({
        '@type': 'unpinChatMessage',
        chat_id: chatId
    });
}
