/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export function openGameInBrowser(url, message) {
    let sharedPreferences = {};
    try {
        sharedPreferences = JSON.parse(localStorage.getItem('botshare')) || { };
    } catch (e) { }

    const existing = sharedPreferences['' + message.id];
    let hash = existing ? existing : ''
    let addHash = 'tgShareScoreUrl=' + encodeURIComponent('tg://share_game_score?hash=');
    if (!existing) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const array = new Uint8Array(1);
        for (let i = 0; i < 20; i++) {
            window.crypto.getRandomValues(array)
            hash += chars[array[0] % chars.length];
        }

        sharedPreferences['' + message.id] = hash;
        localStorage.setItem('botshare', JSON.stringify(sharedPreferences));
    }
    addHash += hash;
    const index = url.indexOf('#');
    if (index < 0) {
        url += '#' + addHash;
    } else {
        const curHash = url.substring(0, index + 1);
        if (curHash.indexOf('=') >= 0 || curHash.indexOf('?') >= 0) {
            url += '&' + addHash;
        } else {
            if (curHash.length > 0) {
                url += '?' + addHash;
            } else {
                url += addHash;
            }
        }
    }

    const newWindow = window.open();
    newWindow.opener = null;
    newWindow.location = url;
}