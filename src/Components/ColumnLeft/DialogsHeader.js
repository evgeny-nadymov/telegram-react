/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
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
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import MainMenuButton from './MainMenuButton';
import { debounce, isAuthorizationReady, throttle } from '../../Utils/Common';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import '../ColumnMiddle/Header.css';

const styles = {
    headerIconButton: {
        margin: '8px 12px 8px 0'
    },
    dialogText: {
        whiteSpace: 'pre-wrap'
    }
};

class DialogsHeader extends React.Component {
    constructor(props) {
        super(props);

        this.searchInput = React.createRef();

        this.state = {
            authorizationState: ApplicationStore.getAuthorizationState(),
            open: false
        };

        this.handleInput = debounce(this.handleInput, 250);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.openSearch && this.props.openSearch !== prevProps.openSearch) {
            setTimeout(() => {
                if (this.searchInput.current) {
                    this.searchInput.current.focus();
                }
            }, 250);
        }
    }

    componentDidMount() {
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState);
    }

    onUpdateAuthorizationState = update => {
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

    handleKeyDown = event => {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    };

    handleKeyUp = () => {
        const innerText = this.searchInput.current.innerText;
        const innerHTML = this.searchInput.current.innerHTML;

        if (innerHTML && (innerHTML === '<br>' || innerHTML === '<div><br></div>')) {
            this.searchInput.current.innerHTML = '';
        }

        ApplicationStore.emit('clientUpdateSearchText', { text: innerText });
    };

    handlePaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertHTML', false, plainText);
        }
    };

    render() {
        const { classes, onClick, openSearch, t } = this.props;
        const { open } = this.state;

        const confirmLogoutDialog = open ? (
            <Dialog transitionDuration={0} open={open} onClose={this.handleClose} aria-labelledby='form-dialog-title'>
                <DialogTitle id='form-dialog-title'>{t('AppName')}</DialogTitle>
                <DialogContent>
                    <DialogContentText className={classes.dialogText}>{t('AreYouSureLogout')}</DialogContentText>
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
        ) : null;

        return (
            <div className='header-master'>
                {!openSearch ? (
                    <>
                        <MainMenuButton onLogOut={this.handleLogOut} />
                        {confirmLogoutDialog}
                        <div className='header-status grow cursor-pointer' onClick={onClick}>
                            <span className='header-status-content'>{t('AppName')}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div className='header-search-input grow'>
                            <div
                                id='header-search-inputbox'
                                ref={this.searchInput}
                                placeholder={t('Search')}
                                key={Date()}
                                contentEditable
                                suppressContentEditableWarning
                                onKeyDown={this.handleKeyDown}
                                onKeyUp={this.handleKeyUp}
                                onPaste={this.handlePaste}
                            />
                        </div>
                    </>
                )}
                <IconButton
                    className={classes.headerIconButton}
                    aria-label={t('Search')}
                    onMouseDown={this.handleSearch}>
                    <SpeedDialIcon open={openSearch} icon={<SearchIcon />} openIcon={<CloseIcon />} />
                </IconButton>
            </div>
        );
    }
}

DialogsHeader.propTypes = {
    openSearch: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
    onSearchTextChange: PropTypes.func.isRequired
};

const enhance = compose(
    withTranslation(),
    withStyles(styles)
);

export default enhance(DialogsHeader);
