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
import { compose, withRestoreRef, withSaveRef } from '../../../Utils/HOC';
import FileProgress from '../../Viewer/FileProgress';
import { getFitSize, getPhotoSize } from '../../../Utils/Common';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { getFileSize, getSrc, isGifMimeType } from '../../../Utils/File';
import { PHOTO_DISPLAY_SIZE } from '../../../Constants';
import AnimationStore from '../../../Stores/AnimationStore';
import AppStore from '../../../Stores/ApplicationStore';
import FileStore from '../../../Stores/FileStore';
import InstantViewStore from '../../../Stores/InstantViewStore';
import MessageStore from '../../../Stores/MessageStore';
import './Animation.css';

class Animation extends React.Component {
    constructor(props) {
        super(props);

        this.state = { };
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
        this.playing = false;

        const player = this.videoRef.current;
        if (player) {
            player.load();
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.animation !== this.props.animation) {
            this.setPlayerParams();
        }
    }

    componentDidMount() {
        AnimationStore.on('clientUpdateAnimationsInView', this.onClientUpdateAnimationsInView);
        AppStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        FileStore.on('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.on('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        InstantViewStore.on('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        InstantViewStore.on('clientUpdateInstantViewViewerContent', this.onClientUpdateInstantViewViewerContent);
        InstantViewStore.on('clientUpdateBlocksInView', this.onClientUpdateBlocksInView);
    }

    componentWillUnmount() {
        AnimationStore.on('clientUpdateAnimationsInView', this.onClientUpdateAnimationsInView);
        AppStore.off('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.off('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        FileStore.off('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.off('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        MessageStore.off('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        InstantViewStore.off('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        InstantViewStore.off('clientUpdateInstantViewViewerContent', this.onClientUpdateInstantViewViewerContent);
        InstantViewStore.off('clientUpdateBlocksInView', this.onClientUpdateBlocksInView);
    }

    startStopPlayer = () => {
        const player = this.videoRef.current;
        if (!player) return;

        if (
            this.windowFocused &&
            ((this.inView && !this.openMediaViewer && !this.openProfileMediaViewer && !this.openIV) ||
                (this.ivInView && !this.openIVMedia) ||
                this.pickerInView)
        ) {
            player.play();
        } else {
            player.pause();
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

    onClientUpdateAnimationsInView = update => {
        const { animation } = this.props;
        if (!animation) return;

        this.pickerInView = update.animations.has(animation);

        this.startStopPlayer();
    }

    onClientUpdateAnimationBlob = update => {
        const { animation } = this.props.animation;
        const { fileId } = update;

        if (!animation) return;

        if (animation.id === fileId) {
            this.forceUpdate(() => {
                this.startStopPlayer();
            });
        }
    };

    onClientUpdateAnimationThumbnailBlob = update => {
        const { thumbnail } = this.props.animation;
        if (!thumbnail) return;

        const { fileId } = update;

        const { file } = thumbnail;
        if (file && file.id === fileId) {
            this.forceUpdate();
        }
    };

    handlePlay = () => {
        // setTimeout(() => {
        //     this.playing = true;
        //     this.forceUpdate();
        // }, 300);
    };

    handleTimeUpdate = () => {
        if (!this.playing) {
            this.playing = true;
            this.forceUpdate();
        }
    }

    render() {
        const { displaySize, stretch, openMedia, t, title, caption, type, style, showProgress } = this.props;
        const { minithumbnail, thumbnail, animation, mime_type, width, height } = this.props.animation;
        const { playing } = this;

        const sizes = [...(thumbnail ? [thumbnail] : []), { width, height }];
        const photoSize = getPhotoSize(sizes, displaySize);
        const fitPhotoSize = getFitSize(photoSize, displaySize, stretch);
        if (!fitPhotoSize) return null;

        const animationStyle = {
            background: 'black',
            minWidth: stretch ? fitPhotoSize.width : null,
            width: !stretch ? fitPhotoSize.width : null,
            height: fitPhotoSize.height,
            ...style
        };

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.file : null);
        const isVideoThumbnail = thumbnail && thumbnail.format['@type'] === 'thumbnailFormatMpeg4';
        const isBlurred = isBlurredThumbnail(thumbnail, displaySize);

        const src = getSrc(animation);
        const isGif = isGifMimeType(mime_type);
        const source = src ? <source src={src} type={mime_type}/> : null;

        return (
            <div
                className={classNames('animation', {
                    'animation-message': type === 'message',
                    'animation-picker': type === 'picker',
                    'animation-iv': type === 'iv',
                    'animation-title': title,
                    'media-title': title,
                    'animation-caption': caption,
                    pointer: openMedia
                })}
                style={animationStyle}
                onClick={openMedia}>
                    {miniSrc && (
                        <img
                            className={classNames('video-preview', 'media-mini-blurred')}
                            src={miniSrc}
                            alt=''
                        />
                    )}
                    {src && (
                        isGif ? (
                            <img className='animation-preview' src={src} alt='' />
                        ) : (
                            <video
                                ref={this.videoRef}
                                className='animation-player'
                                muted
                                autoPlay={type !== 'picker'}
                                loop
                                playsInline
                                width={animationStyle.width}
                                height={animationStyle.height}
                                onPlay={this.handlePlay}
                                onTimeUpdate={this.handleTimeUpdate}
                            >
                                {source}
                            </video>
                        )
                    )}
                    { !playing && (
                        <>
                            { thumbnailSrc && (
                                <>
                                    { isVideoThumbnail ? (
                                        <video
                                            className={classNames('animation-thumbnail', { 'media-blurred': isBlurred })}
                                            autoPlay={false}
                                        >
                                            <source src={thumbnailSrc} type='video/mp4'/>
                                        </video>
                                    ) : (
                                        <img
                                            className={classNames('animation-thumbnail', { 'media-blurred': isBlurred })}
                                            src={thumbnailSrc}
                                            alt=''
                                        />
                                    ) }
                                </>
                            )}
                            {type !== 'picker' && type !== 'preview' && <div className='animation-meta'>{getFileSize(animation)}</div>}
                        </>
                    )}
                {showProgress && (
                    <FileProgress
                        file={animation}
                        download
                        upload
                        cancelButton
                        icon={<div className='animation-play'>{t('AttachGif')}</div>}
                    />
                )}
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
    displaySize: PropTypes.number,
    stretch: PropTypes.bool,
    type: PropTypes.oneOf(['message', 'picker', 'iv', 'preview']),
    showProgress: PropTypes.bool
};

Animation.defaultProps = {
    displaySize: PHOTO_DISPLAY_SIZE,
    stretch: false,
    showProgress: true
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(Animation);
