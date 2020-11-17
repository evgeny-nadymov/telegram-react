/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Slider from '@material-ui/core/Slider';
import VolumeMuteIcon from '@material-ui/icons/VolumeMute';
import VolumeDownIcon from '@material-ui/icons/VolumeDown';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import PictureInPictureIcon from '@material-ui/icons/PictureInPicture';
import FullScreen from '../../Assets/Icons/FullScreen';
import PlayIcon from '../../Assets/Icons/PlayArrow';
import PauseIcon from '../../Assets/Icons/Pause';
import Hint from './Hint';
import Progress from './Progress';
import { clamp, getDurationString } from '../../Utils/Common';
import {
    PLAYER_LOOP_MAX_DURATION,
    PLAYER_PLAYBACKRATE_MAX,
    PLAYER_PLAYBACKRATE_MIN,
    PLAYER_PLAYBACKRATE_STEP,
    PLAYER_SEEK_STEP_BIG,
    PLAYER_SEEK_STEP_SMALL,
    PLAYER_VOLUME_MAX,
    PLAYER_VOLUME_MIN,
    PLAYER_VOLUME_STEP
} from '../../Constants';
import FileStore from '../../Stores/FileStore';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import './Player.css';

class Player extends React.Component {
    constructor(props) {
        super(props);

        this.rootRef = React.createRef();
        this.contentRef = React.createRef();
        this.videoRef = React.createRef();

        const { currentTime, duration } = this.getCurrentTime();

        this.state = {
            noPoster: currentTime > 0 && duration > 0,
            duration,
            currentTime,
            volume: PlayerStore.volume,
            play: true,
            dragging: false,
            buffered: null,
            waiting: true,
            hidden: false
        };
    }

