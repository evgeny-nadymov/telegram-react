/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Sticker, { StickerSourceEnum } from '../Message/Media/Sticker';
import { STICKER_PREVIEW_DISPLAY_SIZE } from '../../Constants';
import TdLibController from '../../Controllers/TdLibController';
import './StickerPreview.css';

class StickerPreview extends React.Component {
    state = {
        emoji: null,
        prevPropsSticker: null
    };

    static getDerivedStateFromProps(props, state) {
        const { sticker } = props;
        const { prevPropsSticker } = state;

        if (sticker && prevPropsSticker) {
            return {
                prevPropsSticker: sticker,
                emoji: null
            };
        }

        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { sticker } = this.props;

        if (sticker && sticker !== prevProps.sticker) {
            this.loadStickerEmojis(sticker);
        }
    }

    componentDidMount() {
        const { sticker } = this.props;

        if (sticker) {
            this.loadStickerEmojis(sticker);
        }
    }

    loadStickerEmojis = sticker => {
        const { sticker: file } = sticker;
        const { id } = file;

        TdLibController.send({
            '@type': 'getStickerEmojis',
            sticker: { '@type': 'inputFileId', id }
        }).then(result => {
            if (this.props.sticker === sticker) {
                this.setState({
                    emoji: result.emojis.join(' ')
                });
            }
        });
    };

    render() {
        const { sticker } = this.props;
        const { emoji } = this.state;

        if (!sticker) return null;

        return (
            <div className='sticker-preview'>
                <div className='sticker-preview-emoji'>{emoji}</div>
                <Sticker
                    sticker={sticker}
                    displaySize={STICKER_PREVIEW_DISPLAY_SIZE}
                    source={StickerSourceEnum.PREVIEW}
                />
            </div>
        );
    }
}

StickerPreview.propTypes = {
    sticker: PropTypes.object
};

export default StickerPreview;
