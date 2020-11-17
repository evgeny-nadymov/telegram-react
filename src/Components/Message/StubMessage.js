/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './StubMessage.css';

class StubMessage extends React.Component {

    render() {

        return (
            <div className='stub-message'>
                {this.props.children}
            </div>
        );
    }

}

StubMessage.propTypes = {};

export default StubMessage;