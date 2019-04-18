/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TdLibController from '../Controllers/TdLibController';

function openUser(userId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenUser',
        userId: userId
    });
}

function openChat(chatId, messageId = null) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenChat',
        chatId: chatId,
        messageId: messageId
    });
}

export { openUser, openChat };
