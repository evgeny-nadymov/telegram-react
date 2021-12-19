/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import BlobDrawable, {
    AMPLITUDE_SPEED,
    FORM_BIG_MAX,
    FORM_SMALL_MAX, LIGHT_GRADIENT_SIZE,
    SCALE_BIG,
    SCALE_BIG_MIN,
    SCALE_SMALL,
    SCALE_SMALL_MIN
} from './BlobDrawable';
import {
    MUTE_BUTTON_STATE_CONNECTING,
    MUTE_BUTTON_STATE_MUTE,
    MUTE_BUTTON_STATE_MUTED_BY_ADMIN,
    MUTE_BUTTON_STATE_UNMUTE
} from './TopBar';
import { stopPropagation } from '../../Utils/Message';

/// https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/view/animation/OvershootInterpolator.java
class OvershootInterpolator {
    constructor(tension) {
        this.mTension = tension;
    }

    getInterpolation(t) {
        // _o(t) = t * t * ((tension + 1) * t + tension)
        // o(t) = _o(t - 1) + 1
        t -= 1.0;
        return t * t * ((this.mTension + 1) * t + this.mTension) + 1.0;
    }
}

// https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/view/animation/DecelerateInterpolator.java
class DecelerateInterpolator {
    constructor(factor) {
        this.mFactor = factor || 1.0;
    }

    getInterpolation(input) {
        let result;
        if (this.mFactor === 1.0) {
            result = 1.0 - (1.0 - input) * (1.0 - input);
        } else {
            result = 1.0 - Math.pow((1.0 - input), 2 * this.mFactor);
        }
        return result;
    }
}

/// https://github.com/aosp-mirror/platform_frameworks_base/blob/master/core/java/android/view/animation/AccelerateInterpolator.java
class AccelerateInterpolator {
    constructor(factor) {
        this.mFactor = factor || 1.0;
        this.mDoubleFactor = 2 * this.mFactor;
    }

    getInterpolation(input) {
        if (this.mFactor === 1.0) {
            return input * input;
        }

        return Math.pow(input, this.mDoubleFactor);
    }
}

class WeavingState {
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

    update(top, left, size, dt) {
        // TODO: move gradient here
    }

    // Android colors
    static getGradientFromType(ctx, type, left, top, right, bottom) {
        if (type === MUTE_BUTTON_STATE_MUTED_BY_ADMIN) {
            const gradient = ctx.createLinearGradient(0, 100, 100, 0);

            gradient.addColorStop(0, '#57A4FE');
            gradient.addColorStop(.3, '#766EE9');
            gradient.addColorStop(1, '#F05459');

            return gradient;
        } else if (type === MUTE_BUTTON_STATE_UNMUTE) {
            const gradient=ctx.createRadialGradient(0,50,0,0,50,200);

            gradient.addColorStop(0, '#77E55C');
            gradient.addColorStop(1, '#56C7FE');

            return gradient;
        } else if (type === MUTE_BUTTON_STATE_MUTE) {
            const gradient = ctx.createRadialGradient(0,50,0,0,50,200);

            gradient.addColorStop(0, '#66D4FB');
            gradient.addColorStop(1, '#539EF8');

            return gradient;
        } else {
            const gradient = ctx.createLinearGradient(0, 400, 400, 0);

            gradient.addColorStop(0, '#2B333E');
            gradient.addColorStop(1, '#2B333E');

            return gradient;
        }
    }
}

class RadialProgressView {
    constructor() {
        this.decelerateInterpolator = new DecelerateInterpolator();
        this.accelerateInterpolator = new AccelerateInterpolator();

        this.lineCap = 'round';
        this.lineWidth = 3;
        this.progressColor = '#1C93E3';
        this.updateProgressPaint();

        this.lastUpdateTime = 0;
        this.radOffset = 0;
        this.currentCircleLength = 0;
        this.risingCircleLength = false;
        this.currentProgressTime = 0;
        this.useSelfAlpha = false;
        this.drawingCircleLength = 0;

        this.rotationTime = 2000;
        this.risingTime = 500;
        this.size = 0;

        this.currentProgress = 0;
        this.progressAnimationStart = 0;
        this.progressTime = 0;
        this.animatedProgress = 0;
        this.circle = false;
        this.circleProgress = 0;
        this.noProgress = true;
    }

