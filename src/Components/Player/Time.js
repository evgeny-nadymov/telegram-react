/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getDurationString } from '../../Utils/Common';

class Time extends React.Component {
    constructor(props) {
        super(props);

        const { currentTime, duration } = props;

        this.state = {
            currentTime: currentTime,
            duration: duration,
            timeString: this.getTimeString(currentTime, duration)
        };
    }

    getTimeString = (currentTime, duration) => {
        const type = 0;

        const durationString = getDurationString(Math.floor(duration || 0));
        const currentTimeString = getDurationString(Math.floor(currentTime || 0));

        return type === 0 ? `${currentTimeString}/${durationString}` : `${durationString}`;
    };

    render() {}
}

Time.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    currentTime: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired
};

export default Time;
