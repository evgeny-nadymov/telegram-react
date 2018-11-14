/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    IconButton
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import TdLibController from '../../Controllers/TdLibController';
import MainMenuButton from './MainMenuButton';
import '../ColumnMiddle/Header.css';

const styles = {
    searchIconButton : {
        margin: '8px 12px 8px 0',
    }
};

class DialogsHeader extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            open: false
        };

        this.handleDone = this.handleDone.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleCheckUpdates = this.handleCheckUpdates.bind(this);
        this.handleLogOut = this.handleLogOut.bind(this);
        this.handleClearCache = this.handleClearCache.bind(this);
    }

    handleCheckUpdates(){
    }

    handleLogOut(){
        this.setState({ open: true });
    }

    handleClearCache(){
        this.props.onClearCache();
    }

    handleDone(){
        this.handleClose();
        TdLibController.logOut();
    }

    handleClose(){
        this.setState({ open: false });
    }

    render() {
        const {classes, onClick} = this.props;
        const {open} = this.state;

        const confirmLogoutDialog = open?
            (<Dialog
                open={open}
                onClose={this.handleClose}
                aria-labelledby='form-dialog-title'>
                <DialogTitle id='form-dialog-title'>Telegram</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to log out?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose} color='primary'>
                        Cancel
                    </Button>
                    <Button onClick={this.handleDone} color='primary'>
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>)
            : null;

        return (
            <div className='header-master'>
                <MainMenuButton onCheckUpdates={this.handleCheckUpdates} onLogOut={this.handleLogOut}/>
                { confirmLogoutDialog }
                <div className='header-status grow cursor-pointer' onClick={onClick}>
                    <span className='header-status-content'>Telegram</span>
                </div>
                <IconButton className={classes.searchIconButton} aria-label='Search'>
                    <SearchIcon />
                </IconButton>
            </div>);
    }
}

export default withStyles(styles)(DialogsHeader);