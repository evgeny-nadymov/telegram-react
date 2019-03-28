/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import { borderStyle } from '../Theme';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import './HeaderPlayer.css';
import { getSrc } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';

const styles = theme => ({
    skipPreviousIconButton: {
        margin: '8px 0 8px 12px'
    },
    playIconButton: {
        margin: '8px 0 8px 0'
    },
    skipNextIconButton: {
        margin: '8px 12px 8px 0'
    },
    closeIconButton: {
        margin: '8px 12px 8px 12px'
    },
    ...borderStyle(theme)
});

class HeaderPlayer extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();

        this.startVolume = 0.1;
        this.startTime = 0.0;

        this.state = {
            message: PlayerStore.message,
            playing: false
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        if (this.state.message !== nextState.message) {
            return true;
        }

        if (this.state.playing !== nextState.playing) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        FileStore.on('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);
        PlayerStore.on('clientUpdateActiveMedia', this.onClientUpdateActiveMedia);
        PlayerStore.on('clientUpdatePlayMedia', this.onClientUpdatePlayMedia);
        PlayerStore.on('clientUpdatePauseMedia', this.onClientUpdatePauseMedia);
        PlayerStore.on('clientUpdateEndMedia', this.onClientUpdateEndMedia);
        PlayerStore.on('clientUpdateStopMedia', this.onClientUpdateStopMedia);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);
        PlayerStore.removeListener('clientUpdateActiveMedia', this.onClientUpdateActiveMedia);
        PlayerStore.removeListener('clientUpdatePlayMedia', this.onClientUpdatePlayMedia);
        PlayerStore.removeListener('clientUpdatePauseMedia', this.onClientUpdatePauseMedia);
        PlayerStore.removeListener('clientUpdateEndMedia', this.onClientUpdateEndMedia);
        PlayerStore.removeListener('clientUpdateStopMedia', this.onClientUpdateStopMedia);
    }

    onClientUpdateEndMedia = update => {};

    onClientUpdateVideoNoteBlob = update => {
        const { chatId, messageId } = update;
        const { message } = this.state;

        if (!message) return;

        const { chat_id, id, content } = message;
        if (!content) return;
        if (chatId !== chat_id || messageId !== id) return;

        switch (content['@type']) {
            case 'messageVideoNote': {
                const { video_note } = content;
                if (video_note) {
                    const { video } = video_note;
                    if (video) {
                        const src = getSrc(video);
                        if (src) {
                            const player = this.videoRef.current;

                            if (!player.paused) return;

                            if (player) {
                                console.log('clientUpdate set currentTime=' + this.startTime);

                                player.volume = this.startVolume;
                                player.currentTime = this.startTime;
                            }

                            TdLibController.clientUpdate({
                                '@type': 'clientUpdatePlayMedia',
                                chatId: chat_id,
                                messageId: id,
                                currentTime: player.currentTime
                            });
                        }
                    }
                }

                break;
            }
        }
    };

    onClientUpdateActiveMedia = update => {
        const { chatId, messageId } = update;
        const { message } = this.state;

        const nextMessage = PlayerStore.message;

        if (message && message.chat_id === chatId && message.id === messageId) {
            const src = this.getMediaSrc(message);
            if (src) {
                const player = this.videoRef.current;
                if (player) {
                    if (player.paused) {
                        TdLibController.clientUpdate({
                            '@type': 'clientUpdatePlayMedia',
                            chatId: chatId,
                            messageId: messageId,
                            currentTime: player.currentTime
                        });
                    } else {
                        TdLibController.clientUpdate({
                            '@type': 'clientUpdatePauseMedia',
                            chatId: chatId,
                            messageId: messageId
                        });
                    }
                }
            }
        } else {
            this.setState(
                {
                    message: PlayerStore.message
                },
                () => {
                    const player = this.videoRef.current;
                    if (player) {
                        player.volume = this.startVolume;
                        player.currentTime = this.startTime;
                    }

                    const src = this.getMediaSrc(PlayerStore.message);
                    if (src) {
                        TdLibController.clientUpdate({
                            '@type': 'clientUpdatePlayMedia',
                            chatId: chatId,
                            messageId: messageId,
                            currentTime: player.currentTime
                        });
                    }
                }
            );
        }
    };

    onClientUpdateStopMedia = update => {
        this.setState({
            message: null
        });
    };

    onClientUpdatePlayMedia = update => {
        this.setState({ playing: true }, () => {
            const player = this.videoRef.current;
            if (player) {
                player.play();
            }
        });
    };

    onClientUpdatePauseMedia = update => {
        this.setState({ playing: false }, () => {
            const player = this.videoRef.current;
            if (player) {
                player.pause();
            }
        });
    };

    handlePrev = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdatePrevMedia'
        });
    };

    handlePlay = () => {
        const { message } = this.state;
        if (!message) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateActiveMedia',
            chatId: message.chat_id,
            messageId: message.id
        });
    };

    handleNext = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateNextMedia'
        });
    };

    handleClose = () => {
        const { message } = this.state;
        if (!message) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStopMedia',
            chatId: message.chat_id,
            messageId: message.id
        });
    };

    getMediaSrc = message => {
        if (message) {
            const { content } = message;
            if (content) {
                const { video_note } = content;
                if (video_note) {
                    const { video } = video_note;
                    if (video) {
                        return getSrc(video);
                    }
                }
            }
        }

        return null;
    };

    handleEnded = () => {
        const { message } = this.state;
        if (!message) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateEndMedia',
            chatId: message.chat_id,
            messageId: message.id
        });

        this.setState({
            playing: false
        });
    };

    handleTimeUpdate = () => {
        const { message } = this.state;
        if (!message) return;

        const player = this.videoRef.current;
        if (!player) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaTimeUpdate',
            chatId: message.chat_id,
            messageId: message.id,
            duration: player.duration,
            currentTime: player.currentTime,
            timestamp: Date.now()
        });
    };

    render() {
        const { classes } = this.props;
        const { playing, message } = this.state;

        const src = this.getMediaSrc(message);

        return (
            <div className={classNames(classes.borderColor, 'header-player')}>
                <video
                    ref={this.videoRef}
                    src={src}
                    autoPlay
                    width={48}
                    height={48}
                    controls={false}
                    onTimeUpdate={this.handleTimeUpdate}
                    onEnded={this.handleEnded}
                />
                {/*<IconButton className={classes.skipPreviousIconButton}>*/}
                {/*<SkipPreviousIcon />*/}
                {/*</IconButton>*/}
                <IconButton className={classes.playIconButton} onClick={this.handlePlay}>
                    {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                {/*<IconButton className={classes.skipNextIconButton}>*/}
                {/*<SkipNextIcon />*/}
                {/*</IconButton>*/}
                <div className='header-player-content'>
                    {message ? `video chat_id=${message.chat_id} message_id=${message.id}` : null}
                </div>
                <IconButton className={classes.closeIconButton} onClick={this.handleClose}>
                    <CloseIcon />
                </IconButton>
            </div>
        );
    }
}

HeaderPlayer.propTypes = {};

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(HeaderPlayer);
