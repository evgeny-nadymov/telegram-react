/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import TdLibController from '../Controllers/TdLibController';

export function openGroupCallPanel() {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateGroupCallPanel',
        opened: true
    });
}

export function closeGroupCallPanel() {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateGroupCallPanel',
        opened: false
    });
}

export function openCallPanel(id) {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateCallPanel',
        callId: id,
        opened: true
    });
}

export function closeCallPanel() {
    TdLibController.clientUpdate({
        '@type': 'clientUpdateCallPanel',
        opened: false
    });
}