/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import { borderStyle } from '../Theme';
import './HeaderPlayer.css';

const styles = theme => ({
    skipPreviousIconButton: {
        margin: '8px 0 8px 12px'
    },
    playIconButton: {
        margin: '8px 0 8px 0'
    },
    skipNextIconButton: {
        margin: '8px 12px 8px 0'
    },
    closeIconButton: {
        margin: '8px 12px 8px 12px'
    },
    ...borderStyle(theme)
});

class HeaderPlayer extends React.Component {
    render() {
        const { classes } = this.props;

        return (
            <div className={classNames(classes.borderColor, 'header-player')}>
                <IconButton className={classes.skipPreviousIconButton}>
                    <SkipPreviousIcon />
                </IconButton>
                <IconButton className={classes.playIconButton}>
                    <PlayArrowIcon />
                </IconButton>
                <IconButton className={classes.skipNextIconButton}>
                    <SkipNextIcon />
                </IconButton>
                <div className='header-player-content' />
                <IconButton className={classes.closeIconButton}>
                    <CloseIcon />
                </IconButton>
            </div>
        );
    }
}

HeaderPlayer.propTypes = {};

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(HeaderPlayer);
