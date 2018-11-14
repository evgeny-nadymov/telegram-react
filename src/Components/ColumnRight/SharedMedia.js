/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SharedMediaHeaderControl from './SharedMediaHeaderControl';
import './SharedMedia.css'

class SharedMedia extends React.Component {
    state = {
        value: 0
    };

    handleChange = (event, value) => {
        this.setState({ value });
    };

    render() {
        const { close } = this.props;
        const { value } = this.state;

        return (
            <div className='shared-media'>
                <SharedMediaHeaderControl close={close}/>
                <Tabs
                    value={value}
                    onChange={this.handleChange}
                    indicatorColor='primary'
                    textColor='primary'
                    scrollable
                    scrollButtons='off'
                    fullWidth>
                    <Tab label='Media' style={{minWidth: '40px'}}/>
                    <Tab label='Docs'  style={{minWidth: '40px'}}/>
                    <Tab label='Links'  style={{minWidth: '40px'}}/>
                    <Tab label='Audio'  style={{minWidth: '40px'}}/>
                </Tabs>
            </div>
        );
    }
}

export default SharedMedia;