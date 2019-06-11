/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Sticker from '../Message/Media/Sticker';
import { STICKER_PREVIEW_DISPLAY_SIZE } from '../../Constants';
import './StickerPreview.css';

class StickerPreview extends React.Component {
    state = {
        emoji: null
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.sticker !== prevProps.sticker) {
        }
    }

    render() {
        const { sticker } = this.props;
        const { emoji } = this.state;

        if (!sticker) return null;

        return (
            <div className='sticker-preview'>
                <div className='sticker-preview-emoji'>{emoji}</div>
                <Sticker sticker={sticker} displaySize={STICKER_PREVIEW_DISPLAY_SIZE} />
            </div>
        );
    }
}

StickerPreview.propTypes = {
    sticker: PropTypes.object.isRequired
};

export default StickerPreview;
