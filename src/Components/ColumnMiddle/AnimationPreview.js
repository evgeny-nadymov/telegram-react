/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Animation from '../Message/Media/Animation';
import './StickerPreview.css';

class AnimationPreview extends React.Component {
    render() {
        const { animation } = this.props;
        if (!animation) return null;

        return (
            <div className='sticker-preview'>
                <Animation
                    type='preview'
                    stretch={true}
                    animation={animation}
                    style={{ borderRadius: 0 }}
                />
            </div>
        );
    }
}

AnimationPreview.propTypes = {
    animation: PropTypes.object
};

export default AnimationPreview;
