/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { getDurationString } from '../../Utils/Common';
import PlayerStore from '../../Stores/PlayerStore';

class Time extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            currentTime: 0,
            duration: 0,
            timeString: this.getTimeString(0, 0)
        };
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaTime', this.onClientUpdateMediaTime);
    }

    onClientUpdateMediaTime = update => {
        const { currentTime } = update;

        this.setState({
            currentTime: currentTime,
            currentTimeString: getDurationString(Math.floor(currentTime || 0))
        });
    };

    getTimeString = (currentTime, duration) => {
        const type = 0;

        const durationString = getDurationString(Math.floor(duration || 0));
        const currentTimeString = getDurationString(Math.floor(currentTime || 0));

        //return type === 0 ? `${currentTimeString}/${durationString}` : `${durationString}`;

        return currentTimeString;
    };

    render() {
        const { currentTimeString } = this.state;

        return <>{currentTimeString}</>;
    }
}

export default Time;
