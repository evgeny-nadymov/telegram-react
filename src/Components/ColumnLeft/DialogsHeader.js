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

    handleClose = () => {
        const { openArchive, openSearch } = this.props;

        if (openArchive) {
            this.handleCloseArchive();
        } else if (openSearch) {
            this.handleCloseSearch();
        }
    };

    render() {
        const { onClick, openArchive, openSearch, t } = this.props;

        let content = null;
        let showClose = false;
        if (openSearch) {
            showClose = true;
            content = (
                <SearchInput
                    inputRef={this.searchInputRef}
                    onChange={this.handleSearchTextChange}
                    onClose={this.handleCloseSearch}
                />
            );
        } else if (openArchive) {
            showClose = true;
            content = (
                <div className='header-status grow cursor-pointer' onClick={onClick}>
                    <span className='header-status-content'>{t('ArchivedChats')}</span>
                </div>
            );
        } else {
            content = <SearchInput inputRef={this.searchInputRef} onFocus={this.handleFocus} />;
        }

        return (
            <div className='header-master'>
                <MainMenuButton showClose={showClose} onClose={this.handleClose} />
                {content}
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
