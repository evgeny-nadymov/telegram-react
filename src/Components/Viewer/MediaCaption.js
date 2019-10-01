/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './MediaCaption.css';

class MediaCaption extends React.Component {
    handleClick = event => {
        event.stopPropagation();
    };

    render() {
        const { text } = this.props;

        return (
            <div className='media-caption' onClick={this.handleClick}>
                <div className='media-caption-text'>{text}</div>
            </div>
        );
    }
}

MediaCaption.propTypes = {
    text: PropTypes.object
};

MediaCaption.defaultProps = {};

export default MediaCaption;
