/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

class EventEmitter {
    constructor() {
        this.observers = {};
    }

    on(events, listener) {
        events.split(' ').forEach(event => {
            this.observers[event] = this.observers[event] || [];
            this.observers[event].push(listener);
        });
        return this;
    }

    off(event, listener) {
        if (!this.observers[event]) return;
        if (!listener) {
            delete this.observers[event];
            return;
        }

        this.observers[event] = this.observers[event].filter(l => l !== listener);
    }

    emit(event, ...args) {
        if (this.observers[event]) {
            const cloned = [].concat(this.observers[event]);
            cloned.forEach(observer => {
                observer(...args);
            });
        }

        if (this.observers['*']) {
            const cloned = [].concat(this.observers['*']);
            cloned.forEach(observer => {
                observer.apply(observer, [event, ...args]);
            });
        }
    }
}

export default EventEmitter;
