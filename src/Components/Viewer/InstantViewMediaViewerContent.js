/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import FileProgress from './FileProgress';
import MediaCaption from './MediaCaption';
import Caption from '../InstantView/Blocks/Caption';
import SafeLink from '../Additional/SafeLink';
import Player from '../Player/Player';
import { getSrc, getViewerFile, getViewerMinithumbnail, getViewerThumbnail } from '../../Utils/File';
import { getThumb } from '../../Utils/Media';
import { isEmptyText } from '../../Utils/InstantView';
import { MEDIA_VIEWER_VIDEO_MAX_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';

class InstantViewMediaViewerContent extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();

        this.state = {};
    }

    static getDerivedStateFromProps(props, state) {
        const { media, size, caption, url } = props;

        if (media !== state.prevMedia) {
            const thumbnail = getViewerThumbnail(media);
            const minithumbnail = getViewerMinithumbnail(media);

            let [width, height, file, mimeType, supportsStreaming] = getViewerFile(media, size);
            file = FileStore.get(file.id) || file;
            let src = getSrc(file);
            let source = null;
            if (!src && supportsStreaming) {
                const { video } = media;
                if (video) {
                    src = `/streaming/file?id=${file.id}&size=${file.size}&mime_type=${video.mime_type}`;
                }
            }

            return {
                prevMedia: media,

                speed: 1,
                isPlaying: false,
                width,
                height,
                file,
                src,
                source,
                supportsStreaming,
                mimeType,
                thumbnail,
                minithumbnail
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
        PlayerStore.on('clientUpdatePictureInPicture', this.onClientUpdatePictureInPicture);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdatePhotoBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateVideoBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateAnimationBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateVideoThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
        FileStore.off('clientUpdateAnimationThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
        PlayerStore.off('clientUpdatePictureInPicture', this.onClientUpdatePictureInPicture);
    }

    onClientUpdatePictureInPicture = update => {
        const { videoInfo } = update;
        if (!videoInfo) return;

        const { file } = this.state;
        if (file.id !== videoInfo.fileId) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateInstantViewViewerContent',
            content: null
        });
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { src } = this.state;

        if (prevState.src !== src) {
            const player = this.videoRef.current;
            if (!player) return;

            player.load();
        }
    }

    onClientUpdateMediaBlob = update => {
        const { fileId } = update;
        const { media, size } = this.props;
        const { file } = this.state;

        if (file && file.id === fileId) {
            const [width, height, file, mimeType, supportsStreaming] = getViewerFile(media, size);

            this.setState({
                width,
                height,
                file,
                src: getSrc(file),
                supportsStreaming,
                mimeType
            });
        }
    };

    onClientUpdateMediaThumbnailBlob = update => {
        const { fileId } = update;
        const { thumbnail } = this.state;

        if (thumbnail && thumbnail.file.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { media, caption, url } = this.props;
        if (!media) return null;

        const {
            width,
            height,
            file,
            src,
            mimeType,
            thumbnail,
            minithumbnail,
            isPlaying,
            supportsStreaming
        } = this.state;
        if (!file) return null;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbnailSrc = getSrc(thumbnail);

        let videoWidth = width;
        let videoHeight = height;
        const scale = MEDIA_VIEWER_VIDEO_MAX_SIZE / Math.max(videoWidth, videoHeight);
        const w = videoWidth > videoHeight ? MEDIA_VIEWER_VIDEO_MAX_SIZE : Math.floor(videoWidth * scale);
        const h = videoHeight > videoWidth ? MEDIA_VIEWER_VIDEO_MAX_SIZE : Math.floor(videoHeight * scale);
        videoWidth = w;
        videoHeight = h;

        let content = null;
        const source = src ? <source src={src} type={mimeType}/> : null;
        const thumb = getThumb(thumbnail, minithumbnail, videoWidth, videoHeight);

        switch (media['@type']) {
            case 'video': {
                content = (
                    <div className='media-viewer-content-wrapper'>
                        <Player
                            ref={this.videoRef}
                            className='media-viewer-content-video-player'
                            fileId={file.id}
                            width={videoWidth}
                            height={videoHeight}
                            poster={supportsStreaming ? (thumbnailSrc || miniSrc) : null}
                            onPlay={() => {
                                this.setState({ isPlaying: true });
                            }}
                        >
                            {source}
                        </Player>
                        {!isPlaying && !supportsStreaming && thumb}
                    </div>
                );
                break;
            }
            case 'animation': {
                // content = (
                //     <Animation
                //         type='preview'
                //         stretch={true}
                //         displaySize={ANIMATION_PREVIEW_DISPLAY_SIZE}
                //         animation={media}
                //         onClick={this.handleContentClick}
                //         showProgress={false}
                //         style={{ borderRadius: 0 }}
                //     />
                // );

                content = (
                    <div className='media-viewer-content-wrapper'>
                        <video
                            ref={this.videoRef}
                            className='media-viewer-content-video-player'
                            onClick={this.handleContentClick}
                            loop
                            autoPlay
                            width={videoWidth}
                            height={videoHeight}
                            onPlay={() => {
                                this.setState({ isPlaying: true });
                            }}
                        >
                            {source}
                        </video>
                        {!isPlaying && thumb}
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
                {!supportsStreaming && <FileProgress file={file} zIndex={2} />}
                {caption && (!isEmptyText(caption.text) || !isEmptyText(caption.credit) || url) && (
                    <MediaCaption
                        text={
                            <>
                                <Caption text={caption.text} credit={caption.credit} />
                                <SafeLink url={url} />
                            </>
                        }
                    />
                )}
            </div>
        );
    }
}

InstantViewMediaViewerContent.propTypes = {
    media: PropTypes.object.isRequired,
    size: PropTypes.number.isRequired,
    caption: PropTypes.object,
    url: PropTypes.string
};

export default InstantViewMediaViewerContent;
