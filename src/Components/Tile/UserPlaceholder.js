/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './UserPlaceholder.css';

class UserPlaceholder extends React.Component {
    render() {
        const { index } = this.props;

        const titleWidth = `${20 + Math.sin(index) * 10}%`;
        const contentWidth = `${30 + Math.cos(index) * 10}%`;

        return (
            <div className='user-placeholder'>
                <div className='user-wrapper'>
                    <div className='dialog-placeholder-tile' />
                    <div className='dialog-placeholder-inner-wrapper'>
                        <div className='tile-first-row'>
                            <div className='dialog-placeholder-title' style={{ width: titleWidth }} />
                            <div className='dialog-placeholder-title' style={{ width: contentWidth, marginLeft: 8 }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

UserPlaceholder.propTypes = {
    index: PropTypes.number.isRequired
};

export default UserPlaceholder;
