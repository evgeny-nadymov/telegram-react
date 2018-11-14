/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import {IconButton} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import '../ColumnMiddle/Header.css';
import './ChatDetailsHeaderControl.css';

const styles = {
    closeIconButton : {
        margin: '8px -2px 8px 12px',
    }
};

class ChatDetailsHeaderControl extends React.Component {
    constructor(props){
        super(props);
    }

    render() {
        const { classes, backButton, onClick } = this.props;

        return (
            <div className='header-master'>
                <IconButton
                    className={classes.closeIconButton}
                    onClick={this.props.onClose}>
                    {
                        backButton ?
                            <ArrowBackIcon /> :
                            <CloseIcon/>
                    }
                </IconButton>
                <div className='header-status grow cursor-pointer' onClick={onClick}>
                    <span className='header-status-content'>Chat Info</span>
                </div>
            </div>);
    }
}

export default withStyles(styles)(ChatDetailsHeaderControl);