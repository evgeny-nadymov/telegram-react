/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { getFitSize } from '../../../Utils/Common';
import { getSrc } from '../../../Utils/File';
import { STICKER_DISPLAY_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Sticker.css';

class Sticker extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.on('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.removeListener('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
    }

    onClientUpdateStickerBlob = update => {
        const { sticker } = this.props.sticker;
        const { fileId } = update;

        if (!sticker) return;

        if (sticker.id === fileId) {
            this.forceUpdate();
        }
    };

    onClientUpdateStickerThumbnailBlob = update => {
        const { thumbnail } = this.props.sticker;
        if (!thumbnail) return;

        const { fileId } = update;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { className, displaySize, blur, sticker: source, style, openMedia, preview } = this.props;
        const { thumbnail, sticker, width, height } = source;

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const src = getSrc(sticker);
        const isBlurred = isBlurredThumbnail(thumbnail);

        const fitSize = getFitSize({ width: width, height: height }, displaySize);
        if (!fitSize) return null;

        const stickerStyle = {
            width: fitSize.width,
            height: fitSize.height,
            ...style
        };

        return (
            <div className={classNames('sticker', className)} style={stickerStyle} onClick={openMedia}>
                {src && !preview ? (
                    <img className='sticker-image' draggable={false} src={src} alt='' />
                ) : (
                    <img
                        className={classNames('sticker-image', { 'media-blurred': isBlurred && blur })}
                        draggable={false}
                        src={thumbnailSrc}
                        alt=''
                    />
                )}
            </div>
        );
    }
}

Sticker.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    sticker: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
    blur: PropTypes.bool,
    displaySize: PropTypes.number
};

Sticker.defaultProps = {
    chatId: 0,
    messageId: 0,
    openMedia: () => {},
    blur: true,
    displaySize: STICKER_DISPLAY_SIZE
};

export default Sticker;
