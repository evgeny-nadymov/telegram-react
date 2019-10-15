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

self.addEventListener('push', function(event) {
    console.log(`[SW] Push received with data "${event.data.text()}"`);

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