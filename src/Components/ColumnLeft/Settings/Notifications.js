/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Checkbox from '@material-ui/core/Checkbox';
import ListItemText from '@material-ui/core/ListItemText';
import './Notifications.css';

class Notifications extends React.Component {
    state = {
        privateEnabled: true,
        privatePreview: true,
        groupEnabled: true,
        groupPreview: true,
        channelEnabled: true,
        channelPreview: true,
        contactJoined: true
    };

    getEnabled(value) {
        return value ? 'Enabled' : 'Disabled';
    }

    handlePrivate = () => {
        this.setState({ privateEnabled: !this.state.privateEnabled });
    };

    handlePrivatePreview = () => {
        this.setState({ privatePreview: !this.state.privatePreview });
    };

    handleGroup = () => {
        this.setState({ groupEnabled: !this.state.groupEnabled });
    };

    handleGroupPreview = () => {
        this.setState({ groupPreview: !this.state.groupPreview });
    };

    handleChannel = () => {
        this.setState({ channelEnabled: !this.state.channelEnabled });
    };

    handleChannelPreview = () => {
        this.setState({ channelPreview: !this.state.channelPreview });
    };

    handleContactJoined = () => {
        this.setState({ contactJoined: !this.state.contactJoined });
    };

    render() {
        const {
            privateEnabled,
            privatePreview,
            groupEnabled,
            groupPreview,
            channelEnabled,
            channelPreview,
            contactJoined
        } = this.state;

        return (
            <div className='search'>
                <div className='notifications-section'>
                    <div className='notifications-section-caption'>Private Chats</div>
                    <ListItem role={undefined} button onClick={this.handlePrivate}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={privateEnabled}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-1'
                            primary={'Notifications for private chats'}
                            secondary={this.getEnabled(privateEnabled)}
                        />
                    </ListItem>
                    <ListItem role={undefined} button onClick={this.handlePrivatePreview}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={privatePreview}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-2'
                            primary={'Message preview'}
                            secondary={this.getEnabled(privatePreview)}
                        />
                    </ListItem>
                </div>
                <div className='notifications-section'>
                    <div className='notifications-section-caption'>Groups</div>
                    <ListItem role={undefined} button onClick={this.handleGroup}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={groupEnabled}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-1'
                            primary={'Notifications for groups'}
                            secondary={this.getEnabled(groupEnabled)}
                        />
                    </ListItem>
                    <ListItem role={undefined} button onClick={this.handleGroupPreview}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={groupPreview}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-2'
                            primary={'Message preview'}
                            secondary={this.getEnabled(groupPreview)}
                        />
                    </ListItem>
                </div>
                <div className='notifications-section'>
                    <div className='notifications-section-caption'>Channels</div>
                    <ListItem role={undefined} button onClick={this.handleChannel}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={channelEnabled}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-1' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-1'
                            primary={'Notifications for private channels'}
                            secondary={this.getEnabled(channelEnabled)}
                        />
                    </ListItem>
                    <ListItem role={undefined} button onClick={this.handleChannelPreview}>
                        <ListItemIcon>
                            <Checkbox
                                color='primary'
                                checked={channelPreview}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': 'label-2' }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            id='label-2'
                            primary={'Message preview'}
                            secondary={this.getEnabled(channelPreview)}
                        />
                    </ListItem>
                </div>
                <div className='notifications-section notifications-section-last'>
                    <div className='notifications-section-caption'>Other</div>
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
                            primary={'Contacts joined Telegram'}
                            secondary={this.getEnabled(contactJoined)}
                        />
                    </ListItem>
                </div>
            </div>
        );
    }
}

Notifications.propTypes = {};

export default Notifications;
