/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@material-ui/core/Button/Button';
import {withStyles} from '@material-ui/core/styles';
import './FooterCommand.css';

const styles = {
    button: {
        margin: '14px',
        minWidth: '100px'
    }
};

class FooterCommand extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {classes, command, onCommand} = this.props;

        return (
            <div className='dialog-command-wrapper'>
                <div className='dialog-command-actions'>
                    <Button color='primary' className={classes.button} onClick={onCommand}>
                        {command}
                    </Button>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(FooterCommand);