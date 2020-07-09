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
import { getDurationString } from '../../Utils/Common';
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
            volume: 0.25,
            play: false,
            dragging: false,
            buffered: null,
            waiting: true
        }
    }

    componentDidMount() {
        const video = this.videoRef.current;
        if (!video) return;

        const { volume } = this.state;

        video.volume = volume;
    }

    load() {
        const video = this.videoRef.current;
        if (!video) return;

        video.load();

        this.setState({
            waiting: true,
            currentTime: 0,
            buffered: null
        });
    }

    handleClick = event => {
        event.stopPropagation();

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

    handlePlay = () => {
        this.setState({
            play: true
        });
    };

    handlePause = () => {
        this.setState({
            play: false
        })
    };

    handleTimeUpdate = () => {
        const video = this.videoRef.current;
        if (!video) return;

        console.log('[pl] timeUpdate', video.currentTime, video.duration);

        this.setState({
            duration: video.duration,
            currentTime: video.currentTime,
            volume: video.volume,
            buffered: video.buffered
        })
    };

    handleLoadedData = () => {
        const video = this.videoRef.current;
        if (!video) return;

        console.log('[pl] loadedData', video.currentTime, video.duration);
    };

    handleLoadedMetadata = () => {
        const video = this.videoRef.current;
        if (!video) return;

        console.log('[pl] loadedMetadata', video.currentTime, video.duration);

        this.setState({
            duration: video.duration,
            currentTime: 0,
            play: false,
            volume: video.volume,
            waiting: true,
            buffered: video.buffered
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
        const { draggingTime } = this.state;

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
        event.stopPropagation();

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

    handleMouseDownRoot = () => {
        this.mouseDownRoot = true;
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

    handleVolumeChange = () => {
        const video = this.videoRef.current;
        if (!video) return;

        this.setState({
            volume: video.volume
        });
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

        this.setState({
            buffered: video.buffered
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
        console.log('[pl] waiting');
        const waitingId = Math.random();
        this.waitingId = waitingId;

        setTimeout(() => {
            if (waitingId !== this.waitingId) return;

            this.setState({
                waiting: true
            })
        }, 250);
    };

    handleCanPlay = () => {
        console.log('[pl] canPlay');
        this.waitingId = null;
        this.setState({
            waiting: false
        })
    };

    handlePictureInPicture = () => {
        const video = this.videoRef.current;
        if (!video) return;

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
    }

    render() {
        const { children, src, className, style, width, height, poster } = this.props;
        const { waiting, volume, duration, currentTime, play, dragging, draggingTime, buffered } = this.state;

        const time = dragging ? draggingTime : currentTime;
        const value = time / duration;
        const bufferedTime = this.getBufferedTime(time, buffered);
        const bufferedValue = bufferedTime / duration;

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
                        id='v'
                        className='player-video'
                        ref={this.videoRef}
                        controls={false}
                        autoPlay={true}
                        playsInline={true}
                        src={src}
                        poster={poster}
                        onPlay={this.handlePlay}
                        onPause={this.handlePause}
                        onTimeUpdate={this.handleTimeUpdate}
                        onLoadedMetadata={this.handleLoadedMetadata}
                        onLoadedData={this.handleLoadedData}
                        onVolumeChange={this.handleVolumeChange}
                        onProgress={this.handleProgress}
                        onWaiting={this.handleWaiting}
                        onCanPlay={this.handleCanPlay}
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
                    { waiting && (
                        <div className='player-waiting'>
                            <svg viewBox='0 0 54 54' height='54' width='54'>
                                <circle stroke='white' fill='transparent' strokeWidth='3' strokeDasharray='120 100' strokeDashoffset='25' strokeLinecap='round' r='21' cx='27' cy='27'/>
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

Player.propTypes = {};

//export default React.forwardRef((props, ref) => (<Player forwardedRef={ref} {...props}/>));

export default Player;
