/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { compose } from 'recompose';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import { IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import './ChatDetailsHeaderControl.css';

const styles = {
    closeIconButton: {
        margin: '8px -2px 8px 12px'
    }
};

class ChatDetailsHeaderControl extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { classes, t, backButton, onClick } = this.props;

        return (
            <div className='header-master'>
                <IconButton className={classes.closeIconButton} onClick={this.props.onClose}>
                    {backButton ? <ArrowBackIcon /> : <CloseIcon />}
                </IconButton>
                <div className='header-status grow cursor-pointer' onClick={onClick}>
                    <span className='header-status-content'>{t('ChatInfo')}</span>
                </div>
            </div>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(ChatDetailsHeaderControl);
