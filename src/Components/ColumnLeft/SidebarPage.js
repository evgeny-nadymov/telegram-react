/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Slide } from '@material-ui/core';
import './SidebarPage.css';

function SidebarPage({ children, open }) {
    return (
        <Slide direction='right' in={open} mountOnEnter unmountOnExit>
            <div className='sidebar-page'>{children}</div>
        </Slide>
    );
}

SidebarPage.propTypes = {
    open: PropTypes.bool.isRequired
};

export default SidebarPage;
