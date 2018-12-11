/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
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
import CloseIcon from '@material-ui/icons/Close';
import TdLibController from '../../Controllers/TdLibController';
import MainMenuButton from './MainMenuButton';
import '../ColumnMiddle/Header.css';
import PropTypes from 'prop-types';
import ApplicationStore from '../../Stores/ApplicationStore';
import { isAuthorizationReady } from '../../Utils/Common';

const styles = {
    headerIconButton: {
        margin: '8px 12px 8px 0'
    }
};

class DialogsHeader extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            authorizationState: ApplicationStore.getAuthorizationState(),
            open: false
        };
    }

    componentDidMount(){
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    onUpdateAuthorizationState = (update) => {
        this.setState({ authorizationState: update.authorization_state });
    };

    handleLogOut = () => {
        this.setState({ open: true });
    };

    handleDone = () => {
        this.handleClose();
        TdLibController.logOut();
    };

    handleClose = () => {
        this.setState({ open: false });
    };

    handleSearch = () => {
        const { onSearch, openSearch } = this.props;
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;

        onSearch(!openSearch);
    };

    handleKeyDown = () => {

    };

    handleKeyUp = () => {

    };

    render() {
        const { classes, onClick, openSearch } = this.props;
        const { open } = this.state;

        const confirmLogoutDialog = open ? (
            <Dialog
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
            </Dialog>
        ) : null;

        return (
            <div className='header-master'>
                {   !openSearch
                    ? <>
                        <MainMenuButton onLogOut={this.handleLogOut} />
                        { confirmLogoutDialog }
                        <div className='header-status grow cursor-pointer' onClick={onClick}>
                            <span className='header-status-content'>Telegram</span>
                        </div>
                    </>
                    : <>
                        <div className='header-search-input grow'>
                            <div
                                id='inputbox-message'
                                ref={this.searchInput}
                                placeholder='Search'
                                key={Date()}
                                contentEditable
                                suppressContentEditableWarning
                                onKeyDown={this.handleKeyDown}
                                onKeyUp={this.handleKeyUp}>
                            </div>
                        </div>
                    </>
                }
                <IconButton
                    className={classes.headerIconButton}
                    aria-label='Search'
                    onClick={this.handleSearch}>
                    { openSearch ? <CloseIcon/> : <SearchIcon/> }
                </IconButton>
            </div>
        );
    }
}

DialogsHeader.propTypes = {
    openSearch: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired
};

export default withStyles(styles)(DialogsHeader);
