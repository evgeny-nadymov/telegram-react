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
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import ArrowBackIcon from '../../Assets/Icons/Back';
import CloseIcon from '../../Assets/Icons/Close';
import SearchIcon from '../../Assets/Icons/Search';
import MainMenuButton from './MainMenuButton';
import SearchInput from './Search/SearchInput';
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

        if (openSearch !== prevProps.openSearch) {
            const searchInput = this.searchInputRef.current;
            if (openSearch) {
                setTimeout(() => {
                    if (searchInput) {
                        searchInput.focus();
                    }
                }, ANIMATION_DURATION_100MS);
            } else {
                searchInput.innerText = null;
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

    handleSearch = () => {
        const { onSearch, openSearch } = this.props;
        const { authorizationState } = this.state;
        if (!isAuthorizationReady(authorizationState)) return;

        onSearch(!openSearch);

        if (!openSearch) {
        }
    };

    handleSearchTextChange = () => {
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

    handleCloseArchive = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateCloseArchive'
        });
    };

    handleCloseSearch = () => {
        this.handleSearch();
    };

    handleFocus = () => {
        this.handleSearch();
    };

    render() {
        const { onClick, openArchive, openSearch, t } = this.props;

        let content = null;
        let showRightButton = true;
        if (openSearch) {
            showRightButton = false;
            content = (
                <>
                    {/*<div*/}
                    {/*    id='header-search-inputbox'*/}
                    {/*    ref={this.searchInputRef}*/}
                    {/*    placeholder={t('Search')}*/}
                    {/*    contentEditable*/}
                    {/*    suppressContentEditableWarning*/}
                    {/*    onKeyDown={this.handleKeyDown}*/}
                    {/*    onKeyUp={this.handleKeyUp}*/}
                    {/*    onPaste={this.handlePaste}*/}
                    {/*/>*/}
                    <IconButton className='header-left-button' onClick={this.handleCloseSearch}>
                        <ArrowBackIcon />
                    </IconButton>
                    <SearchInput inputRef={this.searchInputRef} onChange={this.handleSearchTextChange} />
                </>
            );
        } else if (openArchive) {
            showRightButton = false;
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
            showRightButton = false;
            content = (
                <>
                    <MainMenuButton />
                    <SearchInput inputRef={this.searchInputRef} onFocus={this.handleFocus} />
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
