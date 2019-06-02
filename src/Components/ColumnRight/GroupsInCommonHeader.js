/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import withStyles from '@material-ui/core/styles/withStyles';
import './GroupsInCommonHeader.css';

const styles = {
    backIconButton: {
        margin: '8px -2px 8px 12px'
    }
};

class GroupsInCommonHeader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { classes, onClose } = this.props;

        return (
            <div className='header-master'>
                <IconButton className={classes.backIconButton} onClick={onClose}>
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

export default withStyles(styles)(GroupsInCommonHeader);
