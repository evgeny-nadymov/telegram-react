/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes, { number } from 'prop-types';
import { Slide } from '@material-ui/core';
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import { modalManager } from '../../Utils/Modal';
import './SidebarPage.css';

class SidebarPage extends React.Component {
    constructor(props) {
        super(props);

        this.keyboardHandler = new KeyboardHandler(this.handleKeyDown);
    }

    handleKeyDown = event => {
        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        switch (event.key) {
            case 'Escape':
                const { onClose } = this.props;
                if (onClose) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.target.blur();

                    onClose();
                }
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
        const { children, open, timeout, onClose } = this.props;

        return (
            <Slide direction='right' in={open} timeout={timeout} mountOnEnter unmountOnExit>
                <div className='sidebar-page'>{onClose ? React.cloneElement(children, { onClose }) : children}</div>
            </Slide>
        );
    }
}

SidebarPage.propTypes = {
    open: PropTypes.bool.isRequired,
    timeout: PropTypes.oneOfType([PropTypes.object, PropTypes.number]),
    onClose: PropTypes.func
};

export default SidebarPage;
