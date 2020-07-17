/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import PlayerStore from '../../Stores/PlayerStore';
import './Hint.css';

class Hint extends React.Component {
    state = { text: null };

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaHint', this.onClientUpdateMediaHint);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaHint', this.onClientUpdateMediaHint);
    }

    onClientUpdateMediaHint = update => {
        const { fileId, text } = update;
        if (fileId !== this.props.fileId) return;

        const { animated } = this.state;

        clearTimeout(this.checkTimeout);
        this.setState({
            text,
            animated: false
        }, () => {
            this.checkTimeout = setTimeout(() => {
                if (this.state.text !== text) return;

                this.setState({
                    animated: true
                })
            }, 250);
        });
    };

    handleAnimationEnd = event => {
        this.setState({
            text: null,
            animated: false
        })
    }

    render() {
        const { animated, text } = this.state;
        if (!text) return null;

        return (
            <div className={classNames('player-hint', { 'player-hint-animated': animated })} onAnimationEnd={this.handleAnimationEnd}>
                <span>{text}</span>
            </div>
        );
    }
}

Hint.propTypes = {
    fileId: PropTypes.number
};

export default Hint;