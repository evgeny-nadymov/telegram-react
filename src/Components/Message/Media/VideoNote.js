/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import FileProgress from '../../Viewer/FileProgress';
import { getFileSize, getSrc } from '../../../Utils/File';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { getVideoDurationString } from '../../../Utils/Common';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import './VideoNote.css';

class VideoNote extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.on('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);
        FileStore.on('clientUpdateActiveVideoNote', this.onClientUpdateActiveVideoNote);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.removeListener('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);
        FileStore.removeListener('clientUpdateActiveVideoNote', this.onClientUpdateActiveVideoNote);
    }

    onClientUpdateActiveVideoNote = update => {
        const { message } = this.props;
        const { chatId, messageId } = update;
    };

    onClientUpdateVideoNoteBlob = update => {
        const { video } = this.props.videoNote;
        const { fileId } = update;

        if (!video) return;

        if (video.id === fileId) {
            this.forceUpdate();
        }
    };

    onClientUpdateVideoNoteThumbnailBlob = update => {
        const { thumbnail } = this.props.videoNote;
        if (!thumbnail) return;

        const { fileId } = update;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { displaySize, chatId, messageId, openMedia } = this.props;
        const { thumbnail, video, duration } = this.props.videoNote;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const fitPhotoSize = { width: 200, height: 200 };
        if (!fitPhotoSize) return null;

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const src = getSrc(video);

        const isBlurred = isBlurredThumbnail(thumbnail);

        return (
            <div className='video-note' style={fitPhotoSize} onClick={openMedia}>
                {src ? (
                    <video
                        className={classNames('media-viewer-content-image', 'video-note-round')}
                        src={src}
                        poster={thumbnailSrc}
                        muted
                        autoPlay
                        loop
                        playsInline
                        width={fitPhotoSize.width}
                        height={fitPhotoSize.height}
                    />
                ) : (
                    <>
                        <div className='video-note-round'>
                            <img
                                className={classNames('animation-preview', { 'animation-preview-blurred': isBlurred })}
                                style={fitPhotoSize}
                                src={thumbnailSrc}
                                alt=''
                            />
                        </div>
                        <div className='animation-meta'>
                            {getVideoDurationString(duration) + ' ' + getFileSize(video)}
                        </div>
                    </>
                )}
                <FileProgress file={video} showDownload={false} showCancel />
            </div>
        );
    }
}

VideoNote.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    videoNote: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

VideoNote.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default VideoNote;
