import React, {Component} from 'react';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import './TelegramApp.css';
import Dialogs from './Components/Dialogs';
import DialogDetails from './Components/DialogDetails';
import AuthFormControl from './Components/Auth/AuthFormControl';
import Footer from './Components/Footer';
import TdLibController from './Controllers/TdLibController'
import FileController from './Controllers/FileController'
import localForage from 'localforage';
import LocalForageWithGetItems from 'localforage-getitems';
import {VERBOSITY_MAX, VERBOSITY_MIN, JS_VERBOSITY_MAX, JS_VERBOSITY_MIN} from './Constants';
import packageJson from '../package.json';
import AppInactiveControl from './Components/AppInactiveControl';
import ChatStore from './Stores/ChatStore';

const theme = createMuiTheme({
    palette: {
        primary: { main: '#6bace1'},
    },
});

class TelegramApp extends Component{
    constructor(props){
        super(props);

        console.log(`Start Telegram Web ${packageJson.version}`);

        this.dialogDetails = React.createRef();

        this.state = {
            authState: 'init',
            inactive: false,
        };

        /*this.store = localForage.createInstance({
            name: '/tdlib'
        });*/

        //this.initDB();

        this.onUpdateState = this.onUpdateState.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onUpdateAppInactive = this.onUpdateAppInactive.bind(this);
        this.handleSelectChat = this.handleSelectChat.bind(this);
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
                    console.log(`setQueryParams use_test_dc=${TdLibController.clientParameters.useTestDC}`);
                }
                else{
                    console.log(`setQueryParams skip use_test_dc=${params.get('test')} valid values=[0,1]`);
                }
            }

            if (params.has('verbosity')){
                let verbosity = parseInt(params.get('verbosity'), 10);
                if (verbosity >= VERBOSITY_MIN && verbosity <= VERBOSITY_MAX){
                    TdLibController.clientParameters.verbosity = verbosity;
                    console.log(`setQueryParams verbosity=${TdLibController.clientParameters.verbosity}`);
                }
                else{
                    console.log(`setQueryParams skip verbosity=${params.get('verbosity')} valid values=[${VERBOSITY_MIN}..${VERBOSITY_MAX}]`);
                }
            }

            if (params.has('jsverbosity')){
                let jsVerbosity = parseInt(params.get('jsverbosity'), 10);
                if (jsVerbosity >= JS_VERBOSITY_MIN && jsVerbosity <= JS_VERBOSITY_MAX){
                    TdLibController.clientParameters.jsVerbosity = jsVerbosity;
                    console.log(`setQueryParams jsVerbosity=${TdLibController.clientParameters.jsVerbosity}`);
                }
                else{
                    console.log(`setQueryParams skip jsVerbosity=${params.get('jsVerbosity')} valid values=[${JS_VERBOSITY_MIN}..${JS_VERBOSITY_MAX}]`);
                }
            }
        }
    }

    componentDidMount(){
        TdLibController.on('tdlib_updateAppInactive', this.onUpdateAppInactive);
        TdLibController.on('tdlib_status', this.onUpdateState);
        TdLibController.on('tdlib_update', this.onUpdate);
    }

    componentWillUnmount(){
        TdLibController.removeListener('tdlib_updateAppInactive', this.onUpdateAppInactive);
        TdLibController.removeListener('tdlib_status', this.onUpdateState);
        TdLibController.removeListener('tdlib_update', this.onUpdate);
    }

    onUpdateAppInactive(){
        this.setState({ inactive : true });
    }

    onUpdateState(state){
        switch (state.status) {
            case 'ready':
                this.setState({authState : state.status});
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
                this.setState({authState: state.status});
                break;
            case 'waitCode':
                this.setState({authState: state.status});
                break;
            case 'waitPassword':
                this.setState({authState: state.status});
                break;
            case 'init':
                this.setState({
                    history: [],
                    scrollBottom: false,
                    authState: state.status
                });
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

    onUpdateMessageSendSucceeded(old_message_id, message){
        const selectedChatId = ChatStore.getSelectedChatId();
        if (selectedChatId !== message.chat_id) return;

        let updatedHistory = this.state.history.map((obj) =>{
            return obj.id === old_message_id ? message : obj;
        });

        this.setHistory(updatedHistory);
    }

    handleSelectChat(chat){
        const selectedChatId = ChatStore.getSelectedChatId();
        const chatId = chat ? chat.id : 0;
        if (selectedChatId === chatId){
            this.dialogDetails.current.scrollToBottom();
        }
        else{
            ChatStore.setSelectedChatId(chatId);
        }
    }

    clearCache(){
        // this.store.clear()
        //     .then(() => alert('cache cleared'));
    }

    render(){
        let page = null;

        if (this.state.inactive){
            page = (
                <div id='app-inner'>
                    <div className='header-wrapper'/>
                    <div className='im-page-wrap'>
                        <AppInactiveControl/>
                    </div>
                    <Footer/>
                </div>
            );
        }
        else{
            switch (this.state.authState){
                case 'waitPhoneNumber':
                case 'waitCode':
                case 'waitPassword':
                    page = (
                        <div id='app-inner'>
                            <AuthFormControl authState={this.state.authState}/>
                        </div>
                    );
                    break;
                case 'init':
                case 'ready':
                default:
                    page = (
                        <div id='app-inner'>
                            <div className='im-page-wrap'>
                                <Dialogs
                                    onSelectChat={this.handleSelectChat}
                                    authState={this.state.authState}
                                    onClearCache={this.clearCache}/>
                                <DialogDetails
                                    ref={this.dialogDetails}
                                    currentUser={this.state.currentUser}
                                    onSelectChat={this.handleSelectChat}
                                />
                            </div>
                            <Footer/>
                        </div>
                    );
                    break;
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