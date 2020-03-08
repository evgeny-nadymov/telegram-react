/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Sidebar.css';

class Sidebar extends React.Component {
    render() {
        const { children } = this.props;

        return <div className='sidebar'>{children}</div>;
    }
}

Sidebar.propTypes = {};

export default Sidebar;
