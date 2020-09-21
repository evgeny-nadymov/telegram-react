/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// /* eslint-disable */
// import pako from 'pako';
//
// self.addEventListener('message', ({ data: { key, blob } }) => {
//     const reader = new FileReader();
//     reader.onload = async e => {
//         try {
//             const result = pako.inflate(e.target.result, { to: 'string' });
//             postMessage({ key, result });
//         } catch (err) {
//             postMessage({ key, error: true, msg: err.toString() });
//         }
//     };
//     reader.readAsArrayBuffer(blob);
// });
