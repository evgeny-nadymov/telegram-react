/*
 *  Copyright (c) 2019-present, Aleksandr Telegin
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import PlayerStore from '../../Stores/PlayerStore';
import CircularProgress from '@material-ui/core/CircularProgress';
import './StickyPlayer.css';

const circleStyle = {
    circle: 'video-note-progress-circle'
};

class StickyPlayer extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            progress: 0,
            active: false
        };
    }

    setRef = el => {
        this.container = el;
    };

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaStickPlayer', this.onClientUpdateMediaStickPlayer);
        PlayerStore.on('clientUpdateMediaUnstickPlayer', this.onClientUpdateMediaUnstickPlayer);
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
        PlayerStore.on('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);
    }

    componentWillUnmount() {
        PlayerStore.removeListener('clientUpdateMediaStickPlayer', this.onClientUpdateMediaStickPlayer);
        PlayerStore.removeListener('clientUpdateMediaUnstickPlayer', this.onClientUpdateMediaUnstickPlayer);
        PlayerStore.removeListener('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
        PlayerStore.removeListener('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);
    }

    onClientUpdateMediaPlaybackRate = update => {
        if (this.player) this.player.playbackRate = update.playbackRate;
    };

    onClientUpdateMediaPause = update => {
        const { chatId, messageId } = update;

        if (this.player && chatId === this.chatId && messageId === this.messageId) {
            this.player.pause();
            this.isPaused = true;
        }
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId } = update;

        if (this.player && this.isPaused && chatId === this.chatId && messageId === this.messageId) {
            this.player.play();
            this.isPaused = false;
        }
    };

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId } = update;

        if (chatId === this.chatId && messageId === this.messageId) this.dismiss();
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId } = update;

        if (this.player && this.time && this.chatId === chatId && this.messageId === messageId) {
            this.setState({
                progress: (this.player.currentTime / this.time.duration) * 100
            });
        }
    };

    onClientUpdateMediaStickPlayer = update => {
        const { player, chatId, messageId } = update,
            { time } = PlayerStore;

        if (this.chatId === chatId && this.messageId === messageId) return;

        this.chatId = chatId;
        this.messageId = messageId;
        this.time = time;

        player.width = 100;
        player.height = 100;
        this.player = player;

        this.container.innerHTML = '';
        this.container.appendChild(player);

        this.setState({ active: true });
    };

    onClientUpdateMediaUnstickPlayer = update => {
        const { container } = update;

        if (container) {
            setTimeout(() => {
                this.player.width = 200;
                this.player.height = 200;
                container.appendChild(this.player);
            }, 50);
        }

        this.dismiss();
    };

    dismiss() {
        this.chatId = 0;
        this.messageId = 0;

        this.setState({ active: false });
    }

    render() {
        const { progress, active } = this.state;

        return (
            <div className={classNames('sticky-player-container', { 'sticky-player-visible': active })}>
                <div ref={this.setRef} />
                <div className='sticky-player-progress'>
                    <CircularProgress
                        classes={circleStyle}
                        variant='static'
                        value={progress}
                        size={100}
                        thickness={1}
                    />
                </div>
            </div>
        );
    }
}

export default StickyPlayer;
