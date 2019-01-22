/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

class ActionScheduler {
    constructor(actionCallback, cancelCallback) {
        this.actions = new Map();
        this.actionCallback = actionCallback;
        this.cancelCallback = cancelCallback;
    }

    add = (key, timeout, action, cancel) => {
        if (this.actions.has(key)) {
            return false;
        }

        let expire = new Date();
        expire.setMilliseconds(expire.getMilliseconds() + timeout);

        this.actions.set(key, { expire: expire, action: action, cancel: cancel });

        if (this.timerId) {
            clearTimeout(this.timerId);
        }

        this.setTimeout();

        return true;
    };

    invoke = async key => {
        const item = this.actions.get(key);
        if (!item) return;

        this.actions.delete(key);

        await this.actionCallback({ key: key, action: item.action, cancel: item.cancel });
        if (item.action) await item.action();

        if (this.timerId) {
            clearTimeout(this.timerId);
        }

        this.setTimeout();
    };

    remove = key => {
        const item = this.actions.get(key);
        if (!item) return;

        this.actions.delete(key);

        this.cancelCallback({ key: key, action: item.action, cancel: item.cancel });
        if (item.cancel) item.cancel();

        if (this.timerId) {
            clearTimeout(this.timerId);
        }

        this.setTimeout();
    };

    setTimeout = () => {
        let now = new Date();
        let timeout = 1000000;
        for (let [key, value] of this.actions) {
            let actionTimeout = value.expire - now;
            if (actionTimeout < timeout) timeout = actionTimeout;
            if (timeout < 0) timeout = 0;
        }

        if (timeout < 1000000) {
            this.timerId = setTimeout(this.handleTimer, timeout);
        }
    };

    handleTimer = () => {
        let now = new Date();
        let expired = [];
        for (let [key, value] of this.actions) {
            let actionTimeout = value.expire - now;
            if (actionTimeout <= 0) expired.push({ key: key, value: value });
        }

        for (let item of expired) {
            this.actions.delete(item.key);
            this.actionCallback({ key: item.key, action: item.value.action, cancel: item.value.cancel });
            if (item.value.action) item.value.action();
        }

        this.setTimeout();
    };
}

export default ActionScheduler;
