/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
// eslint-disable-next-line import/no-webpack-loader-syntax
import CacheWorker from './cache.worker';
import { randomString } from './Helpers';
import { set, get, clear } from 'idb-keyval';
import TdLibController from '../Controllers/TdLibController';

class CacheManager {
    constructor() {
        this.worker = new CacheWorker();
        this.worker.onmessage = this.onWorkerMessage;

        this.handlers = new Map();
    }

    onWorkerMessage = event => {
        const { data } = event;
        if (!data) return;

        const { handlerKey, cache } = data;

        const handler = this.handlers.get(handlerKey);
        if (handler) {
            const { command, resolve, reject } = handler;
            switch (command) {
                case 'save': {
                    resolve();
                    break;
                }
                case 'load': {
                    resolve(cache);
                }
            }
        }
    };

    async saveAsync(key, cache) {
        return new Promise((resolve, reject) => {
            const handlerKey = randomString();
            const command = 'save';

            this.handlers.set(handlerKey, { command, resolve, reject });
            this.worker.postMessage({ command, handlerKey, key, cache });
        });
    }

    async loadAsync(key) {
        return new Promise((resolve, reject) => {
            const handlerKey = randomString();
            const command = 'load';

            this.handlers.set(handlerKey, { command, resolve, reject });
            this.worker.postMessage({ command, handlerKey, key });
        });
    }

    async load(key) {
        if (TdLibController.localStorage) {
            // console.log('[cm] load (ls)', key);
            const value = localStorage.getItem(key);
            if (!value) return null;

            // console.log('[cm] parse', key);
            const obj = JSON.parse(value);

            // console.log('[cm] finish', key);
            return obj;
        } else {
            // console.log('[cm] load (idb)', key);
            return await get(key);
        }

        //const store = localforage.createInstance({ name: 'telegram' });
        //return await store.getItem(key);
    }

    async save(key, cache) {
        if (TdLibController.localStorage) {
            localStorage.setItem(key, JSON.stringify(cache));
        } else {
            await set(key, cache);
        }

        //const store = localforage.createInstance({ name: 'telegram' });
        //await store.setItem(key, cache);
    }

    async clear() {
        if (TdLibController.localStorage) {
            localStorage.clear();
        } else {
            await clear();
        }

        //const store = localforage.createInstance({ name: 'telegram' });
        //store.clear();
    }
}

const manager = new CacheManager();
export default manager;
