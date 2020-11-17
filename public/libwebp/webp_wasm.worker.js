/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

function LOG(message, ...optionalParams) {
    return;
    console.log(message, ...optionalParams);
}

console.log('[webp] start init');
const now = new Date();

importScripts('webp_wasm.js');

Module.onRuntimeInitialized = async () => {
    console.log(`[webp] finish init time=${new Date() - now}`, self.Module);
    self.postMessage({ '@type': 'ready' });
};

self.onmessage = event => {
    const { id, blob} = event.data;
    LOG('[webp] decode', id);

    const reader = new FileReader();

    reader.addEventListener('loadend', function() {
        const buffer = reader.result;

        const size = buffer.byteLength;
        const thisPtr = Module._malloc(size);
        Module.HEAPU8.set(new Uint8Array(buffer), thisPtr);

        const getInfo = Module.cwrap('getInfo', 'number', ['number', 'number']);

        const ptr = getInfo(thisPtr, size);
        const success = !!Module.getValue(ptr, 'i32');
        if (!success) {
            Module._free(ptr);
            Module._free(thisPtr);
            LOG('[webp] decode', id, [0, 0]);
            self.postMessage({ '@type': 'result', id, width: 0, height: 0, result: null });
            return;
        }
        const width = Module.getValue(ptr + 4, 'i32');
        const height = Module.getValue(ptr + 8, 'i32');

        Module._free(ptr);

        const decode = Module.cwrap('decode', 'number', ['number', 'number']);

        const resultPtr = decode(thisPtr, size);

        const resultView = new Uint8Array(Module.HEAPU8.buffer, resultPtr, width * height * 4);
        const result = new Uint8ClampedArray(resultView);
        Module._free(resultPtr);
        Module._free(thisPtr);

        LOG('[webp] decode', id, [width, height]);
        self.postMessage({ '@type': 'result', id, width, height, result });
    });

    reader.readAsArrayBuffer(blob);
};