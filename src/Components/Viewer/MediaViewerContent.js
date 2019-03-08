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
import { getMediaFile, getMediaPreviewFile } from '../../Utils/File';
import { getText, isVideoMessage } from '../../Utils/Message';
import { isBlurredThumbnail } from '../../Utils/Media';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import './MediaViewerContent.css';

class MediaViewerContent extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, messageId, size } = this.props;

        let [width, height, file] = getMediaFile(chatId, messageId, size);
        file = FileStore.get(file.id) || file;

        let [thumbnailWidth, thumbnailHeight, thumbnail] = getMediaPreviewFile(chatId, messageId);
        thumbnail = FileStore.get(thumbnail.id) || thumbnail;

        const message = MessageStore.get(chatId, messageId);
        const text = getText(message);

        this.state = {
            prevChatId: chatId,
            prevMessageId: messageId,
            isPlaying: false,
            width: width,
            height: height,
            file: file,
            text: text,
            thumbnailWidth: thumbnailWidth,
            thumbnailHeight: thumbnailHeight,
            thumbnail: thumbnail
        };
    }

    static getDerivedStateFromProps(props, state) {
        const { chatId, messageId, size } = props;

        if (chatId !== state.prevChatId || messageId !== state.prevMessageId) {
            let [width, height, file] = getMediaFile(chatId, messageId, size);
            file = FileStore.get(file.id) || file;

            let [thumbnailWidth, thumbnailHeight, thumbnail] = getMediaPreviewFile(chatId, messageId);
            thumbnail = FileStore.get(thumbnail.id) || thumbnail;

            const message = MessageStore.get(chatId, messageId);
            const text = getText(message);

            return {
                prevChatId: chatId,
                prevMessageId: messageId,
                isPlaying: false,
                width: width,
                height: height,
                file: file,
                text: text,
                thumbnailWidth: thumbnailWidth,
                thumbnailHeight: thumbnailHeight,
                thumbnail: thumbnail
            };
        }

        return null;
    }

    componentDidMount() {
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        FileStore.on('clientUpdateVideoBlob', this.onClientUpdateVideoBlob);
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoBlob);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        FileStore.removeListener('clientUpdateVideoBlob', this.onClientUpdateVideoBlob);
        FileStore.removeListener('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
        MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent);
    }

    onClientUpdatePhotoBlob = update => {
        const { chatId, messageId, size } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            const [width, height, file] = getMediaFile(chatId, messageId, size);
            this.setState({
                width: width,
                height: height,
                file: file
            });
        }
    };

    onClientUpdateVideoBlob = update => {
        const { chatId, messageId, size } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            const [width, height, file] = getMediaFile(chatId, messageId, size);
            this.setState({
                width: width,
                height: height,
                file: file
            });
        }
    };

    onClientUpdateVideoThumbnailBlob = update => {
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
        const { chatId, messageId, size } = this.props;
        const { chat_id, message_id } = update;

        if (chatId === chat_id && messageId === message_id) {
            const [width, height, file] = getMediaFile(chatId, messageId, size);
            const message = MessageStore.get(chatId, messageId);
            const text = getText(message);
            this.setState({
                width: width,
                height: height,
                file: file,
                text: text
            });
        }
    };

    handleContentClick = event => {
        if (event) event.stopPropagation();
    };

    render() {
        const { chatId, messageId } = this.props;
        const { width, height, thumbnailWidth, thumbnailHeight, file, text, thumbnail, isPlaying } = this.state;
        if (!file) return null;

        const blob = FileStore.getBlob(file.id) || file.blob;
        const src = FileStore.getBlobUrl(blob) || '';

        const thumbnailBlob = thumbnail ? FileStore.getBlob(thumbnail.id) || thumbnail.blob : null;
        const thumbnailSrc = FileStore.getBlobUrl(thumbnailBlob);
        const isBlurred = isBlurredThumbnail({ width: thumbnailWidth, height: thumbnailHeight });

        const isVideo = isVideoMessage(chatId, messageId);
        let videoWidth = width;
        let videoHeight = height;
        if (Math.max(videoWidth, videoHeight) > 640) {
            const scale = 640 / Math.max(videoWidth, videoHeight);
            videoWidth = videoWidth > videoHeight ? 640 : Math.floor(videoWidth * scale);
            videoHeight = videoHeight > videoWidth ? 640 : Math.floor(videoHeight * scale);
        }

        return (
            <div className='media-viewer-content'>
                {isVideo ? (
                    <div className='media-viewer-content-wrapper'>
                        <video
                            className='media-viewer-content-video-player'
                            src={src}
                            onClick={this.handleContentClick}
                            controls
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
                ) : (
                    <img className='media-viewer-content-image' src={src} alt='' onClick={this.handleContentClick} />
                )}
                {/*<img className='media-viewer-content-image-preview' src={previewSrc} alt='' />*/}
                <FileProgress file={file} zIndex={2} />
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

export default MediaViewerContent;
