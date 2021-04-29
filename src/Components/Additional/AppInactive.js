/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@material-ui/core/Button/Button';
import './AppInactive.css';

class AppInactive extends React.Component {
    static handleReload() {
        window.location.reload();
    }

    render() {
        return (
            <div className='app-inactive'>
                <div className='app-inactive-wrapper'>
                    <img
                        className='app-inactive-image'
                        src='Manytabs_2x.png'
                        alt=''
                        onClick={AppInactive.handleReload}
                    />
                    <h3 className='app-inactive-title'>Error: Too many active instances.</h3>
                    <div className='app-inactive-description'>
                        You can run only one active instance of the app.
                        <br />
                        Please, reload this page to continue using Telegram Web, or otherwise, close it.
                    </div>
                    <div className='app-inactive-actions'>
                        <Button color='primary' onClick={AppInactive.handleReload}>
                            Reload app
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default AppInactive;
