/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';
import './Waveform.css';

class Waveform extends React.Component {
    render() {
        const { id, data, value, dragging } = this.props;
        if (!data) return null;

        const bitsString = Array.from(atob(data), c => {
            const n = c.charCodeAt(0).toString(2);
            return '00000000'.substr(n.length) + n;
        });
        const str = bitsString.join('');

        const chunkLength = 5;
        let nums = [];

        for (let i = 0, charsLength = str.length; i < charsLength; i += chunkLength) {
            const c = str.substring(i, i + chunkLength);
            nums.push(parseInt(c, 2));
        }

        const transition = dragging ? null : 'width 0.25s'
        const waveformMaxHeight = 23;

        return (
            <div className='waveform'>
                <svg className='waveform-clip-path' width={202} height={waveformMaxHeight}>
                    <defs>
                        <clipPath id={id}>
                            {nums.filter((x, index) => index % 2 === 0).map((x, index) => {
                                const height = Math.min(Math.max(2, x), waveformMaxHeight);
                                const y = waveformMaxHeight - height;
                                return (<rect key={index} x={1 + 4 * index} y={y} width='2' height={height} rx='1' ry='1'/>)
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