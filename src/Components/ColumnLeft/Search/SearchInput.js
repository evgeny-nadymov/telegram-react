/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import SearchIcon from '../../../Assets/Icons/Search';
import './SearchInput.css';

class SearchInput extends React.Component {
    handleKeyDown = event => {
        if (event.keyCode === 13) {
            event.preventDefault();
        }
    };

    handleKeyUp = event => {
        const element = event.target;
        if (!element) return;

        const { innerHTML } = element;
        if (innerHTML === '<br>' || innerHTML === '<div><br></div>') {
            element.innerHTML = null;
        }
    };

    handlePaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            document.execCommand('insertText', false, plainText);
        }
    };

    handleInput = event => {
        const { onChange } = this.props;

        const element = event.target;
        if (!element) return;

        if (onChange) {
            onChange(element.innerText);
        }
    };

    render() {
        const { inputRef, t } = this.props;

        return (
            <div className='search-input'>
                {/*<SearchIcon />*/}
                <div
                    id='search-inputbox'
                    ref={inputRef}
                    placeholder={t('Search')}
                    contentEditable
                    suppressContentEditableWarning
                    onKeyDown={this.handleKeyDown}
                    onKeyUp={this.handleKeyUp}
                    onPaste={this.handlePaste}
                    onInput={this.handleInput}
                />
            </div>
        );
    }
}

SearchInput.propTypes = {
    inputRef: PropTypes.object,
    onChange: PropTypes.func
};

export default withTranslation()(SearchInput);
