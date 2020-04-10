/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import MainMenuButton from './MainMenuButton';
import SearchInput from './Search/SearchInput';
import { isAuthorizationReady } from '../../Utils/Common';
import AppStore from '../../Stores/ApplicationStore';
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
        const { openSearch } = this.props;

        if (openSearch !== prevProps.openSearch) {
            if (openSearch) {
                this.focusInput();
            } else {
                const searchInput = this.searchInputRef.current;
                if (searchInput) {
                    searchInput.innerText = null;
                }
            }
        }
    }

    focusInput() {
        const searchInput = this.searchInputRef.current;
        if (searchInput) {
            searchInput.focus();
        }
    }

    componentDidMount() {
        if (this.props.popup) {
            this.focusInput();
        }

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

    handleCloseSearch = () => {
        this.handleSearch();
    };

    handleFocus = () => {
        this.handleSearch();
    };

    render() {
        const { openSearch, timeout, popup } = this.props;

        let content = null;
        let showBack = false;
        if (openSearch) {
            showBack = true;
            content = (
                <SearchInput
                    inputRef={this.searchInputRef}
                    onChange={this.handleSearchTextChange}
                    onClose={this.handleCloseSearch}
                />
            );
        } else {
            content = <SearchInput inputRef={this.searchInputRef} onFocus={this.handleFocus} />;
        }

        return (
            <div className='header-master'>
                <MainMenuButton timeout={timeout} showClose={showBack} popup={popup} onClose={this.handleCloseSearch} />
                {content}
            </div>
        );
    }
}

DialogsHeader.propTypes = {
    openSearch: PropTypes.bool.isRequired,
    onClick: PropTypes.func,
    onSearch: PropTypes.func.isRequired,
    onSearchTextChange: PropTypes.func.isRequired,
    timeout: PropTypes.bool,
    popup: PropTypes.bool
};

export default DialogsHeader;
