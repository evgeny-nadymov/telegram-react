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
        this.id = requestAnimationFrame(this.startAnim);
    };

    startAnim = timeStamp => {
        const { start, duration } = this;

        this.start = timeStamp;
        this.end = start + duration;
        this.draw(timeStamp);
    };

    draw = now => {
        const { stopped, duration, start, options } = this;

        if (stopped) return;
        if (now - start >= duration) this.stopped = true;

        const p = (now - start) / duration;
        const val = Animator.outSine(p);

        options.forEach(x => {
            const { from, to, func } = x;
            func(from + (to - from) * val);
        });

        this.id = requestAnimationFrame(this.draw);
    };

    stop = () => {
        this.stopped = true;
        cancelAnimationFrame(this.id);
    };
}

export default Animator;
