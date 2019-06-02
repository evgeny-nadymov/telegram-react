/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import './UnreadSeparator.css';

const styles = theme => ({
    unreadSeparator: {
        background: theme.palette.type === 'dark' ? theme.palette.grey[800] : '#f0f4f7',
        color: theme.palette.type === 'dark' ? theme.palette.text.primary : '#8096a8'
    }
});

function UnreadSeparator(props) {
    const { classes } = props;

    return <div className={classNames('unread-separator', classes.unreadSeparator)}>Unread messages</div>;
}

export default withStyles(styles)(UnreadSeparator);
