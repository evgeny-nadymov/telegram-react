/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/Clear';
import Sticker, { StickerSourceEnum } from '../Message/Media/Sticker';
import { STICKER_SMALL_DISPLAY_SIZE } from '../../Constants';
import './StickerSet.css';

class StickerSet extends React.Component {
    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { info } = this.props;

        if (info !== nextProps.info) {
            return true;
        }

        return false;
    }

    render() {
        const { info, onSelect, onMouseDown, onMouseEnter, onDeleteClick } = this.props;
        if (!info) return null;

        const { title, stickers } = info;

        const items = stickers.map((x, i) => (
            <div
                className='sticker-set-item'
                key={x.sticker.id}
                data-sticker-id={x.sticker.id}
                onClick={() => onSelect(x)}
                onMouseEnter={onMouseEnter}
                onMouseDown={onMouseDown}
                style={{
                    width: STICKER_SMALL_DISPLAY_SIZE,
                    height: STICKER_SMALL_DISPLAY_SIZE
                }}>
                <Sticker
                    key={x.sticker.id}
                    sticker={x}
                    autoplay={false}
                    blur={false}
                    displaySize={STICKER_SMALL_DISPLAY_SIZE}
                    preview
                    source={StickerSourceEnum.PICKER}
                />
            </div>
        ));

        return (
            <div className='sticker-set'>
                <div className='sticker-set-title'>
                    <div className='sticker-set-title-wrapper'>
                        <span>{title}</span>
                    </div>
                    {onDeleteClick && (
                        <IconButton
                            aria-label='delete'
                            classes={{ root: 'sticker-set-icon-root' }}
                            size='small'
                            onClick={onDeleteClick}>
                            <ClearIcon fontSize='inherit' />
                        </IconButton>
                    )}
                </div>
                <div className='sticker-set-content'>{items}</div>
            </div>
        );
    }
}

StickerSet.propTypes = {
    info: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func.isRequired,
    onDeleteClick: PropTypes.func
};

export default StickerSet;
