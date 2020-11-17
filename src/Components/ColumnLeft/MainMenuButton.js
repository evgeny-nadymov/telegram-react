/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import ArrowBackIcon from '../../Assets/Icons/Back';
import ChannelIcon from '../../Assets/Icons/Channel';
import CloseIcon from '../../Assets/Icons/Close';
import ArchiveIcon from '../../Assets/Icons/Archive';
import SearchIcon from '../../Assets/Icons/Search';
import MenuIcon from '../../Assets/Icons/Menu';
import GroupIcon from '../../Assets/Icons/Group';
import HelpIcon from '../../Assets/Icons/Help';
import SavedIcon from '../../Assets/Icons/Saved';
import SettingsIcon from '../../Assets/Icons/Settings';
import UserIcon from '../../Assets/Icons/User';
import { isAuthorizationReady } from '../../Utils/Common';
import { openArchive, openChat, searchChat } from '../../Actions/Client';
import AppStore from '../../Stores/ApplicationStore';
import CacheStore from '../../Stores/CacheStore';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';
import './MainMenuButton.css';

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            authorizationState: AppStore.getAuthorizationState(),
            anchorEl: null,
            isSmallWidth: AppStore.isSmallWidth
        };
    }

    componentDidMount() {
        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.on('clientUpdatePageWidth', this.onClientUpdatePageWidth);
    }

    componentWillUnmount() {
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.off('clientUpdatePageWidth', this.onClientUpdatePageWidth);
    }

    onClientUpdatePageWidth = update => {
        const { isSmallWidth } = update;

        this.setState({ isSmallWidth });
    };

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

    handleNewChannel = event => {
        this.handleMenuClose();

        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewChannel',
            open: true
        });
    };

    handleNewGroup = event => {
        this.handleMenuClose();

        TdLibController.clientUpdate({
            '@type': 'clientUpdateNewGroup',
            open: true
        });
    };

    handleContacts = event => {
        this.handleMenuClose();

        TdLibController.clientUpdate({
            '@type': 'clientUpdateContacts',
            open: true
        });
    };

    handleArchived = event => {
        this.handleMenuClose();

        openArchive();
    };

    handleSaved = async event => {
        this.handleMenuClose();

        let chat = CacheStore.cache ? CacheStore.cache.meChat : null;
        if (!chat) {
            chat = await TdLibController.send({
                '@type': 'createPrivateChat',
                user_id: UserStore.getMyId(),
                force: false
            });
        }

        if (!chat) return;

        openChat(chat.id);
    };

    handleSettings = async event => {
        this.handleMenuClose();

        let chat = CacheStore.cache ? CacheStore.cache.meChat : null;
        if (!chat) {
            chat = await TdLibController.send({
                '@type': 'createPrivateChat',
                user_id: UserStore.getMyId(),
                force: false
            });
        }

        if (!chat) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateSettings',
            open: true,
            chatId: chat.id
        });
    };

    handleHelp = async event => {
        this.handleMenuClose();
        // unregister();
    };

    handleSearch = () => {
        this.handleMenuClose();

        searchChat(0);
    };

    render() {
        const { t, timeout, popup, showClose, onClose } = this.props;
        const { anchorEl, authorizationState, isSmallWidth } = this.state;

        const mainMenuControl =
            !showClose && isAuthorizationReady(authorizationState) ? (
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
                    <MenuItem onClick={this.handleNewChannel}>
                        <ListItemIcon>
                            <ChannelIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('NewChannel')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleNewGroup}>
                        <ListItemIcon>
                            <GroupIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('NewGroup')} />
                    </MenuItem>
                    { isSmallWidth && (
                        <MenuItem onClick={this.handleSearch}>
                            <ListItemIcon>
                                <SearchIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('Search')} />
                        </MenuItem>
                    )}
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
            ) : null;

        const closeIcon = popup
            ? <CloseIcon/>
            : <ArrowBackIcon/>;

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className='header-left-button main-menu-button'
                    aria-label='Menu'
                    onClick={showClose ? onClose : this.handleMenuOpen}>
                    { timeout
                        ? (<SpeedDialIcon open={showClose} openIcon={<ArrowBackIcon />} icon={<MenuIcon />} />)
                        : (<>{showClose ? closeIcon : <MenuIcon />}</>)
                    }

                </IconButton>
                {mainMenuControl}
            </>
        );
    }
}

export default withTranslation()(MainMenuButton);
