/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TdLibController from '../Controllers/TdLibController';

export function openUser(userId, popup = false) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenUser',
        userId,
        popup
    });
}

export function openChat(chatId, messageId = null, popup = false) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenChat',
        chatId,
        messageId,
        popup
    });
}

export function highlightMessage(chatId, messageId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateMessageHighlighted',
        chatId,
        messageId
    });
}

export function selectMessage(chatId, messageId, selected) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateMessageSelected',
        chatId,
        messageId,
        selected
    });
}
