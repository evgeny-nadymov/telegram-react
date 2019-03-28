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
import { getVideoDurationString } from '../../../Utils/Common';
import { PHOTO_DISPLAY_SIZE, PHOTO_SIZE } from '../../../Constants';
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

        this.videoRef = React.createRef();

        const { chatId, messageId } = props;

        const { time, message } = PlayerStore;
        const active = message && message.chat_id === chatId && message.id === messageId;

        if (active && time) {
            console.log('clientUpdate diff=' + (Date.now() - time.timestamp) / 1000);
        }

        this.state = {
            active: active,
            syncTime: false,
            currentTime: active && time ? time.currentTime + (Date.now() - time.timestamp) / 1000 : 0.0,
            videoDuration: active && time ? time.duration : 0.0
        };
    }

    componentDidMount() {
        FileStore.on('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.on('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);

        ApplicationStore.on('clientUpdateActiveMedia', this.onClientUpdateActiveMedia);
        ApplicationStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);

        PlayerStore.on('clientUpdatePlayMedia', this.onClientUpdatePlayMedia);
        PlayerStore.on('clientUpdatePauseMedia', this.onClientUpdatePauseMedia);
        PlayerStore.on('clientUpdateMediaTimeUpdate', this.onClientUpdateMediaTimeUpdate);
        PlayerStore.on('clientUpdateEndMedia', this.onClientUpdateEndMedia);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.removeListener('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);

        ApplicationStore.removeListener('clientUpdateActiveMedia', this.onClientUpdateActiveMedia);
        ApplicationStore.removeListener('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);

        PlayerStore.removeListener('clientUpdatePlayMedia', this.onClientUpdatePlayMedia);
        PlayerStore.removeListener('clientUpdatePauseMedia', this.onClientUpdatePauseMedia);
        PlayerStore.removeListener('clientUpdateMediaTimeUpdate', this.onClientUpdateMediaTimeUpdate);
        PlayerStore.removeListener('clientUpdateEndMedia', this.onClientUpdateEndMedia);
    }

    onClientUpdateMediaTimeUpdate = update => {
        const { chatId, messageId } = this.props;
        if (chatId === update.chatId && messageId === update.messageId) {
            const player = this.videoRef.current;
            if (player) {
                const { syncTime } = this.state;

                if (!syncTime && player.currentTime > 0.0) {
                    this.setState({
                        currentTime: update.currentTime,
                        videoDuration: update.duration,
                        syncTime: true
                    });

                    const diff = (Date.now() - update.timestamp) / 1000 + 0.25;
                    console.log(
                        'clientUpdateMediaTimeUpdate sync currentTime',
                        player.currentTime,
                        update.currentTime,
                        diff
                    );
                    player.currentTime = update.currentTime + diff;
                    console.log('clientUpdateMediaTimeUpdate sync currentTime', player.currentTime);
                } else {
                    this.setState({
                        currentTime: update.currentTime,
                        videoDuration: update.duration
                    });
                }
            }
        }
    };

    onClientUpdatePauseMedia = update => {
        const { chatId, messageId } = this.props;
        if (chatId === update.chatId && messageId === update.messageId) {
            const player = this.videoRef.current;
            if (player) {
                player.pause();
            }
        }
    };

    onClientUpdatePlayMedia = update => {
        const { chatId, messageId } = this.props;
        if (chatId === update.chatId && messageId === update.messageId) {
            const player = this.videoRef.current;
            if (player) {
                player.currentTime = update.currentTime;
                player.play();
            }
        }
    };

    onClientUpdateFocusWindow = update => {
        const player = this.videoRef.current;
        if (player) {
            if (this.state.active) {
                return;
            }

            if (update.focused) {
                player.play();
            } else {
                player.pause();
            }
        }
    };

    onClientUpdateActiveMedia = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (this.state.active) {
            } else {
                this.setState(
                    {
                        active: true,
                        syncTime: false,
                        currentTime: null
                    },
                    () => {
                        const player = this.videoRef.current;
                        if (!player) return;

                        //player.volume = 0.25;
                        //player.currentTime = 0.0;
                        //player.play();
                        //console.log(`VideoNote.play current_time=${this.videoRef.current.currentTime} duration=${this.videoRef.current.duration}`);
                    }
                );
            }
        } else if (this.state.active) {
            // stop playing
            this.setState(
                {
                    active: false,
                    currentTime: 0,
                    videoDuration: 0
                },
                () => {
                    const player = this.videoRef.current;
                    if (!player) return;

                    if (player.paused) {
                        player.play();
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
            this.forceUpdate();
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

    onClientUpdateEndMedia = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            const player = this.videoRef.current;

            this.setState(
                {
                    active: false,
                    currentTime: 0,
                    videoDuration: player.duration
                },
                () => {
                    if (window.hasFocus) {
                        player.play();
                    }
                }
            );
        }
    };

    handleLoadedMetadata = () => {
        const { chatId, messageId } = this.props;
        const { active } = this.state;

        if (!active) return;

        const player = this.videoRef.current;
        if (player) {
            player.currentTime = this.state.currentTime;
        }
    };

    handleTimeUpdate = () => {
        const { active } = this.state;

        if (!active) return;

        const player = this.videoRef.current;

        console.log('clientUpdateMediaTimeUpdate handleTimeUpdate currentTime', player.currentTime);
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
        //console.log('VideoNote.render active=' + active, currentTime, videoDuration, duration, progress);

        return (
            <div
                className={classNames('video-note', { 'video-note-playing': active })}
                style={style}
                onClick={openMedia}>
                {src ? (
                    <>
                        <video
                            ref={this.videoRef}
                            className={classNames('media-viewer-content-image', 'video-note-round')}
                            src={src}
                            poster={thumbnailSrc}
                            muted
                            loop={!active}
                            autoPlay
                            playsInline
                            width={style.width}
                            height={style.height}
                            onLoadedMetadata={this.handleLoadedMetadata}
                            onTimeUpdate={this.handleTimeUpdate}
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
                                {getVideoDurationString(active ? Math.floor(currentTime) : duration)}
                                <MediaStatus chatId={chatId} messageId={messageId} icon={' •'} />
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
                            {getVideoDurationString(duration) + ' ' + getFileSize(video)}
                            <MediaStatus chatId={chatId} messageId={messageId} icon={' •'} />
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
