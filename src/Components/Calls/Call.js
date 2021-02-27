/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import CallPanel from './CallPanel';
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import { clamp } from '../../Utils/Common';
import { closeGroupCallPanel } from '../../Actions/Call';
import { modalManager } from '../../Utils/Modal';
import { PIP_PLAYER_BORDER_PRECISION } from '../../Constants';
import CallStore from '../../Stores/CallStore';
import './GroupCall.css';

class Call extends React.Component {

    constructor(props) {
        super(props);

        this.keyboardHandler = new KeyboardHandler(this.onKeyDown);

        this.state = {
            fullScreen: false
        };
    }

    onKeyDown = event => {
        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        // const fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

        const { key } = event;
        switch (key) {
            case 'Escape': {

                this.handleClose();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }
    };

    componentDidMount() {
        this.setPosition();

        CallStore.on('clientUpdateGroupCallFullScreen', this.onClientUpdateGroupCallFullScreen);
        KeyboardManager.add(this.keyboardHandler);
        window.addEventListener('resize', this.onWindowResize);
    }

    componentWillUnmount() {
        CallStore.off('clientUpdateGroupCallFullScreen', this.onClientUpdateGroupCallFullScreen);
        KeyboardManager.remove(this.keyboardHandler);
        window.removeEventListener('resize', this.onWindowResize);
    }

    onClientUpdateGroupCallFullScreen = update => {
        const { fullscreen } = update;

        this.setState({ fullscreen });
    };

    handleClose = () => {
        closeGroupCallPanel();
    };

    handleMouseDown = event => {
        if (event.nativeEvent.which !== 1) return;

        const element = document.getElementById('call');
        if (element) element.focus();

        this.mouseDownRoot = true;
        event.preventDefault();

        this.left = parseInt(element.style.left, 10);
        this.top = parseInt(element.style.top, 10);
        this.pageX = event.nativeEvent.pageX;
        this.pageY = event.nativeEvent.pageY;

        document.onmousemove = this.handleMouseMove;
        document.onmouseup = this.handleMouseUp;

        this.windowDragging = true;
    };

    onWindowResize = () => {
        const fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
        if (fullscreenElement) return;

        const player = document.getElementById('call');

        const oldLeft = parseInt(player.style.left, 10);
        const oldTop = parseInt(player.style.top, 10);

        const { left, top } = this.normalizePosition(oldLeft, oldTop, true);

        if (oldLeft === left && oldTop === top) return;

        // console.log('[pip] windowResize', left, top);
        player.style.left = left + 'px';
        player.style.top = top + 'px';
    };

    handleMouseMove = event => {
        event.preventDefault();

        const { left: startLeft, top: startTop, pageX, pageY } = this;
        const { left, top } = this.normalizePosition(startLeft + event.pageX - pageX, startTop + event.pageY - pageY, false);

        const element = document.getElementById('call');
        element.style.left = left + 'px';
        element.style.top = top + 'px';
    };

    handleMouseUp = event => {
        event.preventDefault();

        document.onmousemove = null;
        document.onmouseup = null;

        this.windowDragging = false;
    };

    setPosition() {
        const element = document.getElementById('call');
        let { pipParams } = CallStore;
        if (!pipParams) {
            pipParams = {
                left: (window.document.documentElement.clientWidth - element.clientWidth) / 2,
                top: (window.document.documentElement.clientHeight - element.clientHeight) / 2
            }
        }

        const { left: prevLeft, top: prevTop } = pipParams;

        const { left, top } = this.normalizePosition(prevLeft, prevTop, false);

        element.style.left = left + 'px';
        element.style.top = top + 'px';
    }

    normalizePosition(left, top, checkGlue = true) {
        const player = document.getElementById('call');
        const playerWidth = player ? player.clientWidth : 300;
        const playerHeight = player ? player.clientHeight : 300;

        const { clientWidth: documentWidth } = document.documentElement;
        const { clientHeight: documentHeight } = document.documentElement;

        if (checkGlue && this.glueLeft) {
            left = 0;
        } else if (checkGlue && this.glueRight) {
            left = documentWidth - playerWidth;
        } else {
            // left = clamp(left - PIP_PLAYER_BORDER_PRECISION, 0, left);
            // left = clamp(left + PIP_PLAYER_BORDER_PRECISION, left, documentWidth - playerWidth);
            left = left < PIP_PLAYER_BORDER_PRECISION ? 0 : left;
            left = left > documentWidth - playerWidth - PIP_PLAYER_BORDER_PRECISION ? documentWidth - playerWidth : left;
            left = clamp(left, 0, documentWidth - playerWidth);
        }

        if (checkGlue && this.glueTop) {
            top = 0;
        } else if (checkGlue && this.glueBottom) {
            top = documentHeight - playerHeight;
        } else {
            top = top < PIP_PLAYER_BORDER_PRECISION ? 0 : top;
            top = top > documentHeight - playerHeight - PIP_PLAYER_BORDER_PRECISION ? documentHeight - playerHeight : top;
            top = clamp(top, 0, documentHeight - playerHeight);
        }

        this.glueLeft = left === 0;
        this.glueRight = left === documentWidth - playerWidth;
        this.glueTop = top === 0;
        this.glueBottom = top === documentHeight - playerHeight;

        CallStore.pipParams = { left, top };

        return { left, top };
    }

    render() {
        const { callId } = this.props;
        const { fullscreen } = this.state;

        return (
            <div
                id='call'
                className={classNames('group-call', { 'group-call-fullscreen': fullscreen })}
                onMouseDown={this.handleMouseDown}
            >
                <CallPanel callId={callId}/>
            </div>
        )
    }
}

Call.propTypes = {
    callId: PropTypes.number
};

export default Call;