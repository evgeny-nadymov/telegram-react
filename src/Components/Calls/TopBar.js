/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import LineBlobDrawable from './LineBlobDrawable';

export const MUTE_BUTTON_STATE_UNMUTE = 0;
export const MUTE_BUTTON_STATE_MUTE = 1;
export const MUTE_BUTTON_STATE_CONNECTING = 2;
export const MUTE_BUTTON_STATE_MUTED_BY_ADMIN = 3;

export class WeavingState {
    constructor(stateId) {
        this.stateId = stateId;
        this.shader = (ctx, left, top, right, bottom) => { };
        this.createGradient(stateId);
    }

    createGradient(stateId) {
        this.shader = (ctx, left, top, right, bottom) => {
            ctx.fillStyle = WeavingState.getGradientFromType(ctx, stateId, left, top, right, bottom);
        };
    }

    // Android colors
    static getGradientFromType(ctx, type, x0, y0, x1, y1) {
        const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        if (type === MUTE_BUTTON_STATE_MUTED_BY_ADMIN) {
            gradient.addColorStop(0, '#57A4FE');
            gradient.addColorStop(.6, '#766EE9');
            gradient.addColorStop(1, '#F05459');
        } else if (type === MUTE_BUTTON_STATE_UNMUTE) {
            gradient.addColorStop(0, '#00B1C0');
            gradient.addColorStop(1, '#52CE5D');
        } else if (type === MUTE_BUTTON_STATE_MUTE) {
            gradient.addColorStop(0, '#2BCEFF');
            gradient.addColorStop(1, '#0976E3');
        } else {
            gradient.addColorStop(0, '#8599aa');
            gradient.addColorStop(1, '#8599aa');
        }

        return gradient;
    }

    update(height, width, dt, amplitude) {
        // TODO: move gradient here
    }
}

class TopBar extends React.Component {
    constructor(props) {
        super(props);

        this.focused = true;
        this.resizing = false;
        this.lastUpdateTime = new Date();
        this.amplitude = 0.0;
        this.amplitude2 = 0.0;

        this.states = [
            new WeavingState(MUTE_BUTTON_STATE_UNMUTE),
            new WeavingState(MUTE_BUTTON_STATE_MUTE),
            new WeavingState(MUTE_BUTTON_STATE_CONNECTING),
            new WeavingState(MUTE_BUTTON_STATE_MUTED_BY_ADMIN),
        ];
        this.prevState = null;
        this.currentState = this.states[MUTE_BUTTON_STATE_CONNECTING];
        this.progressToState = 1.0;

        this.scale = window.devicePixelRatio;
        this.left = 0 * this.scale;
        this.top = 20 * this.scale;
        this.right = 1260 * this.scale;
        this.bottom = 63 * this.scale;
    }

    componentDidMount() {
        this.mounted = true;
        window.addEventListener('blur', this.handleBlur);
        window.addEventListener('focus', this.handleFocus);
        window.addEventListener('resize', this.handleResize);
        this.media = window.matchMedia('screen and (min-resolution: 2dppx)');
        this.media.addEventListener('change', this.handleDevicePixelRatioChanged);

        const topBar = document.getElementById('top-bar');
        this.right = topBar.offsetWidth * this.scale;
        this.forceUpdate();

        this.canvas = document.getElementById('canvas');
        this.lbd = new LineBlobDrawable(3);
        this.lbd1 = new LineBlobDrawable(7);
        this.lbd2 = new LineBlobDrawable(8);
        this.setAmplitude(this.amplitude);

        this.draw();
    }

    componentWillUnmount() {
        this.mounted = false;
        window.removeEventListener('blur', this.handleBlur);
        window.removeEventListener('focus', this.handleFocus);
        window.removeEventListener('resize', this.handleResize);
        this.media.addEventListener('change', this.handleDevicePixelRatioChanged);
    }

    handleDevicePixelRatioChanged = e => {
        this.scale = window.devicePixelRatio;
        this.left = 0 * this.scale;
        this.top = 20 * this.scale;
        this.bottom = 63 * this.scale;

        const topBar = document.getElementById('top-bar');
        if (!topBar) return;

        this.right = topBar.offsetWidth * this.scale;
        this.forceUpdate();
    }

    handleResize = () => {
        if (this.resizeHandler) {
            clearTimeout(this.resizeHandler);
            this.resizeHandler = null;
        }

        this.resizing = true;
        this.resizeCanvas();
        this.resizeHandler = setTimeout(() => {
            this.resizing = false;
            this.invokeDraw();
        }, 250);
    }

    resizeCanvas() {
        const topBar = document.getElementById('top-bar');

        this.scale = window.devicePixelRatio;
        this.right = topBar.offsetWidth * this.scale;

        this.forceUpdate();
        this.invokeDraw();
    }

