/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import { compose } from './Utils/HOC';
import withLanguage from './Language';
import withTelegramTheme from './Theme';
import withTheme from '@material-ui/core/styles/withTheme';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import packageJson from '../package.json';
import AuthForm from './Components/Auth/AuthForm';
import InactivePage from './Components/InactivePage';
import NativeAppPage from './Components/NativeAppPage';
import StubPage from './Components/StubPage';
import registerServiceWorker from './registerServiceWorker';
import { loadData } from './Utils/Phone';
import { isMobile } from './Utils/Common';
import { OPTIMIZATIONS_FIRST_START } from './Constants';
import ChatStore from './Stores/ChatStore';
import UserStore from './Stores/UserStore';
import AppStore from './Stores/ApplicationStore';
import AuthorizationStore from './Stores/AuthorizationStore';
import TdLibController from './Controllers/TdLibController';
import './TelegramApp.css';

import MainPage from './Components/MainPage';
// const MainPage = React.lazy(() => import('./Components/MainPage'));

class TelegramApp extends Component {
    constructor(props) {
        super(props);

        console.log(`Start Telegram Web ${packageJson.version}`);

        this.state = {
            prevAuthorizationState: AuthorizationStore.current,
            authorizationState: null,
            tdlibDatabaseExists: false,
            inactive: false,
            fatalError: false,
            nativeMobile: isMobile()
        };
    }

    componentWillMount() {
        const { location } = this.props;

        TdLibController.init(location);
    }

    componentDidMount() {
        setTimeout(() => loadData(), 1500);
        TdLibController.on('update', this.onUpdate);

        AppStore.on('clientUpdateAppInactive', this.onClientUpdateAppInactive);
        AppStore.on('clientUpdateTdLibDatabaseExists', this.onClientUpdateTdLibDatabaseExists);
        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.on('updateFatalError', this.onUpdateFatalError);
    }

    componentWillUnmount() {
        TdLibController.off('update', this.onUpdate);

        AppStore.off('clientUpdateAppInactive', this.onClientUpdateAppInactive);
        AppStore.off('clientUpdateTdLibDatabaseExists', this.onClientUpdateTdLibDatabaseExists);
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.off('updateFatalError', this.onUpdateFatalError);
    }

    onClientUpdateTdLibDatabaseExists = update => {
        const { exists } = update;

        if (!exists) {
            this.setState({
                authorizationState: {
                    '@type': 'authorizationStateWaitTdlib'
                },
                tdlibDatabaseExists: exists
            });
        }
    };

    onUpdate = update => {
        if (OPTIMIZATIONS_FIRST_START) {
            if (!this.checkServiceWorker) {
                this.checkServiceWorker = true;

                const register = localStorage.getItem('register');
                if (!register) {
                    registerServiceWorker();
                }
            }
        }
    };

    onUpdateFatalError = update => {
        this.setState({ fatalError: true });
    };

    onUpdateAuthorizationState = update => {
        const { authorization_state: authorizationState } = update;

        this.setState({ authorizationState });

        if (!window.hasFocus) return;
        if (!authorizationState) return;

        TdLibController.send({
            '@type': 'setOption',
            name: 'online',
            value: { '@type': 'optionValueBoolean', value: true }
        });
    };

    onClientUpdateAppInactive = update => {
        this.setState({ inactive: true });
    };

    handleChangePhone = () => {
        this.setState({
            authorizationState: { '@type': 'authorizationStateWaitPhoneNumber' }
        });
    };

    handleDragOver = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    handleDrop = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    handleRefresh = () => {
        this.setState({ fatalError: false });
        window.location.reload();
    };

    handleDestroy = () => {
        this.setState({ fatalError: false });
        TdLibController.send({ '@type': 'destroy' });
    };

    handleKeyDown = event => {
        //console.log('KeyDown', event);
    };

