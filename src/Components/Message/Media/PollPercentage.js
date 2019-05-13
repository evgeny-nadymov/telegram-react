/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ANIMATION_FRAME_DURATION_MS, ANIMATION_DURATION_200MS } from './../../../Constants';
import './PollPercentage.css';

class PollPercentage extends React.Component {
    constructor(props) {
        super(props);

        this.timerHandler = null;

        const { value } = props;

        this.state = {
            from: value,
            to: value,
            animated: value,

            prevPropsValue: value
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { animated } = this.state;
        const { value } = this.props;

        if (value !== nextProps.value) {
            return true;
        }

        if (animated !== nextState.animated) {
            return true;
        }

        return false;
    }

    static getDerivedStateFromProps(props, state) {
        if (props.value !== state.prevPropsValue) {
            return {
                startTime: Date.now(),
                from: state.animated,
                to: props.value,

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

        this.timerHandler = requestAnimationFrame(this.onAnimationFrame);
        //this.timerHandler = setInterval(this.onAnimationFrame, ANIMATION_FRAME_DURATION_MS);
    };

    stopAnimation = () => {
        if (!this.timerHandler) return;

        cancelAnimationFrame(this.timerHandler);
        //clearInterval(this.timerHandler);
        this.timerHandler = null;
    };

    onAnimationFrame = () => {
        const { startTime, from, to } = this.state;

        const timePassed = Date.now() - startTime;

        if (timePassed >= ANIMATION_DURATION_200MS) {
            console.log('Poll.animationEnd', to);
            this.setState({ animated: to });
            this.stopAnimation();
        } else {
            const animated = from + Math.floor(((to - from) * timePassed) / ANIMATION_DURATION_200MS);
            console.log('Poll.animating', from, to, animated);
            this.setState({ animated });
            this.timerHandler = requestAnimationFrame(this.onAnimationFrame);
        }
    };

    render() {
        const { chosen } = this.props;
        const { animated } = this.state;

        return <div className={classNames('poll-percentage', { subtitle: !chosen })}>{animated + '%'}</div>;
    }
}

PollPercentage.propTypes = {
    value: PropTypes.number.isRequired,
    chosen: PropTypes.bool
};

export default PollPercentage;
