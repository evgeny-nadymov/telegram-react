/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Country.css';

function Country({ emoji, name, phone }) {
    return (
        <div className='country'>
            <span className='country-emoji'>{emoji}</span>
            <span className='country-name'>{name}</span>
            <span className='country-phone'>{phone}</span>
        </div>
    );
}

Country.propTypes = {
    emoji: PropTypes.string,
    name: PropTypes.string,
    phone: PropTypes.string
};

export default Country;
