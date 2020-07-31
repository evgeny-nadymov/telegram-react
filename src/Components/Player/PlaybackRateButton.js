/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@material-ui/core/IconButton';
import { PLAYER_PLAYBACKRATE_FAST, PLAYER_PLAYBACKRATE_NORMAL } from '../../Constants';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';

class PlaybackRateButton extends React.Component {
    constructor(props) {
        super(props);

        const { audioPlaybackRate, playbackRate } = PlayerStore;

        this.state = {
            audioPlaybackRate,
            playbackRate
        };
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);
        PlayerStore.on('clientUpdateMediaAudioPlaybackRate', this.onClientUpdateMediaAudioPlaybackRate);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaPlaybackRate', this.onClientUpdateMediaPlaybackRate);
        PlayerStore.off('clientUpdateMediaAudioPlaybackRate', this.onClientUpdateMediaAudioPlaybackRate);
    }

    onClientUpdateMediaPlaybackRate = update => {
        const { playbackRate } = update;

        this.setState({ playbackRate });
    };

    onClientUpdateMediaAudioPlaybackRate = update => {
        const { audioPlaybackRate } = update;

        this.setState({ audioPlaybackRate });
    };

    handlePlaybackRate = () => {
        const { audio } = this.props;
        const { audioPlaybackRate, playbackRate } = this.state;

        const rate = audio ? audioPlaybackRate : playbackRate;
        const nextRate = rate === PLAYER_PLAYBACKRATE_NORMAL
            ? PLAYER_PLAYBACKRATE_FAST
            : PLAYER_PLAYBACKRATE_NORMAL;

        if (audio) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaAudioPlaybackRate',
                audioPlaybackRate: nextRate
            });
        } else {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaPlaybackRate',
                playbackRate: nextRate
            });
        }
    };

    render() {
        const { audio } = this.props;
        const { audioPlaybackRate, playbackRate } = this.state;

        const rate = audio ? audioPlaybackRate : playbackRate;

        return (
            <IconButton
                className='header-player-button'
                color={rate > PLAYER_PLAYBACKRATE_NORMAL ? 'primary' : 'default'}
                onClick={this.handlePlaybackRate}>
                <div className='header-player-playback-icon'>2X</div>
            </IconButton>
        );
    }
}

PlaybackRateButton.defaultProps = {
    audio: false
}

PlaybackRateButton.propTypes = {
    audio: PropTypes.bool
}

export default PlaybackRateButton;
