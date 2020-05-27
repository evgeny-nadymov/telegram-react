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
import LogOutIcon from '../../../Assets/Icons/LogOut';
import MoreIcon from '../../../Assets/Icons/More';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { modalManager } from '../../../Utils/Modal';
import TdLibController from '../../../Controllers/TdLibController';

class SettingsMenuButton extends React.Component {
    state = {
        anchorEl: null,
        open: false
    };

    handleMenuOpen = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleLogOut = () => {
        this.handleMenuClose();

        this.setState({ open: true });
    };

    handleDone = () => {
        this.handleClose();
        TdLibController.logOut();
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    render() {
        const { t } = this.props;
        const { anchorEl, open } = this.state;

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className='header-right-button'
                    aria-label='Menu'
                    onClick={this.handleMenuOpen}>
                    <MoreIcon />
                </IconButton>
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
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}>
                    <MenuItem onClick={this.handleLogOut}>
                        <ListItemIcon>
                            <LogOutIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('LogOut')} />
                    </MenuItem>
                </Menu>
                <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={open}
                    onClose={this.handleClose}
                    aria-labelledby='form-dialog-title'>
                    <DialogTitle id='form-dialog-title'>{t('Confirm')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText style={{ whiteSpace: 'pre-wrap' }}>
                            {t('AreYouSureLogout')}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handleDone} color='primary'>
                            {t('Ok')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

SettingsMenuButton.propTypes = {};

export default withTranslation()(SettingsMenuButton);
