/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './PollPercentage.css';

class PollPercentage extends React.Component {
    constructor(props) {
        super(props);

        this.timerHandler = null;
        this.duration = 200;

        this.state = {
            value: props.value,
            animatedValue: props.value,
            prevValue: props.value,
            prevPropsValue: props.value
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.value !== state.prevPropsValue) {
            return {
                value: props.value,
                startTime: Date.now(),
                fromValue: state.animatedValue,
                prevValue: state.prevPropsValue,
                prevPropsValue: props.value
            };
        }

        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.value !== this.props.value) {
            this.updateAnimation();
        }
    }

    componentWillUnmount() {
        this.stopAnimation();
    }

    updateAnimation = () => {
        this.stopAnimation();

        this.timerHandler = setInterval(this.onAnimationFrame, 40);
    };

    stopAnimation = () => {
        if (!this.timerHandler) return;

        clearInterval(this.timerHandler);
        this.timerHandler = null;
    };

    onAnimationFrame = () => {
        const now = Date.now();

        const timePassed = now - this.state.startTime;

        if (timePassed >= this.duration) {
            console.log('Poll.animationEnd', this.state.value);
            this.setState({
                animatedValue: this.state.value
            });
            this.stopAnimation();
        } else {
            const nextAnimatedValue =
                this.state.fromValue +
                Math.floor(((this.state.value - this.state.fromValue) * timePassed) / this.duration);
            console.log('Poll.animating', this.state.value, this.state.fromValue, nextAnimatedValue);
            this.setState({
                animatedValue: nextAnimatedValue
            });
        }
    };

    render() {
        const { chosen } = this.props;
        const { animatedValue } = this.state;

        return <div className={classNames('poll-percentage', { subtitle: !chosen })}>{animatedValue + '%'}</div>;
    }
}

PollPercentage.propTypes = {
    value: PropTypes.number.isRequired,
    chosen: PropTypes.bool
};

export default PollPercentage;
