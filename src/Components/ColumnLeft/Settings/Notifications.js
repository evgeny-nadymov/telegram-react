/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { compose, withRestoreRef, withSaveRef } from '../../../Utils/HOC';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import SectionHeader from '../SectionHeader';
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

    render() {
        const { t, onClose } = this.props;
        const { privateChatsSettings, groupChatsSettings, channelChatsSettings, contactJoined } = this.state;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('Notifications')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('NotificationsPrivateChats')}</SectionHeader>
                        <div className='settings-item' onClick={() => this.handleMuteFor('privateChatsSettings')}>
                            <Checkbox
                                color='primary'
                                className='settings-item-control'
                                checked={this.isEnabled(privateChatsSettings)}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                            <ListItemText
                                id='label-1'
                                primary={t('NotificationsForPrivateChats')}
                                secondary={
                                    this.isEnabled(privateChatsSettings)
                                        ? t('NotificationsEnabled')
                                        : t('NotificationsDisabled')
                                }
                            />
                        </div>
                        <div className='settings-item' onClick={() => this.handleShowPreview('privateChatsSettings')}>
                            <Checkbox
                                color='primary'
                                className='settings-item-control'
                                checked={this.showPreview(privateChatsSettings)}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                            <ListItemText
                                id='label-2'
                                primary={t('MessagePreview')}
                                secondary={
                                    this.showPreview(privateChatsSettings) ? t('PreviewEnabled') : t('PreviewDisabled')
                                }
                            />
                        </div>
                    </div>
                    <div className='sidebar-page-section-divider' />
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('NotificationsGroups')}</SectionHeader>
                        <div className='settings-item' onClick={() => this.handleMuteFor('groupChatsSettings')}>
                            <Checkbox
                                color='primary'
                                className='settings-item-control'
                                checked={this.isEnabled(groupChatsSettings)}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                            <ListItemText
                                id='label-1'
                                primary={t('NotificationsForGroups')}
                                secondary={
                                    this.isEnabled(groupChatsSettings)
                                        ? t('NotificationsEnabled')
                                        : t('NotificationsDisabled')
                                }
                            />
                        </div>
                        <div className='settings-item' onClick={() => this.handleShowPreview('groupChatsSettings')}>
                            <Checkbox
                                color='primary'
                                className='settings-item-control'
                                checked={this.showPreview(groupChatsSettings)}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                            <ListItemText
                                id='label-2'
                                primary={t('MessagePreview')}
                                secondary={
                                    this.showPreview(groupChatsSettings) ? t('PreviewEnabled') : t('PreviewDisabled')
                                }
                            />
                        </div>
                    </div>
                    <div className='sidebar-page-section-divider' />
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('NotificationsChannels')}</SectionHeader>
                        <div className='settings-item' onClick={() => this.handleMuteFor('channelChatsSettings')}>
                            <Checkbox
                                color='primary'
                                className='settings-item-control'
                                checked={this.isEnabled(channelChatsSettings)}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                            <ListItemText
                                id='label-1'
                                primary={t('NotificationsForChannels')}
                                secondary={
                                    this.isEnabled(channelChatsSettings)
                                        ? t('NotificationsEnabled')
                                        : t('NotificationsDisabled')
                                }
                            />
                        </div>
                        <div className='settings-item' onClick={() => this.handleShowPreview('channelChatsSettings')}>
                            <Checkbox
                                color='primary'
                                className='settings-item-control'
                                checked={this.showPreview(channelChatsSettings)}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                            <ListItemText
                                id='label-2'
                                primary={t('MessagePreview')}
                                secondary={
                                    this.showPreview(channelChatsSettings) ? t('PreviewEnabled') : t('PreviewDisabled')
                                }
                            />
                        </div>
                    </div>
                    <div className='sidebar-page-section-divider' />
                    <div className='sidebar-page-section'>
                        <SectionHeader>{t('NotificationsOther')}</SectionHeader>
                        <div className='settings-item' onClick={this.handleContactJoined}>
                            <Checkbox
                                color='primary'
                                className='settings-item-control'
                                checked={contactJoined}
                                tabIndex={-1}
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                            <ListItemText
                                id='label-1'
                                primary={t('ContactJoined')}
                                secondary={contactJoined ? t('ContactJoinedEnabled') : t('ContactJoinedDisabled')}
                            />
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

Notifications.propTypes = {
    onClose: PropTypes.func
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(Notifications);
