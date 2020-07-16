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
import Progress from './Progress';
import { clamp, getDurationString } from '../../Utils/Common';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import './Player.css';

class Player extends React.Component {
    constructor(props) {
        super(props);

        this.rootRef = React.createRef();
        this.contentRef = React.createRef();
        this.videoRef = React.createRef();

        this.state = {
            duration: 0,
            currentTime: 0,
            volume: PlayerStore.volume,
            play: true,
            dragging: false,
            buffered: null,
            waiting: true
        };
    }

    onKeyDown = event => {
        const { key, code, altKey, ctrlKey, metaKey, shiftKey } = event;

        const video = this.videoRef.current;
        if (!video) return;

        switch (code) {
            case 'ArrowLeft': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    const time = clamp(video.currentTime - 5.0, 0.0, video.duration);
                    this.handleSeek(time);
                }
                break;
            }
            case 'KeyJ': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    const time = clamp(video.currentTime - 10.0, 0.0, video.duration);
                    this.handleSeek(time);
                }
                break;
            }
            case 'ArrowRight': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    const time = clamp(video.currentTime + 5.0, 0.0, video.duration);
                    this.handleSeek(time);
                }
                break;
            }
            case 'KeyL': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    const time = clamp(video.currentTime + 10.0, 0.0, video.duration);
                    this.handleSeek(time);
                }
                break;
            }
            case 'ArrowUp': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    video.volume = clamp(video.volume + 0.05, 0.0, 1.0);
                }
                break;
            }
            case 'ArrowDown': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    video.volume = clamp(video.volume - 0.05, 0.0, 1.0);
                }
                break;
            }
            case 'Space':
            case 'KeyK': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleClick();
                }
                break;
            }
            case 'KeyM': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleMute();
                }
                break;
            }
            case 'KeyF': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleFullScreen();
                }
                break;
            }
            case 'KeyI': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handlePictureInPicture();
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
                }
                break;
            }
            case 'Home': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleSeek(0);
                }
                break;
            }
            case 'End': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey) {
                    this.handleSeek(clamp(video.duration - 1.0, 0.0, video.duration));
                }
                break;
            }
            case 'Comma': {
                if (!altKey && !ctrlKey && !metaKey && shiftKey) {
                    this.handlePlaybackRate(clamp(video.playbackRate - 0.25, 0.25, 1.75));
                }
                break;
            }
            case 'Period': {
                if (!altKey && !ctrlKey && !metaKey && shiftKey) {
                    this.handlePlaybackRate(clamp(video.playbackRate + 0.25, 0.25, 1.75));
                }
                break;
            }
        }
    };

    handlePlaybackRate = rate => {
        const video = this.videoRef.current;
        if (!video) return;

        if (Number.isFinite(rate)) {
            video.playbackRate = rate;
        }
    };

    handleSeekProgress = progress => {
        const video = this.videoRef.current;
        if (!video) return;

        this.handleSeek(progress * video.duration);
    };

    handleSeek = currentTime => {
        const video = this.videoRef.current;
        if (!video) return;

        if (Number.isFinite(currentTime)) {
            this.setState({ currentTime },
                () => {
                    video.currentTime = currentTime;
                });
        }
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

        if (video.paused) {
            video.play()
        } else {
            video.pause();
        }
    };

    handlePlay = event => {
        const { onPlay } = this.props;

        this.setState({
            play: true
        });

        TdLibController.clientUpdate({ '@type': 'clientUpdateMediaViewerPlay' });
        onPlay && onPlay(event);
    };

    handlePause = event => {
        const { onPause } = this.props;

        this.setState({
            play: false
        });

        TdLibController.clientUpdate({ '@type': 'clientUpdateMediaViewerPause' });
        onPause && onPause(event);
    };

    handleEnded = event => {
        const { onEnded } = this.props;

        TdLibController.clientUpdate({ '@type': 'clientUpdateMediaViewerEnded' });
        onEnded && onEnded(event);
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
        })
    };

    handleLoadedData = () => {
        const video = this.videoRef.current;
        if (!video) return;
    };

    handleLoadedMetadata = () => {
        const video = this.videoRef.current;
        if (!video) return;

        const { currentTime, duration, volume, buffered } = video;

        this.setState({
                duration,
                currentTime: 0,
                volume,
                waiting: true,
                buffered
            },
            () => {
                const { play } = this.state;
                if (play) {
                    video.play();
                }
            });

        return;
        const stream = video.captureStream();

        const v2 = document.getElementById('v2');
        v2.srcObject = stream;
    };

    handleChange = (event, value) => {
        const video = this.videoRef.current;
        if (!video) return;

        this.setState({
            draggingTime: value * video.duration
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

    getVolumeIcon = value => {
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

    handleVolumeSliderChange = (event, value) => {
        this.setState({
            volume: value
        }, () => {
            const video = this.videoRef.current;
            if (!video) return;

            video.volume = value;
        });
    };

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

    getBufferedTime = (time, buffered) => {
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
        this.setState({
            waiting: true
        });
    };

    handleCanPlay = () => {
        this.setState({
            waiting: false
        });
    };

    handlePictureInPicture = () => {
        const video = this.videoRef.current;
        if (!video) return;
        if (!video.duration) return;

        const pictureInPictureElement = document.pictureInPictureElement || document.mozPictureInPictureElement || document.webkitPictureInPictureElement;
        if (pictureInPictureElement) {
            this.exitPictureInPicture();
            return;
        }

        this.requestPictureInPicture(video);
    };

    requestPictureInPicture(element) {
        const method = element.requestPictureInPicture || element.mozRequestPictureInPicture || element.webkitRequestPictureInPicture;

        method && method.call(element);
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

    render() {
        const { children, src, className, style, width, height, poster } = this.props;
        const { waiting, volume, duration, currentTime, play, dragging, draggingTime, buffered } = this.state;

        const time = dragging ? draggingTime : currentTime;
        const value = duration > 0 ? time / duration : 0;
        const bufferedTime = this.getBufferedTime(time, buffered);
        const bufferedValue = duration > 0 ? bufferedTime / duration : 0;

        const timeString = getDurationString(Math.floor(time) || 0);
        const durationString = getDurationString(Math.floor(duration) || 0);
        const rootStyle = {
            ...style,
            width,
            height
        }

        const fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;
        const pictureInPictureEnabled = document.pictureInPictureEnabled || document.mozPictureInPictureEnabled || document.webkitPictureInPictureEnabled;

        return (
            <div
                ref={this.rootRef}
                className={classNames('player', className)}
                onMouseDown={this.handleMouseDownRoot}
                onClick={this.handleClickRoot}
                onDoubleClick={this.handleDoubleClick}
                style={rootStyle}>
                <div ref={this.contentRef} className='player-content'>
                    <video
                        className='player-video'
                        ref={this.videoRef}
                        autoPlay={false}
                        controls={false}
                        playsInline={true}
                        src={src}
                        poster={poster}
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
                    <div
                        className='player-panel'
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onDoubleClick={e => e.stopPropagation()}>
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
                                />
                            </div>
                            <button className='player-button' onClick={this.handleMute}>
                                {this.getVolumeIcon(volume)}
                            </button>
                            <button className='player-button' disabled={!fullscreenEnabled} onClick={this.handleFullScreen}>
                                <FullScreen/>
                            </button>
                            <button className='player-button' disabled={!pictureInPictureEnabled} onClick={this.handlePictureInPicture}>
                                <PictureInPictureIcon/>
                            </button>
                        </div>
                    </div>
                    <Progress waiting={waiting}/>
                </div>
            </div>
        );
    }
}

Player.propTypes = {};

//export default React.forwardRef((props, ref) => (<Player forwardedRef={ref} {...props}/>));

export default Player;
