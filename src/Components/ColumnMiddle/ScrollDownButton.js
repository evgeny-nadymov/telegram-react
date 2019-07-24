/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import IconButton from '@material-ui/core/IconButton';
import './ScrollDownButton.css';

const styles = theme => ({
    scrollDownButton: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        borderColor: theme.palette.divider
    }
});

class ScrollDownButton extends React.Component {
    render() {
        const { classes, onClick } = this.props;

        return (
            <div className={classNames('scroll-down-button', classes.scrollDownButton)}>
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

export default withStyles(styles)(ScrollDownButton);
