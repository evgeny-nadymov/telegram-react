/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import { withRestoreRef, withSaveRef } from '../../Utils/HOC';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    IconButton
} from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import MainMenuButton from './MainMenuButton';
import { isAuthorizationReady } from '../../Utils/Common';
import { ANIMATION_DURATION_100MS } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import '../ColumnMiddle/Header.css';

class DialogsHeader extends React.Component {
    constructor(props) {
        super(props);

        this.searchInputRef = React.createRef();

        this.state = {
            authorizationState: AppStore.getAuthorizationState(),
            open: false
        };
    }

    setInitQuery(query) {
        const { onSearchTextChange } = this.props;

        const searchInput = this.searchInputRef.current;
        if (searchInput) {
            searchInput.innerText = query;
            if (searchInput.childNodes.length > 0) {
                const range = document.createRange();
                range.setStart(searchInput.childNodes[0], searchInput.childNodes[0].length);
                range.collapse(true);

                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
            searchInput.focus();
            onSearchTextChange(query);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { openSearch, text } = this.props;

        if (openSearch) {
            const searchInput = this.searchInputRef.current;
            if (openSearch !== prevProps.openSearch) {
                setTimeout(() => {
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, ANIMATION_DURATION_100MS);
            }
        }
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
        const { onSearchTextChange } = this.props;

        const element = this.searchInputRef.current;
        if (!element) return;

        const { innerHTML } = element;
        if (innerHTML === '<br>' || innerHTML === '<div><br></div>') {
            element.innerHTML = null;
        }
        const { innerText } = element;

        onSearchTextChange(innerText);
    };

    handlePaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertText', false, plainText);
        }
    };

    handleCloseArchive = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateCloseArchive'
        });
    };

    render() {
        const { onClick, openArchive, openSearch, t } = this.props;
        const { open } = this.state;

        const confirmLogoutDialog = open ? (
            <Dialog transitionDuration={0} open={open} onClose={this.handleClose} aria-labelledby='form-dialog-title'>
                <DialogTitle id='form-dialog-title'>{t('Confirm')}</DialogTitle>
                <DialogContent>
                    <DialogContentText style={{ whiteSpace: 'pre-wrap' }}>{t('AreYouSureLogout')}</DialogContentText>
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

        let content = null;
        if (openSearch) {
            content = (
                <>
                    <div className='header-search-input grow'>
                        <div
                            id='header-search-inputbox'
                            ref={this.searchInputRef}
                            placeholder={t('Search')}
                            contentEditable
                            suppressContentEditableWarning
                            onKeyDown={this.handleKeyDown}
                            onKeyUp={this.handleKeyUp}
                            onPaste={this.handlePaste}
                        />
                    </div>
                </>
            );
        } else if (openArchive) {
            content = (
                <>
                    <IconButton className='header-left-button' onClick={this.handleCloseArchive}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer' onClick={onClick}>
                        <span className='header-status-content'>{t('ArchivedChats')}</span>
                    </div>
                </>
            );
        } else {
            content = (
                <>
                    <MainMenuButton onLogOut={this.handleLogOut} />
                    {confirmLogoutDialog}
                    <div className='header-status grow cursor-pointer' onClick={onClick}>
                        <span className='header-status-content'>{t('AppName')}</span>
                    </div>
                </>
            );
        }

        return (
            <div className='header-master'>
                {content}
                <IconButton className='header-right-button' aria-label={t('Search')} onMouseDown={this.handleSearch}>
                    <SpeedDialIcon open={openSearch} icon={<SearchIcon />} openIcon={<CloseIcon />} />
                </IconButton>
            </div>
        );
    }
}

DialogsHeader.propTypes = {
    openSearch: PropTypes.bool.isRequired,
    openArchive: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
    onSearchTextChange: PropTypes.func.isRequired
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(DialogsHeader);
