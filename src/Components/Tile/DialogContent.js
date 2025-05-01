/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import {
    getChatTypingString,
    getChatDraft,
    getLastMessageSenderName,
    getLastMessageContent,
    showChatDraft, isPrivateChat
} from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import './DialogContent.css';

class DialogContent extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, t } = this.props;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.t !== t) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateChatReadInbox', this.onUpdate);
        ChatStore.on('updateUserChatAction', this.onUpdate);
        UserStore.on('updateUser', this.onUpdateUser);
    }

    componentWillUnmount() {
        ChatStore.off('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.off('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.off('updateChatDraftMessage', this.onUpdate);
        ChatStore.off('updateChatLastMessage', this.onUpdate);
        ChatStore.off('updateChatReadInbox', this.onUpdate);
        ChatStore.off('updateUserChatAction', this.onUpdate);
    }

    onClientUpdateClearHistory = update => {
        const { chatId } = this.props;

        if (chatId === update.chatId) {
            this.clearHistory = update.inProgress;
            this.forceUpdate();
        }
    };

    onFastUpdatingComplete = update => {
        this.forceUpdate();
    };

    onUpdateUser = update => {
        const { chatId } = this.props;
        const { user } = update;

        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (isPrivateChat(chatId)) return;

        const { last_message } = chat;
        if (!last_message) return;

        const { sender_user_id } = last_message;
        if (sender_user_id !== user.id) return;

        this.forceUpdate();
    };

    onUpdate = update => {
        const { chatId } = this.props;

        if (chatId !== update.chat_id) return;

        this.forceUpdate();
    };

    render() {
        const { chatId, t } = this.props;

        if (this.clearHistory) return <div className='dialog-content'>{'\u00A0'}</div>;

        const chat = ChatStore.get(chatId);
        if (!chat) return <div className='dialog-content'>{'\u00A0'}</div>;

        let contentControl = null;
        const typingString = getChatTypingString(chatId);
        if (typingString) {
            contentControl = <span className='dialog-content-accent'>{typingString}</span>;
        }

        if (!contentControl) {
            const draft = getChatDraft(chatId);
            if (showChatDraft(chatId)) {
                const text = draft.text || '\u00A0';

                contentControl = (
                    <>
                        <span className='dialog-content-draft'>{t('Draft') + ': '}</span>
                        {text}
                    </>
                );
            }
        }

        if (!contentControl) {
            const content = getLastMessageContent(chat, t) || '\u00A0';
            const senderName = getLastMessageSenderName(chat, t);
            contentControl = (
                <>
                    {senderName && <span className='dialog-content-accent'>{senderName}: </span>}
                    {content}
                </>
            );
        }

        return <div className='dialog-content'>{contentControl}</div>;
    }
}

export default withTranslation()(DialogContent);
