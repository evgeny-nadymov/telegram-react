/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import lottie from 'lottie-web/build/player/lottie_light.min';
import './Lottie.css';
import { AnimationSegment } from 'lottie-web';

class Lottie extends React.Component {
    componentDidMount() {
        const { options, eventListeners } = this.props;
        // console.log('Lottie.componentDidMount', eventListeners, this.props);

        const {
            loop,
            autoplay,
            animationData,
            rendererSettings,
            segments
        } = options;

        this.options = {
            container: this.el,
            loop: Boolean(loop),
            autoplay: Boolean(autoplay),
            segments: Boolean(segments),
            animationData,
            renderer: 'svg',
            rendererSettings
        };

        this.options = { ...this.options, ...options };

        this.anim = lottie.loadAnimation(this.options);
        this.registerEvents(eventListeners);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { options, eventListeners } = this.props;
        const { options: prevOptions, eventListeners: prevEventListeners } = prevProps

        if (options.animationData !== prevOptions.animationData) {
            this.unregisterEvents(prevEventListeners);

            this.destroy();
            this.options = { ...this.options, ...options };
            this.anim = lottie.loadAnimation(this.options);

            this.registerEvents(eventListeners);
        }
    }

    componentWillUnmount() {
        this.unregisterEvents(this.props.eventListeners);
        this.destroy();
        this.options.animationData = null;
        this.options.path = null;
        this.anim = null;
    }

    get isPaused() {
        return this.anim.isPaused;
    }

    goToAndPlay(value, isFrame) {
        this.anim.goToAndPlay(value, isFrame);
    }

    play() {
        this.anim.play();
    }

    playSegments(segments, forceFlag) {
        this.anim.playSegments(segments, forceFlag);
    }

    stop() {
        this.anim.stop();
    }

    pause() {
        if (!this.anim.isPaused) {
            this.anim.pause();
            return true;
        }

        return false;
    }

    destroy() {
        this.anim.destroy();
    }

    registerEvents(eventListeners) {
        if (!this.anim) return;

        if (!eventListeners) return;

        eventListeners.forEach(({ eventName, callback }) => {
            this.anim.addEventListener(eventName, callback);
        });
    }

    unregisterEvents(eventListeners) {
        if (!this.anim) return;

        if (!eventListeners) return;

        eventListeners.forEach(({ eventName, callback }) => {
            this.anim.removeEventListener(eventName, callback);
        });
    }

    render() {
        const {
            width,
            height,
            ariaRole,
            ariaLabel,
            title,
            eventListeners,
            onComplete,
            onMouseEnter,
            onMouseOut,
            ...other
        } = this.props;

        const getSize = initial => {
            let size;

            if (typeof initial === 'number') {
                size = `${initial}px`;
            } else {
                size = initial || '100%';
            }

            return size;
        };

        const lottieStyles = {
            width: getSize(width),
            height: getSize(height),
            overflow: 'hidden',
            margin: '0 auto',
            outline: 'none',
            ...this.props.style
        };

        return (
            // Bug with eslint rules https://github.com/airbnb/javascript/issues/1374
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div
                ref={c => { this.el = c; }}
                style={lottieStyles}
                title={title}
                role={ariaRole}
                aria-label={ariaLabel}
                tabIndex='0'
                {...other}
                onMouseEnter={onMouseEnter}
                onMouseOut={onMouseOut}
            />
        );
    }
}

Lottie.propTypes = {
    eventListeners: PropTypes.arrayOf(PropTypes.object),
    options: PropTypes.object.isRequired,

    height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    ariaRole: PropTypes.string,
    ariaLabel: PropTypes.string,
    title: PropTypes.string,

    style: PropTypes.string
};

Lottie.defaultProps = {
    eventListeners: [],
    ariaRole: 'button',
    ariaLabel: 'animation',
    title: ''
};

export default Lottie;
