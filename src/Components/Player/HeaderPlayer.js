/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import PlayArrowIcon from '../../Assets/Icons/PlayArrow';
import PauseIcon from '../../Assets/Icons/Pause';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import CloseIcon from '../../Assets/Icons/Close';
import IconButton from '@material-ui/core/IconButton';
import VolumeButton from '../Player/VolumeButton';
import RepeatButton from '../Player/RepeatButton';
import ShuffleButton from '../Player/ShuffleButton';
import PlaybackRateButton from './PlaybackRateButton';
import Time from '../Player/Time';
import Playlist from '../Player/Playlist';
import { supportsStreaming } from '../../Utils/File';
import { openChat } from '../../Actions/Client';
import { getDate, getDateHint, getMessageAudio, hasAudio, hasVoice, useAudioPlaybackRate } from '../../Utils/Message';
import { getCurrentTime, getMediaTitle, getMediaMimeType, getMediaSrc, isCurrentSource, playlistItemEquals } from '../../Utils/Player';
import { openMediaInstantView } from '../../Actions/InstantView';
import { clamp } from '../../Utils/Common';
import { PLAYER_PLAYBACKRATE_NORMAL, PLAYER_SEEK_STEP_BIG } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import './HeaderPlayer.css';

class HeaderPlayer extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();

        const { message, block, instantView, playlist } = PlayerStore;
        const { currentTime, duration } = getCurrentTime(message);

        this.state = {
            currentTime,
            duration,
            message,
            block,
            instantView,
            playlist,
            playing: false,
            src: getMediaSrc(message),
            mimeType: getMediaMimeType(message)
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { message, block, playlist, src, playing } = this.state;

        if (nextState.block !== block) {
            return true;
        }

        if (nextState.message !== message) {
            return true;
        }

        if (nextState.playlist !== playlist) {
            return true;
        }

        if (nextState.src !== src) {
            return true;
        }

        if (nextState.playing !== playing) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        this.addMediaSessionHandlers();

        AppStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        FileStore.on('clientUpdateVoiceNoteBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateVideoNoteBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateAudioBlob', this.onClientUpdateMediaBlob);
        MessageStore.on('clientUpdateRecordStart', this.onClientUpdateRecordStart);
        MessageStore.on('clientUpdateRecordStop', this.onClientUpdateRecordStop);
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaClose', this.onClientUpdateMediaClose);
        PlayerStore.on('clientUpdateMediaPlaylist', this.onClientUpdateMediaPlaylist);
        PlayerStore.on('clientUpdateMediaViewerPlay', this.onClientUpdateMediaViewerPlay);
        PlayerStore.on('clientUpdateMediaViewerPause', this.onClientUpdateMediaViewerPause);
        PlayerStore.on('clientUpdateMediaViewerEnded', this.onClientUpdateMediaViewerEnded);
        PlayerStore.on('clientUpdateMediaVolume', this.onClientUpdateMediaVolume);
        PlayerStore.on('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);
        PlayerStore.on('clientUpdateMediaAudioPlaybackRate', this.onClientUpdateMediaAudioPlaybackRate);
        PlayerStore.on('clientUpdateMediaSeek', this.onClientUpdateMediaSeek);
    }

    componentWillUnmount() {
        this.removeMediaSessionHandlers();

        AppStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        FileStore.off('clientUpdateVoiceNoteBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateVideoNoteBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateAudioBlob', this.onClientUpdateMediaBlob);
        MessageStore.off('clientUpdateRecordStart', this.onClientUpdateRecordStart);
        MessageStore.off('clientUpdateRecordStop', this.onClientUpdateRecordStop);
        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaClose', this.onClientUpdateMediaClose);
        PlayerStore.off('clientUpdateMediaPlaylist', this.onClientUpdateMediaPlaylist);
        PlayerStore.off('clientUpdateMediaViewerPlay', this.onClientUpdateMediaViewerPlay);
        PlayerStore.off('clientUpdateMediaViewerPause', this.onClientUpdateMediaViewerPause);
        PlayerStore.off('clientUpdateMediaViewerEnded', this.onClientUpdateMediaViewerEnded);
        PlayerStore.off('clientUpdateMediaVolume', this.onClientUpdateMediaVolume);
        PlayerStore.off('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);
        PlayerStore.off('clientUpdateMediaAudioPlaybackRate', this.onClientUpdateMediaAudioPlaybackRate);
        PlayerStore.off('clientUpdateMediaSeek', this.onClientUpdateMediaSeek);
    }

    addMediaSessionHandlers() {
        const { mediaSession } = navigator;
        if (!mediaSession) return;

        try {
            mediaSession.setActionHandler('nexttrack', this.handleNext);
            mediaSession.setActionHandler('previoustrack', this.handlePrev);
            mediaSession.setActionHandler('seekforward', this.handleSeekForward);
            mediaSession.setActionHandler('seekbackward', this.handleSeekBackward);
            mediaSession.setActionHandler('seekto', this.handleSeekTo);
        } catch {

        }
    }

    handleSeekForward = () => {
        const video = this.videoRef.current;
        if (!video) return;

        this.handleSeek(video.currentTime + PLAYER_SEEK_STEP_BIG);
    };

    handleSeekBackward = () => {
        const video = this.videoRef.current;
        if (!video) return;

        this.handleSeek(video.currentTime - PLAYER_SEEK_STEP_BIG);
    };

    handleSeekTo = event => {
        const video = this.videoRef.current;
        if (!video) return;

        this.handleSeek(event.seekTime);
    };

    handleSeek = currentTime => {
        const video = this.videoRef.current;
        if (!video) return;

        currentTime = clamp(currentTime, 0, video.duration || 0);

        video.currentTime = currentTime;
    };

    removeMediaSessionHandlers() {
        const { mediaSession } = navigator;
        if (!mediaSession) return;

        try{
            mediaSession.setActionHandler('nexttrack', null);
            mediaSession.setActionHandler('previoustrack', null);
            mediaSession.setActionHandler('seekforward', null);
            mediaSession.setActionHandler('seekbackward', null);
            mediaSession.setActionHandler('seekto', null);
        }catch {

        }
    }

    fadeOutVolume(duration) {
        const player = this.videoRef.current;
        if (!player) return;

        const totalIterations = 20;
        let count = 0;
        const currentVolume = player.volume;
        this.volumeInterval = setInterval(() => {
            if (count >= totalIterations) {
                player.pause();
                player.volume = currentVolume;
                clearInterval(this.volumeInterval);
            } else {
                player.volume = currentVolume / (count + 1);
                count++;
            }
        }, duration / totalIterations);
    }

    fadeInVolume(duration) {
        const player = this.videoRef.current;
        if (!player) return;

        const totalIterations = 20;
        let count = 0;
        const currentVolume = player.volume;
        player.volume = 0;
        player.play();
        this.volumeInterval = setInterval(() => {
            if (count >= totalIterations) {
                player.volume = currentVolume;
                clearInterval(this.volumeInterval);
            } else {
                player.volume = currentVolume / totalIterations * (count + 1);
                count++;
            }
        }, duration / totalIterations);
    }

    onClientUpdateRecordStart = update => {
        const player = this.videoRef.current;
        if (!player) return;

        if (!player.paused) {
            this.fadeOutVolume(250);
            this.pausedForRecord = true;
        }
    };

    onClientUpdateRecordStop = update => {
        const player = this.videoRef.current;
        if (!player) return;

        if (player.paused && this.pausedForRecord) {
            this.fadeInVolume(250);
            this.pausedForRecord = false;
        }
    };

    onClientUpdateMediaPlaybackRate = update => {
        const { playbackRate } = update;

        const { message, block } = this.state;
        if (!message && !block) return;

        const audio = hasAudio(message || block);
        if (audio) return;

        const player = this.videoRef.current;
        if (!player) return;

        player.playbackRate = playbackRate;
    };

    onClientUpdateMediaAudioPlaybackRate = update => {
        const { audioPlaybackRate } = update;

        const { message, block } = this.state;
        if (!message && !block) return;

        if (!hasAudio(message || block)) return;
        if (!useAudioPlaybackRate(message || block)) return;

        const player = this.videoRef.current;
        if (!player) return;

        player.playbackRate = audioPlaybackRate;
    };

    onClientUpdateMediaVolume = update => {
        const { volume } = update;

        const player = this.videoRef.current;
        if (!player) return;

        player.volume = volume;
    };

    onClientUpdateMediaSeek = update => {
        const { source, value, duration } = update;
        const { message, block } = this.state;

        if (!isCurrentSource(message? message.chat_id : 0, message? message.id : 0, block, source)) return;

        const player = this.videoRef.current;
        if (!player) return;
        if (!player.duration) {
            this.currentValue = { value, duration };
            return;
        }

        player.currentTime = value * player.duration;
    };

    onClientUpdateMediaViewerContent = update => {
        this.playingMediaViewer = Boolean(AppStore.mediaViewerContent);
    };

    onClientUpdateMediaViewerEnded = update => {
        this.playingMediaViewer = false;
    };

    onClientUpdateMediaViewerPause = update => {
        this.playingMediaViewer = false;
    };

    onClientUpdateMediaViewerPlay = update => {
        this.playingMediaViewer = true;

        const player = this.videoRef.current;
        if (!player) return;

        this.fadeOutVolume(250);
    };

    startPlayingFile = source => {
        if (!source) return;

        const { playlist } = PlayerStore;
        const { src: prevSrc } = this.state;

        const src = getMediaSrc(source);
        const mimeType = getMediaMimeType(source);
        const { currentTime, duration } = getCurrentTime(source);
        const playing = Boolean(src);

        const srcSource = source['@type'] === 'instantViewSource'
            ? { message: null, block: source.block, instantView: source.instantView }
            : { message: source, block: null, instantView: null };

        this.setState(
            {
                currentTime,
                duration,
                playlist,
                playing,
                src,
                ...srcSource,
                mimeType
            },
            () => {
                const player = this.videoRef.current;
                if (!player) return;

                if (prevSrc !== src) {
                    player.load();
                    if (this.currentValue) {
                        player.currentTime = this.currentValue.value * this.currentValue.duration;
                        this.currentValue = null;
                    } else {
                        player.currentTime = currentTime;
                    }
                }

                if (this.playingMediaViewer) {
                    player.pause();

                    TdLibController.clientUpdate({
                        '@type': 'clientUpdateMediaPause',
                        source
                    });
                } else if (player.paused) {
                    player.play();
                }
            }
        );
    };

    onClientUpdateMediaBlob = update => {
        const { chatId, messageId, fileId } = update;
        const { message, block, instantView } = this.state;

        if (message) {
            const { chat_id, id, content } = message;
            if (!content) return;
            if (chatId !== chat_id || messageId !== id) return;

            let startPlaying = false;
            switch (content['@type']) {
                case 'messageText': {
                    const { web_page } = content;
                    if (web_page) {
                        const { audio, voice_note, video_note } = web_page;

                        if (audio) {
                            if (supportsStreaming()) return;

                            const { audio: file } = audio;
                            if (file) {
                                startPlaying = true;
                                break;
                            }
                        }

                        if (voice_note) {
                            const { voice } = voice_note;
                            if (voice) {
                                startPlaying = true;
                                break;
                            }
                        }

                        if (video_note) {
                            const { video } = video_note;
                            if (video) {
                                startPlaying = true;
                                break;
                            }
                        }
                    }

                    break;
                }
                case 'messageAudio': {
                    const { audio } = content;
                    if (audio) {
                        if (supportsStreaming()) return;

                        const { audio: file } = audio;
                        if (file) {
                            startPlaying = true;
                            break;
                        }
                    }

                    break;
                }
                case 'messageVoiceNote': {
                    const { voice_note } = content;
                    if (voice_note) {
                        const { voice } = voice_note;
                        if (voice) {
                            startPlaying = true;
                            break;
                        }
                    }

                    break;
                }
                case 'messageVideoNote': {
                    const { video_note } = content;
                    if (video_note) {
                        const { video } = video_note;
                        if (video) {
                            startPlaying = true;
                            break;
                        }
                    }

                    break;
                }
            }

            if (startPlaying) {
                this.startPlayingFile(message);
            }
        } else if (block) {
            let startPlaying = false;
            switch (block['@type']) {
                case 'pageBlockAudio': {
                    const { audio } = block;
                    if (audio) {
                        if (supportsStreaming()) return;

                        const { audio: file } = audio;
                        if (file && file.id === fileId) {
                            startPlaying = true;
                        }
                    }

                    break;
                }
                case 'pageBlockVoiceNote': {
                    const { voice_note } = block;
                    if (voice_note) {
                        const { voice: file } = voice_note;
                        if (file && file.id === fileId) {
                            startPlaying = true;
                        }
                    }

                    break;
                }
                case 'pageBlockVideoNote': {
                    const { video_note } = block;
                    if (video_note) {
                        const { video: file } = video_note;
                        if (file && file.id === fileId) {
                            startPlaying = true;
                        }
                    }

                    break;
                }
            }

            if (startPlaying) {
                this.startPlayingFile({ '@type': 'instantViewSource', block, instantView });
            }
        }
    };

    onClientUpdateMediaPlaylist = update => {
        const { playlist, source } = update;
        const { message, block } = this.state;

        const chatId = message ? message.chat_id : 0;
        const messageId = message ? message.id : 0;

        if (isCurrentSource(chatId, messageId, block, source)) {
            this.setState({ playlist });
        }
    };

    onClientUpdateMediaClose = update => {
        this.setState({
            message: null,
            block: null,
            instantView: null,
            playlist: null,
            playing: false,
            src: null,
            mimeType: null
        }, () => {
            const player = this.videoRef.current;
            if (!player) return;

            player.load();
        });
    };

    onClientUpdateMediaActive = update => {
        const { source } = update;
        const { message, block, src } = this.state;

        if (isCurrentSource(message ? message.chat_id : 0, message ? message.id : 0, block, source)) {
            if (!src) return;

            const player = this.videoRef.current;
            if (!player) return;

            this.pausedForRecord = false;
            if (player.paused) {
                player.play();
            } else {
                player.pause();
            }
        } else {
            this.startPlayingFile(source);
        }
    };

    handlePrev = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPrev'
        });
    };

    handlePlay = () => {
        const { message, block, instantView } = this.state;
        if (!message && !block) return;

        const source = message || { '@type': 'instantViewSource', block, instantView };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaActive',
            source
        });
    };

    handleNext = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaNext'
        });
    };

    handleEnded = (moveNext = true) => {
        const { message, block, instantView } = this.state;
        if (!message && !block) return;

        const source = message || { '@type': 'instantViewSource', block, instantView };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaEnding',
            source,
            moveNext
        });

        this.setState(
            {
                //playing: false,
                //message: null,
                //src: null
            },
            () => {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateMediaEnd',
                    source,
                    moveNext
                });
            }
        );
    };

    handleVideoEnded = () => {
        const video = this.videoRef.current;
        this.setCurrentTime({ currentTime: 0, duration: video.duration });

        this.handleEnded(true);
    };

    handleClose = () => {
        const player = this.videoRef.current;
        if (player) {
            player.pause();
        }

        this.handleEnded(false);
    };

    handleLoadedMetadata = () => {
        let { message, block, instantView, currentTime } = this.state;
        if (!message && !block) return;

        const player = this.videoRef.current;
        if (!player) return;

        const { audioPlaybackRate, playbackRate, volume } = PlayerStore;

        const audio = hasAudio(message || block);
        const voiceNote = hasVoice(message || block);

        let rate = PLAYER_PLAYBACKRATE_NORMAL;
        if (voiceNote) {
            rate = playbackRate;
        } else if (audio && useAudioPlaybackRate(message || block)) {
            rate = audioPlaybackRate;
        }

        player.playbackRate = rate;
        player.volume = volume;
        player.muted = false;
        if (this.currentValue) {
            player.currentTime = player.duration * this.currentValue.value;
            this.currentValue = null;
        } else {
            player.currentTime = currentTime;
        }

        player.play();

        const { buffered, duration, videoWidth, videoHeight } = player;
        const source = message || { '@type': 'instantViewSource', block, instantView };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaLoadedMetadata',
            source,
            buffered,
            duration,
            videoWidth,
            videoHeight
        });

        if (audio) {
            return;
        }
        if (voiceNote) {
            return;
        }

        let stream = null;
        if ('captureStream' in player) {
            stream = player.captureStream();
        } else if ('mozCaptureStream' in player) {
            stream = player.mozCaptureStream();
        }

        if (!stream) {
            return;
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaCaptureStream',
            chatId: message.chat_id,
            messageId: message.id,
            stream: stream
        });
    };

    handleProgress = () => {
        const { message, block, instantView } = this.state;
        if (!message && !block) return;

        const player = this.videoRef.current;
        if (!player) return;

        const { buffered } = player;

        const source = message || { '@type': 'instantViewSource', block, instantView };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaProgress',
            source,
            buffered
        });
    }

    handleTimeUpdate = () => {
        const { message, block, instantView } = this.state;
        if (!message && !block) return;

        const player = this.videoRef.current;
        if (!player) return;

        const { currentTime, buffered, duration } = player;

        this.setState({ currentTime });

        const source = message || { '@type': 'instantViewSource', block, instantView };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaTime',
            source,
            duration,
            currentTime,
            buffered,
            timestamp: Date.now()
        });

        this.setCurrentTime({ currentTime, duration });
    };

    handleCanPlay = () => {

    };

    handleVideoPlay = () => {
        const { message, block, instantView } = this.state;
        if (!message && !block) return;

        this.setState({ playing: true });

        const player = this.videoRef.current;
        if (!player) return;

        const { currentTime, duration } = player;

        const source = message || { '@type': 'instantViewSource', block, instantView };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlay',
            source,
            currentTime,
            duration,
            timestamp: Date.now()
        });
    };

    handleVideoPause = () => {
        const { message, block, instantView } = this.state;
        if (!message && !block) return;

        this.setState({
            playing: false
        });

        const player = this.videoRef.current;
        if (!player) return;

        const source = message || { '@type': 'instantViewSource', block, instantView };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPause',
            source
        });
    };

    hasPrev = (item, playlist) => {
        if (!item) return false;
        if (!playlist || !playlist.items.length) return false;

        const index = playlist.items.findIndex(x => playlistItemEquals(x, item));
        if (index === -1) return false;

        return index + 1 < playlist.items.length;
    };

    hasNext = (item, playlist) => {
        if (!item) return false;
        if (!playlist || !playlist.items.length) return false;

        const index = playlist.items.findIndex(x => playlistItemEquals(x, item));
        if (index === -1) return false;

        return index - 1 >= 0;
    };

    handleTitleMouseEnter = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaTitleMouseOver',
            over: true
        });
    };

    handleTitleMouseLeave = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaTitleMouseOver',
            over: false
        });
    };

    handleTitleClick = () => {
        const { message, block, instantView } = this.state;
        if (message) {
            openChat(message.chat_id, message.id);
            return;
        }

        if (block && instantView) {
            openMediaInstantView(instantView, block);
            return;
        }
    };

    setCurrentTime = currentTime => {
        const { message, block } = this.state;
        if (!message && !block) return;

        if (!useAudioPlaybackRate(message || block)) return;

        const audio = getMessageAudio(message.chat_id, message.id);
        if (!audio) return;

        const { audio: file } = audio;
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
        const { t } = this.props;
        const { playing, message, block, duration, playlist, src, mimeType } = this.state;

        const audio = hasAudio(message || block);
        const useAudioRate = useAudioPlaybackRate(message || block);

        const date = message ? message.date : null;

        const title = getMediaTitle(message || block, t);
        const dateHintStr = getDateHint(date);
        const dateStr = getDate(date);
        const showDate = false; //!audio;
        const showPlaybackRate = !audio || useAudioRate;
        const showRepeat = audio;
        const showShuffle = audio;
        const hasPrev = this.hasPrev(message || block, playlist);
        const hasNext = this.hasNext(message || block, playlist);

        const source = src ? <source src={src} type={mimeType}/> : null;

        return (
            <>
                <video
                    className='header-player-video'
                    ref={this.videoRef}
                    autoPlay={true}
                    controls={false}
                    width={44}
                    height={44}
                    disablePictureInPicture={true}
                    onLoadedMetadata={this.handleLoadedMetadata}
                    onCanPlay={this.handleCanPlay}
                    onPlay={this.handleVideoPlay}
                    onPause={this.handleVideoPause}
                    onEnded={this.handleVideoEnded}
                    onTimeUpdate={this.handleTimeUpdate}
                    onProgress={this.handleProgress}
                >
                    {source}
                </video>
                {(message || block) && (
                    <div className='header-player'>
                        <IconButton
                            disabled={!hasPrev}
                            className='header-player-button'
                            color='primary'
                            onClick={this.handlePrev}>
                            <SkipPreviousIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                            className='header-player-button'
                            color='primary'
                            disabled={!src}
                            onClick={this.handlePlay}>
                            {playing ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                        <IconButton
                            disabled={!hasNext}
                            className='header-player-button'
                            color='primary'
                            onClick={this.handleNext}>
                            <SkipNextIcon fontSize='small' />
                        </IconButton>
                        <Playlist />
                        <div
                            className='header-player-content'
                            onMouseEnter={this.handleTitleMouseEnter}
                            onMouseLeave={this.handleTitleMouseLeave}
                            onClick={this.handleTitleClick}>
                            <div className='header-player-title'>
                                {title}
                                {showDate && (
                                    <span title={dateHintStr}>
                                        &nbsp;
                                        {dateStr}
                                    </span>
                                )}
                            </div>
                            &nbsp;
                        </div>
                        <Time duration={duration}/>
                        <VolumeButton />
                        {showPlaybackRate && <PlaybackRateButton audio={audio} />}
                        {showRepeat && <RepeatButton />}
                        {showShuffle && <ShuffleButton />}
                        <IconButton className='header-player-button' onClick={this.handleClose}>
                            <CloseIcon fontSize='small' />
                        </IconButton>
                    </div>
                )}
            </>
        );
    }
}

export default withTranslation()(HeaderPlayer);
