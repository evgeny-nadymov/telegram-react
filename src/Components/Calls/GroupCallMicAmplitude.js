/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getAmplitude } from '../../Calls/Utils';
import './GroupCallMicAmplitude.css';

class GroupCallMicAmplitude extends React.Component {
    constructor(props) {
        super(props);
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.timer = null;

        this.state = {
            value: 0
        };
    }

    componentDidMount() {
        const { stream } = this.props;
        if (stream) {
            this.addAnalyser(stream);
        }
    }

    componentWillUnmount() {
        const { stream } = this.props;
        if (stream) {
            this.removeAnalyser(stream);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { stream } = this.props;
        if (prevProps.stream !== stream) {
            this.removeAnalyser(prevProps.stream);
            this.addAnalyser(stream);
        }
    }

    addAnalyser(stream) {
        if (!stream) return;

        const { audioContext } = this;
        if (!audioContext) return;

        this.streamSource = audioContext.createMediaStreamSource(stream);
        if (!this.analyser) {
            const analyser = audioContext.createAnalyser();
            analyser.minDecibels = -100;
            analyser.maxDecibels = -30;
            analyser.smoothingTimeConstant = 0.05;
            analyser.fftSize = 1024;

            this.analyser = analyser;
        }
        this.streamSource.connect(this.analyser);

        this.timer = setInterval(() => this.analyse(), 100);
    }

    removeAnalyser(stream) {
        if (!stream) return;

        if (this.analyser && this.streamSource) {
            this.streamSource.disconnect(this.analyser);
        }

        clearInterval(this.timer);
    }

    analyse() {
        const { analyser } = this;
        if (!analyser) return;

        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        const value = getAmplitude(array, 1.5);

        this.setState({
            value
        });
    }

    render() {
        const { value } = this.state;

        let d = '';
        for (let i = 0; i < 35; i++) {
            const x = i * 8 + 1.5;
            d += `M${x},0v15Z`;
        }

        const bars = (
            <svg className='group-call-mic-amplitude-bars' viewBox='0 0 275 15'>
                <path d={d} fill='currentColor' strokeWidth={3}/>
            </svg>
        );

        return (
            <div className='group-call-mic-amplitude'>
                {bars}
                <div className='group-call-mic-amplitude-bars-accent' style={{ width: 275 * value }}>
                    {bars}
                </div>
            </div>
        );
    }
}

GroupCallMicAmplitude.propTypes = {
    stream: PropTypes.object
};

export default GroupCallMicAmplitude;