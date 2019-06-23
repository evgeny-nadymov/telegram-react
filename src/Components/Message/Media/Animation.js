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
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import ApplicationStore from '../../../Stores/ApplicationStore';
import './Animation.css';
import Player from '../../Player/Player';

class Animation extends React.Component {
    constructor(props) {
        super(props);
        this.playerRef = React.createRef();

        this.focused = window.hasFocus;
        this.inView = false;
        this.openMediaViewer = Boolean(ApplicationStore.mediaViewerContent);
        this.openProfileMediaViewer = Boolean(ApplicationStore.profileMediaViewerContent);
    }

    componentDidMount() {
        FileStore.on('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.on('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        ApplicationStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.removeListener('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        ApplicationStore.removeListener('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.removeListener('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.removeListener(
            'clientUpdateProfileMediaViewerContent',
            this.onClientUpdateProfileMediaViewerContent
        );
        MessageStore.removeListener('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
    }

    startStopPlayer = () => {
        const player = this.playerRef.current;

        if (player) {
            if (this.inView && this.focused && !this.openMediaViewer && !this.openProfileMediaViewer) {
                player.play();
            } else {
                //console.log('clientUpdate player pause message_id=' + this.props.messageId);
                player.pause();
            }
        }
    };

    onClientUpdateProfileMediaViewerContent = update => {
        this.openProfileMediaViewer = Boolean(ApplicationStore.profileMediaViewerContent);

        this.startStopPlayer();
    };

    onClientUpdateMediaViewerContent = update => {
        this.openMediaViewer = Boolean(ApplicationStore.mediaViewerContent);

        this.startStopPlayer();
    };

    onClientUpdateFocusWindow = update => {
        this.focused = update.focused;

        this.startStopPlayer();
    };

    onClientUpdateMessagesInView = update => {
        const { chatId, messageId } = this.props;
        const key = `${chatId}_${messageId}`;

        this.inView = update.messages.has(key);

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
        const { displaySize, openMedia, t } = this.props;
        const { thumbnail, animation, mime_type, width, height } = this.props.animation;

        const fitPhotoSize = getFitSize(thumbnail || { width: width, height: height }, displaySize);
        if (!fitPhotoSize) return null;

        const style = {
            width: fitPhotoSize.width,
            height: fitPhotoSize.height
        };

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const src = getSrc(animation);

        const isBlurred = isBlurredThumbnail(thumbnail);
        const isGif = isGifMimeType(mime_type);

        return (
            <div className='animation' style={style} onClick={openMedia}>
                {src ? (
                    isGif ? (
                        <img className='media-viewer-content-image' style={style} src={src} alt='' />
                    ) : (
                        <Player
                            ref={this.playerRef}
                            className='media-viewer-content-image'
                            poster={thumbnailSrc}
                            muted
                            autoPlay
                            loop
                            playsInline
                            width={style.width}
                            height={style.height}
                            mimeType={mime_type}
                            src={src}
                        />
                    )
                ) : (
                    <>
                        <img
                            className={classNames('animation-preview', { 'media-blurred': isBlurred })}
                            style={style}
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

export default withTranslation()(Animation);
