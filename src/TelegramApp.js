/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import classNames from 'classnames';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import DialogInfo from './Components/ColumnRight/DialogInfo';
import Dialogs from './Components/ColumnLeft/Dialogs';
import DialogDetails from './Components/ColumnMiddle/DialogDetails';
import AuthFormControl from './Components/Auth/AuthFormControl';
import Footer from './Components/Footer';
import localForage from 'localforage';
import LocalForageWithGetItems from 'localforage-getitems';
import packageJson from '../package.json';
import AppInactiveControl from './Components/Additional/AppInactiveControl';
import registerServiceWorker from './registerServiceWorker';
import ChatStore from './Stores/ChatStore';
import ApplicationStore from './Stores/ApplicationStore';
import TdLibController from './Controllers/TdLibController'
import {VERBOSITY_MAX, VERBOSITY_MIN, JS_VERBOSITY_MAX, JS_VERBOSITY_MIN} from './Constants';
import './TelegramApp.css';

const theme = createMuiTheme({
    palette: {
        primary: { main: '#3B9EDB' },
        secondary: { main: '#FF5555' }
    },
    typography: {
        useNextVariants: true,
    }
});

class TelegramApp extends Component{
    constructor(props){
        super(props);

        console.log(`Start Telegram Web ${packageJson.version}`);

        this.dialogDetails = React.createRef();

        this.state = {
            authorizationState: null,
            authState: 'init',
            inactive: false,
        };

        /*this.store = localForage.createInstance({
            name: '/tdlib'
        });*/

        //this.initDB();

        this.onUpdateState = this.onUpdateState.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onUpdateAuthorizationState = this.onUpdateAuthorizationState.bind(this);
        this.onUpdateChatDetailsVisibility = this.onUpdateChatDetailsVisibility.bind(this);
        this.onUpdateAppInactive = this.onUpdateAppInactive.bind(this);
        this.handleSelectChat = this.handleSelectChat.bind(this);
        this.handleChangePhone = this.handleChangePhone.bind(this);
        this.setQueryParams = this.setQueryParams.bind(this);
        this.clearCache = this.clearCache.bind(this);
    }

    componentWillMount(){
        this.setQueryParams();
        //alert('TdLibController.init use_test_dc=' + TdLibController.useTestDC);
        TdLibController.init();
    }

    setQueryParams(){
        const {location} = this.props;

        if (location
            && location.search){
            const params = new URLSearchParams(location.search.toLowerCase());

            if (params.has('test')){
                let useTestDC = parseInt(params.get('test'), 10);
                if (useTestDC === 0 || useTestDC === 1){
                    TdLibController.clientParameters.useTestDC = useTestDC === 1;
                    //console.log(`setQueryParams use_test_dc=${TdLibController.clientParameters.useTestDC}`);
                }
                else{
                    // console.log(`setQueryParams skip use_test_dc=${params.get('test')} valid values=[0,1]`);
                }
            }

            if (params.has('verbosity')){
                let verbosity = parseInt(params.get('verbosity'), 10);
                if (verbosity >= VERBOSITY_MIN && verbosity <= VERBOSITY_MAX){
                    TdLibController.clientParameters.verbosity = verbosity;
                    // console.log(`setQueryParams verbosity=${TdLibController.clientParameters.verbosity}`);
                }
                else{
                    // console.log(`setQueryParams skip verbosity=${params.get('verbosity')} valid values=[${VERBOSITY_MIN}..${VERBOSITY_MAX}]`);
                }
            }

            if (params.has('jsverbosity')){
                let jsVerbosity = parseInt(params.get('jsverbosity'), 10);
                if (jsVerbosity >= JS_VERBOSITY_MIN && jsVerbosity <= JS_VERBOSITY_MAX){
                    TdLibController.clientParameters.jsVerbosity = jsVerbosity;
                    // console.log(`setQueryParams jsVerbosity=${TdLibController.clientParameters.jsVerbosity}`);
                }
                else{
                    // console.log(`setQueryParams skip jsVerbosity=${params.get('jsVerbosity')} valid values=[${JS_VERBOSITY_MIN}..${JS_VERBOSITY_MAX}]`);
                }
            }
        }
    }

