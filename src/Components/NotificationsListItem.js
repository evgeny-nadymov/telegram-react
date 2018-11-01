/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Switch from '@material-ui/core/Switch';
import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';
import { debounce } from '../Utils/Common';
import { isChatMuted } from '../Utils/Chat';
import { MUTED_VALUE, UNMUTED_VALUE, NOTIFICATIONS_DEBOUNCE_DELAY_MS } from '../Constants';
import ChatStore from '../Stores/ChatStore';
import ApplicationStore from '../Stores/ApplicationStore';
import TdLibController from '../Controllers/TdLibController';

class NotificationsListItem extends React.Component {
    constructor(props){
        super(props);

        const { chatId } = props;
        const chat = ChatStore.get(chatId);
        const isMuted = isChatMuted(chat);

        this.state = {
            prevChatId: chatId,
            isMuted: isMuted
        };

        this.debouncedSetChatNotificationSettings = debounce(this.setChatNotificationSettings, NOTIFICATIONS_DEBOUNCE_DELAY_MS);
        this.setChatNotificationSettings = this.setChatNotificationSettings.bind(this);
        this.handleSetChatNotifications = this.handleSetChatNotifications.bind(this);
        this.onUpdateChatNotificationSettings = this.onUpdateChatNotificationSettings.bind(this);
        this.onUpdateScopeNotificationSettings = this.onUpdateScopeNotificationSettings.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId) {

            const { chatId } = props;
            const chat = ChatStore.get(chatId);
            const isMuted = isChatMuted(chat);

            return {
                prevChatId: props.chatId,
                isMuted: isMuted
            };
        }
        return null;
    }

    componentDidMount(){
        ChatStore.on('updateChatNotificationSettings', this.onUpdateChatNotificationSettings);
        ApplicationStore.on('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatNotificationSettings', this.onUpdateChatNotificationSettings);
        ApplicationStore.removeListener('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
    }

    onUpdateChatNotificationSettings(update){
        const { chatId } = this.props;
        if (!update.chat_id) return;
        if (update.chat_id !== chatId) return;

        const chat = ChatStore.get(update.chat_id);
        if (!chat) return;

        this.setState({ isMuted: isChatMuted(chat) });
    }

    onUpdateScopeNotificationSettings(update){
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        switch (update.scope['@type']) {
            case 'notificationSettingsScopeGroupChats': {
                if (chat.type['@type'] === 'chatTypeBasicGroup'
                    || chat.type['@type'] === 'chatTypeSupergroup'){
                    this.setState({ isMuted: isChatMuted(chat) });
                }
                break;
            }
            case 'notificationSettingsScopePrivateChats':{
                if (chat.type['@type'] === 'chatTypePrivate'
                    || chat.type['@type'] === 'chatTypeSecret'){
                    this.setState({ isMuted: isChatMuted(chat) });
                }
                break;
            }
        }
    }

    handleSetChatNotifications(){
        this.setState({ isMuted: !this.state.isMuted });
        this.debouncedSetChatNotificationSettings();
    }

    setChatNotificationSettings(){
        const { chatId } = this.props;
        const { isMuted } = this.state;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.notification_settings) return;

        const isMutedPrev = isChatMuted(chat);
        if (isMutedPrev === isMuted) {
            return;
        }

        const muteFor = isMuted ? MUTED_VALUE : UNMUTED_VALUE;
        const newNotificationSettings = {...chat.notification_settings, use_default_mute_for : false, mute_for : muteFor};

        TdLibController
            .send({
                '@type': 'setChatNotificationSettings',
                chat_id: chatId,
                notification_settings: newNotificationSettings
            });
    }

    render() {
        const { isMuted } = this.state;

        return (
            <ListItem button onClick={this.handleSetChatNotifications}>
                <ListItemIcon>
                    {
                        !isMuted
                            ? <NotificationsActiveIcon/>
                            : <NotificationsIcon/>
                    }
                </ListItemIcon>
                <ListItemText primary='Notifications'/>
                <ListItemSecondaryAction>
                    <Switch
                        color='primary'
                        onChange={this.handleSetChatNotifications}
                        checked={!isMuted}/>
                </ListItemSecondaryAction>
            </ListItem>
        );
    }
}

export default NotificationsListItem;