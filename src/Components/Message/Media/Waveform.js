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

        return (
            <div className='waveform'>
                <svg className='waveform-clip-path' width={202} height={waveformMaxHeight}>
                    <defs>
                        <clipPath id={id}>
                            {waveform.filter((x, index) => index % 2 === 1).map((x, index) => {
                                const height = Math.min(Math.max(2, x * waveformMaxHeight), waveformMaxHeight);
                                const y = waveformMaxHeight - Math.floor(height);
                                return (<rect key={index} x={1 + 4 * index} y={y} width='2' height={Math.floor(height)} rx='1' ry='1'/>)
                            })}
                        </clipPath>
                    </defs>
                </svg>
                <div className='waveform-content' style={{ clipPath: `url(#${id})`}}>
                    <div className='waveform-background'/>
                    <div className='waveform-progress' style={{ transition, width: value * 100 + '%'}}/>
                </div>
            </div>
        );
    }

}

Waveform.propTypes = {
    data: PropTypes.string
};

export default Waveform;