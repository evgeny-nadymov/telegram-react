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

class Animation extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();
    }

    componentDidMount() {
        FileStore.on('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.on('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        ApplicationStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateAnimationThumbnailBlob', this.onClientUpdateAnimationThumbnailBlob);
        FileStore.removeListener('clientUpdateAnimationBlob', this.onClientUpdateAnimationBlob);
        ApplicationStore.removeListener('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        MessageStore.removeListener('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
    }

    onClientUpdateMessagesInView = update => {
        const player = this.videoRef.current;
        if (player) {
            const { chatId, messageId } = this.props;
            const key = `${chatId}_${messageId}`;

            if (update.messages.has(key)) {
                //console.log('clientUpdateMessagesInView play message_id=' + messageId);
                player.play();
            } else {
                //console.log('clientUpdateMessagesInView pause message_id=' + messageId);
                player.pause();
            }
        }
    };

    onClientUpdateFocusWindow = update => {
        const player = this.videoRef.current;
        if (player) {
            if (update.focused) {
                player.play();
            } else {
                player.pause();
            }
        }
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
                        <video
                            ref={this.videoRef}
                            className='media-viewer-content-image'
                            src={src}
                            poster={thumbnailSrc}
                            muted
                            autoPlay
                            loop
                            playsInline
                            width={style.width}
                            height={style.height}
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
