/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import TdClient from '@arseny30/tdweb/dist/tdweb';
import packageJson from '../../package.json';
import { JS_VERBOSITY_MAX, JS_VERBOSITY_MIN, VERBOSITY_MAX, VERBOSITY_MIN } from '../Constants';

class TdLibController extends EventEmitter{
    constructor(){
        super();

        this.clientParameters = {
            useTestDC : false,
            readOnly : false,
            verbosity : 1,
            jsVerbosity : 3
        };

        this.setMaxListeners(Infinity);
    }

    send(request){
        return this.client.send(request);
    }

    init(location){
        this.setInitParameters(location);

        const { verbosity, jsVerbosity, useTestDC, readOnly } = this.clientParameters;

        let parameters = {
            verbosity : verbosity,
            jsVerbosity : jsVerbosity,
            mode : 'wasm',  // 'wasm-streaming'/'wasm'/'asmjs'
            prefix : useTestDC ? 'tdlib_test' : 'tdlib',
            readOnly : readOnly,
            isBackground : false
        };

        console.log(`[TdLibController] Start client with params=${JSON.stringify(parameters)}`);

        this.client = new TdClient(parameters);
        this.client.onUpdate = this.onUpdate;

        this.setState({
            status: 'init'
        });
    }

    setInitParameters = (location) => {
        if (!location) return;

        const { search } = location;
        if (!search) return;

        const params = new URLSearchParams(search.toLowerCase());

        if (params.has('test')){
            const useTestDC = parseInt(params.get('test'), 10);
            if (useTestDC === 0 || useTestDC === 1){
                this.clientParameters.useTestDC = useTestDC === 1;
                //console.log(`setQueryParams use_test_dc=${TdLibController.clientParameters.useTestDC}`);
            }
            else{
                // console.log(`setQueryParams skip use_test_dc=${params.get('test')} valid values=[0,1]`);
            }
        }

        if (params.has('verbosity')){
            const verbosity = parseInt(params.get('verbosity'), 10);
            if (verbosity >= VERBOSITY_MIN && verbosity <= VERBOSITY_MAX){
                this.clientParameters.verbosity = verbosity;
                // console.log(`setQueryParams verbosity=${TdLibController.clientParameters.verbosity}`);
            }
            else{
                // console.log(`setQueryParams skip verbosity=${params.get('verbosity')} valid values=[${VERBOSITY_MIN}..${VERBOSITY_MAX}]`);
            }
        }

        if (params.has('jsverbosity')){
            const jsVerbosity = parseInt(params.get('jsverbosity'), 10);
            if (jsVerbosity >= JS_VERBOSITY_MIN && jsVerbosity <= JS_VERBOSITY_MAX){
                this.clientParameters.jsVerbosity = jsVerbosity;
                // console.log(`setQueryParams jsVerbosity=${TdLibController.clientParameters.jsVerbosity}`);
            }
            else{
                // console.log(`setQueryParams skip jsVerbosity=${params.get('jsVerbosity')} valid values=[${JS_VERBOSITY_MIN}..${JS_VERBOSITY_MAX}]`);
            }
        }

        if (params.has('readonly')){
            const readOnly = parseInt(params.get('readonly'), 10);
            if (readOnly === 0 || readOnly === 1){
                this.clientParameters.readOnly = readOnly === 1;
                //console.log(`setQueryParams use_test_dc=${TdLibController.clientParameters.useTestDC}`);
            }
            else{
                // console.log(`setQueryParams skip use_test_dc=${params.get('test')} valid values=[0,1]`);
            }
        }
    };

    getState(){
        return this.state;
    }

    setState(state){
        this.state = state;
        this.emit('tdlib_status', state);
    }

