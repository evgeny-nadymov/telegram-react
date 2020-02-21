/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import StopIcon from '../../Assets/Icons/Stop';
import { getMessageDate } from '../../Utils/Chat';
import './Session.css';

class Session extends React.Component {
    state = {
        contextMenu: false,
        left: 0,
        top: 0
    };

    handleContextMenu = event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { session } = this.props;
        if (!session) return;
        if (session.is_current) return;

        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;

            this.setState({
                contextMenu: true,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        this.setState({
            contextMenu: false,
            left: 0,
            top: 0
        });
    };

    handleTerminate = event => {
        this.handleCloseContextMenu(event);

        const { onTerminate, session } = this.props;

        onTerminate(session);
    };

    render() {
        const { session, t } = this.props;
        if (!session) return null;

        const { left, top, contextMenu } = this.state;
        const {
            is_current,
            application_name,
            application_version,
            device_model,
            platform,
            system_version,
            ip,
            region,
            country,
            last_active_date
        } = session;
        const showDate = !is_current;

        return (
            <>
                <ListItem className='settings-list-item' button onContextMenu={this.handleContextMenu}>
                    <div className='session'>
                        <div className='session-title'>
                            <div className='session-app'>{`${application_name} ${application_version}`}</div>
                            {showDate && (
                                <div className='session-date'>{getMessageDate({ date: last_active_date })}</div>
                            )}
                        </div>
                        <div className='session-subtitle1'>{`${device_model}, ${platform} ${system_version}`}</div>
                        <div className='session-subtitle2'>
                            {`${ip} - `}
                            {region && `${region}, `}
                            {country && `${country}`}
                        </div>
                    </div>
                </ListItem>
                <Popover
                    open={contextMenu}
                    onClose={this.handleCloseContextMenu}
                    anchorReference='anchorPosition'
                    anchorPosition={{ top, left }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    onMouseDown={e => e.stopPropagation()}>
                    <MenuList onClick={e => e.stopPropagation()}>
                        <MenuItem onClick={this.handleTerminate}>
                            <ListItemIcon>
                                <StopIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('Terminate')} />
                        </MenuItem>
                    </MenuList>
                </Popover>
            </>
        );
    }
}

Session.propTypes = {
    session: PropTypes.object.isRequired,
    onTerminate: PropTypes.func.isRequired
};

export default withTranslation()(Session);
