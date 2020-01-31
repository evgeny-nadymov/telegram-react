/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { ANIMATION_DURATION_200MS } from './../../../Constants';
import './PollPercentage.css';

class PollPercentage extends React.Component {
    constructor(props) {
        super(props);

        this.handle = null;

        const { value } = props;

        this.state = {
            from: value,
            to: value,
            animated: value,

            prevPropsValue: value
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { closed, theme, value } = this.props;
        const { animated } = this.state;

        if (closed !== nextProps.closed) {
            return true;
        }

        if (theme !== nextProps.theme) {
            return true;
        }

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

        this.handle = requestAnimationFrame(this.onAnimationFrame);
    };

    stopAnimation = () => {
        if (!this.handle) return;

        cancelAnimationFrame(this.handle);
        this.handle = null;
    };

    onAnimationFrame = () => {
        const { startTime, from, to } = this.state;

        const timePassed = Date.now() - startTime;

        if (timePassed >= ANIMATION_DURATION_200MS) {
            this.setState({ animated: to });
            this.stopAnimation();
        } else {
            const animated = from + Math.floor(((to - from) * timePassed) / ANIMATION_DURATION_200MS);
            this.setState({ animated });
            this.handle = requestAnimationFrame(this.onAnimationFrame);
        }
    };

    render() {
        const { chosen, closed, onClick } = this.props;
        const { animated } = this.state;

        return (
            <div className='poll-percentage'>
                {/*{!closed && chosen ? (*/}
                {/*    <a className='poll-percentage-action' onClick={onClick}>*/}
                {/*        {animated + '%'}*/}
                {/*    </a>*/}
                {/*) : (*/}
                {/*    <>{animated + '%'}</>*/}
                {/*)}*/}
                <>{animated + '%'}</>
            </div>
        );
    }
}

PollPercentage.propTypes = {
    value: PropTypes.number.isRequired,
    chosen: PropTypes.bool,
    closed: PropTypes.bool,
    onClick: PropTypes.func
};

export default PollPercentage;
