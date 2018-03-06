import { EventEmitter } from "events";
import TdClient from "@arseny30/tdweb/dist/tdweb";

class TdLibController extends EventEmitter{
    constructor(){
        super();

        this.onUpdate = this.onUpdate.bind(this);

        this.init()
    }

    send(request){
        return this.client.send(request);
    }

    init(){
        this.client = new TdClient();
        this.client.onUpdate = update => this.onUpdate(update);

        this.setState({
            status: 'init'
        });
    }

    getState(){
        return this.state;
    }

    setState(state){
        this.state = state;
        this.emit('tdlib_status', state);
    }

    sendTdParameters() {
        this.client.send({
            '@type': 'setVerbosity',
            verbosity: 2
        });

        this.client.send({
            '@type': 'setTdlibParameters',
            parameters: {
                '@type': 'tdParameters',
                use_test_dc: false,
                api_id: 12183,
                api_hash: '41c3080d9028cf002792a512d4e20089',
                system_language_code: 'en',
                device_model: 'Desktop',
                system_version: 'Unknown',
                application_version: 'tdclient-emscripten',
                use_secret_chats: false,
                use_message_database: true,
                use_file_database: false,
                database_directory: '/db',
                files_directory: '/'
            },
            extra: {
                a: ['a', 'b'],
                b: 123
            }
        });
    }

    onUpdate(update) {
        switch (update['@type']) {
            case 'updateAuthorizationState':
                this.onUpdateAuthState(update.authorization_state);
                break;
            case 'updateConnectionState':
                this.emit('tdlib_connection_state', update.state);
                break;
            default:
                break;
        }

        this.emit('tdlib_update', update);
    }

    onUpdateAuthState(auth_state) {
        this.auth_state = auth_state;
        this.authStateLoop();
    }

    authStateLoop() {
        switch (this.auth_state['@type']) {
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
                break;
            case 'authorizationStateClosed':
                this.init();
                break;
            default:
                this.setState({ status: '???' });
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
}

const controller = new TdLibController();

export default controller;