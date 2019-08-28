/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { randomString } from './Helpers';
// eslint-disable-next-line import/no-webpack-loader-syntax
import PakoWorker from './pako.worker';

const worker = new PakoWorker();
const handlers = {};

worker.onmessage = event => {
    const { data } = event;
    if (!data.error) {
        handlers[data.key].resolve(data.result);
    } else {
        handlers[data.key].reject(data.msg);
    }
};

export async function inflateBlob(blob) {
    const key = randomString();
    return new Promise((resolve, reject) => {
        handlers[key] = { resolve, reject };
        worker.postMessage({ key, blob });
    });
}
