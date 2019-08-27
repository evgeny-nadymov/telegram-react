/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function getHref(url, mail) {
    if (!url) return null;

    if (mail) return url.startsWith('mailto:') ? url : 'mailto:' + url;

    return url.startsWith('http') ? url : 'http://' + url;
}

export function isUrlSafe(displayText, url) {
    if (displayText && displayText !== url) {
        return false;
    }

    if (hasRTLOSymbol(url)) {
        return false;
    }

    return true;
}

export function getDecodedUrl(url, mail) {
    if (!url) return null;

    const href = getHref(url, mail);

    try {
        return decodeURI(href);
    } catch (error) {
        console.log('SafeLink.getDecodedUrl error ', url, error);
    }

    return null;
}

const RTLORegExp = /\u202e/;

export function hasRTLOSymbol(url) {
    if (!url) return false;

    return RTLORegExp.test(url);
}
