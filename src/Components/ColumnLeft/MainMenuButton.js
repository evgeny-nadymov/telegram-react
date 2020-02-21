/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ArchiveIcon from '../../Assets/Icons/Archive';
import GroupIcon from '../../Assets/Icons/Group';
import HelpIcon from '../../Assets/Icons/Help';
import SavedIcon from '../../Assets/Icons/Saved';
import SettingsIcon from '../../Assets/Icons/Settings';
import UserIcon from '../../Assets/Icons/User';
import { isAuthorizationReady } from '../../Utils/Common';
import { openArchive, openChat } from '../../Actions/Client';
import AppStore from '../../Stores/ApplicationStore';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            authorizationState: AppStore.getAuthorizationState(),
            anchorEl: null
        };
    }

    componentDidMount() {
        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    componentWillUnmount() {
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    onUpdateAuthorizationState = update => {
        this.setState({ authorizationState: update.authorization_state });
    };

    handleMenuOpen = event => {
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;

        this.setState({ anchorEl: event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleCheckUpdates = async () => {
        this.handleMenuClose();

        //await update();
    };

    handleNewGroup = event => {
        this.handleMenuClose();
    };

    handleContacts = event => {
        this.handleMenuClose();

        TdLibController.clientUpdate({
            '@type': 'clientUpdateOpenContacts'
        });
    };

    handleArchived = event => {
        this.handleMenuClose();

        openArchive();
    };

    handleSaved = async event => {
        this.handleMenuClose();

        const chat = await TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: UserStore.getMyId(),
            force: true
        });
        if (!chat) return;

        openChat(chat.id);
    };

    handleSettings = async event => {
        this.handleMenuClose();

        const chat = await TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: UserStore.getMyId(),
            force: true
        });
        if (!chat) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateOpenSettings',
            chatId: chat.id
        });
    };

    handleHelp = event => {
        this.handleMenuClose();
    };

    render() {
        const { t } = this.props;
        const { anchorEl, authorizationState } = this.state;

        const mainMenuControl = isAuthorizationReady(authorizationState) ? (
            <>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                    }}>
                    <MenuItem onClick={this.handleNewGroup}>
                        <ListItemIcon>
                            <GroupIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('NewGroup')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleContacts}>
                        <ListItemIcon>
                            <UserIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('Contacts')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleArchived}>
                        <ListItemIcon>
                            <ArchiveIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('Archived')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleSaved}>
                        <ListItemIcon>
                            <SavedIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('Saved')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleSettings}>
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('Settings')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleHelp}>
                        <ListItemIcon>
                            <HelpIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('SettingsHelp')} />
                    </MenuItem>
                </Menu>
            </>
        ) : null;

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className='header-left-button'
                    aria-label='Menu'
                    onClick={this.handleMenuOpen}>
                    <MenuIcon />
                </IconButton>
                {mainMenuControl}
            </>
        );
    }
}

export default withTranslation()(MainMenuButton);
