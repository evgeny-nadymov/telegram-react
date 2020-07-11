/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './Progress.css';

class Progress extends React.Component {
    state = {
        waiting: false
    };

    componentDidMount() {
        this.handleWaiting();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.waiting !== this.props.waiting) {
            this.handleWaiting();
        }
    }

    handleWaiting = () => {
        const { waiting } = this.props;
        if (!waiting) {
            if (this.state.waiting) {
                this.setState({
                    waiting: false
                });
            }
            return;
        }

        setTimeout(() => {
            if (!this.props.waiting) return;

            this.setState({
                waiting: true
            })
        }, 250);
    };

    render() {
        const { waiting } = this.state;

        if (!waiting) return null;

        return (
            <div className='player-progress'>
                <svg viewBox='0 0 54 54' height='54' width='54'>
                    <circle stroke='white' fill='transparent' strokeWidth='3' strokeDasharray='120 100' strokeDashoffset='25' strokeLinecap='round' r='21' cx='27' cy='27'/>
                </svg>
            </div>
        );
    }

}

Progress.propTypes = {
    waiting: PropTypes.bool
};

export default Progress;