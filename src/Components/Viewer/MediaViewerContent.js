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
import FileProgress from './FileProgress';
import MediaCaption from './MediaCaption';
import Player from '../Player/Player';
import { getMediaFile, getMediaMiniPreview, getMediaPreviewFile, getSrc } from '../../Utils/File';
import { getText, isAnimationMessage, isVideoMessage } from '../../Utils/Message';
import { isBlurredThumbnail } from '../../Utils/Media';
import { setFileOptions } from '../../registerServiceWorker';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import './MediaViewerContent.css';

class MediaViewerContent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};

        this.videoRef = React.createRef();
    }

    static getDerivedStateFromProps(props, state) {
        const { chatId, messageId, size, t } = props;

        if (chatId !== state.prevChatId || messageId !== state.prevMessageId) {
            let [thumbnailWidth, thumbnailHeight, thumbnail] = getMediaPreviewFile(chatId, messageId);
            if (thumbnail){
                thumbnail = FileStore.get(thumbnail.id) || thumbnail;
            }
            const [minithumbnailWidth, minithumbnailHeight, minithumbnail] = getMediaMiniPreview(chatId, messageId);

            const message = MessageStore.get(chatId, messageId);
            const text = getText(message, null, t);

            let [width, height, file, mimeType, supportsStreaming] = getMediaFile(chatId, messageId, size);
            file = FileStore.get(file.id) || file;
            let src = getSrc(file);
            let source = null;
            if (!src && supportsStreaming) {
                const { video } = message.content;
                if (video) {
                    src = `/streaming/file_id=${file.id}`;
                    setFileOptions(src, { fileId: file.id, size: file.size, mimeType: video.mime_type });
                }
            }

            return {
                prevChatId: chatId,
                prevMessageId: messageId,

                speed: 1,
                isPlaying: false,
                width,
                height,
                file,
                src,
                source,
                supportsStreaming,
                mimeType,
                text,
                thumbnailWidth,
                thumbnailHeight,
                thumbnail,
                minithumbnailWidth,
                minithumbnailHeight,
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
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdatePhotoBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateVideoBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateAnimationBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateVideoThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
        FileStore.off('clientUpdateAnimationThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { src } = this.state;

        if (prevState.src !== src) {
            const player = this.videoRef.current;
            if (!player) return;

            player.load();
        }
    }

    onClientUpdateMediaBlob = update => {
        const { chatId, messageId, size } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            const [width, height, file, mimeType, supportsStreaming] = getMediaFile(chatId, messageId, size);

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
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            const [width, height, file] = getMediaPreviewFile(chatId, messageId);
            this.setState({
                thumbnailWidth: width,
                thumbnailHeight: height,
                thumbnail: file
            });
        }
    };

    onUpdateMessageContent = update => {
        const { chatId, messageId, size, t } = this.props;
        const { chat_id, message_id } = update;

        if (chatId === chat_id && messageId === message_id) {
            const message = MessageStore.get(chatId, messageId);
            const text = getText(message, null, t);

            const [width, height, file, mimeType, supportsStreaming] = getMediaFile(chatId, messageId, size);
            let src = getSrc(file);
            let source = null;
            if (!src && supportsStreaming) {
                const { video } = message.content;
                if (video) {
                    src = `/streaming/file_id=${file.id}`;
                    setFileOptions(src, { fileId: file.id, size: file.size, mimeType: video.mime_type });
                }
            }

            this.setState({
                width,
                height,
                file,
                src,
                source,
                supportsStreaming,
                mimeType,
                text
            });
        }
    };

    handleContentClick = event => {
        if (event) event.stopPropagation();
    };

    handleClick = event => {
        event.preventDefault();
        event.stopPropagation();


        const { source } = this.state;
        if (!source) return;

        source.loadNextBuffer();
    };

    render() {
        const { chatId, messageId } = this.props;
        const {
            width,
            height,
            file,
            src,
            supportsStreaming,
            mimeType,
            text,
            thumbnailWidth,
            thumbnailHeight,
            minithumbnail,
            thumbnail,
            isPlaying
        } = this.state;

        if (!file) return null;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbnailSrc = getSrc(thumbnail);
        const isBlurred = thumbnailSrc ? isBlurredThumbnail({ width: thumbnailWidth, height: thumbnailHeight }) : Boolean(miniSrc);

        const isVideo = isVideoMessage(chatId, messageId);
        const isAnimation = isAnimationMessage(chatId, messageId);

        let videoWidth = width;
        let videoHeight = height;
        if (Math.max(videoWidth, videoHeight) > 640) {
            const scale = 640 / Math.max(videoWidth, videoHeight);
            videoWidth = videoWidth > videoHeight ? 640 : Math.floor(videoWidth * scale);
            videoHeight = videoHeight > videoWidth ? 640 : Math.floor(videoHeight * scale);
        }

        let content = null;
        const source = src ? <source src={src} type={mimeType}/> : null;
        if (isVideo) {
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
                    {!isPlaying && !supportsStreaming &&
                        ((thumbnailSrc || miniSrc) ? (
                            <img
                                className={classNames('media-viewer-content-video-thumbnail', {
                                    'media-blurred': isBlurred
                                })}
                                src={thumbnailSrc || miniSrc}
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
        } else if (isAnimation) {
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
                    {!isPlaying &&
                        ((thumbnailSrc || miniSrc) ? (
                            <img
                                className={classNames('media-viewer-content-video-thumbnail', {
                                    'media-blurred': isBlurred
                                })}
                                src={thumbnailSrc || miniSrc}
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
        } else {
            content = (
                <img className='media-viewer-content-image' src={src} alt='' onClick={this.handleContentClick} />
            );
        }

        return (
            <div className='media-viewer-content'>
                {content}
                {!supportsStreaming && <FileProgress file={file} zIndex={2} />}
                {text && text.length > 0 && <MediaCaption text={text} />}
            </div>
        );
    }
}

MediaViewerContent.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired
};

export default withTranslation()(MediaViewerContent);
