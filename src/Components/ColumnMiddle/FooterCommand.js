/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@material-ui/core/Button/Button';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import { borderStyle } from '../Theme';
import './FooterCommand.css';

const styles = theme => ({
    button: {
        margin: '14px',
        minWidth: '100px'
    },
    ...borderStyle(theme)
});

class FooterCommand extends React.Component {
    render() {
        const { classes, command, onCommand } = this.props;

        return (
            <div className={classNames(classes.borderColor, 'footer-command-wrapper')}>
                <div className='footer-command-actions'>
                    <Button color='primary' className={classes.button} onClick={onCommand}>
                        {command}
                    </Button>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(FooterCommand);
