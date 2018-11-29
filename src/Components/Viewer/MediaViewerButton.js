/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './MediaViewer.css';

class MediaViewerButton extends React.Component {

    render() {
        const { disabled, onClick, children } = this.props;

        return (
            <div className={!disabled ? 'media-viewer-button' : 'media-viewer-button-disabled'} onClick={onClick}>
                {children}
            </div>
        );
    }
}

MediaViewerButton.propTypes = {
    disabled: PropTypes.bool
};

export default MediaViewerButton;