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
import { getSrc } from '../../Utils/File';
import { openChat } from '../../Actions/Client';
import { getDurationString } from '../../Utils/Common';
import { getDate, getDateHint, getMediaTitle, hasAudio } from '../../Utils/Message';
import { setFileOptions } from '../../registerServiceWorker';
import { PLAYER_PLAYBACKRATE_FAST, PLAYER_PLAYBACKRATE_NORMAL, PLAYER_STARTTIME } from '../../Constants';
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

        const { message, playlist } = PlayerStore;

        this.startTime = PLAYER_STARTTIME;

        this.state = {
            currentTime: 0,
            currentTimeString: getDurationString(0),
            message: message,
            playlist: playlist,
            playing: false,
            src: this.getMediaSrc(message),
            mimeType: this.getMediaMimeType(message)
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { theme } = this.props;
        const { message, playlist, src, playing } = this.state;

        if (nextProps.theme !== theme) {
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
        PlayerStore.on('clientUpdateMediaSeek', this.onClientUpdateMediaSeek);
    }

    componentWillUnmount() {

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
        PlayerStore.off('clientUpdateMediaSeek', this.onClientUpdateMediaSeek);
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

        const player = this.videoRef.current;
        if (!player) return;

        player.playbackRate = playbackRate;
    };

    onClientUpdateMediaVolume = update => {
        const { volume } = update;

        const player = this.videoRef.current;
        if (!player) return;

        player.volume = volume;
    };

    onClientUpdateMediaSeek = update => {
        const { chatId, messageId, value } = update;
        const { message } = this.state;

        if (!message) return;

        const { chat_id, id, content } = message;
        if (!content) return;
        if (chatId !== chat_id || messageId !== id) return;

        const player = this.videoRef.current;
        if (!player) return;
        if (!player.duration) return;

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

        player.pause();
    };

    startPlayingFile = message => {
        const { chat_id, id } = message;

        const { src: prevSrc } = this.state;

        const src = this.getMediaSrc(message);
        const mimeType = this.getMediaMimeType(message);
        const playing = Boolean(src);
        const { playlist } = PlayerStore;

        this.setState(
            {
                message,
                playlist,
                playing,
                src,
                mimeType
            },
            () => {
                const player = this.videoRef.current;
                if (!player) return;

                if (prevSrc !== src) {
                    player.load();
                }
                player.currentTime = this.startTime;
                if (this.playingMediaViewer) {
                    player.pause();

                    TdLibController.clientUpdate({
                        '@type': 'clientUpdateMediaPause',
                        chatId: chat_id,
                        messageId: id
                    });
                } else if (player.paused) {
                    player.play();
                }
            }
        );
    };

    onClientUpdateMediaBlob = update => {
        const { chatId, messageId } = update;
        const { message } = this.state;

        if (!message) return;

        const { chat_id, id, content } = message;
        if (!content) return;
        if (chatId !== chat_id || messageId !== id) return;

        const { streaming } = TdLibController;

        switch (content['@type']) {
            case 'messageText': {
                const { web_page } = content;
                if (web_page) {
                    const { audio, voice_note, video_note } = web_page;

                    if (audio) {
                        if (streaming) return;

                        const { audio: file } = audio;
                        if (file) {
                            this.startPlayingFile(message);
                        }
                    }

                    if (voice_note) {
                        const { voice } = voice_note;
                        if (voice) {
                            this.startPlayingFile(message);
                        }
                    }

                    if (video_note) {
                        const { video } = video_note;
                        if (video) {
                            this.startPlayingFile(message);
                        }
                    }
                }

                break;
            }
            case 'messageAudio': {
                const { audio } = content;
                if (audio) {
                    if (streaming) return;

                    const { audio: file } = audio;
                    if (file) {
                        this.startPlayingFile(message);
                    }
                }

                break;
            }
            case 'messageVoiceNote': {
                const { voice_note } = content;
                if (voice_note) {
                    const { voice } = voice_note;
                    if (voice) {
                        this.startPlayingFile(message);
                    }
                }

                break;
            }
            case 'messageVideoNote': {
                const { video_note } = content;
                if (video_note) {
                    const { video } = video_note;
                    if (video) {
                        this.startPlayingFile(message);
                    }
                }

                break;
            }
        }
    };

    onClientUpdateMediaPlaylist = update => {
        const { playlist } = update;
        const { chatId, messageId } = playlist;
        const { message } = this.state;

        if (message && message.chat_id === chatId && message.id === messageId) {
            this.setState({ playlist: playlist });
        }
    };

    onClientUpdateMediaClose = update => {
        this.setState({
            message: null,
            playlist: null,
            playing: false,
            src: null,
            mimeType: null
        });
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId } = update;
        const { message, src } = this.state;

        if (message && message.chat_id === chatId && message.id === messageId) {
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
            this.startPlayingFile(PlayerStore.message);
        }
    };

    handlePrev = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPrev'
        });
    };

    handlePlay = () => {
        const { message } = this.state;
        if (!message) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaActive',
            chatId: message.chat_id,
            messageId: message.id
        });
    };

    handleNext = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaNext'
        });
    };

    getMediaMimeType = message => {
        if (message) {
            const { content } = message;
            if (content) {
                const { audio, voice_note, video_note, web_page } = content;

                if (audio) {
                    return audio.mime_type;
                }

                if (voice_note) {
                    return voice_note.mime_type;
                }

                if (video_note) {
                    return 'video/mp4';
                }

                if (web_page) {
                    if (web_page.audio) {
                        return web_page.audio.mime_type;
                    }

                    if (web_page.voice_note) {
                        return web_page.voice_note.mime_type;
                    }

                    if (web_page.video_note) {
                        return 'video/mp4';
                    }
                }
            }
        }

        return '';
    };

    getMediaSrc = message => {
        if (message) {
            const { content } = message;
            if (content) {
                const { audio, voice_note, video_note, web_page } = content;

                if (audio) {
                    const { audio: file } = audio;
                    if (file) {
                        let src = getSrc(file);
                        if (!src && TdLibController.streaming) {
                            src = `/streaming/file_id=${file.id}`;
                            setFileOptions(src, { fileId: file.id, size: file.size, mimeType: audio.mime_type });
                        }

                        return src;
                    }
                }

                if (voice_note) {
                    const { voice } = voice_note;
                    if (voice) {
                        return getSrc(voice);
                    }
                }

                if (video_note) {
                    const { video } = video_note;
                    if (video) {
                        return getSrc(video);
                    }
                }

                if (web_page) {
                    if (web_page.audio) {
                        const file = web_page.audio.audio;
                        if (file) {
                            return getSrc(file);
                        }
                    }

                    if (web_page.voice_note) {
                        const { voice } = web_page.voice_note;
                        if (voice) {
                            return getSrc(voice);
                        }
                    }

                    if (web_page.video_note) {
                        const { video } = web_page.video_note;
                        if (video) {
                            return getSrc(video);
                        }
                    }
                }
            }
        }

        return '';
    };

    handleEnded = (moveNext = true) => {
        const { message } = this.state;
        if (!message) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaEnding',
            chatId: message.chat_id,
            messageId: message.id,
            moveNext: moveNext
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
                    chatId: message.chat_id,
                    messageId: message.id,
                    moveNext: moveNext
                });
            }
        );
    };

    handleVideoEnded = () => {
        this.handleEnded(true);
    };

    handleClose = () => {
        const player = this.videoRef.current;
        if (player) {
            player.pause();
        }

        this.handleEnded(false);
    };

    handleTimeUpdate = () => {
        const { message } = this.state;
        if (!message) return;

        const player = this.videoRef.current;
        if (!player) return;

        this.setState({
            currentTime: player.currentTime,
            currentTimeString: getDurationString(Math.floor(player.currentTime || 0))
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaTime',
            chatId: message.chat_id,
            messageId: message.id,
            duration: player.duration,
            currentTime: player.currentTime,
            timestamp: Date.now()
        });
    };

    handleCanPlay = () => {
        const { message } = this.state;
        if (!message) return;

        const player = this.videoRef.current;
        if (!player) return;

        const { playbackRate, volume } = PlayerStore;

        const { chat_id, id } = message;
        const audio = hasAudio(chat_id, id);

        player.playbackRate = audio ? PLAYER_PLAYBACKRATE_NORMAL : playbackRate;
        player.volume = volume;
        player.muted = false;

        if (audio) {
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

    handleVideoPlay = () => {
        const { message } = this.state;
        if (!message) return;

        this.setState({
            playing: true
        });

        const player = this.videoRef.current;
        if (!player) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlay',
            chatId: message.chat_id,
            messageId: message.id,
            currentTime: player.currentTime,
            duration: player.duration,
            timestamp: Date.now()
        });
    };

    handleVideoPause = () => {
        const { message } = this.state;
        if (!message) return;

        this.setState({
            playing: false
        });

        const player = this.videoRef.current;
        if (!player) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPause',
            chatId: message.chat_id,
            messageId: message.id
        });
    };

    handlePlaybackRate = () => {
        const { playbackRate } = this.state;

        const nextPlaybackRate =
            playbackRate === PLAYER_PLAYBACKRATE_NORMAL ? PLAYER_PLAYBACKRATE_FAST : PLAYER_PLAYBACKRATE_NORMAL;

        this.setState(
            {
                playbackRate: nextPlaybackRate
            },
            () => {
                const player = this.videoRef.current;
                if (!player) return;

                player.playbackRate = nextPlaybackRate;
            }
        );

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlaybackRate',
            playbackRate: nextPlaybackRate
        });
    };

    hasPrev = (message, playlist) => {
        if (!message) return false;
        if (!playlist || !playlist.messages.length) return false;

        const { chat_id, id } = message;

        const index = playlist.messages.findIndex(x => x.chat_id === chat_id && x.id === id);
        if (index === -1) return false;

        return index + 1 < playlist.messages.length;
    };

    hasNext = (message, playlist) => {
        if (!message) return false;
        if (!playlist || !playlist.messages.length) return false;

        const { chat_id, id } = message;

        const index = playlist.messages.findIndex(x => x.chat_id === chat_id && x.id === id);
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
        const { message } = this.state;
        if (!message) return;

        openChat(message.chat_id, message.id);
    };

    render() {
        const { t } = this.props;
        const { playing, message, playlist, src, mimeType } = this.state;

        let audio = false;
        if (message) {
            const { chat_id, id } = message;
            audio = hasAudio(chat_id, id);
        }

        const date = message ? message.date : null;

        const title = getMediaTitle(message, t);
        const dateHintStr = getDateHint(date);
        const dateStr = getDate(date);
        const showDate = !audio;
        const showPlaybackRate = !audio;
        const showRepeat = audio;
        const showShuffle = audio;
        const hasPrev = this.hasPrev(message, playlist);
        const hasNext = this.hasNext(message, playlist);

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
                    onCanPlay={this.handleCanPlay}
                    onPlay={this.handleVideoPlay}
                    onPause={this.handleVideoPause}
                    onTimeUpdate={this.handleTimeUpdate}
                    onEnded={this.handleVideoEnded}
                >
                    {source}
                </video>
                {message && (
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
                            <Time />
                        </div>
                        <VolumeButton />
                        {showPlaybackRate && <PlaybackRateButton />}
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
