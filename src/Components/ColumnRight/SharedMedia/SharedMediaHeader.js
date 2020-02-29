/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import CloseIcon from '../../../Assets/Icons/Close';
import SearchIcon from '../../../Assets/Icons/Search';
import SpeedDialIcon from '@material-ui/lab/SpeedDialIcon';
import { ANIMATION_DURATION_200MS } from '../../../Constants';
import './SharedMediaHeader.css';

class SharedMediaHeader extends React.Component {
    constructor(props) {
        super(props);

        this.searchInputRef = React.createRef();

        this.state = {
            openSearch: false
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { openSearch } = this.state;

        if (openSearch && openSearch !== prevProps.openSearch) {
            setTimeout(() => {
                if (this.searchInputRef.current) {
                    this.searchInputRef.current.focus();
                }
            }, ANIMATION_DURATION_200MS);
        }
    }

    handleSearch = () => {
        if (this.searchInputRef.current) {
            const innerText = this.searchInputRef.current.innerText;
            if (innerText) {
                this.searchInputRef.current.innerText = '';

                const { onSearch } = this.props;
                if (!onSearch) return;

                onSearch('');
                return;
            }
        }

        const { onCloseSearch } = this.props;
        const { openSearch } = this.state;

        this.setState({ openSearch: !openSearch });

        if (onCloseSearch) {
            onCloseSearch();
        }
    };

    handleKeyDown = event => {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    };

    handleKeyUp = () => {
        const element = this.searchInputRef.current;
        if (!element) return;

        const { innerHTML } = element;
        if (innerHTML === '<br>' || innerHTML === '<div><br></div>') {
            element.innerHTML = null;
        }
        const { innerText } = element;

        const { onSearch } = this.props;
        if (!onSearch) return;

        onSearch(innerText);
    };

    handlePaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertText', false, plainText);
        }
    };

    render() {
        const { t, title, onClick, onClose, onSearch } = this.props;
        const { openSearch } = this.state;

        return (
            <div className='header-master'>
                {!openSearch ? (
                    <>
                        <IconButton className='header-left-button' onClick={onClose}>
                            <ArrowBackIcon />
                        </IconButton>
                        <div className='header-status grow cursor-pointer' onClick={onClick}>
                            <span className='header-status-content'>{title}</span>
                        </div>
                    </>
                ) : (
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
                )}
                {Boolean(onSearch) && (
                    <IconButton className='header-right-button' onMouseDown={this.handleSearch}>
                        <SpeedDialIcon open={openSearch} icon={<SearchIcon />} openIcon={<CloseIcon />} />
                    </IconButton>
                )}
            </div>
        );
    }
}

SharedMediaHeader.propTypes = {
    title: PropTypes.string,
    onClick: PropTypes.func,
    onClose: PropTypes.func,
    onCloseSearch: PropTypes.func,
    onSearch: PropTypes.func
};

export default withTranslation()(SharedMediaHeader);
