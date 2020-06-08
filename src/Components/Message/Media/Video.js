/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PlayArrowIcon from '../../../Assets/Icons/PlayArrow';
import { getFitSize, getDurationString } from '../../../Utils/Common';
import { getFileSize, getSrc } from '../../../Utils/File';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Video.css';

class Video extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    onClientUpdateVideoThumbnailBlob = update => {
        const { thumbnail } = this.props.video;
        const { fileId } = update;

        if (!thumbnail) return;

        const { file } = thumbnail;
        if (file && file.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { displaySize, openMedia, title, caption, type, style } = this.props;
        const { minithumbnail, thumbnail, video, width, height, duration } = this.props.video;

        const fitPhotoSize = getFitSize({ width, height } || thumbnail, displaySize);
        if (!fitPhotoSize) return null;

        const videoStyle = {
            width: fitPhotoSize.width,
            height: fitPhotoSize.height,
            ...style
        };

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.file : null);
        const isBlurred = thumbnailSrc ? isBlurredThumbnail(thumbnail) : Boolean(miniSrc);

        return (
            <div
                className={classNames('video', {
                    'video-big': type === 'message',
                    'video-title': title,
                    'video-caption': caption,
                    pointer: openMedia
                })}
                style={videoStyle}
                onClick={openMedia}>
                <img
                    className={classNames('video-preview', {
                        'media-blurred': isBlurred,
                        'media-mini-blurred': !thumbnailSrc && isBlurred
                    })}
                    src={thumbnailSrc || miniSrc}
                    alt=''
                />
                <div className='video-play'>
                    <PlayArrowIcon />
                </div>
                <div className='video-meta'>{getDurationString(duration) + ' ' + getFileSize(video)}</div>
            </div>
        );
    }
}

Video.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    video: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

Video.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default Video;
