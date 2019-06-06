/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import packageJson from '../../package.json';
import './Footer.css';

class Footer extends React.PureComponent {
    render() {
        return (
            <div className='footer-wrapper'>
                <span>{packageJson.version}</span>
            </div>
        );
    }
}

export default Footer;
