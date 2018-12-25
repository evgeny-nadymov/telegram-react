/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TYPING_INPUT_INTERVAL_S } from '../Constants';

class InputTypingManager {
    constructor(chatId, timeoutCallback) {
        this.actions = new Map();
        this.timerId = null;
        this.chatId = chatId;
        this.timeoutCallback = timeoutCallback;

        this.handleTimer = this.handleTimer.bind(this);
        this.addAction = this.addAction.bind(this);
        this.clearAction = this.clearAction.bind(this);
        this.setActionsTimeout = this.setActionsTimeout.bind(this);
    }

    handleTimer() {
        let now = new Date();
        let expiredActions = [];
        for (let [key, value] of this.actions) {
            let actionTimeout = value.expire - now;
            if (actionTimeout <= 0) expiredActions.push(key);
        }

        for (let key of expiredActions) {
            this.actions.delete(key);
        }

        let update = {
            '@type': 'updateUserChatAction',
            chat_id: this.chatId,
            action: { '@type': 'chatActionTimerUpdate' }
        };

        this.timeoutCallback(update);
        // ChatStore.emit('updateUserChatAction', update);

        this.setActionsTimeout();
    }

    addAction(userId, action) {
        let expire = new Date();
        expire.setSeconds(expire.getSeconds() + TYPING_INPUT_INTERVAL_S);

        this.actions.set(userId, { expire: expire, action: action });

        if (this.timerId) {
            clearTimeout(this.timerId);
        }

        this.setActionsTimeout();
    }

    setActionsTimeout() {
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
    }

    clearAction(userId) {
        this.actions.delete(userId);

        if (this.timerId) {
            clearTimeout(this.timerId);
        }

        this.setActionsTimeout();
    }
}

export default InputTypingManager;
