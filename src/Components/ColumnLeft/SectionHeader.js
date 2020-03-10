/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './SectionHeader.css';

function SectionHeader(props) {
    const { command, onClick, children } = props;

    return (
        <div className='section-header'>
            <div className='section-header-title'>{children}</div>
            {Boolean(command) && <a onClick={onClick}>{command}</a>}
        </div>
    );
}

SectionHeader.propTypes = {
    command: PropTypes.string,
    onClick: PropTypes.func
};

export default SectionHeader;