    onKeyDown = event => {
        const { key, code, altKey, ctrlKey, metaKey, shiftKey } = event;

        const video = this.videoRef.current;
        if (!video) return;

        let handled = false;
        switch (code) {
            case 'ArrowLeft': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleSeek(video.currentTime - PLAYER_SEEK_STEP_SMALL);
                    handled = true;
                }
                break;
            }
            case 'KeyJ': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleSeek(video.currentTime - PLAYER_SEEK_STEP_BIG);
                    handled = true;
                }
                break;
            }
            case 'ArrowRight': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleSeek(video.currentTime + PLAYER_SEEK_STEP_SMALL);
                    handled = true;
                }
                break;
            }
            case 'KeyL': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleSeek(video.currentTime + PLAYER_SEEK_STEP_BIG);
                    handled = true;
                }
                break;
            }
            case 'ArrowUp': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleVolume(video.volume + PLAYER_VOLUME_STEP);
                    handled = true;
                }
                break;
            }
            case 'ArrowDown': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleVolume(video.volume - PLAYER_VOLUME_STEP);
                    handled = true;
                }
                break;
            }
            case 'Space':
            case 'KeyK': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleClick();
                    handled = true;
                }
                break;
            }
            case 'KeyM': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleMute();
                    handled = true;
                }
                break;
            }
            case 'KeyF': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleFullScreen();
                    handled = true;
                }
                break;
            }
            case 'KeyI': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handlePictureInPicture();
                    handled = true;
                }
                break;
            }
            case 'Digit0':
            case 'Digit1':
            case 'Digit2':
            case 'Digit3':
            case 'Digit4':
            case 'Digit5':
            case 'Digit6':
            case 'Digit7':
            case 'Digit8':
            case 'Digit9': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    const progress = new Number(key.replace('Digit', '')) / 10.0;
                    this.handleSeekProgress(progress);
                    handled = true;
                }
                break;
            }
            case 'Home': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleSeek(0);
                    handled = true;
                }
                break;
            }
            case 'End': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleSeek(video.duration - 1.0);
                    handled = true;
                }
                break;
            }
            case 'Comma': {
                if (!altKey && !ctrlKey && !metaKey && shiftKey) {
                    this.handlePlaybackRate(video.playbackRate - PLAYER_PLAYBACKRATE_STEP);
                    handled = true;
                }
                break;
            }
            case 'Period': {
                if (!altKey && !ctrlKey && !metaKey && shiftKey) {
                    this.handlePlaybackRate(video.playbackRate + PLAYER_PLAYBACKRATE_STEP);
                    handled = true;
                }
                break;
            }
        }

        if (handled) {
            event.stopPropagation();
            event.preventDefault();
        }
    };

    handleVolume = volume => {
        const video = this.videoRef.current;
        if (!video) return;

        volume = clamp(volume, PLAYER_VOLUME_MIN, PLAYER_VOLUME_MAX);

        video.volume = volume;
        this.showMediaHint(`${Math.round(video.volume * 100)}%`);
    };

    handlePlaybackRate = rate => {
        const video = this.videoRef.current;
        if (!video) return;

        rate = clamp(rate, PLAYER_PLAYBACKRATE_MIN, PLAYER_PLAYBACKRATE_MAX)

        video.playbackRate = rate;
        this.showMediaHint(`${rate}x`);
    };

    handleSeekProgress = progress => {
        const video = this.videoRef.current;
        if (!video) return;

        this.handleSeek(progress * video.duration);
    };

    handleSeek = currentTime => {
        const video = this.videoRef.current;
        if (!video) return;

        currentTime = clamp(currentTime, 0, video.duration || 0);

        video.currentTime = currentTime;
        this.setState({ currentTime });
    };

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaShortcut', this.onClientUpdateMediaShortcut);

        const video = this.videoRef.current;
        if (!video) return;

        const { volume } = this.state;

        video.volume = volume;
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaShortcut', this.onClientUpdateMediaShortcut);
    }

    onClientUpdateMediaShortcut = update => {
        const { event } = update;
        if (!event) return;

        this.onKeyDown(event);
    };

    load() {
        const video = this.videoRef.current;
        if (!video) return;

        video.load();

        this.setState({
            duration: 0,
            currentTime: 0,
            play: true,
            dragging: false,
            buffered: null,
            waiting: true
        });
    }

    handleClick = () => {
        this.startStopPlayer();
    };

    startStopPlayer = () => {
        const video = this.videoRef.current;
        if (!video) return;

        const { waiting } = this.state;
        if (waiting) {
            this.setState({
                play: !this.state.play,
                hidden: false
            });
        } else {
            if (video.paused) {
                video.play()
            } else {
                video.pause();
            }
        }
    };

    handlePlay = event => {
        const { onPlay } = this.props;

        this.setState({
            play: true,
            hidden: true
        });

        TdLibController.clientUpdate({ '@type': 'clientUpdateMediaViewerPlay' });
        onPlay && onPlay(event);
    };

    handlePause = event => {
        const { onPause } = this.props;

        this.setState({
            play: false,
            hidden: false
        });

        TdLibController.clientUpdate({ '@type': 'clientUpdateMediaViewerPause' });
        onPause && onPause(event);
    };

    handleEnded = event => {
        const { onEnded } = this.props;

        TdLibController.clientUpdate({ '@type': 'clientUpdateMediaViewerEnded' });
        onEnded && onEnded(event);

        const video = this.videoRef.current;
        this.setCurrentTime({ currentTime: 0, duration: video.duration });
    };

    handleTimeUpdate = () => {
        const video = this.videoRef.current;
        if (!video) return;

        const { fileId } = this.props;
        const { currentTime, duration, volume, buffered } = video;

        this.setState({
            duration,
            currentTime,
            volume,
            buffered
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaViewerTimeUpdate',
            fileId,
            currentTime,
            duration,
            volume,
            buffered
        });

        this.setCurrentTime({ currentTime, duration });
    };

    handleLoadedData = () => {
        const video = this.videoRef.current;
        if (!video) return;
    };

    handleLoadedMetadata = () => {
        const video = this.videoRef.current;
        if (!video) return;

        const { currentTime } = this.state;
        const { duration, volume, buffered } = video;

        this.setState({
            duration,
            volume,
            waiting: true,
            buffered
        }, () => {
            if (!currentTime) return;

            video.currentTime = currentTime;
        });
    };

    handleMouseDown = event => {
        event.stopPropagation();

        const video = this.videoRef.current;
        if (!video) return;

        this.setState({
            dragging: true,
            draggingTime: video.currentTime
        });
    };

    handleChange = (event, value) => {
        const video = this.videoRef.current;
        if (!video) return;

        this.setState({
            draggingTime: value * video.duration
        });
    };

    handleChangeCommitted = () => {
        const { dragging, draggingTime } = this.state;
        if (!dragging) return;

        this.setState({
            dragging: false,
            currentTime: draggingTime,
            draggingTime: 0
        }, () => {
            const video = this.videoRef.current;
            if (!video) return;

            if (Number.isFinite(draggingTime)) {
                video.currentTime = draggingTime;
            }
        });
    };

    handleFullScreen = event => {
        event && event.stopPropagation();

        const root = this.contentRef.current;
        if (!root) return;

        const fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
        if (fullscreenElement) {
            this.exitFullscreen();
            return;
        }

        this.requestFullscreen(root);
    };

    requestFullscreen(element) {
        const method = element.requestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

        method && method.call(element);
    }

    exitFullscreen() {
        const method = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen;

        method && method.call(document);
    }

    handleClickRoot = event => {
        event.stopPropagation();

        const { mouseDownRoot } = this;
        if (!mouseDownRoot) return;

        this.mouseDownRoot = false;
        this.startStopPlayer();
    }

    handleMouseDownRoot = event => {
        this.mouseDownRoot = true;
        event.stopPropagation();
    }

    static getVolumeIcon = value => {
        if (value === 0) {
            return <VolumeOffIcon fontSize='small' />;
        }

        if (value < 0.25) {
            return <VolumeMuteIcon fontSize='small' />;
        }

        if (value < 0.5) {
            return <VolumeDownIcon fontSize='small' />;
        }

        return <VolumeUpIcon fontSize='small' />;
    };

    handleVolumeChange = event => {
        const { onVolumeChange } = this.props;

        const video = this.videoRef.current;
        if (!video) return;

        const { volume } = video;

        this.setState({
            volume
        });

        TdLibController.clientUpdate({ '@type' : 'clientUpdateMediaVolume', volume });
        onVolumeChange && onVolumeChange(event);
    };

    handleVolumeSliderChange = (event, volume) => {
        if (volume === this.state.volume) return;

        this.setState({
            volume
        }, () => {
            const video = this.videoRef.current;
            if (!video) return;

            video.volume = volume;
        });
    };

    handleVolumeSliderChangeCommitted = event => {
        const video = this.videoRef.current;
        if (!video) return;

        document.activeElement.blur();
    };

    showMediaHint(text) {
        const { fileId } = this.props;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaHint',
            fileId,
            text
        });
    }

    handleMute = () => {
        const video = this.videoRef.current;
        if (!video) return;

        if (video.volume === 0) {
            video.volume = this.prevVolume || 0.5;
        } else {
            this.prevVolume = video.volume;
            video.volume = 0;
        }
    }

    handleProgress = () => {
        const video = this.videoRef.current;
        if (!video) return;

        const { fileId } = this.props;

        const { buffered } = video;

        this.setState({
            buffered
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaViewerProgress',
            fileId,
            buffered
        });
    };

    static getBufferedTime = (time, buffered) => {
        if (!buffered || !buffered.length) {
            return 0;
        }

        for (let i = 0; i < buffered.length; i++) {
            const start = buffered.start(i);
            const end = buffered.end(i);
            if (start <= time && time < end) {
                return end;
            }
        }

        return 0;
    }

    handleWaiting = () => {
        this.setState({ waiting: true });
    };

    handleCanPlay = event => {
        const { target: video } = event;

        this.setState({
            waiting: false
        }, () => {
            if (!video) return;

            const { play } = this.state;
            if (play) {
                video.play();
            } else {
                video.pause();
            }
        });
    };

    handlePictureInPicture = async () => {
        const { fileId } = this.props;
        const { duration, currentTime, volume, play, buffered, waiting } = this.state;

        const video = this.videoRef.current;
        if (!video) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdatePictureInPicture',
            videoInfo: {
                fileId,
                video,
                duration,
                currentTime,
                volume,
                play,
                buffered,
                waiting
            }
        });

        return;

        if (!video.duration) return;

        const pictureInPictureElement = document.pictureInPictureElement || document.mozPictureInPictureElement || document.webkitPictureInPictureElement;
        if (pictureInPictureElement) {
            this.exitPictureInPicture();
            return;
        }

        try {
            const pipWindow = await this.requestPictureInPicture(video);
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaViewerContent',
                content: null
            });
            video.onpause = event => {
                event.target.play();
                event.target.onpause = null;
            };
            video.addEventListener('leavepictureinpicture', this.handleLeavePictureInPicture);
        } catch (error) { }
    };

    handleLeavePictureInPicture = event => {
        const video = this.videoRef.current;

        if (!video) event.target.src = null;
        event.target.removeEventListener('leavepictureinpicture', this.handleLeavePictureInPicture);
    };

    async requestPictureInPicture(element) {
        const method = element.requestPictureInPicture || element.mozRequestPictureInPicture || element.webkitRequestPictureInPicture;
        if (!method) return null;

        return method.call(element);
    }

    exitPictureInPicture() {
        const method = document.exitPictureInPicture || document.mozExitPictureInPicture || document.webkitExitPictureInPicture;

        method && method.call(document);
    }

    handleDoubleClick = event => {
        this.handleFullScreen(event);
    };

    handleVideoKeyDown = event => {
        event.preventDefault();
    };

    handlePanelDoubleClick = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    handlePanelEnter = () => {
        this.panelEnter = true;
    };

    handlePanelLeave = () => {
        this.panelEnter = false;
    };

    handleMouseOver = event => {
        const { hidden } = this.state;

        if (hidden) {
            this.setState({
                hidden: false
            });
        }

        clearTimeout(this.mouseOverTimeout);
        this.mouseOverTimeout = setTimeout(() => {
            if (this.panelEnter) return;
            if (!this.state.play) return;

            this.setState({
                hidden: true
            });
        }, 1000);
    };

    getCurrentTime = () => {
        const { fileId } = this.props;

        const file = FileStore.get(fileId);
        if (!file) return { currentTime: 0, duration: 0 };

        const { remote } = file;
        if (!remote) return { currentTime: 0, duration: 0 };

        const { unique_id } = remote;
        if (!unique_id) return { currentTime: 0, duration: 0 };

        return PlayerStore.getCurrentTime(unique_id);
    };

    setCurrentTime = currentTime => {
        const { fileId } = this.props;

        const file = FileStore.get(fileId);
        if (!file) return;

        const { remote } = file;
        if (!remote) return;

        const { unique_id } = remote;
        if (!unique_id) return;

        if (!currentTime) {
            PlayerStore.clearCurrentTime(unique_id);
        } else {
            PlayerStore.setCurrentTime(unique_id, currentTime);
        }
    };

    render() {
        const { children, src, className, style, width, height, poster, fileId } = this.props;
        const { waiting, volume, duration, currentTime, play, dragging, draggingTime, buffered, hidden, noPoster } = this.state;

        const time = dragging ? draggingTime : currentTime;
        const value = duration > 0 ? time / duration : 0;
        const bufferedTime = Player.getBufferedTime(time, buffered);
        const bufferedValue = duration > 0 ? bufferedTime / duration : 0;

        const timeString = getDurationString(Math.floor(time) || 0);
        const durationString = getDurationString(Math.floor(duration) || 0);
        const rootStyle = {
            ...style,
            width,
            height
        }

        const fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;
        const pictureInPictureEnabled = true;//document.pictureInPictureEnabled || document.mozPictureInPictureEnabled || document.webkitPictureInPictureEnabled;

        return (
            <div
                ref={this.rootRef}
                className={classNames('player', className)}
                onMouseDown={this.handleMouseDownRoot}
                onClick={this.handleClickRoot}
                onDoubleClick={this.handleDoubleClick}
                style={rootStyle}>
                <div ref={this.contentRef} className={classNames('player-content', { 'player-content-hidden': hidden })} onMouseMove={this.handleMouseOver}>
                    <video
                        className='player-video'
                        ref={this.videoRef}
                        autoPlay={false}
                        controls={false}
                        playsInline={true}
                        src={src}
                        poster={noPoster ? null : poster}
                        loop={duration <= PLAYER_LOOP_MAX_DURATION}
                        onLoadedMetadata={this.handleLoadedMetadata}
                        onLoadedData={this.handleLoadedData}
                        onCanPlay={this.handleCanPlay}
                        onPlay={this.handlePlay}
                        onPause={this.handlePause}
                        onEnded={this.handleEnded}
                        onTimeUpdate={this.handleTimeUpdate}
                        onVolumeChange={this.handleVolumeChange}
                        onProgress={this.handleProgress}
                        onWaiting={this.handleWaiting}
                        onKeyDown={this.handleVideoKeyDown}
                    >
                        {children}
                    </video>
                    <Hint fileId={fileId}/>
                    <div
                        className={classNames('player-panel', { 'player-panel-hidden': hidden })}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onDoubleClick={this.handlePanelDoubleClick}
                        onMouseEnter={this.handlePanelEnter}
                        onMouseLeave={this.handlePanelLeave}>
                        <div className='player-slider'>
                            <span className='player-slider-buffer-track' style={{ width: bufferedValue * 100 + '%'}}/>
                            <Slider
                                value={value}
                                min={0}
                                max={1}
                                step={0.001}
                                classes={{
                                    root: 'player-slider-root',
                                    rail: 'player-slider-rail',
                                    track: 'player-slider-track',
                                    thumb: 'player-slider-thumb',
                                    active: 'player-slider-active'
                                }}
                                onChange={this.handleChange}
                                onChangeCommitted={this.handleChangeCommitted}
                                onMouseDown={this.handleMouseDown}
                            />
                        </div>
                        <div className='player-controls'>
                            <button className='player-button' onClick={this.handleClick}>
                                {play ? <PauseIcon/> : <PlayIcon/>}
                            </button>
                            <div className='player-time'>
                                {`${timeString} / ${durationString}`}
                            </div>
                            <div className='player-volume'>
                                <Slider
                                    value={volume}
                                    min={0}
                                    max={1}
                                    step={0.001}
                                    classes={{
                                        root: 'player-volume-root',
                                        rail: 'player-volume-rail',
                                        track: 'player-volume-track',
                                        thumb: 'player-volume-thumb',
                                        active: 'player-volume-active'
                                    }}
                                    onChange={this.handleVolumeSliderChange}
                                    onChangeCommitted={this.handleVolumeSliderChangeCommitted}
                                />
                            </div>
                            <button className='player-button' onClick={this.handleMute}>
                                {Player.getVolumeIcon(volume)}
                            </button>
                            <button className='player-button' disabled={!pictureInPictureEnabled} onClick={this.handlePictureInPicture}>
                                <PictureInPictureIcon/>
                            </button>
                            <button className='player-button' disabled={!fullscreenEnabled} onClick={this.handleFullScreen}>
                                <FullScreen/>
                            </button>
                        </div>
                    </div>
                    <Progress waiting={waiting}/>
                </div>
            </div>
        );
    }
}

Player.propTypes = {
    fileId: PropTypes.number
};

//export default React.forwardRef((props, ref) => (<Player forwardedRef={ref} {...props}/>));

export default Player;
