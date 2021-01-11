/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import GroupCallPanel from './GroupCallPanel';
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import { modalManager } from '../../Utils/Modal';
import CallStore from '../../Stores/CallStore';
import TdLibController from '../../Controllers/TdLibController';
import './GroupCall.css';
import { PIP_PLAYER_BORDER_PRECISION } from '../../Constants';
import { clamp } from '../../Utils/Common';
import PlayerStore from '../../Stores/PlayerStore';

class GroupCall extends React.Component {

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
        KeyboardManager.add(this.keyboardHandler);
        CallStore.on('clientUpdateGroupCallFullScreen', this.onClientUpdateGroupCallFullScreen);
    }

    componentWillUnmount() {
        KeyboardManager.remove(this.keyboardHandler);
        CallStore.off('clientUpdateGroupCallFullScreen', this.onClientUpdateGroupCallFullScreen);
    }

    onClientUpdateGroupCallFullScreen = update => {
        const { fullscreen } = update;

        this.setState({ fullscreen });
    }

    handleClose = () => {
        const { groupCallId } = this.props;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateGroupCallPanel',
            groupCallId,
            opened: false
        });
    };

    handleMouseDown = event => {
        const element = document.getElementById('group-call');
        if (element) element.focus();

        this.mouseDownRoot = true;
        event.preventDefault();

        if (event.nativeEvent.which !== 1) return;

        this.offsetX = event.nativeEvent.offsetX;
        this.offsetY = event.nativeEvent.offsetY;

        document.onmousemove = this.handleMouseMove;
        document.onmouseup = this.handleMouseUp;

        this.setState({
            windowDragging: true
        });
    };

    handleMouseMove = event => {
        event.preventDefault();

        const { left, top } = this.normalizePosition(event.clientX - this.offsetX, event.clientY - this.offsetY, false);

        const element = document.getElementById('group-call');
        element.style.left = left + 'px';
        element.style.top = top + 'px';
    };

    handleMouseUp = event => {
        event.preventDefault();

        document.onmousemove = null;
        document.onmouseup = null;

        this.setState({
            windowDragging: false
        });
    };

    normalizePosition(left, top, checkGlue = true) {
        const player = document.getElementById('group-call');
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

        PlayerStore.pipParams = { left, top };

        return { left, top };
    }

    render() {
        const { groupCallId } = this.props;
        const { fullscreen } = this.state;

        return (
            <div
                id='group-call'
                className={classNames('group-call', { 'group-call-fullscreen': fullscreen })}
                onMouseDown={this.handleMouseDown}
            >
                <GroupCallPanel groupCallId={groupCallId} onClose={this.handleClose}/>
            </div>
        )
    }
}

GroupCall.propTypes = {
    groupCallId: PropTypes.number
};

export default GroupCall;