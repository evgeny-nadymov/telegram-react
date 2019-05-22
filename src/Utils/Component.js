/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
export function focusNode(node, toEnd = false) {
    if (!node) return;

    if (toEnd && node.childNodes && node.childNodes.length > 0) {
        const range = document.createRange();
        range.setStart(node.childNodes[0], node.childNodes[0].length);
        range.collapse(true);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    node.focus();
}
