/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import NotificationStore from '../../../Stores/NotificationStore';
import OptionStore from '../../../Stores/OptionStore';
import TdLibController from '../../../Controllers/TdLibController';
import './Notifications.css';

class Notifications extends React.Component {
    constructor(props) {
        super(props);

        const contactJoinedOption = OptionStore.get('disable_contact_registered_notifications');

        this.state = {
            privateChatsSettings: NotificationStore.settings.get('notificationSettingsScopePrivateChats'),
            groupChatsSettings: NotificationStore.settings.get('notificationSettingsScopeGroupChats'),
            channelChatsSettings: NotificationStore.settings.get('notificationSettingsScopeChannelChats'),
            contactJoined: !contactJoinedOption || !contactJoinedOption.value
        };
    }

    componentWillUnmount() {
        const { privateChatsSettings, groupChatsSettings, channelChatsSettings, contactJoined } = this.state;
        this.setScopeNotificationSettings('notificationSettingsScopePrivateChats', privateChatsSettings);
        this.setScopeNotificationSettings('notificationSettingsScopeGroupChats', groupChatsSettings);
        this.setScopeNotificationSettings('notificationSettingsScopeChannelChats', channelChatsSettings);
        this.setContactJoinedOption(contactJoined);
    }

    setContactJoinedOption() {
        const { contactJoined } = this.state;

        const contactJoinedOption = OptionStore.get('disable_contact_registered_notifications');
        const oldContactJoined = !contactJoinedOption || !contactJoinedOption.value;
        if (oldContactJoined === contactJoined) return;

        TdLibController.send({
            '@type': 'setOption',
            name: 'disable_contact_registered_notifications',
            value: {
                '@type': 'optionValueBoolean',
                value: !contactJoined
            }
        });
    }

    setScopeNotificationSettings(scope, settings) {
        if (!scope) return;
        if (!settings) return;
        const oldSettings = NotificationStore.settings.get(scope);
        if (!oldSettings) return;

        const { mute_for, show_preview } = settings;
        const { mute_for: oldMuteFor, show_preview: oldShowPreview } = oldSettings;
        if (mute_for === oldMuteFor && show_preview === oldShowPreview) return;

        TdLibController.send({
            '@type': 'setScopeNotificationSettings',
            scope: { '@type': scope },
            notification_settings: settings
        });
    }

    handleMuteFor = property => {
        const settings = this.state[property];
        if (!settings) return;

        const { mute_for } = settings;
        const newSettings = { ...settings, mute_for: mute_for === 0 ? 365 * 24 * 60 * 60 : 0 };

        this.setState({ [property]: newSettings });
    };

    handleShowPreview = property => {
        const settings = this.state[property];
        if (!settings) return;

        const { show_preview } = settings;
        const newSettings = { ...settings, show_preview: !show_preview };

        this.setState({ [property]: newSettings });
    };

    handleContactJoined = () => {
        this.setState({ contactJoined: !this.state.contactJoined });
    };

    isEnabled(settings) {
        if (!settings) return false;

        const { mute_for } = settings;

        return mute_for === 0;
    }

    showPreview(settings) {
        if (!settings) return false;

        const { show_preview } = settings;

        return show_preview;
    }

    isEnabledString(value) {
        const { t } = this.props;
        return value ? t('NotificationsOn') : t('NotificationsOff');
    }

    render() {
        const { t } = this.props;
        const { privateChatsSettings, groupChatsSettings, channelChatsSettings, contactJoined } = this.state;

        return (
            <div className='search'>
                <div className='notifications-section'>
                    <div className='notifications-section-caption'>{t('NotificationsPrivateChats')}</div>
                    <ListItem role={undefined} button onClick={() => this.handleMuteFor('privateChatsSettings')}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={this.isEnabled(privateChatsSettings)}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-1'
                            primary={t('NotificationsForPrivateChats')}
                            secondary={
                                this.isEnabled(privateChatsSettings)
                                    ? t('NotificationsEnabled')
                                    : t('NotificationsDisabled')
                            }
                        />
                    </ListItem>
                    <ListItem role={undefined} button onClick={() => this.handleShowPreview('privateChatsSettings')}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={this.showPreview(privateChatsSettings)}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-2'
                            primary={t('MessagePreview')}
                            secondary={
                                this.showPreview(privateChatsSettings) ? t('PreviewEnabled') : t('PreviewDisabled')
                            }
                        />
                    </ListItem>
                </div>
                <div className='notifications-section'>
                    <div className='notifications-section-caption'>{t('NotificationsGroups')}</div>
                    <ListItem role={undefined} button onClick={() => this.handleMuteFor('groupChatsSettings')}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={this.isEnabled(groupChatsSettings)}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-1'
                            primary={t('NotificationsForGroups')}
                            secondary={
                                this.isEnabled(groupChatsSettings)
                                    ? t('NotificationsEnabled')
                                    : t('NotificationsDisabled')
                            }
                        />
                    </ListItem>
                    <ListItem role={undefined} button onClick={() => this.handleShowPreview('groupChatsSettings')}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={this.showPreview(groupChatsSettings)}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-2'
                            primary={t('MessagePreview')}
                            secondary={
                                this.showPreview(groupChatsSettings) ? t('PreviewEnabled') : t('PreviewDisabled')
                            }
                        />
                    </ListItem>
                </div>
                <div className='notifications-section'>
                    <div className='notifications-section-caption'>{t('NotificationsChannels')}</div>
                    <ListItem role={undefined} button onClick={() => this.handleMuteFor('channelChatsSettings')}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={this.isEnabled(channelChatsSettings)}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-1'
                            primary={t('NotificationsForChannels')}
                            secondary={
                                this.isEnabled(channelChatsSettings)
                                    ? t('NotificationsEnabled')
                                    : t('NotificationsDisabled')
                            }
                        />
                    </ListItem>
                    <ListItem role={undefined} button onClick={() => this.handleShowPreview('channelChatsSettings')}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={this.showPreview(channelChatsSettings)}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-2'
                            primary={t('MessagePreview')}
                            secondary={
                                this.showPreview(channelChatsSettings) ? t('PreviewEnabled') : t('PreviewDisabled')
                            }
                        />
                    </ListItem>
                </div>
                <div className='notifications-section notifications-section-last'>
                    <div className='notifications-section-caption'>{t('NotificationsOther')}</div>
                    <ListItem role={undefined} button onClick={this.handleContactJoined}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={contactJoined}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-1'
                            primary={t('ContactJoined')}
                            secondary={contactJoined ? t('ContactJoinedEnabled') : t('ContactJoinedDisabled')}
                        />
                    </ListItem>
                </div>
            </div>
        );
    }
}

export default withTranslation()(Notifications);
