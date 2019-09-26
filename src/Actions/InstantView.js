/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { loadInstantViewContent } from '../Utils/File';
import { setInstantViewContent } from './Client';
import TdLibController from '../Controllers/TdLibController';

let timestamp = null;

export async function openInstantView(url) {
    try {
        const now = (timestamp = new Date());
        const result = await TdLibController.send({
            '@type': 'getWebPageInstantView',
            url,
            force_full: true
        });
        if (timestamp !== now) return;

        console.log('[IV] open', result);
        loadInstantViewContent(result);
        setInstantViewContent({ instantView: result });
    } catch {
        const newWindow = window.open();
        newWindow.opener = null;
        newWindow.location = url;
    }
}
