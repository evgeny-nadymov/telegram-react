/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// import { randomString } from './Helpers';
// import myWorker from './test.worker';
//
// const worker = new myWorker();
// const handlers = { };
//
// worker.onmessage = function (e) {
//     console.log('worker.onmessage', e);
//     if (!e.data.error) {
//         handlers[e.data.key].resolve(e.data.json)
//     } else {
//         handlers[e.data.key].reject(e.data.msg)
//     }
// };
//
// export async function inflateBlob (blob) {
//     const key = randomString();
//     console.log('worker.inflateBlob', key, blob);
//     return new Promise((resolve, reject) => {
//         handlers[key] = { resolve, reject };
//         worker.postMessage({ key, blob })
//     })
// }
