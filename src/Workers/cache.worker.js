/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable */
// import localforage from 'localforage';
//
// self.addEventListener('message', async ({ data }) => {
//     const { handlerKey, key, command, cache } = data;
//     switch (command) {
//         case 'load': {
//             await loadCache(handlerKey, key);
//             break;
//         }
//         case 'save': {
//             await saveCache(handlerKey, key, cache);
//             break;
//         }
//     }
// });
//
// async function loadCache(handlerKey, key) {
//     const store = localforage.createInstance({ name: 'telegram' });
//     const cache = await store.getItem(key);
//
//     postMessage({ handlerKey, cache });
// }
//
// async function saveCache(handlerKey, key, cache) {
//     const store = localforage.createInstance({ name: 'telegram' });
//     store.setItem(key, cache);
//
//     postMessage({ handlerKey });
// }
