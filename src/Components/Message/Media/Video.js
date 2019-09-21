/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { getFitSize, getDurationString } from '../../../Utils/Common';
import { getFileSize } from '../../../Utils/File';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Video.css';

class Video extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    onClientUpdateVideoThumbnailBlob = update => {
        const { thumbnail } = this.props.video;
        const { fileId } = update;

        if (!thumbnail) return;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { displaySize, openMedia, style } = this.props;
        const { thumbnail, video, width, height, duration } = this.props.video;

        const fitPhotoSize = getFitSize(thumbnail || { width: width, height: height }, displaySize);
        if (!fitPhotoSize) return null;

        const videoStyle = {
            width: fitPhotoSize.width,
            height: fitPhotoSize.height,
            ...style
        };

        const file = thumbnail ? thumbnail.photo : null;
        const blob = file ? FileStore.getBlob(file.id) || file.blob : null;
        const src = FileStore.getBlobUrl(blob);
        const isBlurred = isBlurredThumbnail(thumbnail);

        return (
            <div className='video' style={videoStyle} onClick={openMedia}>
                <img className={classNames('video-preview', { 'media-blurred': isBlurred })} src={src} alt='' />
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
    openMedia: PropTypes.func.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

Video.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default Video;
