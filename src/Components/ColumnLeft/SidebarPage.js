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

const pages = [];
document.addEventListener('keydown', event => {
    // console.log('[sp] esc', pages);
    if (!pages.length) return;

    switch (event.key) {
        case 'Escape':
            const page = pages[pages.length - 1];
            if (page) {
                event.preventDefault();
                event.stopPropagation();

                const { onClose } = page.props;
                if (onClose) onClose();
            }
            break;
    }
});

class SidebarPage extends React.Component {
    componentDidUpdate(prevProps, prevState, snapshot) {
        const { open } = this.props;

        if (prevProps.open !== open) {
            if (open) {
                // console.log('[sp] push', this);
                pages.push(this);
            } else {
                // console.log('[sp] pop', this);
                const index = pages.indexOf(this);
                pages.splice(index, 1);
            }
        }
    }

    render() {
        const { children, open, onClose } = this.props;

        return (
            <Slide direction='right' in={open} mountOnEnter unmountOnExit>
                <div className='sidebar-page'>{onClose ? React.cloneElement(children, { onClose }) : children}</div>
            </Slide>
        );
    }
}

SidebarPage.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func
};

export default SidebarPage;
