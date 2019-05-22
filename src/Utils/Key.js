/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const keys = {
    backspace: 8,
    shift: 16,
    ctrl: 17,
    alt: 18,
    delete: 46,
    cmd: 91,
    leftArrow: 37,
    upArrow: 38,
    rightArrow: 39,
    downArrow: 40
};

export const utils = {
    special: {},
    navigational: {},
    isSpecial(e) {
        return typeof this.special[e.keyCode] !== 'undefined';
    },
    isNavigational(e) {
        return typeof this.navigational[e.keyCode] !== 'undefined';
    }
};

utils.special[keys['backspace']] = true;
utils.special[keys['shift']] = true;
utils.special[keys['ctrl']] = true;
utils.special[keys['alt']] = true;
utils.special[keys['delete']] = true;

utils.navigational[keys['upArrow']] = true;
utils.navigational[keys['downArrow']] = true;
utils.navigational[keys['leftArrow']] = true;
utils.navigational[keys['rightArrow']] = true;
