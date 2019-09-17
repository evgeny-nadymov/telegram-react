/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TdLibController from '../Controllers/TdLibController';

export function forwardMessages(chatId, messageIds) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateForward',
        info: {
            chatId,
            messageIds
        }
    });
}

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

export function closeChat() {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenChat',
        chatId: 0,
        messageId: null,
        popup: false
    });
}

export function openReply(chatId, messageId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenReply',
        chatId,
        messageId
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

export function setMediaViewerContent(content) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateMediaViewerContent',
        content
    });
}

export function setProfileMediaViewerContent(content) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateProfileMediaViewerContent',
        content
    });
}

export function setInstantViewContent(content) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateInstantViewContent',
        content
    });
}
