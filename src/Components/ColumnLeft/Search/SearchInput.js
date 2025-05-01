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
        } else if (event.keyCode === 27) {
            const { onChange, onClose } = this.props;

            const element = event.target;
            if (!element) return;

            if (element.innerText) {
                event.stopPropagation();
                event.nativeEvent.stopImmediatePropagation();

                element.innerText = null;
                if (onChange) onChange(element.innerText);
                return;
            }

            if (onClose) {
                onClose(event);
            }
        } else if (event.keyCode === 8) {
            const { onBackspace } = this.props;

            const element = event.target;
            if (!element) return;
            if (element.innerText) return;

            if (onBackspace) {
                event.stopPropagation();
                onBackspace();
            }
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
        const { inputRef, t, onFocus, hint, showIcon } = this.props;

        return (
            <div className='search-input'>
                <div
                    id='search-inputbox'
                    ref={inputRef}
                    placeholder={hint || t('Search')}
                    contentEditable
                    suppressContentEditableWarning
                    onKeyDown={this.handleKeyDown}
                    onKeyUp={this.handleKeyUp}
                    onPaste={this.handlePaste}
                    onInput={this.handleInput}
                    onFocus={onFocus}
                />
                {showIcon && <SearchIcon className='search-input-icon' />}
            </div>
        );
    }
}

SearchInput.propTypes = {
    inputRef: PropTypes.object,
    hint: PropTypes.string,
    showIcon: PropTypes.bool,
    onBackspace: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onClose: PropTypes.func
};

SearchInput.defaultProps = {
    showIcon: true
}

export default withTranslation()(SearchInput);
