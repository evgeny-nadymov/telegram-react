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
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import CircularProgress from '@material-ui/core/CircularProgress';
import FileProgress from '../../Viewer/FileProgress';
import MediaStatus from './MediaStatus';
import { getFileSize, getSrc } from '../../../Utils/File';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { getDurationString } from '../../../Utils/Common';
import { hasAudio } from '../../../Utils/Message';
import { PLAYER_PLAYBACKRATE_NORMAL, PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
import Player from '../../Player/Player';
import PlayerStore from '../../../Stores/PlayerStore';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import ApplicationStore from '../../../Stores/ApplicationStore';
import './VideoNote.css';

const circleStyle = {
    circle: 'video-note-progress-circle'
};

class VideoNote extends React.Component {
    constructor(props) {
        super(props);

        this.playerRef = React.createRef();

        const { chatId, messageId } = props;
        const { video } = props.videoNote;

        const { time, message, playing } = PlayerStore;
        const active = message && message.chat_id === chatId && message.id === messageId;

        this.state = {
            active: active,
            src: getSrc(video),
            currentTime: active && time ? time.currentTime : 0.0,
            videoDuration: active && time ? time.duration : 0.0
        };

        this.focused = window.hasFocus;
        this.inView = false;
        this.isPaused = !playing && active;
        this.openMediaViewer = Boolean(ApplicationStore.mediaViewerContent);
        this.openProfileMediaViewer = Boolean(ApplicationStore.profileMediaViewerContent);
    }

    updateVideoSrc() {
        const { src } = this.state,
            player = this.playerRef.current;

        if (player) player.setSrc(src);
    }

    componentDidMount() {
        this.updateVideoSrc();

        FileStore.on('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.on('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);

        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);

        ApplicationStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);

        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
        PlayerStore.on('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.on('clientUpdateMediaPlay', this.onClientUpdateMediaPlay);
        PlayerStore.on('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);

        if (this.state.active) {
            const player = this.playerRef.current;
            player && player.unstick(true);
        }
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.removeListener('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);

        MessageStore.removeListener('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);

        ApplicationStore.removeListener('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.removeListener('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.removeListener(
            'clientUpdateProfileMediaViewerContent',
            this.onClientUpdateProfileMediaViewerContent
        );

        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
        PlayerStore.removeListener('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.removeListener('clientUpdateMediaPlay', this.onClientUpdateMediaPlay);
        PlayerStore.removeListener('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);

        if (this.state.active && !this.isSticked) {
            const player = this.playerRef.current;
            player && player.stick(this.props);
            this.isSticked = true;
        }
    }

    onClientUpdateMediaPlaybackRate = update => {
        if (this.isSticked) return;

        const { playbackRate } = update;

        if (this.playerRef.current) this.playerRef.current.setPlaybackRate(playbackRate);
    };

    startStopPlayer = () => {
        const player = this.playerRef.current;
        if (player) {
            if (this.inView && this.focused && !this.openMediaViewer && !this.openProfileMediaViewer) {
                //console.log('clientUpdate player play message_id=' + this.props.messageId);
                if (this.isSticked) {
                    player.unstick();
                    this.isSticked = false;
                }
                if (!this.isPaused) player.play();
            } else {
                //console.log('clientUpdate player pause message_id=' + this.props.messageId);
                if (this.state.active && window.hasFocus) {
                    player.stick(this.props);
                    this.isSticked = true;
                } else player.pause();
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

    onClientUpdateMediaTime = update => {
        const { chatId, messageId } = this.props;
        if (chatId === update.chatId && messageId === update.messageId) {
            const player = this.playerRef.current;
            if (player) {
                this.setState({
                    currentTime: update.currentTime,
                    videoDuration: update.duration
                });
            }
        }
    };

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState(
                {
                    active: false,
                    srcObject: null,
                    currentTime: 0
                },
                () => {
                    const player = this.playerRef.current;
                    if (!player) return;

                    player.setPlaybackRate(PLAYER_PLAYBACKRATE_NORMAL);

                    this.updateVideoSrc();
                    this.isPaused = false;

                    if (!window.hasFocus) {
                        player.pause();
                    }
                }
            );
        }
    };

    onClientUpdateMediaPause = update => {
        const { chatId, messageId } = this.props,
            player = this.playerRef.current;

        if (player && chatId === update.chatId && messageId === update.messageId) {
            this.isPaused = true;
            if (!this.isSticked) player.pause();
        }
    };

    onClientUpdateMediaPlay = update => {
        const { chatId, messageId } = this.props,
            player = this.playerRef.current;

        if (chatId === update.chatId && messageId === update.messageId) return;

        this.isPaused = false;
        player.reset();
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId } = this.props,
            player = this.playerRef.current;

        if (!player) return;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (this.state.active) {
                this.isPaused ? player.play() : player.pause();
                this.isPaused = !this.isPaused;
            } else {
                this.setState({
                    active: true,
                    currentTime: null
                });
                const { playbackRate } = PlayerStore,
                    audio = hasAudio(chatId, messageId);

                player.setPlaybackRate(audio ? PLAYER_PLAYBACKRATE_NORMAL : playbackRate);
                player.reset();
            }
        } else if (this.state.active) {
            if (this.isSticked) {
                player.unstick();
                this.isSticked = false;
            }

            this.setState(
                {
                    active: false,
                    srcObject: null,
                    currentTime: 0
                },
                () => {
                    const player = this.playerRef.current;
                    if (!player) return;

                    this.updateVideoSrc();

                    if (!window.hasFocus) player.pause();
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

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    onClick = e => {
        this.props.openMedia();
    };

    render() {
        const { displaySize, chatId, messageId, openMedia } = this.props;
        const { active, currentTime, videoDuration } = this.state;
        const { thumbnail, video, duration } = this.props.videoNote;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const style = { width: 200, height: 200 };
        if (!style) return null;

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const src = getSrc(video);
        const isBlurred = isBlurredThumbnail(thumbnail);

        let progress = 0;
        if (videoDuration && currentTime) {
            const progressTime = currentTime + 0.25;
            progress = (progressTime / videoDuration) * 100;
        }

        return (
            <div
                className={classNames('video-note', { 'video-note-playing': active })}
                style={style}
                onClick={this.onClick}>
                {src ? (
                    <>
                        <Player
                            ref={this.playerRef}
                            className={classNames('media-viewer-content-image', 'video-note-round')}
                            poster={thumbnailSrc}
                            muted={true}
                            currentTime={currentTime}
                            autoPlay={!this.isPaused}
                            src={src}
                            loop={true}
                            playsInline={true}
                            width={style.width}
                            height={style.height}
                        />
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
                        <div className='video-note-round'>
                            <img
                                className={classNames('animation-preview', { 'media-blurred': isBlurred })}
                                style={style}
                                src={thumbnailSrc}
                                alt=''
                            />
                        </div>
                        <div className='animation-meta'>
                            {getDurationString(duration) + ' ' + getFileSize(video)}
                            <MediaStatus chatId={chatId} messageId={messageId} icon={'\u00A0•'} />
                        </div>
                        <div className='video-note-muted'>
                            <VolumeOffIcon />
                        </div>
                    </>
                )}
                <FileProgress file={video} download upload cancelButton icon={<ArrowDownwardIcon />} />
            </div>
        );
    }
}

VideoNote.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    videoNote: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired,
    size: PropTypes.number,
    displaySize: PropTypes.number
};

VideoNote.defaultProps = {
    size: PHOTO_SIZE,
    displaySize: PHOTO_DISPLAY_SIZE
};

export default VideoNote;
