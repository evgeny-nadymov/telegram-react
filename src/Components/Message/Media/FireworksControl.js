/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will draw a rectangle
 * outline with a 5 pixel border radius
 * @param {CanvasRenderingContext2D} ctx
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 * @param {Number} [radius = 5] The corner radius; It can also be an object
 *                 to specify different radii for corners
 * @param {Number} [radius.tl = 0] Top left
 * @param {Number} [radius.tr = 0] Top right
 * @param {Number} [radius.br = 0] Bottom right
 * @param {Number} [radius.bl = 0] Bottom left
 * @param {Boolean} [fill = false] Whether to fill the rectangle.
 * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

class Particle {
    constructor(fireworks) {
        this.fireworks = fireworks;
        this.type = 0;
        this.colorType = 0;
        this.side = 0;
        this.typeSize = 4;
        this.xFinished = false;
        this.finishedStart = false;

        this.x = 0;
        this.y = 0;
        this.rotation = 0;
        this.moveX = 0;
        this.moveY = 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.colorType;

        if (this.type === 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.typeSize, 0, Math.PI * 2, false);
            ctx.fill();
        } else {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            roundRect(ctx, -this.typeSize, -2, this.typeSize * 2, 4, 2, true, false);
            ctx.restore();
        }
    }

    update(dt) {
        const moveCoef = dt / 16.0;
        this.x += this.moveX * moveCoef;
        this.y += this.moveY * moveCoef;
        if (this.xFinished !== 0) {
            const dp = 0.5;
            if (this.xFinished === 1) {
                this.moveX += dp * moveCoef * 0.05;
                if (this.moveX >= dp) {
                    this.xFinished = 2;
                }
            } else {
                this.moveX -= dp * moveCoef * 0.05;
                if (this.moveX <= -dp) {
                    this.xFinished = 1;
                }
            }
        } else {
            if (this.side === 0) {
                if (this.moveX > 0) {
                    this.moveX -= moveCoef * 0.05;
                    if (this.moveX <= 0) {
                        this.moveX = 0;
                        this.xFinished = this.finishedStart;
                    }
                }
            } else {
                if (this.moveX < 0) {
                    this.moveX += moveCoef * 0.05;
                    if (this.moveX >= 0) {
                        this.moveX = 0;
                        this.xFinished = this.finishedStart;
                    }
                }
            }
        }
        let yEdge = -0.5;
        const wasNegative = this.moveY < yEdge;
        if (this.moveY > yEdge) {
            this.moveY += (1.0 / 3.0) * moveCoef * this.fireworks.speedCoef;
        } else {
            this.moveY += (1.0 / 3.0) * moveCoef;
        }
        if (wasNegative && this.moveY > yEdge) {
            this.fireworks.fallingDownCount++;
        }
        if (this.type === 1) {
            this.rotation += moveCoef * 10;
            if (this.rotation > 360) {
                this.rotation -= 360;
            }
        }

        return this.y >= this.fireworks.getMeasuredHeight();
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

class Fireworks {
    static colors = ['#E8BC2C', '#D0049E', '#02CBFE', '#5723FD', '#FE8C27', '#6CB859'];

    constructor(context) {
        this.context = context;
        this.particlesCount = 60;
        this.fallParticlesCount = 30;
        this.particles = [];
        this.speedCoef = 1.0;
        this.fallingDownCount = 0;
    }

    getMeasuredHeight() {
        return this.context.canvas.clientHeight;
    }

    getMeasuredWidth() {
        return this.context.canvas.clientWidth;
    }

    createParticle(fall) {
        const particle = new Particle(this);
        particle.colorType = Fireworks.colors[getRandomInt(0, Fireworks.colors.length)];
        particle.type = getRandomInt(0, 2);
        particle.side = getRandomInt(0, 2);
        particle.finishedStart = 1 + getRandomInt(0, 2);
        if (particle.type === 0) {
            particle.typeSize = 4 + Math.random() * 2;
        } else {
            particle.typeSize = 4 + Math.random() * 4;
        }
        if (fall) {
            particle.y = -Math.random() * this.getMeasuredHeight() * 1.2;
            particle.x = 5 + getRandomInt(0, this.getMeasuredWidth() - 10);
            particle.xFinished = particle.finishedStart;
        } else {
            const xOffset = 4 + getRandomInt(0, 10);
            const yOffset = this.getMeasuredHeight() / 4;
            if (particle.side === 0) {
                particle.x = -xOffset;
            } else {
                particle.x = this.getMeasuredWidth() + xOffset;
            }
            particle.rotation = Math.random() * 360;
            particle.moveX = (particle.side === 0 ? 1 : -1) * (1.2 + Math.random() * 4);
            particle.moveY = -(4 + Math.random() * 4);
            particle.y = yOffset / 2 + getRandomInt(0, yOffset * 2);
        }
        // console.log(`particle side=${particle.side} x=${particle.x} y=${particle.y} moveX=${particle.moveX} moveY=${particle.moveY}`);
        return particle;
    }

    start() {
        if (this.started) {
            return;
        }

        this.particles = [];
        this.started = true;
        this.startedFall = false;
        this.fallingDownCount = 0;
        this.speedCoef = 1.0;
        this.lastUpdateTime = 0;
        for (let a = 0; a < this.particlesCount; a++) {
            this.particles.push(this.createParticle(false));
        }

        this.draw();
    }

    startFall() {
        if (this.startedFall) {
            return;
        }
        this.startedFall = true;
        for (let a = 0; a < this.fallParticlesCount; a++) {
            this.particles.push(this.createParticle(true));
        }
    }

    draw() {
        const newTime = Date.now();
        let dt = newTime - this.lastUpdateTime;
        this.lastUpdateTime = newTime;
        if (dt > 18) {
            dt = 16;
        }
        // console.log('draw dt', dt);
        this.context.clearRect(0, 0, this.getMeasuredWidth(), this.getMeasuredHeight());
        for (let a = 0, N = this.particles.length; a < N; a++) {
            const p = this.particles[a];
            p.draw(this.context);
            if (p.update(dt)) {
                this.particles.splice(a, 1);
                a--;
                N--;
            }
        }
        if (this.fallingDownCount >= this.particlesCount / 2 && this.speedCoef > 0.2) {
            this.startFall();
            this.speedCoef -= (dt / 16.0) * 0.15;
            if (this.speedCoef < 0.2) {
                this.speedCoef = 0.2;
            }
        }
        if (this.particles.length) {
            window.requestAnimationFrame(() => this.draw());
        } else {
            this.started = false;
            this.context.clearRect(0, 0, this.getMeasuredWidth(), this.getMeasuredHeight());
        }
    }
}

class FireworksComponent extends React.Component {
    constructor(props) {
        super(props);

        this.canvasRef = React.createRef();
    }

    componentDidMount() {
        this.attachToParent();
    }

    componentWillUnmount() {
        this.detachFromParent();
    }

    attachToParent() {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        const parentNode = canvas.parentNode;
        if (!parentNode) return;

        this.parentNode = parentNode;
        canvas.setAttribute('width', this.parentNode.clientWidth + 18);
        canvas.setAttribute('height', this.parentNode.clientHeight + 12);
        window.addEventListener('resize', this.onResize);
    }

    detachFromParent() {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        const parentNode = canvas.parentNode;
        if (!parentNode) return;

        this.parentNode = null;
        window.removeEventListener('resize', this.onResize);
    }

    onResize = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;

        canvas.setAttribute('width', this.parentNode.clientWidth + 18);
        canvas.setAttribute('height', this.parentNode.clientHeight + 12);
    };

    start() {
        const ctx = this.canvasRef.current.getContext('2d');

        const fireworks = new Fireworks(ctx);
        fireworks.start();
    }

    render() {
        return (
            <canvas
                ref={this.canvasRef}
                style={{
                    zIndex: 2,
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                }}
            />
        );
    }
}

FireworksComponent.propTypes = {};

export default FireworksComponent;
