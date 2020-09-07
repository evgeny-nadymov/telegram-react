/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';

class RLottie extends React.Component {
    componentDidMount() {
        const { options, eventListeners } = this.props;

        const {
            url,
            loop,
            autoplay,
            animationData,
            rendererSettings,
            segments
        } = options;

        this.options = {
            container: this.el,
            renderer: 'canvas',
            loop: Boolean(loop),
            autoplay: Boolean(autoplay),
            segments: Boolean(segments),
            animationData,
            rendererSettings
        };

        this.options = { ...this.options, ...options };
        const data = this.options.animationData;
        const fileId = this.options.fileId;
        // console.log('[RLottie] ctor loadAnimation start', [fileId, data]);
        window.RLottie.loadAnimation(this.options, anim => {
            this.anim = anim;
            // console.log('[RLottie] ctor loadAnimation stop', anim, [fileId, data]);
            // if (this.props.options.url === url) {
            //     this.anim = anim;
            // } else {
            //     window.RLottie.destroy(anim);
            // }
        });
        this.registerEvents(eventListeners);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { options, eventListeners } = this.props;
        const { options: prevOptions, eventListeners: prevEventListeners } = prevProps

        // const data = options.animationData;
        // const prevData = prevOptions.animationData;
        // const fileId = options.fileId;
        // const prevFileId = prevOptions.fileId;
        if (options.animationData !== prevOptions.animationData || options.fileId !== prevOptions.fileId) {
            // console.log('[RLottie] update', [fileId, data], [prevFileId, prevData], [options.animationData !== prevOptions.animationData, options.fileId !== prevOptions.fileId])
            this.unregisterEvents(prevEventListeners);
            this.destroy();

            this.options = { ...this.options, ...options };
            // console.log('[RLottie] update loadAnimation start', [fileId, data]);
            const url = this.props.options.url;
            window.RLottie.loadAnimation(this.options, anim => {
                this.anim = anim;
                // console.log('[RLottie] update loadAnimation stop', anim, [fileId, data]);
                // if (this.props.options.url === url) {
                //     this.anim = anim;
                // } else {
                //     window.RLottie.destroy(anim);
                // }
            });
            this.registerEvents(eventListeners);
        }
    }

    componentWillUnmount() {
        this.unregisterEvents(this.props.eventListeners);
        this.destroy();
        this.options.blob = null;
        this.options.container = null;
        this.options = null;
        this.anim = null;
    }

    play() {
        // this.anim.play();
    }

    playSegments(segments, forceFlag) {
        // this.anim.playSegments(segments, forceFlag);
    }

    stop() {
        // this.anim.stop();
    }

    pause() {
        // if (!this.anim.isPaused) {
        //     this.anim.pause();
        //     return true;
        // }

        return false;
    }

    destroy() {
        // console.log('[RLottie] destroy', this.anim);
        if (!this.anim) return;

        window.RLottie.destroy(this.anim);
        // this.anim.destroy();
    }

    registerEvents(eventListeners) {
        if (!this.anim) return;

        if (!eventListeners) return;

        eventListeners.forEach(({ eventName, callback }) => {
            window.RLottie.addEventListener(this.anim, eventName, callback);
        });
    }

    unregisterEvents(eventListeners) {
        if (!this.anim) return;

        if (!eventListeners) return;

        eventListeners.forEach(({ eventName, callback }) => {
            window.RLottie.removeEventListener(this.anim, eventName, callback);
        });
    }

    render() {
        const {
            width,
            height,
            ariaRole,
            ariaLabel,
            title,
            onMouseEnter,
            onMouseOut
        } = this.props;

        const lottieStyles = {
            width: width || '100%',
            height: height || '100%',
            overflow: 'hidden',
            // margin: '0 auto',
            outline: 'none',
            ...this.props.style
        };

        return (
            <div
                style={lottieStyles}
                title={title}
                role={ariaRole}
                aria-label={ariaLabel}
                tabIndex='0'
                onMouseEnter={onMouseEnter}
                onMouseOut={onMouseOut}
            >
                <picture
                    ref={c => this.el = c}
                    className='dev_page_tgsticker tl_main_card_animated js-tgsticker_image'>
                </picture>
            </div>
        );
    }
}

RLottie.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    options: PropTypes.object
};

export default RLottie;