    setUseSelfAlpha = value => {
        this.useSelfAlpha = value;
    };

    setAlpha = alpha => {
        console.log('[rpv] setAlpha', alpha);
    };

    setNoProgress = value => {
        this.noProgress = value;
    };

    setProgress = value => {
        this.currentProgress = value;
        if (this.animatedProgress > value) {
            this.animatedProgress = value;
        }

        this.progressAnimationStart = this.animatedProgress;
        this.progressTime = 0;
    };

    updateAnimation = () => {
        const newTime = new Date();
        let dt = newTime - this.lastUpdateTime;
        if (dt > 17) {
            dt = 17;
        }
        this.lastUpdateTime = newTime;

        this.radOffset += 360 * dt / this.rotationTime;
        let count = Math.trunc(this.radOffset / 360);
        this.radOffset -= count * 360;

        if (this.circle && this.circleProgress !== 1.0) {
            this.circleProgress += 16 / 220;
            if (this.circleProgress > 1.0) {
                this.circleProgress = 1.0;
            }
        } else if (!this.circle && this.circleProgress !== 0.0) {
            this.circleProgress -= 16 / 400;
            if (this.circleProgress < 0) {
                this.circleProgress = 0;
            }
        }

        if (this.noProgress) {
            if (this.circleProgress === 0) {
                this.currentProgressTime += dt;
                if (this.currentProgressTime >= this.risingTime) {
                    this.currentProgressTime = this.risingTime;
                }
                if (this.risingCircleLength) {
                    this.currentCircleLength = 4 + 266 * this.accelerateInterpolator.getInterpolation(this.currentProgressTime / this.risingTime);
                } else {
                    this.currentCircleLength = 4 - 270 * (1.0 - this.decelerateInterpolator.getInterpolation(this.currentProgressTime / this.risingTime));
                }

                if (this.currentProgressTime === this.risingTime) {
                    if (this.risingCircleLength) {
                        this.radOffset += 270;
                        this.currentCircleLength = -266;
                    }

                    this.risingCircleLength = !this.risingCircleLength;
                    this.currentProgressTime = 0;
                }
            } else {
                if (this.risingCircleLength) {
                    const old = this.currentCircleLength;
                    this.currentCircleLength = 4 + 266 * this.accelerateInterpolator.getInterpolation(this.currentProgressTime / this.risingTime);
                    this.currentCircleLength += 360 * this.circleProgress;
                    const dx = old - this.currentCircleLength;
                    if (dx > 0) {
                        this.radOffset += old - this.currentCircleLength;
                    }
                } else {
                    const old = this.currentCircleLength;
                    this.currentCircleLength = 4 - 270 * (1.0 - this.decelerateInterpolator.getInterpolation(this.currentProgressTime / this.risingTime));
                    this.currentCircleLength -= 364 * this.circleProgress;
                    const dx = old - this.currentCircleLength;
                    if (dx > 0) {
                        this.radOffset += old - this.currentCircleLength;
                    }
                }
            }
        }
        else {
            let progressDiff = this.currentProgress - this.progressAnimationStart;
            if (progressDiff > 0) {
                progressDiff += dt;
                if (this.progressTime >= 200) {
                    this.animatedProgress = this.progressAnimationStart = this.currentProgress;
                    this.progressTime = 0;
                } else {
                    this.animatedProgress = this.progressAnimationStart + progressDiff * this.decelerateInterpolator.getInterpolation(this.progressTime / 200);
                }
            }
            this.currentCircleLength = Math.max(4, 360 * this.animatedProgress);
        }
    };

    setSize = size => {
        this.size = size;
    };

    setStrokeWidth = value => {
        this.lineWidth = value;
        this.updateProgressPaint();
    };

    setProgressColor = color => {
        this.progressColor = color;
        this.updateProgressPaint();
    };

    updateProgressPaint() {
        this.progressPaint = ctx => {
            if (this.lineCap) {
                ctx.lineCap = this.lineCap;
            }
            if (this.lineWidth) {
                ctx.lineWidth = this.lineWidth;
            }
            if (this.progressColor) {
                ctx.strokeStyle = this.progressColor;
            }
        };
    }

