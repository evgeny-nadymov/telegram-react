/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from '../Stores/EventEmitter';
import packageJson from '../../package.json';
import { stringToBoolean, getBrowser, getOSName } from '../Utils/Common';
import {
    VERBOSITY_JS_MAX,
    VERBOSITY_JS_MIN,
    VERBOSITY_MAX,
    VERBOSITY_MIN,
    WASM_FILE_HASH,
    WASM_FILE_NAME
} from '../Constants';
import TdClient from 'tdweb/dist/tdweb';
// import TdClient from '@arseny30/tdweb/dist/tdweb';

function databaseExists(dbname, callback) {
    var req = indexedDB.open(dbname);
    var existed = true;
    req.onsuccess = function() {
        req.result.close();
        if (!existed) indexedDB.deleteDatabase(dbname);
        callback(existed);
    };
    req.onupgradeneeded = function() {
        existed = false;
    };
}

class TdLibController extends EventEmitter {
    constructor() {
        super();

        this.parameters = {
            useTestDC: false,
            readOnly: false,
            verbosity: 1,
            jsVerbosity: 3,
            fastUpdating: true,
            useDatabase: false,
            mode: 'wasm'
        };

        this.disableLog = true;
        this.streaming = true;
    }

    init = location => {
        this.setParameters(location);

        const { verbosity, jsVerbosity, useTestDC, readOnly, fastUpdating, useDatabase, mode } = this.parameters;
        const dbName = useTestDC ? 'tdlib_test' : 'tdlib';

        databaseExists(dbName, exists => {
            this.clientUpdate({ '@type': 'clientUpdateTdLibDatabaseExists', exists });

            let options = {
                logVerbosityLevel: verbosity,
                jsLogVerbosityLevel: jsVerbosity,
                mode: mode, // 'wasm-streaming'/'wasm'/'asmjs'
                prefix: useTestDC ? 'tdlib_test' : 'tdlib',
                readOnly: readOnly,
                isBackground: false,
                useDatabase: useDatabase,
                wasmUrl: `${WASM_FILE_NAME}?_sw-precache=${WASM_FILE_HASH}`
                // onUpdate: update => this.emit('update', update)
            };

            console.log(
                `[TdLibController] (fast_updating=${fastUpdating}) Start client with params=${JSON.stringify(options)}`
            );

            this.client = new TdClient(options);
            this.client.onUpdate = update => {
                if (!this.disableLog) {
                    if (update['@type'] === 'updateFile') {
                        console.log('receive updateFile file_id=' + update.file.id, update);
                    } else {
                        console.log('receive update', update);
                    }
                }
                this.emit('update', update);
            };
        });
    };

    clientUpdate = update => {
        if (!this.disableLog) {
            console.log('clientUpdate', update);
        }
        this.emit('clientUpdate', update);
    };

    setParameters = location => {
        if (!location) return;

        const { search } = location;
        if (!search) return;

        const params = new URLSearchParams(search.toLowerCase());

        if (params.has('test')) {
            this.parameters.useTestDC = stringToBoolean(params.get('test'));
        }

        if (params.has('verbosity')) {
            const verbosity = parseInt(params.get('verbosity'), 10);
            if (verbosity >= VERBOSITY_MIN && verbosity <= VERBOSITY_MAX) {
                this.parameters.verbosity = verbosity;
            }
        }

        if (params.has('jsverbosity')) {
            const jsVerbosity = parseInt(params.get('jsverbosity'), 10);
            if (jsVerbosity >= VERBOSITY_JS_MIN && jsVerbosity <= VERBOSITY_JS_MAX) {
                this.parameters.jsVerbosity = jsVerbosity;
            }
        }

        if (params.has('tag') && params.has('tagverbosity')) {
            const tag = params
                .get('tag')
                .replace('[', '')
                .replace(']', '')
                .split(',');
            const tagVerbosity = params
                .get('tagverbosity')
                .replace('[', '')
                .replace(']', '')
                .split(',');
            if (tag && tagVerbosity && tag.length === tagVerbosity.length) {
                this.parameters.tag = tag;
                this.parameters.tagVerbosity = tagVerbosity;
            }
        }

        if (params.has('readonly')) {
            this.parameters.readOnly = stringToBoolean(params.get('readonly'));
        }

        if (params.has('fastupdating')) {
            this.parameters.fastUpdating = stringToBoolean(params.get('fastupdating'));
        }

        if (params.has('db')) {
            this.parameters.useDatabase = stringToBoolean(params.get('db'));
        }
        if (params.has('mode')) {
            this.parameters.mode = params.get('mode');
        }
        if (params.has('clientlog')) {
            this.disableLog = !stringToBoolean(params.get('clientlog'));
        }
        if (params.has('streaming')) {
            this.streaming = stringToBoolean(params.get('streaming'));
        }
    };

    send = request => {
        if (!this.client) {
            console.log('send (none init)', request);
            return;
        }

        if (!this.disableLog) {
            console.log('send', request);

            return this.client
                .send(request)
                .then(result => {
                    console.log('send result', result);
                    return result;
                })
                .catch(error => {
                    console.error('send error', error);

                    throw error;
                });
        } else {
            return this.client.send(request);
        }
    };

    sendTdParameters = async () => {
        const apiId = process.env.REACT_APP_TELEGRAM_API_ID;
        const apiHash = process.env.REACT_APP_TELEGRAM_API_HASH;

        // console.log('[td] sendTdParameters', apiHash, apiId);
        if (!apiId || !apiHash) {
            if (
                window.confirm(
                    'API id is missing!\n' +
                        'In order to obtain an API id and develop your own application ' +
                        'using the Telegram API please visit https://core.telegram.org/api/obtaining_api_id'
                )
            ) {
                window.location.href = 'https://core.telegram.org/api/obtaining_api_id';
            }
        }

        const { useTestDC } = this.parameters;
        const { version } = packageJson;

        this.send({
            '@type': 'setTdlibParameters',
            parameters: {
                '@type': 'tdParameters',
                use_test_dc: useTestDC,
                api_id: apiId,
                api_hash: apiHash,
                system_language_code: navigator.language || 'en',
                device_model: getBrowser(),
                system_version: getOSName(),
                application_version: version,
                use_secret_chats: false,
                use_message_database: true,
                use_file_database: false,
                database_directory: '/db',
                files_directory: '/'
            }
            // ,
            // extra: {
            //     a: ['a', 'b'],
            //     b: 123
            // }
        });

        if (this.parameters.tag && this.parameters.tagVerbosity) {
            for (let i = 0; i < this.parameters.tag.length; i++) {
                let tag = this.parameters.tag[i];
                let tagVerbosity = this.parameters.tagVerbosity[i];

                this.send({
                    '@type': 'setLogTagVerbosityLevel',
                    tag: tag,
                    new_verbosity_level: tagVerbosity
                });
            }
        }
    };

    logOut() {
        this.send({ '@type': 'logOut' }).catch(error => {
            this.emit('tdlib_auth_error', error);
        });
    }

    setChatId = (chatId, messageId = null) => {
        const update = {
            '@type': 'clientUpdateChatId',
            chatId,
            messageId
        };

        this.clientUpdate(update);
    };

    setMediaViewerContent(content) {
        this.clientUpdate({
            '@type': 'clientUpdateMediaViewerContent',
            content: content
        });
    }
}

const controller = new TdLibController();

export default controller;
