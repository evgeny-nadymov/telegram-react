/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import IconButton from '@mui/material/IconButton';
import './ScrollDownButton.css';

class ScrollDownButton extends React.Component {
    render() {
        const { onClick } = this.props;

        return (
            <div className='scroll-down-button'>
                <IconButton disableRipple={true} onMouseDown={onClick}>
                    <ArrowDownwardIcon />
                </IconButton>
            </div>
        );
    }
}

ScrollDownButton.propTypes = {
    onClick: PropTypes.func.isRequired
};

export default ScrollDownButton;