    toCircle = (toCircle, animated) => {
        this.circle = toCircle;
        if (!animated) {
            this.circleProgress = this.circle ? 1.0 : 0.0;
        }
    }

    draw = (canvas, cx, cy, scale = 1) => {
        this.circleRect = { x0: cx - this.size / 2, y0: cy - this.size / 2, x1: cx + this.size / 2, y1: cy + this.size / 2 };
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.translate(cx, cy);
            ctx.scale(scale, scale);
            ctx.beginPath();
            if (!this.risingCircleLength) {
                if ((this.radOffset + this.currentCircleLength) > this.radOffset) {
                    this.currentCircleLength = 0;
                }
            }

            const radStart = this.radOffset * Math.PI / 180;
            this.drawingCircleLength = this.currentCircleLength;
            const radLength = this.drawingCircleLength * Math.PI / 180;


            ctx.arc(0, 0, this.size / 2, radStart, radStart + radLength, !this.risingCircleLength);
            this.progressPaint(ctx);
            ctx.stroke();
            ctx.restore();

            this.updateAnimation();
        }
    }

    isCircle = () => {
        return Math.abs(this.drawingCircleLength) >= 360;
    }
}

class Button extends React.Component {

    constructor(props) {
        super(props);

        this.focused = true;
        this.radialPaint = ctx => { };
        this.paint = ctx => { };
        this.paintTmp = ctx => { };
        this.lastUpdateTime = new Date();
        this.amplitude = 0.0;

        this.states = [
            new WeavingState(MUTE_BUTTON_STATE_UNMUTE),
            new WeavingState(MUTE_BUTTON_STATE_MUTE),
            new WeavingState(MUTE_BUTTON_STATE_CONNECTING),
            new WeavingState(MUTE_BUTTON_STATE_MUTED_BY_ADMIN),
        ];
        this.switchProgress = 1.0;
        this.muteButtonState = MUTE_BUTTON_STATE_MUTE;
        this.prevState = null;
        this.currentState = this.states[this.muteButtonState];
        this.progressToState = 1.0;

        this.showLightingProgress = 1.0;
        this.showWavesProgress = 1.0;
        this.overshootInterpolator = new OvershootInterpolator(1.5);
        this.colorsTmp = new Array(3);

        this.scale = window.devicePixelRatio;
        this.left = 0 * this.scale;
        this.top = 0 * this.scale;
        this.right = 380 * this.scale;
        this.bottom = (220 + 28) * this.scale;
        this.cx = 190 * this.scale;
        this.cy = (110 + 28) * this.scale;

        this.buttonDefaultRadius = 57;
        this.buttonRadius = 52;
        this.strokeWidth = 4;
        this.invalidateColors = true;
        this.radialProgressView = new RadialProgressView();
        this.radialProgressView.setSize(this.buttonRadius * 2 - this.strokeWidth);
        this.radialProgressView.setStrokeWidth(this.strokeWidth);
        this.radialProgressView.setProgressColor('#28BAFF');
    }

    componentDidMount() {
        this.mounted = true;
        window.addEventListener('blur', this.handleBlur);
        window.addEventListener('focus', this.handleFocus);
        this.media = window.matchMedia('screen and (min-resolution: 2dppx)');
        this.media.addEventListener('change', this.handleDevicePixelRatioChanged);


        this.canvas = document.getElementById('button-canvas');
        this.tinyWaveDrawable = new BlobDrawable(9);
        this.bigWaveDrawable = new BlobDrawable(12);

        this.tinyWaveDrawable.minRadius = Math.trunc(62 / this.buttonDefaultRadius * this.buttonRadius);
        this.tinyWaveDrawable.maxRadius = Math.trunc(72 / this.buttonDefaultRadius * this.buttonRadius);
        this.tinyWaveDrawable.generateInitBlob();

        this.bigWaveDrawable.minRadius = Math.trunc(65 / this.buttonDefaultRadius * this.buttonRadius);
        this.bigWaveDrawable.maxRadius = Math.trunc(75 / this.buttonDefaultRadius * this.buttonRadius);
        this.bigWaveDrawable.generateInitBlob();

        const color = '#66D4FB';
        this.radialGradient = ctx => {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 160);
            gradient.addColorStop(0, color + '32');
            gradient.addColorStop(1, color + '00');

            ctx.fillStyle = gradient;
        };
        this.radialPaint = this.radialGradient;

