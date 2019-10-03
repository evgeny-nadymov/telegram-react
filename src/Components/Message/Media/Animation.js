/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import FileProgress from '../../Viewer/FileProgress';
import { getFitSize } from '../../../Utils/Common';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { getFileSize, getSrc, isGifMimeType } from '../../../Utils/File';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import AppStore from '../../../Stores/ApplicationStore';
import FileStore from '../../../Stores/FileStore';
import InstantViewStore from '../../../Stores/InstantViewStore';
import MessageStore from '../../../Stores/MessageStore';
import './Animation.css';

class Animation extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();

        this.setPlayerParams();
    }

    setPlayerParams() {
        this.windowFocused = window.hasFocus;

        this.inView = false;
        this.openMediaViewer = Boolean(AppStore.mediaViewerContent);
        this.openProfileMediaViewer = Boolean(AppStore.profileMediaViewerContent);
        this.openIV = Boolean(InstantViewStore.getCurrent());

        this.ivInView = false;
        this.openIVMedia = Boolean(InstantViewStore.viewerContent);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.animation !== this.props.animation) {
            this.setPlayerParams();
        }
    }

    componentDidMount() {
        FileStore.on('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.on('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        AppStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        InstantViewStore.on('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        InstantViewStore.on('clientUpdateInstantViewViewerContent', this.onClientUpdateInstantViewViewerContent);
        InstantViewStore.on('clientUpdateBlocksInView', this.onClientUpdateBlocksInView);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.removeListener('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        AppStore.removeListener('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.removeListener('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.removeListener('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        MessageStore.removeListener('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        InstantViewStore.removeListener('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        InstantViewStore.removeListener(
            'clientUpdateInstantViewViewerContent',
            this.onClientUpdateInstantViewViewerContent
        );
        InstantViewStore.removeListener('clientUpdateBlocksInView', this.onClientUpdateBlocksInView);
    }

    startStopPlayer = () => {
        const player = this.videoRef.current;
        if (player) {
            if (
                this.windowFocused &&
                ((this.inView && !this.openMediaViewer && !this.openProfileMediaViewer && !this.openIV) ||
                    (this.ivInView && !this.openIVMedia))
            ) {
                player.play();
            } else {
                player.pause();
            }
        }
    };

    onClientUpdateInstantViewContent = update => {
        this.openIV = Boolean(InstantViewStore.getCurrent());

        this.startStopPlayer();
    };

    onClientUpdateProfileMediaViewerContent = update => {
        this.openProfileMediaViewer = Boolean(AppStore.profileMediaViewerContent);

        this.startStopPlayer();
    };

    onClientUpdateMediaViewerContent = update => {
        this.openMediaViewer = Boolean(AppStore.mediaViewerContent);

        this.startStopPlayer();
    };

    onClientUpdateInstantViewViewerContent = update => {
        this.openIVMedia = Boolean(InstantViewStore.viewerContent);

        this.startStopPlayer();
    };

    onClientUpdateFocusWindow = update => {
        this.windowFocused = update.focused;

        this.startStopPlayer();
    };

    onClientUpdateMessagesInView = update => {
        const { chatId, messageId } = this.props;
        const key = `${chatId}_${messageId}`;

        this.inView = update.messages.has(key);

        this.startStopPlayer();
    };

    onClientUpdateBlocksInView = update => {
        const { pageBlock } = this.props;
        if (!pageBlock) return;

        this.ivInView = update.blocks.has(pageBlock);

        this.startStopPlayer();
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
        const { displaySize, openMedia, t, style } = this.props;
        const { thumbnail, animation, mime_type, width, height } = this.props.animation;

        const fitPhotoSize = getFitSize({ width, height } || thumbnail, displaySize, false);
        if (!fitPhotoSize) return null;

        const animationStyle = {
            width: fitPhotoSize.width,
            height: fitPhotoSize.height,
            ...style
        };

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const src = getSrc(animation);

        const isBlurred = isBlurredThumbnail(thumbnail);
        const isGif = isGifMimeType(mime_type);

        return (
            <div className='animation' style={animationStyle} onClick={openMedia}>
                {src ? (
                    isGif ? (
                        <img className='animation-preview' src={src} alt='' />
                    ) : (
                        <video
                            ref={this.videoRef}
                            className='media-viewer-content-animation'
                            src={src}
                            poster={thumbnailSrc}
                            muted
                            autoPlay
                            loop
                            playsInline
                            width={animationStyle.width}
                            height={animationStyle.height}
                        />
                    )
                ) : (
                    <>
                        <img
                            className={classNames('animation-preview', { 'media-blurred': isBlurred })}
                            src={thumbnailSrc}
                            alt=''
                        />
                        <div className='animation-meta'>{getFileSize(animation)}</div>
                    </>
                )}
                <FileProgress
                    file={animation}
                    download
                    upload
                    cancelButton
                    icon={<div className='animation-play'>{t('AttachGif')}</div>}
                />
            </div>
        );
    }
}

Animation.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    pageBlock: PropTypes.object,
    animation: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
    size: PropTypes.number,
    displaySize: PropTypes.number,
    iv: PropTypes.bool
};

Animation.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE,
    iv: false
};

export default withTranslation()(Animation);
