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
import { getSize, getFitSize } from '../../../Utils/Common';
import { getSrc } from '../../../Utils/File';
import { PHOTO_SIZE, PHOTO_DISPLAY_SIZE, PHOTO_THUMBNAIL_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Photo.css';
import { isBlurredThumbnail } from '../../../Utils/Media';

class Photo extends React.Component {
    constructor(props) {
        super(props);

        const { photo, size, thumbnailSize } = props;
        const photoSize = getSize(photo.sizes, size);
        const thumbnail = getSize(photo.sizes, thumbnailSize);

        this.state = {
            photoSize: photoSize,
            thumbnail: thumbnail
        };
    }

    componentDidMount() {
        FileStore.on('clientUpdatePhotoThumbnailBlob', this.onClientUpdatePhotoThumbnailBlob);
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdatePhotoThumbnailBlob', this.onClientUpdatePhotoThumbnailBlob);
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
    }

    onClientUpdatePhotoBlob = update => {
        const { photoSize } = this.state;
        const { fileId } = update;

        if (!photoSize) return;

        if (photoSize.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    onClientUpdatePhotoThumbnailBlob = update => {
        const { thumbnail } = this.state;
        const { fileId } = update;

        if (!thumbnail) return;

        if (thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { displaySize, openMedia } = this.props;
        const { thumbnail, photoSize } = this.state;

        if (!photoSize) return null;

        const src = getSrc(photoSize.photo);
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const isBlurred = isBlurredThumbnail(thumbnail);

        const fitPhotoSize = getFitSize(photoSize, displaySize);
        if (!fitPhotoSize) return null;

        const style = {
            width: fitPhotoSize.width,
            height: fitPhotoSize.height
        };

        return (
            <div className='photo' style={style} onClick={openMedia}>
                {src ? (
                    <img className='photo-img' draggable={false} style={style} src={src} alt='' />
                ) : (
                    <img
                        className={classNames('photo-img', { 'media-blurred': isBlurred })}
                        draggable={false}
                        style={style}
                        src={thumbnailSrc}
                        alt=''
                    />
                )}
                <FileProgress file={photoSize.photo} cancelButton />
            </div>
        );
    }
}

Photo.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    photo: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,

    size: PropTypes.number,
    thumbnailSize: PropTypes.number,
    displaySize: PropTypes.number
};

Photo.defaultProps = {
    size: PHOTO_SIZE,
    thumbnailSize: PHOTO_THUMBNAIL_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default Photo;
