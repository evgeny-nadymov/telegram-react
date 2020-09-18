/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import FileProgress from './FileProgress';
import MediaCaption from './MediaCaption';
import Player from '../Player/Player';
import { getMediaFile, getMediaMinithumbnail, getMediaThumbnail, getSrc } from '../../Utils/File';
import { getText, isAnimationMessage, isEmbedMessage, isVideoMessage } from '../../Utils/Message';
import { getThumb } from '../../Utils/Media';
import { MEDIA_VIEWER_VIDEO_MAX_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
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
            const thumbnail = getMediaThumbnail(chatId, messageId);
            const minithumbnail = getMediaMinithumbnail(chatId, messageId);

            const message = MessageStore.get(chatId, messageId);
            const text = getText(message, null, t);

            let [width, height, file, mimeType, supportsStreaming] = getMediaFile(chatId, messageId, size);
            file = FileStore.get(file.id) || file;
            let src = getSrc(file);
            let source = null;
            if (!src && supportsStreaming) {
                if (isVideoMessage(chatId, messageId)) {
                    src = `/streaming/file?id=${file.id}&size=${file.size}&mime_type=${mimeType}`;
                }
            }

            const { content } = message;
            const { web_page: webPage } = content;

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
                thumbnail,
                minithumbnail,
                webPage
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
        PlayerStore.on('clientUpdatePictureInPicture', this.onClientUpdatePictureInPicture);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdatePhotoBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateVideoBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateAnimationBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateVideoThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
        FileStore.off('clientUpdateAnimationThumbnailBlob', this.onClientUpdateMediaThumbnailBlob);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        PlayerStore.off('clientUpdatePictureInPicture', this.onClientUpdatePictureInPicture);
    }

    onClientUpdatePictureInPicture = update => {
        const { videoInfo } = update;
        if (!videoInfo) return;

        const { file } = this.state;
        if (file.id !== videoInfo.fileId) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaViewerContent',
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
        const { chatId, messageId, size } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            let [width, height, file, mimeType, supportsStreaming] = getMediaFile(chatId, messageId, size);

            file = FileStore.get(file.id) || file;
            let src = getSrc(file);
            let source = null;
            if (!src && supportsStreaming) {
                if (isVideoMessage(chatId, messageId)) {
                    src = `/streaming/file?id=${file.id}&size=${file.size}&mime_type=${mimeType}`;
                }
            }

            this.setState({
                width,
                height,
                file,
                src,
                source,
                supportsStreaming,
                mimeType
            });
        }
    };

    onClientUpdateMediaThumbnailBlob = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            const thumbnail = getMediaThumbnail(chatId, messageId);
            this.setState({
                thumbnail
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
                if (isVideoMessage(chatId, messageId)) {
                    src = `/streaming/file?id=${file.id}&size=${file.size}&mime_type=${mimeType}`;
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
            minithumbnail,
            thumbnail,
            webPage,
            isPlaying
        } = this.state;

        if (!file) return null;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.file : null);

        const isEmbed = isEmbedMessage(chatId, messageId);
        const isVideo = isVideoMessage(chatId, messageId);
        const isAnimation = isAnimationMessage(chatId, messageId);

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
                    {!isPlaying && !supportsStreaming && thumb}
                </div>
            );
        } else if (isAnimation) {
            // const message = MessageStore.get(chatId, messageId);
            //
            // content = (
            //     <Animation
            //         type='preview'
            //         stretch={true}
            //         displaySize={ANIMATION_PREVIEW_DISPLAY_SIZE}
            //         animation={message.content.animation || message.content.web_page.animation}
            //         onClick={this.handleContentClick}
            //         showProgress={false}
            //         style={{ borderRadius: 0 }}
            //         />
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
        } else if (webPage && webPage.embed_url) {
            let { embed_url: url } = webPage;

            switch (webPage.site_name) {
                case 'Coub': {
                    break;
                }
                case 'SoundCloud': {
                    break;
                }
                case 'Spotify': {
                    break;
                }
                case 'Twitch': {
                    url += `&parent=${window.location.hostname}`;
                    break;
                }
                case 'YouTube': {
                    url += '?iv_load_policy=3&controls=2&playsinline=1&rel=0&modestbranding=0&autoplay=1&enablejsapi=0&widgetid=1&showinfo=0';
                    break;
                }
                case 'Vimeo': {
                    url += '?playsinline=true&autoplay=true&dnt=true&title=false';
                    break;
                }
                case 'КиноПоиск': {
                    break;
                }
                case 'Яндекс.Музыка': {
                    break;
                }
            }

            content = (
                <div className='media-viewer-content-wrapper'>
                    <iframe src={url} width={videoWidth} height={videoHeight} frameBorder={0} allowFullScreen={true} scrolling='no' style={{ background: 'black' }}/>
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
                {text && text.length > 0 && !isVideo && !isEmbed && <MediaCaption text={text} />}
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
