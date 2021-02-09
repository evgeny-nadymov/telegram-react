/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// const MIN_SPEED = 0.8;
// const MAX_SPEED = 8.2;

import { MIN_SPEED, MAX_SPEED } from './BlobDrawable';

export default class LineBlobDrawable {
    constructor(n) {
        this.maxRadius = 10;
        this.minRadius = 0;

        this.N = n;
        this.radius = new Array(n + 1);

        this.radiusNext = new Array(n + 1);
        this.progress = new Array(n + 1);
        this.speed = new Array(n + 1);

        for (let i = 0; i <= n; i++) {
            this.generateBlob(this.radius, i);
            this.generateBlob(this.radiusNext, i);
            this.progress[i] = 0;
        }
    }

    generateBlob(radius, i) {
        const { maxRadius, minRadius, speed } = this;

        const radDif = maxRadius - minRadius;
        radius[i] = minRadius + Math.random() * radDif;
        speed[i] = 0.017 + 0.003 * Math.random();
    }

    generateNextBlob() {
        const { radius, radiusNext, progress, N } = this;
        for (let i = 0; i < N; i++) {
            this.generateBlob(radius, i);
            this.generateBlob(radiusNext, i);
            progress[i] = 0.0;
        }
    }

    update(amplitude, speedScale) {
        const { N, progress, speed, radius, radiusNext } = this;
        for (let i = 0; i <= N; i++) {
            progress[i] += (speed[i] * MIN_SPEED) + amplitude * speed[i] * MAX_SPEED * speedScale;
            if (progress[i] >= 1.0) {
                progress[i] = 0.0;
                radius[i] = radiusNext[i];
                this.generateBlob(radiusNext, i);
            }
        }
    }

    draw(left, top, right, bottom, canvas, paint, pinnedTop, progressToPinned) {
        if (canvas.getContext) {
            const ctx = canvas.getContext('2d');
            // ctx.globalAlpha = 0.5;
            // ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(right, bottom);
            ctx.lineTo(left, bottom);

            const { radius, radiusNext, N } = this;
            for (let i = 0; i <= N; i++) {
                if (i === 0) {
                    const progress = this.progress[i];
                    const r1 = radius[i] * (1.0 - progress) + radiusNext[i] * progress;
                    const y = (top - r1) * progressToPinned + pinnedTop * (1.0 - progressToPinned);
                    ctx.lineTo(left, y);
                } else {
                    const progress = this.progress[i - 1];
                    const r1 = radius[i - 1] * (1.0 - progress) + radiusNext[i - 1] * progress;
                    const progressNext = this.progress[i];
                    const r2 = radius[i] * (1.0 - progressNext) + radiusNext[i] * progressNext;
                    const x1 = (right - left) / N * (i - 1);
                    const x2 = (right - left) / N * i;
                    const cx = x1 + (x2 - x1) / 2;

                    const y1 = (top - r1) * progressToPinned + pinnedTop * (1.0 - progressToPinned);
                    const y2 = (top - r2) * progressToPinned + pinnedTop * (1.0 - progressToPinned);
                    ctx.bezierCurveTo(
                        cx, y1,
                        cx, y2,
                        x2, y2
                    );
                    if (i === N) {
                        ctx.lineTo(right, bottom);
                    }
                }
            }

            // ctx.scale(1.0, 1.0);
            paint(ctx);
            ctx.fill();
            ctx.closePath();
        }
    }
}