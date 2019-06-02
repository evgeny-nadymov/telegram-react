/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import './SharedMediaHeaderControl.css';

const styles = {
    backIconButton: {
        margin: '8px -2px 8px 12px'
    }
};

class SharedMediaHeaderControl extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { classes, close } = this.props;

        return (
            <div className='header-master'>
                <IconButton className={classes.backIconButton} onClick={close}>
                    <ArrowBackIcon />
                </IconButton>
                <div className='header-status grow cursor-pointer'>
                    <span className='header-status-content'>Shared Media</span>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(SharedMediaHeaderControl);
