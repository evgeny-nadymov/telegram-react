/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Sticker from '../Message/Media/Sticker';
import { loadStickerContent } from '../../Utils/File';
import { STICKER_HINT_DISPLAY_SIZE, STICKER_SMALL_DISPLAY_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import './StickerSet.css';

class StickerSet extends React.Component {
    componentDidMount() {
        this.loadContent();
    }

    loadContent = () => {
        const { info } = this.props;
        if (!info) return;

        const { stickers } = info;
        if (!stickers) return;

        const store = FileStore.getStore();
        stickers.forEach(x => {
            loadStickerContent(store, x, null);
        });
    };

    render() {
        const { info, onSelect } = this.props;
        if (!info) return null;

        const { title, stickers } = info;

        const items = stickers.map(x => (
            <div
                className='sticker-set-item'
                key={x.sticker.id}
                data-sticker-id={x.sticker.id}
                style={{ width: STICKER_SMALL_DISPLAY_SIZE, height: STICKER_SMALL_DISPLAY_SIZE }}
                onClick={() => onSelect(x)}>
                <Sticker
                    key={x.sticker.id}
                    className='sticker-set-item-sticker'
                    sticker={x}
                    displaySize={STICKER_SMALL_DISPLAY_SIZE}
                    blur={false}
                />
            </div>
        ));

        return (
            <div className='sticker-set'>
                <div className='sticker-set-title'>
                    <span>{title}</span>
                </div>
                <div className='sticker-set-content'>{items}</div>
            </div>
        );
    }
}

StickerSet.propTypes = {
    info: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default StickerSet;
