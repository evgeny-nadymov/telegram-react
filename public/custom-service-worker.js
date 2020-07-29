/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
// import TdClient from 'tdweb/dist/tdweb';
// import packageJson from '../package';
// importScripts('./tdweb.js');
// importScripts('./subworkers.js');

const SMALLEST_CHUNK_LIMIT = 1024 * 4;
const STREAM_CHUNK_UPPER_LIMIT = 256 * 1024;
const STREAM_CHUNK_BIG_FILE = 700 * 1024 * 1024;
const STREAM_CHUNK_BIG_FILE_UPPER_LIMIT = 512 * 1024;
const STREAM_CHUNK_AUDIO_UPPER_LIMIT = 1024 * 1024;

function LOG(message, ...optionalParams) {
    return;
    console.log(message, ...optionalParams);
}

self.addEventListener('push', event => {
    LOG(`[SW] Push received with data "${event.data.text()}"`);

    let obj;
    try{
        obj = event.data.json();
    }
    catch(error){
        obj = event.data.text();
    }

    let title = obj.title || 'Telegram';
    let body = obj.description || obj;
    const options = {
        body: body,
        icon: 'images/icon.png',
        badge: 'images/badge.png'
    };

    event.waitUntil(
        //loadUpdates()
        self.registration.showNotification(title, options)
    );
});

function isSafari() {
    const is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    LOG('[stream] isSafari', is_safari);
    return is_safari;

}

function parseRange(header) {
    const [, chunks] = header.split('=');
    const ranges = chunks.split(', ');
    const [start, end] = ranges[0].split('-');

    return [+start, +end || 0];
}

function alignLimit(limit) {
    return 2 ** Math.ceil(Math.log(limit) / Math.log(2));
}

function alignOffset(offset, base = SMALLEST_CHUNK_LIMIT) {
    return offset - (offset % base);
}

function getOffsetLimit(start, end, chunk, size) {
    end = end > 0 ? end : start + chunk - 1;
    end = end > size - 1 ? size - 1 : end;

    const offset = start;
    const limit = end - start + 1;

    return [ offset, limit ];
}

function fetchStreamRequest(url, start, end, resolve, get) {

    const { searchParams } = new URL(url, 'https://telegram.org');
    const fileId = parseInt(searchParams.get('id'), 10);
    const size = parseInt(searchParams.get('size'), 10);
    const mimeType = searchParams.get('mime_type');

    const info = { url, options: { fileId, size, mimeType } };

    LOG('[stream] fetchStreamRequest', url, info);

    // safari workaround
    if (start === 0 && end === 1) {
        resolve(new Response(new Uint8Array(2).buffer, {
            status: 206,
            statusText: 'Partial Content',
            headers: {
                'Accept-Ranges': 'bytes',
                'Content-Range': `bytes 0-1/${size || '*'}`,
                'Content-Length': '2',
                'Content-Type': mimeType || 'video/mp4',
            },
        }));
        return;
    }

    const isBigFile = info.options.size > STREAM_CHUNK_BIG_FILE;
    let upperLimit = isBigFile ? STREAM_CHUNK_BIG_FILE_UPPER_LIMIT : STREAM_CHUNK_UPPER_LIMIT;
    if (info.options.mimeType && info.options.mimeType.startsWith('audio')) {
        upperLimit = STREAM_CHUNK_AUDIO_UPPER_LIMIT;
    }

    const limit = end && end < upperLimit ? alignLimit(end - start + 1) : upperLimit;
    const alignedOffset = alignOffset(start, limit);

    LOG(`[stream] get alignOffset=${alignedOffset} limit=${limit}`);
    get(alignedOffset, limit, info.options, async (blob, type) => {
        const headers = {
            'Accept-Ranges': 'bytes',
            'Content-Range': `bytes ${alignedOffset}-${alignedOffset + blob.size - 1}/${info.options.size || '*'}`,
            'Content-Length': `${blob.size}`,
        };

        if (type) headers['Content-Type'] = type;

        if (isSafari()) {
            let ab = await getArrayBuffer(blob);

            ab = ab.slice(start - alignedOffset, end - alignedOffset + 1);
            headers['Content-Range'] = `bytes ${start}-${start + ab.byteLength - 1}/${info.options.size || '*'}`;
            headers['Content-Length'] = `${ab.byteLength}`;

            blob = ab;
        }

        resolve(new Response(blob, {
            status: 206,
            statusText: 'Partial Content',
            headers,
        }));
    });
}

async function getFilePartRequest(offset, limit, options, ready) {
    const { fileId, size, mimeType } = options;

    LOG('[stream] getFilePartRequest', fileId, offset, limit);
    const result = await getBufferFromClientAsync(fileId, offset, limit, size);

    ready(result, mimeType);
}

