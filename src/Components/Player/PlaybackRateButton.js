/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import { PLAYER_PLAYBACKRATE_FAST, PLAYER_PLAYBACKRATE_NORMAL } from '../../Constants';

class PlaybackRateButton extends React.Component {
    constructor(props) {
        super(props);

        const { playbackRate } = PlayerStore;

        this.state = {
            playbackRate
        };
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);
    }

    onClientUpdateMediaPlaybackRate = update => {
        const { playbackRate } = update;

        this.setState({ playbackRate });
    };

    handlePlaybackRate = () => {
        const { playbackRate } = this.state;

        const nextPlaybackRate =
            playbackRate === PLAYER_PLAYBACKRATE_NORMAL ? PLAYER_PLAYBACKRATE_FAST : PLAYER_PLAYBACKRATE_NORMAL;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlaybackRate',
            playbackRate: nextPlaybackRate
        });
    };

    render() {
        const { playbackRate } = this.state;

        return (
            <IconButton
                className='header-player-button'
                color={playbackRate > PLAYER_PLAYBACKRATE_NORMAL ? 'primary' : 'default'}
                onClick={this.handlePlaybackRate}>
                <div className='header-player-playback-icon'>2X</div>
            </IconButton>
        );
    }
}

export default PlaybackRateButton;
