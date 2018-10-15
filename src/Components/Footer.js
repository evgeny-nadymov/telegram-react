/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import packageJson from '../../package.json';
import TdLibController from '../Controllers/TdLibController';
import './Footer.css'

class Footer extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            authState: TdLibController.getState()
        };

        this.onStatusUpdated = this.onStatusUpdated.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState !== this.state){
            return true;
        }

        return false;
    }

    componentDidMount(){
        TdLibController.on("tdlib_status", this.onStatusUpdated);
    }

    componentWillUnmount(){
        TdLibController.removeListener("tdlib_status", this.onStatusUpdated);
    }

    onStatusUpdated(payload) {
        this.setState({ authState: payload});
    }

    render() {
        const status = this.state.authState? this.state.authState.status : 'null';

        return (
            <div className='footer-wrapper'>
                <span>
                    {packageJson.version}
                </span>
            </div>
        );
    }
}

export default Footer;