/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { loadInstantViewContent } from '../Utils/File';
import { setInstantViewContent } from './Client';
import TdLibController from '../Controllers/TdLibController';

export function openMediaInstantView(instantView, block) {
    const url = urlCache.get(instantView);
    if (!url) return;

    console.log('[IV] open', instantView);
    loadInstantViewContent(instantView);
    setInstantViewContent({ instantView, block, url });
}

let timestamp = null;

const ivCache = new Map();
const urlCache = new Map();

export async function openInstantView(url) {
    try {
        let result = null;
        if (ivCache.has(url)) {
            result = ivCache.get(url);
        } else {
            const now = (timestamp = new Date());
            result = await TdLibController.send({
                '@type': 'getWebPageInstantView',
                url,
                force_full: true
            });
            ivCache.set(url, result);
            urlCache.set(result, url);
            if (timestamp !== now) return;
        }

        console.log('[IV] open', result);
        loadInstantViewContent(result);
        setInstantViewContent({ instantView: result, url });
    } catch {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
    }
}
