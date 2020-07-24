/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { clamp, getDurationString } from '../../Utils/Common';
import './PipPlayer.css';
import { PIP_PLAYER_BORDER_PRECISION } from '../../Constants';
import Slider from '@material-ui/core/Slider';
import PauseIcon from '../../Assets/Icons/Pause';
import PlayIcon from '../../Assets/Icons/PlayArrow';
import FullScreen from '../../Assets/Icons/FullScreen';
import PictureInPictureIcon from '@material-ui/icons/PictureInPicture';
import Player from './Player';
import PlayerStore from '../../Stores/PlayerStore';
import Progress from './Progress';
import TdLibController from '../../Controllers/TdLibController';
import CloseIcon from '../../Assets/Icons/Close';
import FileStore from '../../Stores/FileStore';

class PipPlayer extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { video, duration, currentTime, volume, play, buffered, waiting } = props;
        if (state.prevVideo !== video) {
            return {
                prevVideo: video,
                duration,
                currentTime,
                volume,
                play,
                buffered,
                waiting,
                dragging: false,
                hidden: false
            }
        }

        return null;
    }

    componentDidMount() {
        const { video } = this.props;
        this.connectPlayer(video);
        window.addEventListener('resize', this.onWindowResize);
    }

    componentWillUnmount() {
        const { video } = this.props;
        this.disconnectPlayer(video);
        window.removeEventListener('resize', this.onWindowResize);
    }

    onWindowResize = () => {

        const fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
        if (fullscreenElement) return;

        const player = document.getElementById('pip-player');

        const oldLeft = parseInt(player.style.left, 10);
        const oldTop = parseInt(player.style.top, 10);

        const { left, top } = this.normalizePosition(oldLeft, oldTop, true);

        if (oldLeft === left && oldTop === top) return;

        // console.log('[pip] windowResize', left, top);
        player.style.left = left + 'px';
        player.style.top = top + 'px';
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { video } = this.props;

        if (prevProps.video !== video) {
            this.disconnectPlayer(prevProps.video)
            this.connectPlayer(video);
        }
    }

    connectPlayer(video) {
        if (!video) return;

        const pipPlayer = document.getElementById('pip-player');
        const { left, top } = this.normalizePosition(PlayerStore.pipParams.left, PlayerStore.pipParams.top, false);
        pipPlayer.style.left = left + 'px';
        pipPlayer.style.top = top + 'px';

        // console.log('[pip] connect', PlayerStore.pipParams, pipPlayer.style.left, pipPlayer.style.top);

        const container = document.getElementById('pip-player-container');
        if (!container) return;

        video.onloadedmetadata = this.handleLoadedMetadata;
        video.onloadeddata = this.handleLoadedData;
        video.oncanplay = this.handleCanPlay;
        video.onplay = this.handlePlay;
        video.onpause = this.handlePause;
        video.onended = this.handleEnded;
        video.ontimeupdate = this.handleTimeUpdate;
        video.onvolumechange = this.handleVolumeChange;
        video.onprogress = this.handleProgress;
        video.onwaiting = this.handleWaiting;

        container.innerHTML = '';
        container.appendChild(video);
    }

    disconnectPlayer(video) {
        if (!video) return;

        video.onloadedmetadata = null;
        video.onloadeddata = null;
        video.oncanplay = null;
        video.onplay = null;
        video.onpause = null;
        video.onended = null;
        video.ontimeupdate = null;
        video.onvolumechange = null;
        video.onprogress = null;
        video.onwaiting = null;
    }

    handleLoadedData = event => {
        const { target: video } = event;
        if (!video) return;
    };

    handleLoadedMetadata = event => {
        const { target: video } = event;
        if (!video) return;

        const { currentTime } = this.state;
        const { duration, volume, buffered } = video;
        // const currentTime = this.getCurrentTime();

        this.setState({
            duration,
            // currentTime,
            volume,
            waiting: true,
            buffered
        }, () => {
            if (!currentTime) return;

            video.currentTime = currentTime;
        });
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

        const { video } = this.props;
        this.setCurrentTime({currentTime: 0, duration: video.duration });
    };

    handleTimeUpdate = event => {
        const { target: video } = event;
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

    handleVolumeChange = event => {
        const { onVolumeChange } = this.props;

        const { target: video } = event;
        if (!video) return;

        const { volume } = video;

        this.setState({
            volume
        });

        TdLibController.clientUpdate({ '@type' : 'clientUpdateMediaVolume', volume });
        onVolumeChange && onVolumeChange(event);
    };

    handleProgress = event => {
        const { target: video } = event;
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

    handleWaiting = () => {
        this.setState({ waiting: true });
    };

    handleClick = () => {
        this.startStopPlayer();
    };

    startStopPlayer = () => {
        const { video } = this.props;
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

    handlePlayerMouseDown = event => {
        event.preventDefault();

        if (event.nativeEvent.which !== 1) return;

        this.offsetX = event.nativeEvent.offsetX;
        this.offsetY = event.nativeEvent.offsetY;

        document.onmousemove = this.handleMouseMove;
        document.onmouseup = this.handleMouseUp;

        this.setState({
            windowDragging: true
        });
    };

    handleMouseUp = event => {
        event.preventDefault();

        document.onmousemove = null;
        document.onmouseup = null;

        this.setState({
            windowDragging: false
        });
    };

    normalizePosition(left, top, checkGlue = true) {
        const player = document.getElementById('pip-player');
        const playerWidth = player ? player.clientWidth : 300;
        const playerHeight = player ? player.clientHeight : 300;

        const { clientWidth: documentWidth } = document.documentElement;
        const { clientHeight: documentHeight } = document.documentElement;

        if (checkGlue && this.glueLeft) {
            left = 0;
        } else if (checkGlue && this.glueRight) {
            left = documentWidth - playerWidth;
        } else {
            // left = clamp(left - PIP_PLAYER_BORDER_PRECISION, 0, left);
            // left = clamp(left + PIP_PLAYER_BORDER_PRECISION, left, documentWidth - playerWidth);
            left = left < PIP_PLAYER_BORDER_PRECISION ? 0 : left;
            left = left > documentWidth - playerWidth - PIP_PLAYER_BORDER_PRECISION ? documentWidth - playerWidth : left;
            left = clamp(left, 0, documentWidth - playerWidth);
        }

        if (checkGlue && this.glueTop) {
            top = 0;
        } else if (checkGlue && this.glueBottom) {
            top = documentHeight - playerHeight;
        } else {
            top = top < PIP_PLAYER_BORDER_PRECISION ? 0 : top;
            top = top > documentHeight - playerHeight - PIP_PLAYER_BORDER_PRECISION ? documentHeight - playerHeight : top;
            top = clamp(top, 0, documentHeight - playerHeight);
        }

        this.glueLeft = left === 0;
        this.glueRight = left === documentWidth - playerWidth;
        this.glueTop = top === 0;
        this.glueBottom = top === documentHeight - playerHeight;

        PlayerStore.pipParams = { left, top };

        return { left, top };
    }

    handleMouseMove = event => {
        event.preventDefault();

        const { left, top } = this.normalizePosition(event.clientX - this.offsetX, event.clientY - this.offsetY, false);

        const player = document.getElementById('pip-player');
        player.style.left = left + 'px';
        player.style.top = top + 'px';
    };

    handleMouseDown = event => {
        event.stopPropagation();

        const { video } = this.props;
        if (!video) return;

        this.setState({
            dragging: true,
            draggingTime: video.currentTime
        });
    };

    handleChange = (event, value) => {
        const { video } = this.props;
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
            const { video } = this.props;
            if (!video) return;

            if (Number.isFinite(draggingTime)) {
                video.currentTime = draggingTime;
            }
        });
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
    }

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdatePictureInPicture',
            videoInfo: null
        });
    };

    handleVolumeSliderChange = (event, volume) => {
        if (volume === this.state.volume) return;

        this.setState({
            volume
        }, () => {
            const { video } = this.props;
            if (!video) return;

            video.volume = volume;
        });
    };

    handleVolumeSliderChangeCommitted = event => {
        const { video } = this.props;
        if (!video) return;

        document.activeElement.blur();
    };

    handleMute = () => {
        const { video } = this.props;
        if (!video) return;

        if (video.volume === 0) {
            video.volume = this.prevVolume || 0.5;
        } else {
            this.prevVolume = video.volume;
            video.volume = 0;
        }
    }

    handleFullScreen = event => {
        event && event.stopPropagation();

        const root = document.getElementById('pip-player');
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

    getCurrentTime = () => {
        const { fileId } = this.props;

        const file = FileStore.get(fileId);
        if (!file) return;

        const { remote } = file;
        if (!remote) return;

        const { unique_id } = remote;
        if (!unique_id) return;

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
        const { windowDragging, dragging, draggingTime, currentTime, duration, play, waiting, buffered, hidden, volume } = this.state;

        const time = dragging ? draggingTime : currentTime;
        const value = duration > 0 ? time / duration : 0;
        const bufferedTime = Player.getBufferedTime(time, buffered);
        const bufferedValue = duration > 0 ? bufferedTime / duration : 0;

        const timeString = getDurationString(Math.floor(time) || 0);
        const durationString = getDurationString(Math.floor(duration) || 0);

        const pictureInPictureEnabled = true;
        const fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;

        return (
            <div
                id='pip-player'
                className={classNames('pip-player', { 'pip-player-dragging': windowDragging })}
                onMouseDown={this.handlePlayerMouseDown}
                onMouseMove={this.handleMouseOver}>
                <div className='pip-player-wrapper'>
                    <div id='pip-player-container'/>

                    <button onMouseDown={e => e.stopPropagation()} className={classNames('player-button', 'player-button-close', { 'player-panel-hidden': hidden })} onClick={this.handleClose}>
                        <CloseIcon/>
                    </button>
                    <div
                        className={classNames('player-panel', { 'player-panel-hidden': hidden })}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                        onDoubleClick={e => e.stopPropagation()}
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
                                {`${timeString}`}
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
                            <button className='player-button' disabled={!fullscreenEnabled} onClick={this.handleFullScreen}>
                                <FullScreen/>
                            </button>
                            {/*<button className='player-button' disabled={!pictureInPictureEnabled} onClick={this.handlePictureInPicture}>*/}
                            {/*    <PictureInPictureIcon/>*/}
                            {/*</button>*/}
                        </div>
                    </div>
                    <Progress waiting={waiting}/>
                </div>
            </div>
        )
    }
}

PipPlayer.propTypes = {

};

export default PipPlayer;