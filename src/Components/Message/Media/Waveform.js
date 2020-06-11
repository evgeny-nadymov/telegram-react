/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { getNormalizedWaveform } from '../../../Utils/Media';
import './Waveform.css';

const defaultData = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

class Waveform extends React.Component {
    render() {
        const { id, value, dragging } = this.props;
        let { data } = this.props;
        if (!data) {
            data = defaultData;
        }

        const waveform = getNormalizedWaveform(data);

        const transition = dragging ? null : 'width 0.25s'
        const waveformMaxHeight = 23;

        const d = waveform.filter((x, index) => index % 2 === 1).map((x, index) => {
            const height = Math.min(Math.max(2, x * waveformMaxHeight), waveformMaxHeight);
            const y = waveformMaxHeight - Math.floor(height);
            return `M${1 + 4 * index + 1},${y + 1}v${Math.floor(height) - 2}Z`
        }).join('');

        const svg = (
            <svg className='waveform-bars' viewBox='0 0 202 32'>
                <path d={d}/>
            </svg>
        );

        return (
            <div className='waveform'>
                <div className='waveform-content'>
                    <div className='waveform-background'>
                        {svg}
                    </div>
                    <div className='waveform-progress' style={{ transition, width: value * 100 + '%'}}>
                        {svg}
                    </div>
                </div>
            </div>
        );
    }

}

Waveform.propTypes = {
    data: PropTypes.string
};

export default Waveform;