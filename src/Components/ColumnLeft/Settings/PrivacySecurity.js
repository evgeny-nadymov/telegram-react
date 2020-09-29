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
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ActiveSessions from './ActiveSessions';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import BlockedUsers from './BlockedUsers';
import DeviceIcon from '../../../Assets/Icons/Device';
import RemoveMemberIcon from '../../../Assets/Icons/RemoveMember';
import SidebarPage from '../SidebarPage';
import SectionHeader from '../SectionHeader';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './PrivacySecurity.css';

class PrivacySecurity extends React.Component {
    state = {
        sessions: null,
        users: null,
        openBlockedUsers: false,
        openActiveSessions: false
    };

    componentDidMount() {
        this.loadContent();

        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
    }

    componentWillUnmount() {
        UserStore.off('updateUserFullInfo', this.onUpdateUserFullInfo);
    }

    onUpdateUserFullInfo = update => {
        const { user_id, user_full_info } = update;
        const { users } = this.state;
        if (!users) return;

        const { total_count, user_ids } = users;
        const { is_blocked } = user_full_info;
        const prevIsBlocked = user_ids.indexOf(user_id) !== -1;
        if (is_blocked === prevIsBlocked) return;

        if (is_blocked) {
            this.setState({
                users: {
                    ...users,
                    total_count: total_count + 1,
                    user_ids: [user_id, ...user_ids]
                }
            });
        } else {
            this.setState({
                users: {
                    ...users,
                    total_count: total_count - 1,
                    user_ids: user_ids.filter(x => x !== user_id)
                }
            });
        }
    };

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

    openActiveSessions = () => {
        if (!this.state.sessions) return;

        this.setState({
            openActiveSessions: true
        });
    };

    closeActiveSessions = () => {
        this.setState({
            openActiveSessions: false
        });
    };

    openBlockedUsers = () => {
        if (!this.state.users) return;

        this.setState({
            openBlockedUsers: true
        });
    };

    closeBlockedUsers = () => {
        this.setState({
            openBlockedUsers: false
        });
    };

    render() {
        const { t, onClose } = this.props;
        const { openBlockedUsers, users, openActiveSessions, sessions } = this.state;

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
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('PrivacySettings')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='sidebar-page-section'>
                        <ListItem
                            className='settings-list-item2'
                            role={undefined}
                            button
                            onClick={this.openBlockedUsers}>
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
                            onClick={this.openActiveSessions}>
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
                    {/*<div className='sidebar-page-section-divider' />*/}
                    {/*<div className='sidebar-page-section'>*/}
                    {/*    <SectionHeader>{t('PrivacyTitle')}</SectionHeader>*/}
                    {/*    <ListItem className='settings-list-item2' role={undefined} button>*/}
                    {/*        <ListItemText*/}
                    {/*            className='settings-list-item-text2'*/}
                    {/*            primary={t('PrivacyPhoneTitle')}*/}
                    {/*            secondary={t('LastSeenContacts')}*/}
                    {/*        />*/}
                    {/*    </ListItem>*/}
                    {/*    <ListItem className='settings-list-item2' role={undefined} button>*/}
                    {/*        <ListItemText*/}
                    {/*            className='settings-list-item-text2'*/}
                    {/*            primary={t('LastSeenTitle')}*/}
                    {/*            secondary={t('LastSeenEverybody')}*/}
                    {/*        />*/}
                    {/*    </ListItem>*/}
                    {/*    <ListItem className='settings-list-item2' role={undefined} button>*/}
                    {/*        <ListItemText*/}
                    {/*            className='settings-list-item-text2'*/}
                    {/*            primary={t('PrivacyProfilePhotoTitle')}*/}
                    {/*            secondary={t('LastSeenEverybody')}*/}
                    {/*        />*/}
                    {/*    </ListItem>*/}
                    {/*    <ListItem className='settings-list-item2' role={undefined} button>*/}
                    {/*        <ListItemText*/}
                    {/*            className='settings-list-item-text2'*/}
                    {/*            primary={t('PrivacyForwardsTitle')}*/}
                    {/*            secondary={t('LastSeenEverybody')}*/}
                    {/*        />*/}
                    {/*    </ListItem>*/}
                    {/*    <ListItem className='settings-list-item2' role={undefined} button>*/}
                    {/*        <ListItemText*/}
                    {/*            className='settings-list-item-text2'*/}
                    {/*            primary={t('WhoCanAddMe')}*/}
                    {/*            secondary={t('LastSeenEverybody')}*/}
                    {/*        />*/}
                    {/*    </ListItem>*/}
                    {/*</div>*/}
                </div>
                <SidebarPage open={openBlockedUsers} onClose={this.closeBlockedUsers}>
                    <BlockedUsers users={users} />
                </SidebarPage>
                <SidebarPage open={openActiveSessions} onClose={this.closeActiveSessions}>
                    <ActiveSessions sessions={sessions} />
                </SidebarPage>
            </>
        );
    }
}

PrivacySecurity.propTypes = {
    onClose: PropTypes.func
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(PrivacySecurity);
