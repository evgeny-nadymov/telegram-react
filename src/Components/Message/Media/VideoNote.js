/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import DownloadIcon from '../../../Assets/Icons/Download';
import CircularProgress from '@material-ui/core/CircularProgress';
import FileProgress from '../../Viewer/FileProgress';
import MediaStatus from './MediaStatus';
import { getFileSize, getSrc } from '../../../Utils/File';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { clamp, getDurationString } from '../../../Utils/Common';
import { isCurrentSource } from '../../../Utils/Player';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import ApplicationStore from '../../../Stores/ApplicationStore';
import FileStore from '../../../Stores/FileStore';
import InstantViewStore from '../../../Stores/InstantViewStore';
import PlayerStore from '../../../Stores/PlayerStore';
import MessageStore from '../../../Stores/MessageStore';
import './VideoNote.css';

const circleStyle = {
    circle: 'video-note-progress-circle'
};

class VideoNote extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();
        this.sourceRef = React.createRef();

        const { chatId, messageId } = props;
        const { video } = props.videoNote;

        const { time, message, videoStream } = PlayerStore;
        const active = message && message.chat_id === chatId && message.id === messageId;

        this.state = {
            active: active,
            srcObject: active ? videoStream : null,
            src: getSrc(video),
            currentTime: active && time ? time.currentTime : 0.0,
            videoDuration: active && time ? time.duration : 0.0
        };

        this.windowFocused = window.hasFocus;
        this.inView = false;
        this.openMediaViewer = Boolean(ApplicationStore.mediaViewerContent);
        this.openProfileMediaViewer = Boolean(ApplicationStore.profileMediaViewerContent);
        this.openIV = Boolean(InstantViewStore.getCurrent());
    }

    updateVideoSrc() {
        const { srcObject, src } = this.state;

        const player = this.videoRef.current;
        if (!player) return;

        if (srcObject) {
            //player.scr = null;
            player.srcObject = srcObject;
            return;
        }

        const stream = player.srcObject;
        if (stream) {
            //console.log('clientUpdate release srcObject');
            const tracks = stream.getTracks();

            tracks.forEach(track => {
                //console.log('clientUpdate release track');
                track.stop();
            });
        }

        if (player.srcObject) {
            //console.log('clientUpdate release video.srcObject');
            player.srcObject = null;
        }

        const source = this.sourceRef.current;
        if (!source) return;

        if (source.src !== src) {
            source.src = src;
            player.load();
        }
    }

    componentDidMount() {
        this.updateVideoSrc();

        FileStore.on('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.on('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);

        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);

        ApplicationStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        InstantViewStore.on('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);

        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaCaptureStream', this.onClientUpdateMediaCaptureStream);
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.off('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);

        MessageStore.off('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);

        ApplicationStore.off('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.off('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        InstantViewStore.off('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);

        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaCaptureStream', this.onClientUpdateMediaCaptureStream);
        PlayerStore.off('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.off('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    startStopPlayer = () => {
        const player = this.videoRef.current;
        if (player) {
            if (
                this.inView &&
                this.windowFocused &&
                !this.openMediaViewer &&
                !this.openProfileMediaViewer &&
                !this.openIV
            ) {
                player.play();
            } else {
                if (this.state.active) {
                    return;
                }

                player.pause();
            }
        }
    };

    onClientUpdateInstantViewContent = update => {
        this.openIV = Boolean(InstantViewStore.getCurrent());

        this.startStopPlayer();
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
        this.windowFocused = update.focused;

        this.startStopPlayer();
    };

    onClientUpdateMessagesInView = update => {
        const { chatId, messageId } = this.props;
        const key = `${chatId}_${messageId}`;

        this.inView = update.messages.has(key);

        this.startStopPlayer();
    };

    onClientUpdateMediaCaptureStream = update => {
        const { chatId, messageId } = this.props;
        if (chatId === update.chatId && messageId === update.messageId) {
            const player = this.videoRef.current;
            if (player) {
                this.setState({ srcObject: update.stream }, () => {
                    this.updateVideoSrc();
                });
            }
        }
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId, block } = this.props;
        const { currentTime, duration: videoDuration, source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        const player = this.videoRef.current;
        if (!player) return;

        this.setState({
            currentTime,
            videoDuration
        });
    };

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.setState(
            {
                active: false,
                srcObject: null,
                currentTime: 0
            },
            () => {
                const player = this.videoRef.current;
                if (!player) return;

                this.updateVideoSrc();

                if (!window.hasFocus) {
                    player.pause();
                }
            }
        );
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        if (isCurrentSource(chatId, messageId, block, source)) {
            if (this.state.active) {
            } else {
                this.setState({
                    active: true,
                    currentTime: null
                });
            }
        } else if (this.state.active) {
            this.setState(
                {
                    active: false,
                    srcObject: null,
                    currentTime: 0
                },
                () => {
                    const player = this.videoRef.current;
                    if (!player) return;

                    this.updateVideoSrc();

                    if (!window.hasFocus) {
                        player.pause();
                    }
                }
            );
        }
    };

    onClientUpdateVideoNoteBlob = update => {
        const { video } = this.props.videoNote;
        const { fileId } = update;

        if (!video) return;

        if (video.id === fileId) {
            this.setState(
                {
                    src: getSrc(video)
                },
                () => {
                    this.updateVideoSrc();
                }
            );
        }
    };

    onClientUpdateVideoNoteThumbnailBlob = update => {
        const { thumbnail } = this.props.videoNote;
        if (!thumbnail) return;

        const { fileId } = update;

        const { file } = thumbnail;
        if (file && file.id === fileId) {
            this.forceUpdate();
        }
    };

    handleCanPlay = () => {
        // const player = this.videoRef.current;
        // if (player){
        //     if (this.state.active){
        //         player.muted = false;
        //     }
        //     else{
        //         player.muted = true;
        //     }
        // }
    };

    render() {
        const { displaySize, chatId, messageId, openMedia, meta } = this.props;
        const { active, currentTime, videoDuration } = this.state;
        const { minithumbnail, thumbnail, video, duration } = this.props.videoNote;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const style = { width: 200, height: 200 };
        if (!style) return null;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.file : null);
        const isBlurred = isBlurredThumbnail(thumbnail, displaySize);

        const src = getSrc(video);
        let progress = 0;
        if (videoDuration && currentTime) {
            const progressTime = currentTime + 0.25;
            progress = clamp(progressTime / videoDuration * 100, 0, 100);
        }

        return (
            <div
                className={classNames('video-note', { 'video-note-playing': active })}
                style={style}
                onClick={openMedia}>
                <div className='video-note-round'>
                    {miniSrc && (
                        <img
                            className={classNames('video-preview', 'media-mini-blurred')}
                            src={miniSrc}
                            alt=''
                        />
                    )}
                    { thumbnailSrc && (
                        <img
                            className={classNames('animation-thumbnail', { 'media-blurred': isBlurred })}
                            src={thumbnailSrc}
                            alt=''
                        />
                    )}
                </div>
                {src ? (
                    <>
                        <video
                            ref={this.videoRef}
                            className={classNames('media-viewer-content-image', 'video-note-video')}
                            muted
                            autoPlay
                            loop
                            playsInline
                            width={style.width}
                            height={style.height}
                            onCanPlay={this.handleCanPlay}
                        >
                            <source ref={this.sourceRef} src={null} type='video/mp4'/>
                        </video>
                        <div className='video-note-player'>
                            <div className='video-note-progress'>
                                <CircularProgress
                                    classes={circleStyle}
                                    variant='static'
                                    value={progress}
                                    size={200}
                                    thickness={1}
                                />
                            </div>
                            <div className='animation-meta'>
                                {getDurationString(active ? Math.floor(currentTime) : duration)}
                                <MediaStatus chatId={chatId} messageId={messageId} icon={'\u00A0•'} />
                            </div>
                            <div className='video-note-muted'>
                                <VolumeOffIcon />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className='animation-meta'>
                            {getDurationString(duration) + ' ' + getFileSize(video)}
                            <MediaStatus chatId={chatId} messageId={messageId} icon={'\u00A0•'} />
                        </div>
                        <div className='video-note-muted'>
                            <VolumeOffIcon />
                        </div>
                    </>
                )}
                <FileProgress file={video} download upload cancelButton icon={<DownloadIcon />} />
                {meta}
            </div>
        );
    }
}

VideoNote.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    block: PropTypes.object,

    videoNote: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

VideoNote.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default VideoNote;