    sendTdParameters() {
        const apiId = process.env.REACT_APP_TELEGRAM_API_ID;
        const apiHash = process.env.REACT_APP_TELEGRAM_API_HASH;

        if (!apiId || !apiHash){
            if (window.confirm('API id is missing!\nIn order to obtain an API id and develop your own application using the Telegram API please visit https://core.telegram.org/api/obtaining_api_id'))
            {
                window.location.href='https://core.telegram.org/api/obtaining_api_id';
            }
        }

        this.send({
            '@type': 'setTdlibParameters',
            parameters: {
                '@type': 'tdParameters',
                use_test_dc: this.clientParameters.useTestDC,
                api_id: apiId,
                api_hash: apiHash,
                system_language_code: 'en',
                device_model: 'Web',
                system_version: 'Unknown',
                application_version: packageJson.version,
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
    }

    onUpdate = (update) => {
        //console.log('receive from worker', update);

        switch (update['@type']) {
            case 'updateAuthorizationState':
                this.onUpdateAuthorizationState(update);
                break;
            case 'updateConnectionState':
                this.emit('tdlib_connection_state', update.state);
                break;
            default:
                break;
        }

        this.emit('tdlib_update', update);
    };

    onUpdateAuthorizationState(update) {
        if (!update) return;

        switch (update.authorization_state['@type']) {
            case 'authorizationStateLoggingOut':
                this.setState({ status: 'loggingOut' });
                this.loggingOut = true;
                break;
            case 'authorizationStateWaitTdlibParameters':
                this.setState({ status: 'waitTdLibParameters' });
                this.sendTdParameters();
                break;
            case 'authorizationStateWaitEncryptionKey':
                this.setState({ status: 'waitEncryptionKey' });
                this.client.send({ '@type': 'checkDatabaseEncryptionKey' });
                break;
            case 'authorizationStateWaitPhoneNumber':
                this.setState({ status: 'waitPhoneNumber' });
                break;
            case 'authorizationStateWaitCode':
                this.setState({ status: 'waitCode' });
                break;
            case 'authorizationStateWaitPassword':
                this.setState({ status: 'waitPassword'});
                break;
            case 'authorizationStateReady':
                this.setState({ status: 'ready' });
                this.loggingOut = false;
                break;
            case 'authorizationStateClosing':
                this.setState({ status: 'closing' });
                break;
            case 'authorizationStateClosed':
                this.setState({ status: 'closed' });
                if (!this.loggingOut) {
                    document.title += ': Zzz…';
                    this.emit('tdlib_updateAppInactive');
                }
                else{
                    this.init();
                }
                break;
            default:
                this.setState({ status: '???' });
        }
    }

    onAuthError = (error) => {
        this.emit('tdlib_auth_error', error);
    };

    onInputExternal(status, line) {
        switch (status) {
            case 'wait':
                return;
            case 'waitPhoneNumber':
                this.client
                    .send({ '@type': 'setAuthenticationPhoneNumber', phone_number: line })
                    .catch(this.onAuthError);
                this.setState({ status: 'sendPhoneNumber' });
                break;
            case 'waitCode':
                this.client
                    .send({
                        '@type': 'checkAuthenticationCode',
                        code: line,
                        first_name: 'A',
                        last_name: 'B'
                    })
                    .catch(this.onAuthError);
                this.setState({ status: 'sendCode' });
                break;
            case 'waitPassword':
                this.client
                    .send({
                        '@type': 'checkAuthenticationPassword',
                        password: line,
                    })
                    .catch(this.onAuthError);
                this.setState({ status: 'sendPassword' });
                break;
            case 'ready':
                this.client
                    .send({
                        '@type': 'logOut',
                    })
                    .catch(this.onAuthError);
                this.setState({ status: 'sendLogOut' });
                break;
            default:
                break;
        }
    }

    onInput(line) {
        switch (this.state.status) {
            case 'wait':
                return;
            case 'waitPhoneNumber':
                this.client
                    .send({ '@type': 'setAuthenticationPhoneNumber', phone_number: line })
                    .catch(this.onAuthError);
                this.setState({ status: 'sendPhoneNumber' });
                break;
            case 'waitCode':
                this.client
                    .send({
                        '@type': 'checkAuthenticationCode',
                        code: line,
                        first_name: 'A',
                        last_name: 'B'
                    })
                    .catch(this.onAuthError);
                this.setState({ status: 'sendCode' });
                break;
            case 'waitPassword':
                this.client
                    .send({
                        '@type': 'checkAuthenticationPassword',
                        password: line,
                    })
                    .catch(this.onAuthError);
                this.setState({ status: 'sendPassword' });
                break;
            case 'ready':
                this.client
                    .send({
                        '@type': 'logOut',
                    })
                    .catch(this.onAuthError);
                this.setState({ status: 'sendLogOut' });
                break;
            default:
                break;
        }
    }

    logOut(){
        this.client
            .send({
                '@type': 'logOut',
            })
            .catch(this.onAuthError);
        this.setState({ status: 'sendLogOut' });
    }

    destroy(){
        this.client
            .send({
                '@type': 'destroy',
            });
    }
}

const controller = new TdLibController();

export default controller;