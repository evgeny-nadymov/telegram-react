/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { withRestoreRef, withSaveRef, compose } from '../../Utils/HOC';
import { IconButton } from '@material-ui/core';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '../../Assets/Icons/Close';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import MainMenuButton from './MainMenuButton';
import { isAuthorizationReady } from '../../Utils/Common';
import { ANIMATION_DURATION_100MS } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import '../ColumnMiddle/Header.css';
import SettingsMenuButton from './Settings/SettingsMenuButton';

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

    handleCloseSettings = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateCloseSettings'
        });
    };

    handleCloseEditProfile = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateCloseEditProfile'
        });
    };

    handleCloseNotifications = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateCloseNotifications'
        });
    };

    render() {
        const {
            onClick,
            openArchive,
            openSearch,
            openSettings,
            openLanguage,
            openEditProfile,
            openNotifications,
            openPrivacySecurity,
            openActiveSessions,
            openContacts,
            t
        } = this.props;

        let content = null;
        let showRightButton = true;
        if (openSearch) {
            content = (
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
        } else if (openEditProfile) {
            showRightButton = false;
            content = (
                <>
                    <IconButton className='header-left-button' onClick={this.handleCloseEditProfile}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer' onClick={onClick}>
                        <span className='header-status-content'>{t('EditProfile')}</span>
                    </div>
                </>
            );
        } else if (openLanguage || openNotifications || openPrivacySecurity || openActiveSessions) {
            showRightButton = false;
            content = null;
        } else if (openSettings) {
            showRightButton = false;
            content = (
                <>
                    <IconButton className='header-left-button' onClick={this.handleCloseSettings}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer' onClick={onClick}>
                        <span className='header-status-content'>{t('Settings')}</span>
                    </div>
                    <SettingsMenuButton />
                </>
            );
        } else if (openContacts) {
            showRightButton = false;
            content = null;
        } else {
            content = (
                <>
                    <MainMenuButton />
                    <div className='header-status grow cursor-pointer' onClick={onClick}>
                        <span className='header-status-content'>{t('AppName')}</span>
                    </div>
                </>
            );
        }

        return (
            <div className='header-master'>
                {content}
                {showRightButton && (
                    <IconButton
                        className='header-right-button'
                        aria-label={t('Search')}
                        onMouseDown={this.handleSearch}>
                        <SpeedDialIcon open={openSearch} icon={<SearchIcon />} openIcon={<CloseIcon />} />
                    </IconButton>
                )}
            </div>
        );
    }
}

DialogsHeader.propTypes = {
    openSearch: PropTypes.bool.isRequired,
    openArchive: PropTypes.bool.isRequired,
    openSettings: PropTypes.bool.isRequired,
    openEditProfile: PropTypes.bool.isRequired,
    openNotifications: PropTypes.bool.isRequired,
    openPrivacySecurity: PropTypes.bool.isRequired,
    openActiveSessions: PropTypes.bool.isRequired,
    openLanguage: PropTypes.bool.isRequired,
    openContacts: PropTypes.bool.isRequired,
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
