/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

//import pako from 'pako';

onmessage = function({ data: { key, blob } }) {
    console.log('BlobInflator.worker.message', key, blob);
    // const reader = new FileReader();
    // reader.onload = e => {
    //     try {
    //         const json = JSON.parse(pako.inflate(e.target.result, { to : 'string' }));
    //         postMessage({ key, json });
    //     } catch (err) {
    //         postMessage({ key, error: true, msg : err.toString() });
    //     }
    // };
    // reader.readAsArrayBuffer(blob);
};
