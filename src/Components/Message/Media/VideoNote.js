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

        this.state = {
            active: false,
            currentTime: null,
            videoDuration: 0
        };
    }

    componentDidMount() {
        FileStore.on('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.on('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);
        ApplicationStore.on('clientUpdateActiveVideoNote', this.onClientUpdateActiveVideoNote);
        ApplicationStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateVideoNoteThumbnailBlob);
        FileStore.removeListener('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);
        ApplicationStore.removeListener('clientUpdateActiveVideoNote', this.onClientUpdateActiveVideoNote);
        ApplicationStore.removeListener('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
    }

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

    onClientUpdateActiveVideoNote = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (this.state.active) {
                const player = this.videoRef.current;
                if (!player) return;

                if (!player.paused) {
                    player.pause();
                } else {
                    player.play();
                }
            } else {
                this.setState(
                    {
                        active: true,
                        currentTime: null
                    },
                    () => {
                        const player = this.videoRef.current;
                        if (!player) return;

                        player.volume = 0.25;
                        player.currentTime = 0.0;
                        player.play();
                        //console.log(`VideoNote.play current_time=${this.videoRef.current.currentTime} duration=${this.videoRef.current.duration}`);
                    }
                );
            }
        } else if (this.state.active) {
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

    handleTimeUpdate = () => {
        const { active } = this.state;
        if (!active) return;

        //console.log(`VideoNote.handleTimeUpdate current_time=${this.videoRef.current.currentTime} duration=${this.videoRef.current.duration}`);

        this.setState({
            currentTime: this.videoRef.current.currentTime,
            videoDuration: this.videoRef.current.duration
        });
    };

    handleEnded = () => {
        const { active } = this.state;
        if (!active) return;

        this.setState(
            {
                active: false,
                currentTime: 0,
                videoDuration: this.videoRef.current.duration
            },
            () => {
                if (window.hasFocus) {
                    this.videoRef.current.play();
                }
            }
        );
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
            const time = currentTime + 0.25;
            progress = (time / videoDuration) * 100;
        }
        //console.log('VideoNote.render active=' + active, currentTime, videoDuration, duration, progress);

        return (
            <div className='video-note' style={style} onClick={openMedia}>
                {src ? (
                    <>
                        <video
                            ref={this.videoRef}
                            className={classNames('media-viewer-content-image', 'video-note-round')}
                            src={src}
                            poster={thumbnailSrc}
                            muted={!active}
                            loop={!active}
                            autoPlay
                            playsInline
                            width={style.width}
                            height={style.height}
                            onTimeUpdate={this.handleTimeUpdate}
                            onEnded={this.handleEnded}
                        />
                        <div className='video-note-player'>
                            {active && (
                                <div className='video-note-progress'>
                                    <CircularProgress
                                        classes={circleStyle}
                                        variant='static'
                                        value={progress}
                                        size={200}
                                        thickness={1}
                                    />
                                </div>
                            )}
                            <div className='animation-meta'>
                                {getVideoDurationString(active ? Math.floor(currentTime) : duration)}
                                <MediaStatus chatId={chatId} messageId={messageId} icon={' •'} />
                            </div>
                            {!active && (
                                <div className='video-note-muted'>
                                    <VolumeOffIcon />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className='video-note-round'>
                            <img
                                className={classNames('animation-preview', { 'animation-preview-blurred': isBlurred })}
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
