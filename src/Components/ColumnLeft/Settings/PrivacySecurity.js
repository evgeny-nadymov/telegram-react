/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DeviceIcon from '../../../Assets/Icons/Device';
import RemoveMemberIcon from '../../../Assets/Icons/RemoveMember';
import TdLibController from '../../../Controllers/TdLibController';
import './PrivacySecurity.css';

class PrivacySecurity extends React.Component {
    state = {
        sessions: null,
        users: null
    };

    componentDidMount() {
        this.loadContent();
    }

    async loadContent() {
        TdLibController.send({
            '@type': 'getActiveSessions'
        }).then(sessions => this.setState({ sessions }));

        TdLibController.send({
            '@type': 'getBlockedUsers',
            offset: 0,
            limit: 100
        }).then(users => this.setState({ users }));
    }

    handleClose = () => {
        TdLibController.clientUpdate({ '@type': 'clientUpdatePrivacySecurityPage', opened: false });
    };

    handleBlockedUsers = () => {
        const { users } = this.state;
        if (!users) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateBlockedUsersPage',
            opened: true,
            users
        });
    };

    handleActiveSessions = () => {
        const { sessions } = this.state;
        if (!sessions) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateActiveSessionsPage',
            opened: true,
            sessions
        });
    };

    render() {
        const { t } = this.props;
        const { users, sessions } = this.state;

        const sessionsCount =
            sessions && sessions.sessions.length > 0
                ? sessions.sessions.length === 1
                    ? '1 session'
                    : `${sessions.sessions.length} sessions`
                : '1 session';

        const usersCount =
            users && users.total_count > 0
                ? users.total_count === 1
                    ? '1 user'
                    : `${users.total_count} users`
                : 'no users';

        return (
            <div className='sidebar-page'>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={this.handleClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('PrivacySettings')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='settings-section'>
                        <ListItem
                            className='settings-list-item2'
                            role={undefined}
                            button
                            onClick={this.handleBlockedUsers}>
                            <ListItemIcon className='settings-list-item-icon'>
                                <RemoveMemberIcon />
                            </ListItemIcon>
                            <ListItemText
                                id='label-2'
                                className='settings-list-item-text'
                                primary={t('BlockedUsers')}
                                secondary={usersCount}
                            />
                        </ListItem>
                        <ListItem
                            className='settings-list-item2'
                            role={undefined}
                            button
                            onClick={this.handleActiveSessions}>
                            <ListItemIcon className='settings-list-item-icon'>
                                <DeviceIcon />
                            </ListItemIcon>
                            <ListItemText
                                id='label-2'
                                className='settings-list-item-text'
                                primary={t('SessionsTitle')}
                                secondary={sessionsCount}
                            />
                        </ListItem>
                    </div>
                    <div className='settings-border' />
                    <div className='settings-section'>
                        <div className='settings-section-header'>{t('PrivacyTitle')}</div>
                        <ListItem className='settings-list-item2' role={undefined} button>
                            <ListItemText
                                className='settings-list-item-text2'
                                primary={t('PrivacyPhoneTitle')}
                                secondary={t('LastSeenContacts')}
                            />
                        </ListItem>
                        <ListItem className='settings-list-item2' role={undefined} button>
                            <ListItemText
                                className='settings-list-item-text2'
                                primary={t('LastSeenTitle')}
                                secondary={t('LastSeenEverybody')}
                            />
                        </ListItem>
                        <ListItem className='settings-list-item2' role={undefined} button>
                            <ListItemText
                                className='settings-list-item-text2'
                                primary={t('PrivacyProfilePhotoTitle')}
                                secondary={t('LastSeenEverybody')}
                            />
                        </ListItem>
                        <ListItem className='settings-list-item2' role={undefined} button>
                            <ListItemText
                                className='settings-list-item-text2'
                                primary={t('PrivacyForwardsTitle')}
                                secondary={t('LastSeenEverybody')}
                            />
                        </ListItem>
                        <ListItem className='settings-list-item2' role={undefined} button>
                            <ListItemText
                                className='settings-list-item-text2'
                                primary={t('WhoCanAddMe')}
                                secondary={t('LastSeenEverybody')}
                            />
                        </ListItem>
                    </div>
                </div>
            </div>
        );
    }
}

PrivacySecurity.propTypes = {};

export default withTranslation()(PrivacySecurity);