        this.setAmplitude(this.amplitude);

        // console.log('[button] componentDidMount draw');
        this.draw();
    }

    componentWillUnmount() {
        this.mounted = false;
        window.removeEventListener('blur', this.handleBlur);
        window.removeEventListener('focus', this.handleFocus);
        this.media.addEventListener('change', this.handleDevicePixelRatioChanged);
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

    handleDevicePixelRatioChanged = e => {
        this.scale = window.devicePixelRatio;
        this.left = 0 * this.scale;
        this.top = 0 * this.scale;
        this.right = 380 * this.scale;
        this.bottom = (220 + 28) * this.scale;
        this.cx = 190 * this.scale;
        this.cy = (110 + 28) * this.scale;
        this.forceUpdate();
    }

    fillColors(stateId, colorsToSet) {
        if (stateId === MUTE_BUTTON_STATE_UNMUTE) {
            colorsToSet[0] = '#66D4FB';
            colorsToSet[1] = '';
            colorsToSet[2] = '';
        } else if (stateId === MUTE_BUTTON_STATE_MUTE) {
            colorsToSet[0] = '#7DDCAA';
            colorsToSet[1] = '';
            colorsToSet[2] = '';
        } else if (stateId === MUTE_BUTTON_STATE_MUTED_BY_ADMIN) {
            colorsToSet[0] = '#766EE9';
            colorsToSet[1] = '';
            colorsToSet[2] = '';
        } else {
            colorsToSet[0] = '#1C2229';
            colorsToSet[1] = '';
            colorsToSet[2] = '';
        }
    }

    strToHex(n) {
        let s = n.toString(16);
        if (s.length === 1) {
            s = '0' + s;
        }
        return s;
    }

    blendARGB(color1, color2, ratio) {
        if (color1.length <= 7) {
            color1 += 'FF';
        }
        if (color2.length <= 7) {
            color2 += 'FF';
        }
        const c1 = {
            r: parseInt(color1.substr(1, 2), 16),
            g: parseInt(color1.substr(3, 2), 16),
            b: parseInt(color1.substr(5, 2), 16),
            a: parseInt(color1.substr(7, 2), 16),
        };
        const c2 = {
            r: parseInt(color2.substr(1, 2), 16),
            g: parseInt(color2.substr(3, 2), 16),
            b: parseInt(color2.substr(5, 2), 16),
            a: parseInt(color2.substr(7, 2), 16),
        };

        const inverseRatio = 1 - ratio;
        const a = Math.trunc(c1.a * inverseRatio + c2.a * ratio) % 256;
        const r = Math.trunc(c1.r * inverseRatio + c2.r * ratio) % 256;
        const g = Math.trunc(c1.g * inverseRatio + c2.g * ratio) % 256;
        const b = Math.trunc(c1.b * inverseRatio + c2.b * ratio) % 256;

        return `#${this.strToHex(r)}${this.strToHex(g)}${this.strToHex(b)}`;
    }

    draw = (force = false) => {
        this.raf = null;
        if (!this.mounted) {
            return;
        }
        if (!this.focused && this.switchProgress >= 1.0) {
            return;
        }
        // console.log('[button] draw', [this.focused, this.mounted]);
        const { currentState, prevState, left, top, right, bottom } = this;

        const newTime = new Date();
        let dt = (newTime - this.lastUpdateTime);
        if (dt > 20) {
            dt = 17;
        }

        this.tinyWaveDrawable.minRadius = Math.trunc(62 / this.buttonDefaultRadius * this.buttonRadius);
        this.tinyWaveDrawable.maxRadius = Math.trunc((62 + 20 * FORM_SMALL_MAX) / this.buttonDefaultRadius * this.buttonRadius);

        this.bigWaveDrawable.minRadius = Math.trunc(65 / this.buttonDefaultRadius * this.buttonRadius);
        this.bigWaveDrawable.maxRadius = Math.trunc((65 + 20 * FORM_BIG_MAX) / this.buttonDefaultRadius * this.buttonRadius);

        if (this.animateToAmplitude !== this.amplitude) {
            this.amplitude = this.amplitude + this.animateAmplitudeDiff * dt;
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

        let canSwitchProgress = true;
        if (prevState && prevState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
            this.radialProgressView.toCircle(true, true);
            if (!this.radialProgressView.isCircle()) {
                canSwitchProgress = false;
            }
        } else if (prevState && currentState && currentState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
            this.radialProgressView.toCircle(true, false);
        }

        if (canSwitchProgress) {
            if (this.switchProgress !== 1) {
                if (prevState && prevState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                    this.switchProgress += dt / 100;
                } else {
                    this.switchProgress += dt / 180;
                }

                if (this.switchProgress >= 1.0) {
                    this.switchProgress = 1.0;
                    this.prevState = null;
                    if (currentState && currentState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                        this.radialProgressView.toCircle(false, true);
                    }
                }
                this.invalidateColors = true;
            }

            if (this.invalidateColors && currentState) {
                this.invalidateColors = false;
                let lightingColor;
                if (prevState) {
                    this.fillColors(prevState.stateId, this.colorsTmp);
                    const oldLight = this.colorsTmp[0];
                    this.fillColors(currentState.stateId, this.colorsTmp);
                    const newLight = this.colorsTmp[0];
                    lightingColor = this.blendARGB(oldLight, newLight, this.switchProgress);
                } else {
                    this.fillColors(currentState.stateId, this.colorsTmp);
                    lightingColor = this.colorsTmp[0];
                }
                if (this.currentLightColor !== lightingColor) {
                    this.radialGradient = ctx => {
                        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);

                        gradient.addColorStop(0, lightingColor + '3C');
                        gradient.addColorStop(1, lightingColor + '00');

                        ctx.fillStyle = gradient;
                    };
                    this.currentLightColor = lightingColor;
                }
            }

            let showWaves = false;
            let showLighting = false;
            if (currentState) {
                showWaves = currentState.stateId === MUTE_BUTTON_STATE_MUTE || currentState.stateId === MUTE_BUTTON_STATE_UNMUTE;
                showLighting = currentState.stateId !== MUTE_BUTTON_STATE_CONNECTING;
            }

            if (prevState && currentState && currentState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                this.showWavesProgress -= dt / 180;
                if (this.showWavesProgress < 0) {
                    this.showWavesProgress = 0;
                }
            } else {
                if (showWaves && this.showWavesProgress !== 1) {
                    this.showWavesProgress += dt / 350;
                    if (this.showWavesProgress > 1) {
                        this.showWavesProgress = 1;
                    }
                } else if (!showWaves && this.showWavesProgress !== 0) {
                    this.showWavesProgress -= dt / 350;
                    if (this.showWavesProgress < 0) {
                        this.showWavesProgress = 0;
                    }
                }
            }

            if (showLighting && this.showLightingProgress !== 1) {
                this.showLightingProgress += dt / 350;
                if (this.showLightingProgress > 1) {
                    this.showLightingProgress = 1;
                }
            } else if (!showLighting && this.showLightingProgress !== 0) {
                this.showLightingProgress -= dt / 350;
                if (this.showLightingProgress < 0) {
                    this.showLightingProgress = 0;
                }
            }
        }

        let showWavesProgressInterpolated = this.overshootInterpolator.getInterpolation(this.showWavesProgress);
        showWavesProgressInterpolated = 0.4 + 0.6 * showWavesProgressInterpolated;

        this.bigWaveDrawable.update(this.amplitude, 1.0);
        this.tinyWaveDrawable.update(this.amplitude, 1.0);

        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.resetTransform();

        const cx = this.cx;
        const cy = this.cy;

        if (prevState && currentState && (currentState.stateId === MUTE_BUTTON_STATE_CONNECTING || prevState.stateId === MUTE_BUTTON_STATE_CONNECTING)) {
            let progress;
            if (currentState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                progress = this.switchProgress;
                this.paint = prevState.shader;
            } else {
                progress = 1.0 - this.switchProgress;
                this.paint = currentState.shader;
            }

            this.paintTmp = ctx => {
                ctx.fillStyle = '#2B333E';
            }

            let paint = ctx => {
                this.paint(ctx, left, top, right, bottom);
            };

            ctx.globalAlpha = 1.0;
            let scale = SCALE_BIG_MIN + SCALE_BIG * this.amplitude * 0.5;
            const scaleLight = 0.7 + LIGHT_GRADIENT_SIZE;
            this.drawCircle(ctx, cx, cy, scaleLight * scale * this.showLightingProgress * this.scale, 160, this.radialGradient);

            ctx.globalAlpha = 0.3;
            // big wave
            ctx.save();
            scale = SCALE_BIG_MIN + SCALE_BIG * this.amplitude;
            ctx.translate(cx, cy);
            ctx.scale(scale * showWavesProgressInterpolated * this.scale, scale * showWavesProgressInterpolated * this.scale);
            this.bigWaveDrawable.draw(0, 0 ,this.canvas, paint);
            ctx.restore();

            // small wave
            ctx.save();
            scale = SCALE_SMALL_MIN + SCALE_SMALL * this.amplitude;
            ctx.translate(cx, cy);
            ctx.scale(scale * showWavesProgressInterpolated * this.scale, scale * showWavesProgressInterpolated * this.scale);
            this.tinyWaveDrawable.draw(0, 0, this.canvas, paint);
            ctx.restore();

            ctx.globalAlpha = 1.0;
            if (canSwitchProgress) {
                this.drawCircle(ctx, cx, cy, this.scale, this.buttonRadius, paint);
                paint = ctx => {
                    ctx.fillStyle = '#28BAFF';
                };
                if (progress !== 0) {
                    ctx.globalAlpha = progress;
                    this.drawCircle(ctx, cx, cy, this.scale, this.buttonRadius, paint);
                }
            }
            ctx.globalAlpha = 1.0;
            this.drawCircle(ctx, cx, cy, 1,Math.trunc(this.buttonRadius - 0.5 * this.strokeWidth) * progress * this.scale, this.paintTmp);
            if  (!canSwitchProgress) {
                this.radialProgressView.draw(this.canvas, cx, cy, this.scale);
            }
            ctx.restore();
        } else {
            for (let i = 0; i < 2; i++) {
                let alpha = 0;
                let buttonRadius = this.buttonRadius;
                let paint = null;
                if (i === 0 && prevState) {
                    paint = prevState.shader;
                    alpha = 1 - this.switchProgress;
                    if (prevState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                        buttonRadius -= alpha * 2;
                    }
                } else if (i === 1) {
                    paint = currentState.shader;
                    alpha = this.switchProgress;
                    if (currentState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                        buttonRadius -= alpha * 2;
                    }
                } else {
                    continue;
                }

                if (!paint) {
                    paint = ctx => {
                        ctx.fillStyle = '#2B333E';
                    };
                }

                ctx.globalAlpha = 1.0;
                let scale = SCALE_BIG_MIN + SCALE_BIG * this.amplitude * 0.5;
                if (i === 1) {
                    const scaleLight = 0.7 + LIGHT_GRADIENT_SIZE;
                    this.drawCircle(ctx, cx, cy, scaleLight * scale * this.showLightingProgress * this.scale, 160, this.radialGradient);
                }

                ctx.globalAlpha = 0.3 * alpha;
                // big wave
                ctx.save();
                scale = SCALE_BIG_MIN + SCALE_BIG * this.amplitude;
                ctx.translate(cx, cy);
                ctx.scale(scale * showWavesProgressInterpolated * this.scale, scale * showWavesProgressInterpolated * this.scale);
                this.bigWaveDrawable.draw(0, 0 ,this.canvas, paint);
                ctx.restore();

                // small wave
                ctx.save();
                scale = SCALE_SMALL_MIN + SCALE_SMALL * this.amplitude;
                ctx.translate(cx, cy);
                ctx.scale(scale * showWavesProgressInterpolated * this.scale, scale * showWavesProgressInterpolated * this.scale);
                this.tinyWaveDrawable.draw(0, 0, this.canvas, paint);
                ctx.restore();
            }

            // button
            for (let i = 0; i < 2; i++) {
                let alpha = 0;
                let buttonRadius = this.buttonRadius;
                let paint = null;
                if (i === 0 && prevState) {
                    paint = prevState.shader;
                    alpha = 1 - this.switchProgress;
                    if (prevState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                        buttonRadius -= alpha * 2;
                    }
                } else if (i === 1) {
                    paint = currentState.shader;
                    alpha = this.switchProgress;
                    if (currentState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                        buttonRadius -= alpha * 2;
                    }
                } else {
                    continue;
                }

                if (!paint) {
                    paint = ctx => {
                        ctx.fillStyle = '#2B333E';
                    };
                }

                if (i === 0) {
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.globalAlpha = alpha;
                }
                this.drawCircle(ctx, cx, cy, this.scale, buttonRadius, paint);

                if (i === 1 && currentState.stateId === MUTE_BUTTON_STATE_CONNECTING) {
                    this.radialProgressView.draw(this.canvas, cx, cy, this.scale);
                }
            }
        }

        if (!force) {
            this.raf = requestAnimationFrame(() => this.draw());
        }
    };

    drawCircle(ctx, cx, cy, scale, radius, paint) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.arc(0, 0, radius, 0, 2 * Math.PI, false);
        ctx.closePath();
        paint && paint(ctx);
        ctx.fill();
        ctx.restore();
    }

    setCurrentState = (stateId, animated) => {
        const { currentState, states } = this;

        if (currentState && currentState.id === stateId) {
            return;
        }

        this.previousState = animated ? currentState : null;
        this.currentState = states[stateId];
        this.progressToState = this.previousState ? 0.0 : 1.0;
    };

    updateMuteButton = (stateId, animated) => {
        const { muteButtonState } = this;
        if (muteButtonState === stateId && animated) {
            return;
        }

        // TODO: add text animation

        if (animated) {
            this.muteButtonState = stateId;
        } else {
            this.muteButtonState = stateId;
        }
        this.updateMuteButtonState(animated);
    }

    updateMuteButtonState (animated) {
        const { states, currentState, muteButtonState } = this;

        if (states[muteButtonState] !== currentState) {
            this.prevState = currentState;
            this.currentState = states[muteButtonState];
            if (!this.prevState || !animated) {
                this.switchProgress = 1.0;
                this.prevState = null;
            } else {
                this.switchProgress = 0.0;
            }
        }

        if (!animated) {
            let showWaves = false;
            let showLighting = false;
            if (currentState) {
                showWaves = currentState.stateId === MUTE_BUTTON_STATE_MUTE || currentState.stateId === MUTE_BUTTON_STATE_UNMUTE;
                showLighting = currentState.stateId === MUTE_BUTTON_STATE_CONNECTING;
            }
            this.showWavesProgress = showWaves ? 1.0 : 0.0;
            this.showLightingProgress = showLighting ? 1.0 : 0.0;
        }
    }

    setAmplitude(value) {
        this.animateToAmplitude = value;
        this.animateAmplitudeDiff = (value - this.amplitude) / (100 + 500 * AMPLITUDE_SPEED);
        // console.log('[button] setAmplitude', [this.amplitude, this.animateToAmplitude, this.animateAmplitudeDiff]);
    }

    handleMouseDown = event => {
        event.stopPropagation();
    }

    render() {
        const { children, onClick } = this.props;
        const { left, right, top, bottom, scale } = this;

        return (
            <div id='button' className='button' style={{ height: bottom / scale, borderRadius: 12, position: 'relative', transform: 'translateY(-28px)' }}>
                <canvas id='button-canvas' width={right} height={bottom} style={{ width: right / scale, height: bottom / scale }}/>
                <div style={{
                    position: 'absolute',
                    background: 'transparent',
                    width: 104,
                    height: 104,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    left: '50%',
                    top: '50%',
                    marginLeft: -52,
                    marginTop: -38,
                    cursor: 'pointer'
                }}
                     onMouseDown={stopPropagation}
                     onClick={onClick}>
                    {children}
                </div>
            </div>
        );
    }

}

Button.propTypes = {};

export default Button;