/*
 *  Copyright (c) 2019-present, Aleksandr Telegin
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import TdLibController from '../../Controllers/TdLibController';

class Player extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();
        this.sourceRef = React.createRef();
        this.containerRef = React.createRef();
        this.visible = false;
    }

    setParam(name, value) {
        if (!this.video) return;

        this.video[name] = value;
    }

    setPlaybackRate(playbackRate) {
        this.setParam('playbackRate', playbackRate);
    }

    getCurrentTime() {
        if (this.video) return this.video.currentTime;
    }

    getDuration() {
        if (this.video) return this.video.duration;
    }

    setCurrentTime(currentTime) {
        this.setParam('currentTime', currentTime);
    }

    setVolume(volume) {
        this.setParam('volume', volume);
    }

    setMuted(muted) {
        this.setParam('muted', muted);
    }

    setSrc(src) {
        if (!this.video) return;

        if (this.source.src !== src) {
            this.source.src = src;
            this.video.load();
        }
    }

    show() {
        if (this.visible) return;

        if (!this.video) return;

        this.visible = true;
        this.video.width = this.props.width;
        this.video.height = this.props.height;
    }

    pause() {
        if (this.video) this.video.pause();
    }

    reset() {
        this.pause();
        this.setCurrentTime(0);
        this.play();
    }

    play() {
        if (!this.video) return;

        const promise = this.video.play();

        if (promise) {
            promise.then(_ => {}).catch(_ => {});
        }
    }

    isPaused() {
        if (this.video) return this.video.paused;

        return false;
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.src === this.props.src) return nextProps.className !== this.props.className;

        this.setSrc(nextProps.src);
        return false;
    }

    onLoadedMetadata = (...params) => {
        if (this.props.currentTime) this.video.currentTime = this.props.currentTime;

        if (this.props.autoPlay && window.hasFocus) this.play();

        this.props.onCanPlay && this.props.onCanPlay(...params);
    };

    stick(props) {
        const { chatId, messageId } = props;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaStickPlayer',
            chatId,
            messageId,
            player: this.video
        });
        this.isSticked = true;
    }

    unstick(orphan) {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaUnstickPlayer',
            chatId: this.props.chatId,
            messageId: this.props.messageId,
            container: orphan ? undefined : this.containerRef.current
        });
        this.isSticked = false;
    }

    onCanPlay = () => {};

    onTimeUpdate = (...params) => {
        // this.show();

        this.props.onTimeUpdate && this.props.onTimeUpdate(...params);
    };

    componentWillUnmount() {
        if (!this.isSticked) this.pause();
    }

    componentDidMount() {
        this.source = this.sourceRef.current;
        this.video = this.videoRef.current;
        this.video.load();
    }

    render() {
        var { width, height } = this.props,
            filteredProps = { ...this.props };

        delete filteredProps.currentTime;
        delete filteredProps.src;
        delete filteredProps.mimeType;

        return (
            <div ref={this.containerRef} style={{ width, height }}>
                <video
                    {...filteredProps}
                    ref={this.videoRef}
                    onLoadedMetadata={this.onLoadedMetadata}
                    onCanPlay={this.onCanPlay}
                    onTimeUpdate={this.onTimeUpdate}
                    autoPlay={false}>
                    <source ref={this.sourceRef} src={this.props.src} type={this.props.mimeType || 'video/MP4'} />
                </video>
            </div>
        );
    }
}

export default Player;
