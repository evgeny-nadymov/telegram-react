/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

class CacheManager {
    async load(key) {
        const value = localStorage.getItem(key);
        if (!value) return null;

        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    async save(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    async remove(key) {
        localStorage.removeItem(key);
    }

    async clear() {
        localStorage.clear();
    }
}

const manager = new CacheManager();
export default manager;
