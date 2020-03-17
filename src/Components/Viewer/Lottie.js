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

class Lottie extends React.Component {
    componentDidMount() {
        const { options, eventListeners } = this.props;
        // console.log('Lottie.componentDidMount', eventListeners, this.props);

        const {
            loop,
            autoplay,
            animationData,
            //path,
            rendererSettings,
            segments
        } = options;

        this.options = {
            container: this.el,
            renderer: 'svg',
            loop: Boolean(loop),
            autoplay: Boolean(autoplay),
            segments: Boolean(segments),
            animationData,
            //path,
            rendererSettings
        };

        this.options = { ...this.options, ...options };

        this.anim = lottie.loadAnimation(this.options);
        this.registerEvents(eventListeners);
    }

    componentWillUpdate(nextProps, nextState, nextContext) {
        /* Recreate the animation handle if the data is changed */
        if (
            this.options.animationData !== nextProps.options.animationData ||
            this.options.path !== nextProps.options.path
        ) {
            this.unregisterEvents(this.props.eventListeners);
            this.destroy();
            this.options = { ...this.options, ...nextProps.options };
            this.anim = lottie.loadAnimation(this.options);
            this.registerEvents(nextProps.eventListeners);
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        // console.log('Lottie.componentDidUpdate', this.props.eventListeners, this.props);
        // if (this.props.isStopped) {
        //     this.stop();
        // } else if (this.props.segments) {
        //     this.playSegments();
        // } else {
        //     this.play();
        // }

        //this.pause();
        this.setSpeed();
        this.setDirection();
    }

    componentWillUnmount() {
        // console.log('Lottie.componentWillUnmount', this.props.eventListeners, this.props);
        this.unregisterEvents(this.props.eventListeners);
        this.destroy();
        this.options.animationData = null;
        this.options.path = null;
        this.anim = null;
    }

    getCurrentRawFrame() {
        return this.anim.currentRawFrame;
    }

    getCurrentFrame() {
        return this.anim.currentFrame;
    }

    setSpeed() {
        this.anim.setSpeed(this.props.speed);
    }

    setDirection() {
        this.anim.setDirection(this.props.direction);
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
                ref={c => {
                    this.el = c;
                }}
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
    speed: PropTypes.number,
    segments: PropTypes.arrayOf(PropTypes.number),
    direction: PropTypes.number,
    ariaRole: PropTypes.string,
    ariaLabel: PropTypes.string,
    title: PropTypes.string,
    style: PropTypes.string
};

Lottie.defaultProps = {
    eventListeners: [],
    speed: 1,
    ariaRole: 'button',
    ariaLabel: 'animation',
    title: ''
};

export default Lottie;
