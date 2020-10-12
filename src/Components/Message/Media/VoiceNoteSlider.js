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
import Player from '../../Player/Player';
import Waveform from './Waveform';
import { isCurrentSource } from '../../../Utils/Player';
import { PLAYER_PROGRESS_TIMEOUT_MS } from '../../../Constants';
import MessageStore from '../../../Stores/MessageStore';
import PlayerStore from '../../../Stores/PlayerStore';
import TdLibController from '../../../Controllers/TdLibController';
import './VoiceNoteSlider.css';

class VoiceNoteSlider extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId, messageId, block, duration, waveform } = props;

        if (state.prevChatId !== chatId || state.prevMessageId !== messageId || state.prevBlock !== block) {

            const { message, block: currentBlock, time } = PlayerStore;

            const active = message && message.chat_id === chatId && message.id === messageId || block === currentBlock;
            const currentTime = active && time ? time.currentTime : 0;
            const audioDuration = active && time && time.duration ? time.duration : duration;
            const buffered = active && time ? time.buffered : null;
            const value = VoiceNoteSlider.getValue(currentTime, audioDuration, active, waveform, false);

            return {
                prevChatId: chatId,
                prevMessageId: messageId,
                prevBlock: block,
                active,
                currentTime,
                duration: audioDuration,
                value,
                buffered
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { style } = this.props;
        const { active, value, buffered } = this.state;

        if (nextState.value !== value) {
            return true;
        }

        if (nextState.active !== active) {
            return true;
        }

        if (nextState.buffered !== buffered) {
            return true;
        }

        if (nextProps.style !== style) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaLoadedMetadata', this.onClientUpdateMediaLoadedMetadata);
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.on('clientUpdateMediaProgress', this.onClientUpdateMediaProgress);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaLoadedMetadata', this.onClientUpdateMediaLoadedMetadata);
        PlayerStore.off('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.off('clientUpdateMediaProgress', this.onClientUpdateMediaProgress);
        PlayerStore.off('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    reset() {
        const { waveform } = this.props;
        const { value, duration, dragging } = this.state;

        if (value === 1) {
            this.setState({
                active: false,
                currentTime: 0,
                buffered: null
            });

            setTimeout(() => {
                const { currentTime } = this.state;
                if (!currentTime) {
                    this.setState({
                        value: VoiceNoteSlider.getValue(0, duration, false, waveform, dragging)
                    });
                }
            }, PLAYER_PROGRESS_TIMEOUT_MS);
        } else {
            this.setState({
                active: false,
                currentTime: 0,
                buffered: null,
                value: VoiceNoteSlider.getValue(0, duration, false, waveform, dragging)
            });
        }
    }

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.reset();
    };

    onClientUpdateMediaLoadedMetadata = update => {
        const { chatId, messageId, block } = this.props;
        const { source, duration, buffered } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.setState({
            duration,
            buffered
        });
    };

    onClientUpdateMediaProgress = update => {
        const { chatId, messageId, block } = this.props;
        const { source, buffered } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.setState({
            buffered
        });
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId, block, waveform } = this.props;
        const { active, duration, dragging, value } = this.state;
        const { source, currentTime, buffered } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.setState({
            currentTime,
            buffered,
            value: dragging ? value : VoiceNoteSlider.getValue(currentTime, duration, active, waveform, dragging)
        });
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, block, waveform } = this.props;
        const { active, currentTime, duration, dragging } = this.state;
        const { source, currentTime: prevCurrentTime } = update;

        if (isCurrentSource(chatId, messageId, block, source)) {
            let { value } = this.state;
            if (!dragging) {
                value = VoiceNoteSlider.getValue(active ? currentTime : prevCurrentTime, duration, true, waveform, dragging);
            }

            this.setState({
                active: true,
                currentTime: active ? currentTime : prevCurrentTime,
                value
            });
        } else if (active) {
            this.reset();
        }
    };

    static getValue(currentTime, duration, active, waveform, dragging) {
        // if (waveform && !dragging) {
        //     currentTime += 0.25;
        // }

        return active ? currentTime / duration : 0;
    }

    handleMouseDown = event => {
        event.stopPropagation();

        this.setState({
            dragging: true
        });
    };

    handleChange = (event, value) => {
        const { chatId, messageId, block } = this.props;
        const { active, dragging } = this.state;
        if (!active) return;

        const source = MessageStore.get(chatId, messageId) || { '@type': 'instantViewSource', block};

        if (dragging) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaSeeking',
                source,
                value
            });
        }

        this.setState({
            value
        });
    };

    handleChangeCommitted = () => {
        const { chatId, messageId, block, duration } = this.props;
        const { value } = this.state;

        const source = MessageStore.get(chatId, messageId) || { '@type': 'instantViewSource', block};

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaSeek',
            source,
            value,
            duration
        });

        this.setState({
            dragging: false
        });
    };

    render() {
        const { chatId, messageId, audio, waveform, className, style } = this.props;
        const { duration, value, dragging, buffered } = this.state;

        const time = value * duration;
        const bufferedTime = Player.getBufferedTime(time, buffered);
        const bufferedValue = duration > 0 ? bufferedTime / duration : 0;

        // const ranges = [];
        // for (let i = 0; buffered && i < buffered.length; i++) {
        //     ranges.push({ start: buffered.start(i), end: buffered.end(i)})
        // }
        //

        return (
            <div className={classNames('voice-note-slider', className)} style={style}>
                {!audio && <Waveform id={`waveform_${chatId}_${messageId}`} dragging={dragging} data={waveform} value={value}/>}
                {audio && <div className='voice-note-slider-buffered' style={{ width: `${bufferedValue*100}%`}}/>}
                <Slider
                    className={classNames('voice-note-slider-component', { 'voice-note-slider-component-hidden': !audio })}
                    classes={{
                        track: 'voice-note-slider-track',
                        thumb: 'voice-note-slider-thumb',
                        active: 'voice-note-slider-active',
                        rail: 'voice-note-slider-rail'
                    }}
                    min={0}
                    max={1}
                    step={0.01}
                    value={value}
                    onChange={this.handleChange}
                    onChangeCommitted={this.handleChangeCommitted}
                    onMouseDown={this.handleMouseDown}
                />
            </div>
        );
    }
}

VoiceNoteSlider.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    block: PropTypes.object,

    audio: PropTypes.bool,
    duration: PropTypes.number.isRequired,
    waveform: PropTypes.string
};

export default VoiceNoteSlider;
