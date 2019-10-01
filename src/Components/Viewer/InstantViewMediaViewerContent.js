/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import FileProgress from './FileProgress';
import MediaCaption from './MediaCaption';
import { getViewerFile, getViewerThumbnail } from '../../Utils/File';
import { isBlurredThumbnail } from '../../Utils/Media';
import FileStore from '../../Stores/FileStore';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import Caption from '../InstantView/Blocks/Caption';

class InstantViewMediaViewerContent extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();

        this.state = {};
    }

    static getDerivedStateFromProps(props, state) {
        const { media, size, text } = props;

        if (media !== state.prevMedia) {
            let [width, height, file] = getViewerFile(media, size);
            file = FileStore.get(file.id) || file;

            let [thumbnailWidth, thumbnailHeight, thumbnail] = getViewerThumbnail(media);
            thumbnail = FileStore.get(thumbnail.id) || thumbnail;

            return {
                prevMedia: media,

                speed: 1,
                isPlaying: false,
                width,
                height,
                file,
                text,
                thumbnailWidth,
                thumbnailHeight,
                thumbnail
            };
        }

        return null;
    }

    componentDidMount() {
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateVideoBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateAnimationBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
        FileStore.on('clientUpdateAnimationThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdateMediaBlob);
        FileStore.removeListener('clientUpdateVideoBlob', this.onClientUpdateMediaBlob);
        FileStore.removeListener('clientUpdateAnimationBlob', this.onClientUpdateMediaBlob);
        FileStore.removeListener('clientUpdateVideoThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
        FileStore.removeListener('clientUpdateAnimationThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
    }

    onClientUpdateMediaBlob = update => {
        const { fileId } = update;
        const { file } = this.state;

        if (file && file.id === fileId) {
            this.forceUpdate();
        }
    };

    onClientUpdateMediaThumbnailBlob = update => {
        const { fileId } = update;
        const { thumbnail: file } = this.state;

        if (file && file.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        console.log('[IV] IVMediaViewerContent.render', this.props);
        const { media } = this.props;
        if (!media) return null;

        const { width, height, file, text, thumbnailWidth, thumbnailHeight, thumbnail, isPlaying } = this.state;
        if (!file) return null;

        const blob = FileStore.getBlob(file.id) || file.blob;
        const src = FileStore.getBlobUrl(blob) || '';

        const thumbnailBlob = thumbnail ? FileStore.getBlob(thumbnail.id) || thumbnail.blob : null;
        const thumbnailSrc = FileStore.getBlobUrl(thumbnailBlob);
        const isBlurred = isBlurredThumbnail({ width: thumbnailWidth, height: thumbnailHeight });

        let videoWidth = width;
        let videoHeight = height;
        if (Math.max(videoWidth, videoHeight) > 640) {
            const scale = 640 / Math.max(videoWidth, videoHeight);
            videoWidth = videoWidth > videoHeight ? 640 : Math.floor(videoWidth * scale);
            videoHeight = videoHeight > videoWidth ? 640 : Math.floor(videoHeight * scale);
        }

        let content = null;
        switch (media['@type']) {
            case 'video': {
                content = (
                    <div className='media-viewer-content-wrapper'>
                        <video
                            ref={this.videoRef}
                            className='media-viewer-content-video-player'
                            src={src}
                            onClick={this.handleContentClick}
                            controls
                            autoPlay
                            width={videoWidth}
                            height={videoHeight}
                            onPlay={() => {
                                this.setState({ isPlaying: true });
                                TdLibController.clientUpdate({
                                    '@type': 'clientUpdateMediaViewerPlay'
                                });
                            }}
                            onCanPlay={() => {
                                const player = this.videoRef.current;
                                if (player) {
                                    player.volume = PlayerStore.volume;
                                }
                            }}
                            onPause={() => {
                                TdLibController.clientUpdate({
                                    '@type': 'clientUpdateMediaViewerPause'
                                });
                            }}
                            onEnded={() => {
                                TdLibController.clientUpdate({
                                    '@type': 'clientUpdateMediaViewerEnded'
                                });
                            }}
                            onVolumeChange={() => {
                                const player = this.videoRef.current;
                                if (player) {
                                    TdLibController.clientUpdate({
                                        '@type': 'clientUpdateMediaVolume',
                                        volume: player.volume
                                    });
                                }
                            }}
                        />
                        {!isPlaying &&
                            (!src && thumbnailSrc ? (
                                <img
                                    className={classNames('media-viewer-content-video-thumbnail', {
                                        'media-blurred': isBlurred
                                    })}
                                    src={thumbnailSrc}
                                    alt=''
                                    width={videoWidth}
                                    height={videoHeight}
                                />
                            ) : (
                                <div
                                    className='media-viewer-content-video-thumbnail'
                                    style={{
                                        width: videoWidth,
                                        height: videoHeight
                                    }}
                                />
                            ))}
                    </div>
                );
                break;
            }
            case 'animation': {
                content = (
                    <div className='media-viewer-content-wrapper'>
                        <video
                            className='media-viewer-content-video-player'
                            src={src}
                            onClick={this.handleContentClick}
                            loop
                            autoPlay
                            width={videoWidth}
                            height={videoHeight}
                            onPlay={() => {
                                this.setState({ isPlaying: true });
                            }}
                        />
                        {!isPlaying &&
                            (!src && thumbnailSrc ? (
                                <img
                                    className={classNames('media-viewer-content-video-thumbnail', {
                                        'media-blurred': isBlurred
                                    })}
                                    src={thumbnailSrc}
                                    alt=''
                                    width={videoWidth}
                                    height={videoHeight}
                                />
                            ) : (
                                <div
                                    className='media-viewer-content-video-thumbnail'
                                    style={{
                                        width: videoWidth,
                                        height: videoHeight
                                    }}
                                />
                            ))}
                    </div>
                );
                break;
            }
            default: {
                content = (
                    <img className='media-viewer-content-image' src={src} alt='' onClick={this.handleContentClick} />
                );
            }
        }

        return (
            <div className='media-viewer-content'>
                {content}
                <FileProgress file={file} zIndex={2} />
                <MediaCaption text={<Caption text={text.text} credit={text.credit} />} />
            </div>
        );
    }
}

InstantViewMediaViewerContent.propTypes = {
    media: PropTypes.object.isRequired,
    size: PropTypes.number.isRequired,
    text: PropTypes.object
};

export default InstantViewMediaViewerContent;
