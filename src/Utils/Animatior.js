/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

class Animator {
    constructor(duration, options = []) {
        this.options = options;
        this.duration = duration;
    }

    static outSine(n) {
        return Math.sin((n * Math.PI) / 2);
    }

    start = () => {
        this.stopped = false;
        this.id = requestAnimationFrame(this.startInternal);
    };

    startInternal = timeStamp => {
        const { startTime, duration } = this;

        this.startTime = timeStamp;
        this.endTime = startTime + duration;
        this.draw(timeStamp);
    };

    draw = now => {
        const { stopped, duration, startTime, options } = this;

        if (now - startTime > duration && options.every(x => x.to === x.last)) {
            this.stopped = true;
        }

        if (stopped) return;

        const time = Math.min(now - startTime, duration);
        const p = duration === 0 ? 1.0 : time / duration;
        const val = Animator.outSine(p);

        options.forEach(x => {
            const { from, to, func } = x;
            x.last = from + (to - from) * val;
            func(x.last);
        });

        this.id = requestAnimationFrame(this.draw);
    };

    stop = () => {
        this.stopped = true;
        cancelAnimationFrame(this.id);
    };
}

export default Animator;
