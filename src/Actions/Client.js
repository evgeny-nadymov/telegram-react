/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { canSendMessages, getChatUserId, isGroupChat, isPrivateChat } from '../Utils/Chat';
import AppStore from '../Stores/ApplicationStore';
import LStore from '../Stores/LocalizationStore';
import TdLibController from '../Controllers/TdLibController';

export function showLeaveVoiceChatAlert(params) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateLeaveVoiceChatAlert',
        params
    });
}

export function showInputPasswordAlert(state, onPassword) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateInputPasswordAlert',
        state,
        onPassword
    });
}

export function setText(text) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateSendText',
        text
    });
}

export function showOpenGameAlert(game, params) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenGameAlert',
        game,
        params
    });
}

export function showOpenUrlAlert(url, params) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenUrlAlert',
        url,
        params
    });
}

export function showRequestUrlAlert(url, params) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateRequestUrlAlert',
        url,
        params
    });
}

export function showAlert(params) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateAlert',
        params
    });
}

export function showSnackbar(message, action) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateSnackbar',
        message,
        action
    });
}

export function openArchive() {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateArchive',
        open: true
    });
}

export function closeArchive() {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateArchive',
        open: false
    });
}

export function editMessage(chatId, messageId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateEditMessage',
        chatId,
        messageId
    });
}

export function deleteMessages(chatId, messageIds) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateDeleteMessages',
        chatId,
        messageIds
    });
}

export function replyMessage(chatId, messageId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateReply',
        chatId,
        messageId
    });
}

export function forward(info) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateForward',
        info
    });
}

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

export function openChat(chatId, messageId = null, popup = false, options = null) {
    const { chatSelectOptions } = AppStore;
    if (chatSelectOptions) {
        const { switchInline, botStartMessage } = chatSelectOptions;

        let rejected = false
        if (switchInline) {
            if (!canSendMessages(chatId)) {
                rejected = true;
            }
        } else if (botStartMessage) {
            if (!canSendMessages(chatId)) {
                rejected = true;
            }

            if (isPrivateChat(chatId)) {
                if (getChatUserId(chatId) !== botStartMessage.botUserId) {
                    rejected = true;
                }
            } else if (!isGroupChat(chatId)) {
                rejected = true;
            }
        }

        if (rejected) {
            showAlert({
                title: LStore.getString('AppName'),
                message: LStore.getString('WriteChatCant'),
                ok: LStore.getString('OK')
            });

            return;
        }

        AppStore.chatSelectOptions = null;

        options = {
            ...options,
            ...chatSelectOptions,
            ...{ closeChatSelect: true }
        };
    }

    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenChat',
        chatId,
        messageId,
        popup,
        options,
    });
}

export function closeChat() {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateOpenChat',
        chatId: 0,
        messageId: null,
        popup: false,
        options: null
    });
}

export function clearOpenChatOptions() {
    TdLibController.clientUpdate({ '@type': 'clientUpdateClearOpenChatOptions' });
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

export function clearSelection() {
    TdLibController.clientUpdate({ '@type': 'clientUpdateClearSelection' });
}

export function closePinned() {
    TdLibController.clientUpdate({ '@type': 'clientUpdateClosePinned' });
}

export function setInstantViewViewerContent(content) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateInstantViewViewerContent',
        content
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

export function searchChat(chatId, query = null) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateSearchChat',
        chatId,
        query
    });
}

export function requestUnpinMessage(chatId, messageId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateUnpinMessage',
        chatId,
        messageId
    });
}

export function requestPinMessage(chatId, messageId) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdatePinMessage',
        chatId,
        messageId
    });
}
