/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { isWebpSupported } from '../Utils/Common';
import FileStore from './FileStore';
import TdLibController from '../Controllers/TdLibController';

let canvas = null;

function createPng(width, height, result) {
    canvas = canvas || document.createElement('canvas');

    return new Promise(resolve => {
        const img = new ImageData(result, width, height);

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(img, 0, 0);

        canvas.toBlob(blob => { resolve(blob); }, 'image/png', 1);
    });
}

class WebpManager {

    constructor() {
        this.worker = null;
        this.isSupported = false;
    }

    isWebpSupported() {
        return this.isSupported;
    }

    decode = async (fileId, thumbnail = false) => {
        this.isSupported = await isWebpSupported()
        if (this.isSupported) {
            return;
        }

        // console.log('[sticker] convertWebpToPng', [fileId]);
        const blob = FileStore.getBlob(fileId);
        if (!blob) return;

        this.init();

        this.decodeInternal(fileId, blob, thumbnail);
    }

    init = async () => {
        this.isSupported = await isWebpSupported()
        if (this.isSupported) {
            return;
        }

        let { worker } = this;
        if (!worker) {
            const w = new Worker('libwebp/webp_wasm.worker.js');
            w.wasmReady = false;
            w.wasmRequests = [];
            w.onmessage = this.onLibWebpMessage;

            this.worker = w;
        }
    };

    onLibWebpMessage = event => {
        const { worker } = this;

        const { id } = event.data;
        switch (event.data['@type']) {
            case 'ready': {
                if (worker.wasmRequests) {
                    worker.wasmReady = true;
                    worker.wasmRequests.forEach(request => {
                        this.decodeInternal(request.fileId, request.blob, request.thumbnail);
                    });
                    worker.wasmRequests = [];
                }
                break;
            }
            case 'result': {
                if (worker.requests.has(id)) {
                    const resolve = worker.requests.get(id);

                    worker.requests.delete(id);
                    resolve(event.data);
                }
                break;
            }
        }
    };

    getDecodePromise = (fileId, blob) => {
        const { worker } = this;

        return new Promise(resolve => {
            const id = fileId;

            worker.requests = worker.requests || new Map();
            worker.requests.set(id, resolve);
            worker.postMessage({ id, blob });
        });
    };

    decodeInternal = async (fileId, webp, thumbnail) => {
        const { worker } = this;
        if (!worker.wasmReady) {
            worker.wasmRequests.push({ fileId, blob: webp, thumbnail });
            return;
        }

        // console.log('[sticker] decodeFile', fileId, thumbnail);
        const { result, width, height } = await this.getDecodePromise(fileId, webp);
        if (!width || !height) {
            // console.log('[sticker] decodeFile png', fileId, [width, height, null]);
            return;
        }

        // console.log('[sticker]', result);
        const blob = await createPng(width, height, result);

        // console.log('[sticker] decodeFile png', fileId, [width, height, blob]);
        TdLibController.clientUpdate({
            '@type': thumbnail ? 'clientUpdateStickerThumbnailPngBlob' : 'clientUpdateStickerPngBlob',
            fileId,
            blob
        });
    };
}

const manager = new WebpManager();
window.webpManager = manager;
export default manager;