/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function randomString() {
    return (
        '$' +
        Math.random()
            .toString(36)
            .slice(2, 10)
    );
}
