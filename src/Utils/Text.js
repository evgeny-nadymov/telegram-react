/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export async function copy(text) {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (e) {
        console.error('[clipboard] unable to copy with clipboard.writeText', e);
    }

    return copyOld(text);
}

function copyOld(text) {
    let element;
    let successful;
    try {
        element = document.createElement('textarea');
        element.contentEditable = true;
        element.readOnly = true;
        element.value = text;
        element.style.all = 'unset';
        element.style.position = 'fixed';
        element.style.top = 0;
        element.style.clip = 'rect(0, 0, 0, 0)';
        element.style.whiteSpace = 'pre';
        element.style.webkitUserSelect = 'text';
        element.style.MozUserSelect = 'text';
        element.style.msUserSelect = 'text';
        element.style.userSelect = 'text';

        document.body.appendChild(element);

        element.focus();
        element.select();

        successful = document.execCommand('copy');
        if (!successful) {
            throw new Error();
        }
        return true;
    } catch {
        console.error('[clipboard] unable to copy with document.execCommand', successful);
    } finally {
        if (element) {
            document.body.removeChild(element);
        }
    }

    return false;
}
