/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { getDurationString } from '../../Utils/Common';
import PlayerStore from '../../Stores/PlayerStore';
import './Time.css';

class Time extends React.Component {
    constructor(props) {
        super(props);

        const { duration } = this.props;

        const currentTime = 0;
        const reverse = false;

        this.state = {
            reverse,
            currentTime,
            duration,
            currentTimeString: getDurationString(currentTime, duration, reverse),
        };
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaTime', this.onClientUpdateMediaTime);
    }

    onClientUpdateMediaTime = update => {
        const { currentTime, duration } = update;
        const { reverse } = this.state;

        this.setState({
            currentTime,
            duration,
            currentTimeString: getDurationString(Math.floor(currentTime || 0), duration, reverse)
        });
    };

    handleReverse = event => {
        event.stopPropagation();
        event.preventDefault();

        const { currentTime, duration, reverse } = this.state;

        this.setState({
            reverse: !reverse,
            currentTimeString: getDurationString(Math.floor(currentTime || 0), duration, !reverse)
        });
    };

    render() {
        const { currentTimeString } = this.state;

        return (
            <div className='header-player-time' onClick={this.handleReverse}>
                {currentTimeString}
            </div>
        );
    }
}

export default Time;
