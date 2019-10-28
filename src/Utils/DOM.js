/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function findLastTextNode(element) {
    if (element.nodeType === Node.TEXT_NODE) {
        return element;
    }

    for (let i = element.childNodes.length - 1; i >= 0; i--) {
        const textNode = findLastTextNode(element.childNodes[i]);
        if (textNode) {
            return textNode;
        }
    }

    return null;
}