    handleFocus = () => {
        this.focused = true;
        this.invokeDraw();
    }

    handleBlur = () => {
        this.focused = false;
    }

    invokeDraw = () => {
        if (this.raf) return;

        this.draw();
    }

    draw = (force = false) => {
        this.raf = null;
        if (!this.mounted) {
            return;
        }
        const { lbd, lbd1, lbd2, scale, left, top, right, bottom, currentState, previousState, focused, resizing } = this;
        if (!focused && !resizing && this.progressToState >= 1.0) {
            return;
        }

        // console.log('[top] draw', [focused, resizing, this.mounted]);

        const newTime = new Date();
        let dt = (newTime - this.lastUpdateTime);
        if (dt > 20) {
            dt = 17;
        }

        // console.log('draw start', this.amplitude, this.animateToAmplitude);
        if (this.animateToAmplitude !== this.amplitude) {
            this.amplitude += this.animateAmplitudeDiff * dt;
            if (this.animateAmplitudeDiff > 0) {
                if (this.amplitude > this.animateToAmplitude) {
                    this.amplitude = this.animateToAmplitude;
                }
            } else {
                if (this.amplitude < this.animateToAmplitude) {
                    this.amplitude = this.animateToAmplitude;
                }
            }
        }

        if (this.animateToAmplitude !== this.amplitude2) {
            this.amplitude2 += this.animateAmplitudeDiff2 * dt;
            if (this.animateAmplitudeDiff2 > 0) {
                if (this.amplitude2 > this.animateToAmplitude) {
                    this.amplitude2 = this.animateToAmplitude;
                }
            } else {
                if (this.amplitude2 < this.animateToAmplitude) {
                    this.amplitude2 = this.animateToAmplitude;
                }
            }
        }

        if (previousState) {
            this.progressToState += dt / 250;
            if (this.progressToState > 1) {
                this.progressToState = 1;
                this.previousState = null;
            }
        }

        const top1 = 6 * this.amplitude2 * scale;
        const top2 = 6 * this.amplitude2 * scale;

        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        lbd.minRadius = 0;
        lbd.maxRadius = (2 + 2 * this.amplitude) * scale;
        lbd1.minRadius = 0;
        lbd1.maxRadius = (3 + 9 * this.amplitude) * scale;
        lbd2.minRadius = 0;
        lbd2.maxRadius = (3 + 9 * this.amplitude) * scale;

        lbd.update(this.amplitude, 0.3);
        lbd1.update(this.amplitude, 0.7);
        lbd2.update(this.amplitude, 0.7);

        for (let i = 0; i < 2; i++) {
            if (i === 0 && !previousState) {
                continue;
            }

            let alpha = 1;
            let state = null;
            if (i === 0) {
                alpha = 1 - this.progressToState;
                state = previousState;
                // previousState.setToPaint(paint);
            } else {
                alpha = previousState ? this.progressToState : 1;
                currentState.update(bottom - top, right - left, dt, this.amplitude);
                state = currentState;
                // currentState.setToPaint(paint);
            }

            const paint1 = ctx => {
                ctx.globalAlpha = 0.3 * alpha;
                state.shader(ctx, left, top, right, bottom);
            };
            const paint = ctx => {
                ctx.globalAlpha = i === 0? 1 : alpha;
                state.shader(ctx, left, top, right, bottom);
            };

            lbd1.draw(left, top - top1, right, bottom, this.canvas, paint1,  top, 1.0);
            lbd2.draw(left, top - top2, right, bottom, this.canvas, paint1,  top, 1.0);
            lbd.draw(left, top, right, bottom, this.canvas, paint, top, 1.0);
        }

        if (!force) {
            this.raf = requestAnimationFrame(() => this.draw());
        }
    };

    setCurrentState = (stateId, animated) => {
        const { currentState, states } = this;

        if (currentState && currentState.id === stateId) {
            return;
        }

        this.previousState = animated ? currentState : null;
        this.currentState = states[stateId];
        this.progressToState = this.previousState ? 0.0 : 1.0;
    };

    setAmplitude(value) {
        this.animateToAmplitude = value;
        this.animateAmplitudeDiff = (value - this.amplitude) / 250;
        this.animateAmplitudeDiff2 = (value - this.amplitude) / 120;
    }

    render() {
        const { left, right, top, bottom, scale } = this;

        return(
            <div id='top-bar' className='top-bar'>
                <canvas id='canvas' width={right} height={bottom} style={{ width: right / scale, height: bottom / scale }}/>
            </div>
        );
    }
}

TopBar.propTypes = {};

export default TopBar;