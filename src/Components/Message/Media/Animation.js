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
import { getFileSize, isGifMimeType } from '../../../Utils/File';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Animation.css';

class Animation extends React.Component {
    constructor(props) {
        super(props);

        const { message } = props;
        const { animation } = message.content;

        this.state = {
            width: animation.width,
            height: animation.height,
            thumbnail: animation.thumbnail,
            animation: animation.animation,
            mimeType: animation.mimeType,
            active: true
        };
    }

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

        const active = message && chatId === message.chat_id && message.id === messageId;
    };

    onClientUpdateAnimationBlob = update => {
        const { animation } = this.state;
        const { fileId } = update;

        if (!animation) return;

        if (animation.id === fileId) {
            this.setState({ active: true });
            //this.forceUpdate();
        }
    };

    onClientUpdateAnimationThumbnailBlob = update => {
        const { thumbnail } = this.state;
        const { fileId } = update;

        if (!thumbnail) return;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    getSrc = file => {
        const blob = file ? FileStore.getBlob(file.id) || file.blob : null;

        return FileStore.getBlobUrl(blob) || '';
    };

    handleStopAnimation = e => {
        e.stopPropagation();

        this.setState({ active: !this.state.active });
    };

    handleStartAnimation = e => {
        //e.stopPropagation();

        const { animation } = this.state;

        const animationSrc = this.getSrc(animation);
        this.setState({ active: Boolean(animationSrc) });
    };

    render() {
        const { displaySize, openMedia, message, t } = this.props;
        const { thumbnail, animation, mimeType, active } = this.state;

        const fitPhotoSize = getFitSize(thumbnail, displaySize);
        if (!fitPhotoSize) return null;

        const thumbnailSrc = this.getSrc(thumbnail ? thumbnail.photo : null);
        const isBlurred = isBlurredThumbnail(thumbnail);

        const isGif = isGifMimeType(mimeType);
        const animationSrc = this.getSrc(animation);

        return (
            <div className='animation' style={fitPhotoSize} onClick={openMedia}>
                {animationSrc && active ? (
                    isGif ? (
                        <img
                            className='media-viewer-content-image'
                            style={fitPhotoSize}
                            src={animationSrc}
                            alt=''
                            width={fitPhotoSize.width}
                            height={fitPhotoSize.height}
                        />
                    ) : (
                        <video
                            className='media-viewer-content-image'
                            src={animationSrc}
                            poster={thumbnailSrc}
                            autoPlay
                            loop
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
                            onClick={this.handleStartAnimation}
                        />
                        <div className='animation-play'>{t('AttachGif')}</div>
                        <div className='animation-meta'>{getFileSize(message.content.animation.animation)}</div>
                    </>
                )}
            </div>
        );
    }
}

Animation.propTypes = {
    message: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

Animation.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default withNamespaces()(Animation);
