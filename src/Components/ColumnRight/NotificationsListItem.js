/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import Checkbox from '@material-ui/core/Checkbox';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Notifications from '../ColumnMiddle/Notifications';
import './NotificationsListItem.css';

class NotificationsListItem extends Notifications {
    render() {
        const { t } = this.props;
        const { isMuted } = this.state;

        return (
            <ListItem button className='list-item-rounded' alignItems='flex-start' onClick={this.handleSetChatNotifications}>
                <ListItemIcon>
                    <Checkbox
                        className='notifications-checkbox'
                        edge='start'
                        checked={!isMuted}
                        color='primary'
                        tabIndex={-1}
                        disableRipple
                        onChange={this.handleSetChatNotifications}
                    />
                </ListItemIcon>
                <ListItemText
                    primary={
                        <Typography variant='inherit' noWrap>
                            {t('Notifications')}
                        </Typography>
                    }
                    secondary={!isMuted ? t('PopupEnabled') : t('PopupDisabled')}
                />
            </ListItem>
        );
    }
}

export default withTranslation()(NotificationsListItem);
