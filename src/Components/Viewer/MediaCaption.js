/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import './MediaCaption.css';

class MediaCaption extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            top: false,
            bottom: false
        };

        this.scrollRef = React.createRef();
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { text } = this.props;
        const { top, bottom } = this.state;

        if (nextProps.text !== text) return true;
        if (nextState.top !== top) return true;
        if (nextState.bottom !== bottom) return true;

        return false;
    }

    componentDidMount() {
        this.handleScroll();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { text } = this.props;

        if (prevProps.text !== text) {
            this.handleScroll();
        }
    }

    handleClick = event => {
        event.stopPropagation();
    };

    handleScroll = () => {
        const scroll = this.scrollRef.current;
        if (!scroll) return;

        const top = scroll.scrollTop === 0 && scroll.scrollHeight > scroll.offsetHeight;
        const bottom = scroll.scrollTop + scroll.offsetHeight === scroll.scrollHeight && scroll.scrollHeight > scroll.offsetHeight;

        this.setState({
            top,
            bottom
        })
    };

    render() {
        const { text } = this.props;
        const { top, bottom } = this.state;

        return (
            <div className='media-caption' onClick={this.handleClick}>
                <div
                    ref={this.scrollRef}
                    className={classNames(
                        'scrollbars-hidden',
                        'media-caption-wrapper', {
                            'media-caption-wrapper-top': top,
                            'media-caption-wrapper-bottom': bottom,
                            'media-caption-wrapper-both': !top && !bottom
                        })}
                    onScroll={this.handleScroll}>
                    <div className='media-caption-text'>{text}</div>
                </div>
            </div>
        );
    }
}

MediaCaption.propTypes = {
    text: PropTypes.array
};

MediaCaption.defaultProps = {};

export default MediaCaption;
