/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Slide } from '@material-ui/core';
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import './SidebarPage.css';

class SidebarPage extends React.Component {
    constructor(props) {
        super(props);

        this.keyboardHandler = new KeyboardHandler(this.handleKeyDown);
    }

    handleKeyDown = event => {
        event.preventDefault();
        event.stopPropagation();
        event.target.blur();

        switch (event.key) {
            case 'Escape':
                const { onClose } = this.props;
                if (onClose) onClose();
                break;
        }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { open } = this.props;

        if (prevProps.open !== open) {
            if (open) {
                KeyboardManager.add(this.keyboardHandler);
            } else {
                KeyboardManager.remove(this.keyboardHandler);
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
