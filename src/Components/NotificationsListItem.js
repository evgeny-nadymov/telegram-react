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
import NotificationsControl from './NotificationsControl';

class NotificationsListItem extends NotificationsControl {
    constructor(props){
        super(props);
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