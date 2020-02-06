/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './SearchCaption.css';

function SearchCaption(props) {
    const { caption, command, onClick } = props;

    return (
        <div className='search-caption'>
            <div className='search-caption-title'>{caption}</div>
            {Boolean(command) && <a onClick={onClick}>{command}</a>}
        </div>
    );
}

SearchCaption.propTypes = {
    caption: PropTypes.string.isRequired,
    command: PropTypes.string,
    onClick: PropTypes.func
};

export default SearchCaption;
