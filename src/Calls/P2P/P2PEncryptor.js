/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import CryptoJS from 'crypto-js';

const MTPROTO_ENCRYPTION = false;

export default class P2PEncryptor {
    constructor(key) {
        const p2pKey = CryptoJS.enc.Base64.parse(key);

        this.key = CryptoJS.enc.Hex.parse('3132333435363738393031323334353641424344454647484940414243444546');
        this.iv = CryptoJS.enc.Hex.parse('0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f');
        this.mode = CryptoJS.mode.CTR;
        this.padding = CryptoJS.pad.NoPadding;
    }

    encryptToBase64(str) {
        if (MTPROTO_ENCRYPTION) {
            const { key, iv, mode, padding } = this;

            const encrypted = CryptoJS.AES.encrypt(str, key, {
                mode,
                iv,
                padding
            });

            return encrypted.toString();
        } else {
            return btoa(str);
        }
    }

    decryptFromBase64(base64) {
        if (MTPROTO_ENCRYPTION) {
            const { key, iv, mode, padding } = this;

            const decrypted = CryptoJS.AES.decrypt(base64, key, {
                mode,
                iv,
                padding
            });

            return decrypted.toString(CryptoJS.enc.Utf8);
        } else {
            return atob(base64);
        }
    }
};