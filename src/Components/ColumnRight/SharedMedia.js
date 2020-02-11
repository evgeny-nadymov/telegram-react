/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SharedMediaHeader from './SharedMediaHeader';
import './SharedMedia.css';

class SharedMedia extends React.Component {
    state = {
        value: 0
    };

    handleChange = (event, value) => {
        this.setState({ value });
    };

    render() {
        const { onClose, popup } = this.props;
        const { value } = this.state;

        const content = (
            <>
                <SharedMediaHeader close={onClose} />
                <Tabs
                    value={value}
                    onChange={this.handleChange}
                    indicatorColor='primary'
                    textColor='primary'
                    scrollable
                    scrollButtons='off'
                    fullWidth>
                    <Tab label='Media' style={{ minWidth: '40px' }} />
                    <Tab label='Docs' style={{ minWidth: '40px' }} />
                    <Tab label='Links' style={{ minWidth: '40px' }} />
                    <Tab label='Audio' style={{ minWidth: '40px' }} />
                </Tabs>
            </>
        );

        return popup ? <>{content}</> : <div className='shared-media'>{content}</div>;
    }
}

SharedMedia.propTypes = {
    chatId: PropTypes.number.isRequired,
    onClose: PropTypes.func.isRequired,
    popup: PropTypes.bool,
    minHeight: PropTypes.number
};

SharedMedia.defaultProps = {
    popup: false,
    minHeight: 0
};

export default SharedMedia;
