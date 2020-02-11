/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { isChatMuted } from '../../Utils/Chat';
import { debounce } from '../../Utils/Common';
import { toggleChatNotificationSettings } from '../../Actions/Chat';
import { NOTIFICATION_DEBOUNCE_DELAY_MS } from '../../Constants';
import ChatStore from '../../Stores/ChatStore';
import NotificationStore from '../../Stores/NotificationStore';

class Notifications extends React.Component {
    constructor(props) {
        super(props);

        const { chatId } = props;

        this.state = {
            prevChatId: chatId,
            isMuted: isChatMuted(chatId)
        };

        this.debouncedSetChatNotificationSettings = debounce(
            this.setChatNotificationSettings,
            NOTIFICATION_DEBOUNCE_DELAY_MS
        );
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId) {
            const { chatId } = props;

            return {
                prevChatId: chatId,
                isMuted: isChatMuted(chatId)
            };
        }
        return null;
    }

    componentDidMount() {
        ChatStore.on('updateChatNotificationSettings', this.onUpdateChatNotificationSettings);
        NotificationStore.on('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    componentWillUnmount() {
        ChatStore.off('updateChatNotificationSettings', this.onUpdateChatNotificationSettings);
        NotificationStore.off('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    onUpdateChatNotificationSettings = update => {
        const { chat_id } = update;
        const { chatId } = this.props;

        if (!chat_id) return;
        if (chat_id !== chatId) return;

        this.setState({ isMuted: isChatMuted(chatId) });
    };

    onUpdateScopeNotificationSettings = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);

        switch (update.scope['@type']) {
            case 'notificationSettingsScopeGroupChats': {
                if (chat.type['@type'] === 'chatTypeBasicGroup' || chat.type['@type'] === 'chatTypeSupergroup') {
                    this.setState({ isMuted: isChatMuted(chatId) });
                }
                break;
            }
            case 'notificationSettingsScopePrivateChats': {
                if (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret') {
                    this.setState({ isMuted: isChatMuted(chatId) });
                }
                break;
            }
        }
    };

    handleSetChatNotifications = () => {
        this.setState({ isMuted: !this.state.isMuted });
        this.debouncedSetChatNotificationSettings();
    };

    setChatNotificationSettings = () => {
        const { chatId } = this.props;
        const { isMuted } = this.state;

        toggleChatNotificationSettings(chatId, isMuted);
    };
}

export default Notifications;
