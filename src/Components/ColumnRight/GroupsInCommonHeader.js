/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '../../Assets/Icons/Back';
import './GroupsInCommonHeader.css';

class GroupsInCommonHeader extends React.Component {
    render() {
        const { onClose } = this.props;

        return (
            <div className='header-master'>
                <IconButton className='header-left-button' onClick={onClose}>
                    <ArrowBackIcon />
                </IconButton>
                <div className='header-status grow cursor-pointer'>
                    <span className='header-status-content'>Groups in common</span>
                </div>
            </div>
        );
    }
}

GroupsInCommonHeader.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default GroupsInCommonHeader;