    componentDidMount(){
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        ApplicationStore.on('clientUpdateChatDetailsVisibility', this.onUpdateChatDetailsVisibility);
        TdLibController.on('tdlib_updateAppInactive', this.onUpdateAppInactive);
        TdLibController.on('tdlib_status', this.onUpdateState);
        TdLibController.on('tdlib_update', this.onUpdate);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState);
        ApplicationStore.removeListener('clientUpdateChatDetailsVisibility', this.onUpdateChatDetailsVisibility);
        TdLibController.removeListener('tdlib_updateAppInactive', this.onUpdateAppInactive);
        TdLibController.removeListener('tdlib_status', this.onUpdateState);
        TdLibController.removeListener('tdlib_update', this.onUpdate);
    }

    onUpdateAuthorizationState(update){
        this.setState({ authorizationState: update.authorization_state });

        if (update.authorization_state
            && (update.authorization_state['@type'] === 'authorizationStateReady'
                || update.authorization_state['@type'] === 'authorizationStateWaitCode'
                || update.authorization_state['@type'] === 'authorizationStateWaitPassword'
                || update.authorization_state['@type'] === 'authorizationStateWaitPhoneNumber')){
            //registerServiceWorker();
        }
    }

    onUpdateChatDetailsVisibility(update){
        this.forceUpdate();
    }


    onUpdateAppInactive(){
        this.setState({ inactive : true });
    }

    onUpdateState(state){
        switch (state.status) {
            case 'ready':
                this.setState({ authState : state.status });
                TdLibController
                    .send({
                        '@type': 'setOption',
                        name: 'online',
                        value: { '@type': 'optionValueBoolean', value: true }
                    });
                TdLibController
                    .send({
                        '@type': 'getMe'
                    })
                    .then(result =>{
                        this.setState({ currentUser: result });
                    });

                break;
            case 'waitPhoneNumber':
                this.setState({ authState: state.status });
                break;
            case 'waitCode':
                this.setState({ authState: state.status });
                break;
            case 'waitPassword':
                this.setState({ authState: state.status });
                break;
            case 'init':
                this.setState({ authState: state.status });
                break;
            default:
                break;
        }
    }

    onUpdate(update) {

        // NOTE: important to start init DB after receiving first update
        //FileController.initDB();

        switch (update['@type']) {
            case 'updateFatalError':
                alert('Oops! Something went wrong. We need to refresh this page.');
                window.location.reload();
                break;
            case 'updateServiceNotification':
                if (update.content
                    && update.content['@type'] === 'messageText'
                    && update.content.text
                    && update.content.text['@type'] === 'formattedText'
                    && update.content.text.text){
                    switch (update.type) {
                        case 'AUTH_KEY_DROP_DUPLICATE':
                            let result = window.confirm(update.content.text.text);
                            if (result){
                                TdLibController.logOut();
                            }
                            break;
                        default:
                            alert(update.content.text.text);
                            break;
                    }
                }

                break;
            default:
                break;
        }
    }

    handleSelectChat = (chat) => {
        const selectedChatId = ChatStore.getSelectedChatId();
        const chatId = chat ? chat.id : 0;
        if (selectedChatId === chatId){
            this.dialogDetails.current.scrollToBottom();
        }
        else{
            ChatStore.setSelectedChatId(chatId);
        }
    };

    handleSelectUser = async (user) => {
        if (!user) return;

        const chat = await TdLibController
            .send({
                '@type': 'createPrivateChat',
                user_id: user.id,
                force: true
            });

        this.handleSelectChat(chat);
    };

    clearCache(){
        // this.store.clear()
        //     .then(() => alert('cache cleared'));
    }

    handleChangePhone(){
        this.setState({ authorizationState: { '@type': 'authorizationStateWaitPhoneNumber' } });
    }

    render(){
        const { inactive, authorizationState } = this.state;
        const { isChatDetailsVisible } = ApplicationStore;

        let page = (
            <>
                <div className={classNames('page', { 'page-third-column': isChatDetailsVisible })}>
                    <Dialogs
                        onSelectChat={this.handleSelectChat}
                        authState={this.state.authState}
                        onClearCache={this.clearCache}/>
                    <DialogDetails
                        ref={this.dialogDetails}
                        currentUser={this.state.currentUser}
                        onSelectChat={this.handleSelectChat}
                        onSelectUser={this.handleSelectUser}/>
                    {
                        isChatDetailsVisible && <DialogInfo/>
                    }
                </div>
                <Footer/>
            </>
        );

        if (inactive){
            page = (
                <>
                    <div className='header-wrapper'/>
                    <div className='page'>
                        <AppInactiveControl/>
                    </div>
                    <Footer/>
                </>
            );
        }
        else if (authorizationState){
            switch (authorizationState['@type']){
                case 'authorizationStateClosed': {

                    break;
                }
                case 'authorizationStateClosing': {

                    break;
                }
                case 'authorizationStateLoggingOut': {

                    break;
                }
                case 'authorizationStateReady': {

                    break;
                }
                case 'authorizationStateWaitCode':
                case 'authorizationStateWaitPassword':
                case 'authorizationStateWaitPhoneNumber':
                    page = (
                        <AuthFormControl authorizationState={authorizationState} onChangePhone={this.handleChangePhone}/>
                    );
                    break;
                case 'authorizationStateWaitEncryptionKey': {

                    break;
                }
                case 'authorizationStateWaitTdlibParameters': {

                    break;
                }
            }
        }

        return (
            <MuiThemeProvider theme={theme}>
                <div id='app'>
                    {page}
                </div>
            </MuiThemeProvider>
        );
    }
}

/*window.onblur = function(){
    TdLibController
        .send({
            '@type': 'setOption',
            name: 'online',
            value: { '@type': 'optionValueBoolean', value: false }
        });
};

window.onfocus = function(){
    TdLibController
        .send({
            '@type': 'setOption',
            name: 'online',
            value: { '@type': 'optionValueBoolean', value: true }
        });
};*/

export default TelegramApp;