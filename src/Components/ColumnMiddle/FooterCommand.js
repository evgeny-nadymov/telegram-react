/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@material-ui/core/Button/Button';
import './FooterCommand.css';

class FooterCommand extends React.Component {
    render() {
        const { command, onCommand } = this.props;

        return (
            <div className='footer-command-wrapper'>
                <div className='footer-command-actions'>
                    <Button color='primary' className='footer-command-button' onClick={onCommand}>
                        {command}
                    </Button>
                </div>
            </div>
        );
    }
}

export default FooterCommand;
