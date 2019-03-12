/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withNamespaces } from 'react-i18next';
import FileProgress from '../../Viewer/FileProgress';
import { getFitSize } from '../../../Utils/Common';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { getFileSize, getSrc, isGifMimeType } from '../../../Utils/File';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Animation.css';

class Animation extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.on('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        FileStore.on('clientUpdateActiveAnimation', this.onClientUpdateActiveAnimation);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.removeListener('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        FileStore.removeListener('clientUpdateActiveAnimation', this.onClientUpdateActiveAnimation);
    }

    onClientUpdateActiveAnimation = update => {
        const { message } = this.props;
        const { chatId, messageId } = update;
    };

    onClientUpdateAnimationBlob = update => {
        const { animation } = this.props.animation;
        const { fileId } = update;

        if (!animation) return;

        if (animation.id === fileId) {
            this.forceUpdate();
        }
    };

    onClientUpdateAnimationThumbnailBlob = update => {
        const { thumbnail } = this.props.animation;
        if (!thumbnail) return;

        const { fileId } = update;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { displaySize, openMedia, t } = this.props;
        const { thumbnail, animation, mime_type, width, height } = this.props.animation;

        const fitPhotoSize = getFitSize(thumbnail || { width: width, height: height }, displaySize);
        if (!fitPhotoSize) return null;

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const src = getSrc(animation);

        const isBlurred = isBlurredThumbnail(thumbnail);
        const isGif = isGifMimeType(mime_type);

        return (
            <div className='animation' style={fitPhotoSize} onClick={openMedia}>
                {src ? (
                    isGif ? (
                        <img className='media-viewer-content-image' style={fitPhotoSize} src={src} alt='' />
                    ) : (
                        <video
                            className='media-viewer-content-image'
                            src={src}
                            poster={thumbnailSrc}
                            muted
                            autoPlay
                            loop
                            playsInline
                            width={fitPhotoSize.width}
                            height={fitPhotoSize.height}
                        />
                    )
                ) : (
                    <>
                        <img
                            className={classNames('animation-preview', { 'animation-preview-blurred': isBlurred })}
                            style={fitPhotoSize}
                            src={thumbnailSrc}
                            alt=''
                        />
                        <div className='animation-meta'>{getFileSize(animation)}</div>
                    </>
                )}
                <FileProgress file={animation}>
                    <div className='animation-play'>{t('AttachGif')}</div>
                </FileProgress>
            </div>
        );
    }
}

Animation.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    animation: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

Animation.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default withNamespaces()(Animation);