    render() {
        const { t, theme } = this.props;
        const { inactive, nativeMobile, tdlibDatabaseExists, fatalError } = this.state;
        let { authorizationState, prevAuthorizationState } = this.state;
        const state = authorizationState;
        if (
            !authorizationState ||
            authorizationState['@type'] === 'authorizationStateWaitEncryptionKey' ||
            authorizationState['@type'] === 'authorizationStateWaitTdlibParameters'
        ) {
            if (prevAuthorizationState) {
                authorizationState = prevAuthorizationState;
            }
            // else if (tdlibDatabaseExists) {
            //     authorizationState = {
            //         '@type': 'authorizationStateReady'
            //     }
            // }
            else {
                authorizationState = {
                    '@type': 'authorizationStateWaitPhoneNumber'
                };
            }
        }

        const loading = t('Loading').replace('...', '');
        let page = <MainPage />;
        //     (
        //     <React.Suspense fallback={<StubPage title='' />}>
        //         <MainPage />
        //     </React.Suspense>
        // );

        if (nativeMobile) {
            page = <NativeAppPage />;
        } else if (inactive) {
            page = <InactivePage />;
        } else if (authorizationState) {
            switch (authorizationState['@type']) {
                case 'authorizationStateClosed':
                case 'authorizationStateClosing':
                case 'authorizationStateLoggingOut':
                case 'authorizationStateReady': {
                    break;
                }
                case 'authorizationStateWaitCode':
                case 'authorizationStateWaitPassword':
                case 'authorizationStateWaitPhoneNumber':
                case 'authorizationStateWaitTdlib':
                    page = <AuthForm authorizationState={authorizationState} onChangePhone={this.handleChangePhone} />;
                    break;
                case 'authorizationStateWaitEncryptionKey':
                case 'authorizationStateWaitTdlibParameters': {
                    // if (!tdlibDatabaseExists) {
                    //     page = (
                    //         <AuthForm
                    //             authorizationState={authorizationState}
                    //             onChangePhone={this.handleChangePhone}
                    //         />
                    //     );
                    // }

                    break;
                }
            }
        }

        // console.log(
        //     'TelegramApp.render',
        //     state,
        //     prevAuthorizationState,
        //     'nativeMobile=' + nativeMobile,
        //     'inactive=' + inactive,
        //     'tdlibDb=' + tdlibDatabaseExists,
        //     page
        // );

        return (
            <div
                id='app'
                className={theme.palette.type === 'dark' ? 'dark' : 'light'}
                onDragOver={this.handleDragOver}
                onDrop={this.handleDrop}
                onKeyDown={this.handleKeyDown}>
                {page}
                <Dialog
                    transitionDuration={0}
                    open={fatalError}
                    onClose={this.handleRefresh}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>Telegram</DialogTitle>
                    <DialogContent>
                        <DialogContentText id='fatal-error-dialog-description'>
                            Oops! Something went wrong. We need to refresh this page.
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleDestroy} color='primary'>
                            Log out
                        </Button>
                        <Button onClick={this.handleRefresh} color='primary' autoFocus>
                            Refresh
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

const keyMap = new Map();
window.keyMap = keyMap;

async function openPinnedChat(index) {
    const chats = await TdLibController.send({
        '@type': 'getChats',
        offset_order: '9223372036854775807',
        offset_chat_id: 0,
        limit: 10
    });

    if (chats) {
        let pinnedIndex = -1;
        for (let i = 0; i < chats.chat_ids.length; i++) {
            const chat = ChatStore.get(chats.chat_ids[i]);
            if (chat && chat.is_pinned) {
                pinnedIndex++;
            }

            if (pinnedIndex === index) {
                TdLibController.setChatId(chat.id);
                return;
            }
        }
    }
}

document.addEventListener('keyup', event => {
    keyMap.delete(event.key);
    //console.log('keyup key=' + event.key, keyMap);
});

document.addEventListener('keydown', async event => {
    keyMap.set(event.key, event.key);
    //console.log('keydown key=' + event.key, event.altKey, event.ctrlKey, event, keyMap);

    const { authorizationState } = AppStore;
    if (!authorizationState) return;
    if (authorizationState['@type'] !== 'authorizationStateReady') return;
    if (keyMap.size > 3) return;

    if (event.altKey && event.ctrlKey) {
        switch (event.key) {
            case '0': {
                event.preventDefault();
                event.stopPropagation();

                const chat = await TdLibController.send({
                    '@type': 'createPrivateChat',
                    user_id: UserStore.getMyId(),
                    force: true
                });

                if (chat) {
                    TdLibController.setChatId(chat.id);
                }
                break;
            }
            case '1': {
                event.preventDefault();
                event.stopPropagation();

                openPinnedChat(0);
                break;
            }
            case '2': {
                event.preventDefault();
                event.stopPropagation();

                openPinnedChat(1);
                break;
            }
            case '3': {
                event.preventDefault();
                event.stopPropagation();

                openPinnedChat(2);
                break;
            }
            case '4': {
                event.preventDefault();
                event.stopPropagation();

                openPinnedChat(3);
                break;
            }
            case '5': {
                event.preventDefault();
                event.stopPropagation();

                openPinnedChat(4);
                break;
            }
        }
    }
});

window.hasFocus = true;

// set offline on page lost focus
// console.log('[ns] window.onblur attach');
window.onblur = function() {
    keyMap.clear();

    window.hasFocus = false;

    TdLibController.clientUpdate({
        '@type': 'clientUpdateFocusWindow',
        focused: false
    });
};

// set online on page get focus
// console.log('[ns] window.onfocus attach');
window.onfocus = function() {
    keyMap.clear();

    window.hasFocus = true;

    TdLibController.clientUpdate({
        '@type': 'clientUpdateFocusWindow',
        focused: true
    });
};

// disable back navigation
window.history.pushState(null, null, window.location.href);
window.onpopstate = function() {
    window.history.go(1);
};

const enhance = compose(
    withLanguage,
    withTranslation(),
    withTelegramTheme,
    withTheme
);

export default enhance(TelegramApp);
