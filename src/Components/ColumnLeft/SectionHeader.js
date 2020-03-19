/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './SectionHeader.css';

function SectionHeader({ command, multiline, onClick, children }) {
    return (
        <div className='section-header'>
            <div className={classNames('section-header-title', { 'section-header-title-multiline': multiline })}>{children}</div>
            {Boolean(command) && <a onClick={onClick}>{command}</a>}
        </div>
    );
}

SectionHeader.propTypes = {
    command: PropTypes.string,
    multiline: PropTypes.bool,
    onClick: PropTypes.func
};

export default SectionHeader;
