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
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
    }

    componentWillUnmount() {
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

    render() {
        const { displaySize, openMedia, style } = this.props;
        const { thumbnail, photoSize } = this.state;

        if (!photoSize) return null;

        const src = getSrc(photoSize.photo);
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const isBlurred = isBlurredThumbnail(thumbnail);

        const fitPhotoSize = getFitSize(photoSize, displaySize);
        if (!fitPhotoSize) return null;

        const photoStyle = {
            width: fitPhotoSize.width,
            height: fitPhotoSize.height,
            ...style
        };

        return (
            <div className='photo' style={photoStyle} onClick={openMedia}>
                {src ? (
                    <img className='photo-img' draggable={false} src={src} alt='' />
                ) : (
                    <img
                        className={classNames('photo-img', { 'media-blurred': isBlurred })}
                        draggable={false}
                        src={thumbnailSrc}
                        alt=''
                    />
                )}
                <FileProgress file={photoSize.photo} download upload cancelButton />
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
    displaySize: PropTypes.number,
    style: PropTypes.object
};

Photo.defaultProps = {
    size: PHOTO_SIZE,
    thumbnailSize: PHOTO_THUMBNAIL_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default Photo;
