/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// import { randomString } from './Helpers';
// // eslint-disable-next-line import/no-webpack-loader-syntax
// import PakoWorker from './pako.worker';
//
// const worker = new PakoWorker();
// const handlers = new Map();
//
// worker.onmessage = event => {
//     const { data } = event;
//     if (!data) return;
//
//     const { key, error, result, msg } = data;
//
//     const { resolve, reject } = handlers.get(key);
//     handlers.delete(key);
//
//     if (!error) {
//         resolve(result);
//     } else {
//         reject(msg);
//     }
// };
//
// export async function inflateBlob(blob) {
//     const key = randomString();
//     return new Promise((resolve, reject) => {
//         handlers.set(key, { resolve, reject });
//         worker.postMessage({ key, blob });
//     });
// }
