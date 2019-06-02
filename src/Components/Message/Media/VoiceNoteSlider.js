/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Slider from '@material-ui/lab/Slider';
import { PLAYER_PROGRESS_TIMEOUT_MS } from '../../../Constants';
import PlayerStore from '../../../Stores/PlayerStore';
import './VoiceNoteSlider.css';

const styles = {
    slider: {
        maxWidth: 216
    },
    track: {
        transition: 'width 0ms linear 0ms, height 0ms linear 0ms, transform 0ms linear 0ms'
    },
    thumbWrapper: {
        transition: 'transform 0ms linear 0ms'
    },
    thumb: {
        transition: 'transform 0ms linear 0ms, box-shadow 0ms linear 0ms'
    }
};

class VoiceNoteSlider extends React.Component {
    constructor(props) {
        super(props);

        const { message, time } = PlayerStore;
        const { chatId, messageId, duration } = this.props;

        const active = message && message.chat_id === chatId && message.id === messageId;
        const currentTime = active && time ? time.currentTime : 0;
        const audioDuration = active && time && time.duration ? time.duration : duration;

        this.state = {
            active: active,
            currentTime: currentTime,
            duration: audioDuration,
            value: this.getValue(currentTime, audioDuration, active)
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { active, value } = this.state;

        if (nextState.value !== value) {
            return true;
        }

        if (nextState.active !== active) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    reset = () => {
        const { duration } = this.props;
        const { value } = this.state;

        if (value === 1) {
            this.setState({
                active: false,
                currentTime: 0
            });

            setTimeout(() => {
                const { currentTime } = this.state;
                if (!currentTime) {
                    this.setState({
                        value: this.getValue(0, duration, false)
                    });
                }
            }, PLAYER_PROGRESS_TIMEOUT_MS);
        } else {
            this.setState({
                active: false,
                currentTime: 0,
                value: this.getValue(0, duration, false)
            });
        }
    };

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.reset();
        }
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId, duration } = this.props;
        const { active } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                currentTime: update.currentTime,
                duration: update.duration || duration,
                value: this.getValue(update.currentTime, update.duration || duration, active)
            });
        }
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, duration } = this.props;
        const { active, currentTime } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                active: true,
                currentTime: active ? currentTime : 0,
                value: this.getValue(active ? currentTime : 0, duration, true)
            });
        } else if (active) {
            this.reset();
        }
    };

    getValue = (currentTime, duration, active) => {
        return active ? currentTime / duration : 0;
    };

    render() {
        const { classes } = this.props;
        const { value } = this.state;

        return (
            <div className='voice-note-slider'>
                <Slider
                    className={classes.slider}
                    classes={{
                        track: classes.track,
                        thumbWrapper: classes.thumbWrapper,
                        thumb: classes.thumb
                    }}
                    min={0}
                    max={1}
                    value={value}
                />
            </div>
        );
    }
}

VoiceNoteSlider.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired
};

export default withStyles(styles)(VoiceNoteSlider);
