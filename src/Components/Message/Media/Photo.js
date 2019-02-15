/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import FileProgress from '../../Viewer/FileProgress';
import { getSize, getFitSize } from '../../../Utils/Common';
import { PHOTO_SIZE, PHOTO_DISPLAY_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Photo.css';

class Photo extends React.Component {
    constructor(props) {
        super(props);

        const { message, size } = props;
        const photoSize = getSize(message.content.photo.sizes, size);
        this.state = {
            photoSize: photoSize
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
        const { displaySize, openMedia } = this.props;
        const { photoSize } = this.state;

        if (!photoSize) return null;

        const fitPhotoSize = getFitSize(photoSize, displaySize);
        if (!fitPhotoSize) return null;

        const file = photoSize.photo;
        const blob = FileStore.getBlob(file.id) || file.blob;

        let src = '';
        try {
            src = FileStore.getBlobUrl(blob);
        } catch (error) {
            console.log(`Photo.render photo with error ${error}`);
        }

        // if (!blob && this.props.message.content.photo.sizes.length > 0)
        // {
        //     let previewSize = this.props.message.content.photo.sizes[0];
        //     if (previewSize){
        //         let previewFile = previewSize.photo;
        //         if (previewFile && previewFile.blob){
        //             className += ' photo-img-blur';
        //             try{
        //                 src = FileStore.getBlobUrl(previewFile.blob);
        //             }
        //             catch(error){
        //                 console.log(`Photo.render photo with error ${error}`);
        //             }
        //         }
        //     }
        // }

        return (
            <div className='photo' style={fitPhotoSize} onClick={openMedia}>
                <img className='photo-img' style={fitPhotoSize} src={src} alt='' />
                <FileProgress file={file} showCancel />
            </div>
        );
    }
}

Photo.propTypes = {
    message: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

Photo.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default Photo;