self.addEventListener('fetch', event => {
    const [, url, scope] = /http[:s]+\/\/.*?(\/(.*?)\/.*$)/.exec(event.request.url) || [];

    switch (scope) {
        case 'streaming': {
            const [start, end] = parseRange(event.request.headers.get('Range') || '');

            LOG(`[SW] fetch stream start=${start} end=${end}`, event.request.url, scope);

            event.respondWith(new Promise((resolve) => {
                fetchStreamRequest(url, start, end, resolve, getFilePartRequest);
            }));
            break;
        }
    }
});

const queue = new Map();

async function getBufferFromClientAsync(fileId, offset, limit, size) {
    return new Promise((resolve, reject) => {

        const key = `${fileId}_${offset}_${limit}`;
        queue.set(key, { resolve, reject });
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                LOG('[stream] getBufferFromClientAsync', fileId, offset, limit, client);
                client.postMessage({
                    '@type': 'getFile',
                    fileId,
                    offset,
                    limit,
                    size
                });
            });
        })
    });
}

async function getArrayBuffer(blob) {
    return new Promise((resolve) => {
        let fr = new FileReader();
        fr.onload = () => {
            resolve(fr.result);
        };
        fr.readAsArrayBuffer(blob);
    })
}

self.addEventListener('message', async e => {
    LOG('[stream] sw.message', e.data);
    switch (e.data['@type']) {
        case 'getFileResult': {
            const { fileId, offset, limit, data } = e.data;
            const key = `${fileId}_${offset}_${limit}`;
            const request = queue.get(key);
            LOG('[stream] sw.message request', request, queue, e.data);
            if (request) {
                queue.delete(key);
                const { resolve } = request;

                // const buffer = await getArrayBuffer(data);

                LOG('[stream] sw.message resolve', data);
                resolve(data);
            }
            break;
        }
    }
});

// function loadUpdates(){
//     return new Promise((resolve, reject) => {
//
//         const { verbosity, jsVerbosity, useTestDC } = {
//             useTestDC : false,
//             verbosity : 1,
//             jsVerbosity : 3
//         };
//
//         let parameters = {
//             verbosity : verbosity,
//             jsVerbosity : jsVerbosity,
//             mode : 'wasm',
//             prefix : useTestDC ? 'tdlib_test' : 'tdlib',
//             isBackground : true
//         };
//
//         console.log(`[SW] Start client with params ${JSON.stringify(parameters)}`);
//
//         // const client = new TdClient(parameters);//new TdClient(parameters);
//         // client.onUpdate = (update) => {
//         //     switch (update['@type']) {
//         //         case 'updateAuthorizationState': {
//         //
//         //             console.log(`[SW] Receive update ${JSON.stringify(update)}`);
//         //             switch (update.authorization_state['@type']) {
//         //                 case 'authorizationStateLoggingOut':
//         //                     resolve();
//         //                     break;
//         //                 case 'authorizationStateWaitTdlibParameters':
//         //                     client.send({
//         //                         '@type': 'setTdlibParameters',
//         //                         parameters: {
//         //                             '@type': 'tdParameters',
//         //                             use_test_dc: useTestDC,
//         //                             api_id: process.env.REACT_APP_TELEGRAM_API_ID,
//         //                             api_hash: process.env.REACT_APP_TELEGRAM_API_HASH,
//         //                             system_language_code: 'en',
//         //                             device_model: 'Web',
//         //                             system_version: 'Unknown',
//         //                             application_version: '0.0.1',//packageJson.version,
//         //                             use_secret_chats: false,
//         //                             use_message_database: true,
//         //                             use_file_database: false,
//         //                             database_directory: '/db',
//         //                             files_directory: '/'
//         //                         }
//         //                     });
//         //                     break;
//         //                 case 'authorizationStateWaitEncryptionKey':
//         //                     client.send({ '@type': 'checkDatabaseEncryptionKey' });
//         //                     break;
//         //                 case 'authorizationStateWaitPhoneNumber':
//         //                     resolve();
//         //                     break;
//         //                 case 'authorizationStateWaitCode':
//         //                     resolve();
//         //                     break;
//         //                 case 'authorizationStateWaitPassword':
//         //                     resolve();
//         //                     break;
//         //                 case 'authorizationStateReady':
//         //                     // wait for connectionStateReady
//         //                     break;
//         //                 case 'authorizationStateClosing':
//         //                     resolve();
//         //                     break;
//         //                 case 'authorizationStateClosed':
//         //                     resolve();
//         //                     break;
//         //                 default:
//         //                     resolve();
//         //             }
//         //             break;
//         //         }
//         //         case 'updateConnectionState': {
//         //
//         //             console.log(`[SW] Receive update ${JSON.stringify(update)}`);
//         //             if (update.state['@type'] === 'connectionStateReady'){
//         //                 resolve();
//         //             }
//         //
//         //             break;
//         //         }
//         //     }
//         // };
//     })
// }