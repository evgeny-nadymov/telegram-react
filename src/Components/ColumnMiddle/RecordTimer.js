/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import MessageStore from '../../Stores/MessageStore';
import './RecordTimer.css';

class RecordTimer extends React.Component {
    state = { };

    componentDidMount() {
        MessageStore.on('clientUpdateRecordStart', this.onClientUpdateRecordStart);
        MessageStore.on('clientUpdateRecordStop', this.onClientUpdateRecordStop);
        MessageStore.on('clientUpdateRecordError', this.onClientUpdateRecordError);
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateRecordStart', this.onClientUpdateRecordStart);
        MessageStore.off('clientUpdateRecordStop', this.onClientUpdateRecordStop);
        MessageStore.off('clientUpdateRecordError', this.onClientUpdateRecordError);
    }

    onClientUpdateRecordStart = () => {
        this.timer = setInterval(() => {
            const now = new Date();
            const diff = now - this.startTime;

            // console.log('[recordTimer] ');
            this.setState({
                time: diff
            });
        }, 25);
        this.startTime = new Date();
    }

    onClientUpdateRecordStop = () => {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.setState({
            time: null
        });
    }

    onClientUpdateRecordError = () => {
        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.setState({
            time: null
        });
    }

    normalizeM(n) {
        let msStr = n.toString();
        if (msStr.length === 1) {
            msStr += '0'
        } else if (msStr.length > 2) {
            msStr = msStr.substr(0, 2);
        }

        return msStr;
    }

    normalizeS(n) {
        let msStr = n.toString();
        if (msStr.length === 1) {
            msStr = '0' + msStr;
        }

        return msStr;
    }

    msToTime(s) {
        let ms = (s % 1000);
        s = (s - ms) / 1000;
        let secs = s % 60;
        s = (s - secs) / 60;
        let mins = s % 60;
        let hrs = (s - mins) / 60;

        let result = mins + ':' + this.normalizeS(secs) + ',' + this.normalizeM(ms);
        if (hrs > 0) {
            result = hrs + ':' + result;
        }

        return result;
    }

    render() {
        const { time } = this.state;
        if (!time) return null;

        return (
            <div className='record-timer'>
                {this.msToTime(time)}
                <div className='record-timer-icon'/>
            </div>
        );
    }

}

RecordTimer.propTypes = {};

export default RecordTimer;