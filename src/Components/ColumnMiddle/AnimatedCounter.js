/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import AnimatedItem from './AnimatedItem';
import './AnimatedCounter.css';

class AnimatedCounter extends React.Component {

    state = { };

    static getDerivedStateFromProps(props, state) {
        const { counter } = props;
        const { prevCounter } = state;

        if (counter !== prevCounter) {
            return {
                prevCounter: counter,

                scrollDown: counter > prevCounter
            };
        }

        return null;
    }

    render() {
        const { counter, height, reverse } = this.props;
        const { scrollDown } = this.state;
        if (!counter) return null;

        const counterStr = counter + '';

        return (
            <div className='animated-counter' style={{ height }}>
                {[...counterStr].reverse().map((x, index) => <AnimatedItem key={index} item={x} scrollDown={reverse ? !scrollDown : scrollDown} height={height} />)}
            </div>
        );
    }
}

AnimatedCounter.propTypes = {
    counter: PropTypes.number,
    height: PropTypes.number,
    reverse: PropTypes.bool
};

AnimatedCounter.defaultProps = {
    counter: 0,
    height: 21,
    reverse: false
}

export default AnimatedCounter;