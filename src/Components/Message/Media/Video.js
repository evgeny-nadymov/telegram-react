/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import FileProgress from '../../Viewer/FileProgress';
import { getFitSize, getSize } from '../../../Utils/Common';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Video.css';

class Video extends React.Component {
    constructor(props) {
        super(props);

        const { message, size } = props;
        const photoSize = {
            width: message.content.video.width,
            height: message.content.video.height
        };
        this.state = {
            photoSize: photoSize
        };
    }

    render() {
        const { displaySize, message, openMedia } = this.props;
        const { photoSize } = this.state;

        if (!photoSize) return null;

        const fitPhotoSize = getFitSize(photoSize, displaySize);
        if (!fitPhotoSize) return null;

        const { video } = message.content;
        const { thumbnail } = video;

        const file = thumbnail ? thumbnail.photo : null;
        const blob = FileStore.getBlob(file.id) || file.blob;

        let className = 'photo-img';
        let src = '';
        try {
            src = FileStore.getBlobUrl(blob);
        } catch (error) {
            console.log(`Video.render photo with error ${error}`);
        }

        return (
            <div className='photo' style={fitPhotoSize} onClick={openMedia}>
                <img className={className} style={fitPhotoSize} src={src} alt='' />
                <FileProgress file={file} showCancel />
            </div>
        );
    }
}

Video.propTypes = {
    message: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

Video.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default Video;
