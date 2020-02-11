/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Button from '@material-ui/core/Button';
import { isIOS, isWindowsPhone } from '../../Utils/Common';
import './NativeApp.css';

class NativeApp extends React.Component {
    static handleInstall = () => {
        if (isIOS()) {
            window.location.href = 'https://telegram.org/dl/ios';
        } else if (isWindowsPhone()) {
            window.location.href = 'https://telegram.org/dl/wp';
        } else {
            window.location.href = 'https://telegram.org/dl/android';
        }
    };

    render() {
        let src = 'Android_2x.jpg';
        if (isIOS()) {
            src = 'iOS_2x.jpg';
        } else if (isWindowsPhone()) {
            src = 'WP_2x.jpg';
        }

        return (
            <div className='app-inactive'>
                <div className='app-inactive-wrapper'>
                    <img src={src} alt='' className='app-inactive-image' onClick={NativeApp.handleInstall} />
                    <h3 className='app-inactive-title'>Work is in progress!</h3>
                    <div className='app-inactive-description'>
                        This client has not been optimized for mobile devices yet.
                        <br />
                        Please consider using our native mobile app.
                    </div>
                    <div className='app-inactive-actions'>
                        <Button color='primary' onClick={NativeApp.handleInstall}>
                            Install app
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default NativeApp;
