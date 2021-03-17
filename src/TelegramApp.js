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
// import StubPage from './Components/StubPage';
import registerServiceWorker from './registerServiceWorker';
import { isMobile } from './Utils/Common';
import { loadData } from './Utils/Phone';
import KeyboardManager, { KeyboardHandler } from './Components/Additional/KeyboardManager';
import { openChatList, openPinnedChat } from './Actions/Chat';
import { modalManager } from './Utils/Modal';
import { clearSelection, editMessage, replyMessage, searchChat } from './Actions/Client';
import { isSafari } from './Utils/Common';
import { OPTIMIZATIONS_FIRST_START, STORAGE_REGISTER_KEY, STORAGE_REGISTER_TEST_KEY } from './Constants';
import UserStore from './Stores/UserStore';
import AppStore from './Stores/ApplicationStore';
import AuthorizationStore from './Stores/AuthorizationStore';
import FilterStore from './Stores/FilterStore';
import MessageStore from './Stores/MessageStore';
import TdLibController from './Controllers/TdLibController';
import './TelegramApp.css';

// import MainPage from './Components/MainPage';
const MainPage = React.lazy(() => import('./Components/MainPage'));

class TelegramApp extends Component {
    constructor(props) {
        super(props);

        console.log(`Start Telegram Web ${packageJson.version}`);
        console.log('[auth] ctor', props.location);

        this.state = {
            prevAuthorizationState: AuthorizationStore.current,
            authorizationState: null,
            tdlibDatabaseExists: false,
            inactive: false,
            fatalError: false,
            nativeMobile: isMobile(),
            isSmall: window.innerWidth < 800
        };

        this.replyMessageId = 0;
        this.editMessageId = 0;
        this.keyboardHandler = new KeyboardHandler(this.handleKeyDown);
        this.keyMap = new Map();

        document.addEventListener('keyup', event => {
            this.keyMap.delete(event.key);
        });
    }

    handleKeyDown = async event => {
        const { altKey, ctrlKey, keyCode, key, metaKey, repeat, shiftKey, isComposing } = event;

        this.keyMap.set(key, key);

        const { chatList } = FilterStore;
        const { authorizationState, chatId } = AppStore;
        if (!authorizationState) return;
        if (authorizationState['@type'] !== 'authorizationStateReady') return;
        if (this.keyMap.size > 3) return;

        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        switch (key) {
            case 'Escape': {
                if (!altKey && !ctrlKey && !metaKey && !shiftKey && !repeat) {
                    // console.log('[keydown] esc', this.editMessageId, this.replyMessageId);
                    if (this.editMessageId) {
                        editMessage(chatId, 0);
                        return;
                    } else if (this.replyMessageId) {
                        replyMessage(chatId, 0);
                        return;
                    } else if (MessageStore.selectedItems.size > 0) {
                        clearSelection();
                        return;
                    } else if (chatId) {
                        TdLibController.setChatId(0);
                        return;
                    } else if (chatList && chatList['@type'] !== 'chatListMain') {
                        openChatList({ '@type': 'chatListMain' });
                        return;
                    }

                    // open search if no one dialog opened
                    searchChat(0, null);

                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            case '0': {
                if (altKey && ctrlKey && !metaKey && !shiftKey && !repeat) {
                    if (this.editMessageId) return;
                    if (this.replyMessageId) return;

                    const chat = await TdLibController.send({
                        '@type': 'createPrivateChat',
                        user_id: UserStore.getMyId(),
                        force: true
                    });

                    if (!chat) return;

                    TdLibController.setChatId(chat.id);
                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
            case '1':
            case '2':
            case '3':
            case '4':
            case '5': {
                if (altKey && ctrlKey && !metaKey && !shiftKey && !repeat) {
                    if (this.editMessageId) return;
                    if (this.replyMessageId) return;

                    openPinnedChat(Number(key) - 1);
                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            }
        }
    };

    componentWillMount() {
        TdLibController.init();
    }

    componentDidMount() {
        setTimeout(() => loadData(), 1500);
        TdLibController.on('update', this.onUpdate);

        AppStore.on('clientUpdateAppInactive', this.onClientUpdateAppInactive);
        AppStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.on('clientUpdateTdLibDatabaseExists', this.onClientUpdateTdLibDatabaseExists);
        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.on('updateFatalError', this.onUpdateFatalError);
        MessageStore.on('clientUpdateEditMessage', this.onClientUpdateEditMessage);
        MessageStore.on('clientUpdateReply', this.onClientUpdateReply);
        KeyboardManager.add(this.keyboardHandler);
    }

    componentWillUnmount() {
        TdLibController.off('update', this.onUpdate);

        AppStore.off('clientUpdateAppInactive', this.onClientUpdateAppInactive);
        AppStore.off('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.off('clientUpdateTdLibDatabaseExists', this.onClientUpdateTdLibDatabaseExists);
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.off('updateFatalError', this.onUpdateFatalError);
        MessageStore.off('clientUpdateEditMessage', this.onClientUpdateEditMessage);
        MessageStore.off('clientUpdateReply', this.onClientUpdateReply);
        KeyboardManager.remove(this.keyboardHandler);
    }

    onClientUpdateEditMessage = update => {
        const { messageId } = update;

        this.editMessageId = messageId;
    };

    onClientUpdateReply = update => {
        const { messageId } = update;

        this.replyMessageId = messageId;
    };

    onClientUpdateFocusWindow = update => {
        this.keyMap.clear();
    };

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

                const { useTestDC } = TdLibController.parameters;
                const registerKey = useTestDC ? STORAGE_REGISTER_TEST_KEY : STORAGE_REGISTER_KEY;
                const register = localStorage.getItem(registerKey);
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
        let { prevAuthorizationState } = this.state;

        if (authorizationState && (
            authorizationState['@type'] === 'authorizationStateLoggingOut' ||
            authorizationState['@type'] === 'authorizationStateClosed')) {
            prevAuthorizationState = null;
        }

        this.setState({
            authorizationState,
            prevAuthorizationState
        });

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
            changePhone: true
        });
    };

    handleRequestQRCode = () => {
        const { changePhone, authorizationState } = this.state;

        if (changePhone
            && authorizationState
            && authorizationState['@type'] === 'authorizationStateWaitOtherDeviceConfirmation') {
            this.setState({ changePhone: false });
        } else {
            TdLibController.send({
                '@type': 'requestQrCodeAuthentication',
                other_user_ids: []
            });
        }
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

    render() {
        const { t, theme } = this.props;
        const { inactive, nativeMobile, fatalError } = this.state;
        let { authorizationState: state, prevAuthorizationState, changePhone } = this.state;
        if (changePhone) {
            state = { '@type': 'authorizationStateWaitPhoneNumber' };
        } else if (!state ||
            state['@type'] === 'authorizationStateClosed' ||
            state['@type'] === 'authorizationStateWaitEncryptionKey' ||
            state['@type'] === 'authorizationStateWaitTdlibParameters'
        ) {
            if (prevAuthorizationState) {
                state = prevAuthorizationState;
            } else {
                state = { '@type': 'authorizationStateWaitPhoneNumber' };
            }
        }

        const loading = t('Loading').replace('...', '');
        let page = ( //<MainPage />;
            <React.Suspense fallback={null}>
                <MainPage />
            </React.Suspense>
        );

        if (nativeMobile) {
            page = <NativeAppPage />;
        } else if (inactive) {
            page = <InactivePage />;
        } else if (state) {
            switch (state['@type']) {
                case 'authorizationStateClosed':
                case 'authorizationStateClosing':
                case 'authorizationStateLoggingOut':
                case 'authorizationStateReady': {
                    break;
                }
                case 'authorizationStateWaitOtherDeviceConfirmation':
                case 'authorizationStateWaitCode':
                case 'authorizationStateWaitRegistration':
                case 'authorizationStateWaitPassword':
                case 'authorizationStateWaitPhoneNumber':
                case 'authorizationStateWaitTdlib':
                    page = <AuthForm authorizationState={state} onChangePhone={this.handleChangePhone} onRequestQRCode={this.handleRequestQRCode}/>;
                    break;
                case 'authorizationStateWaitEncryptionKey':
                case 'authorizationStateWaitTdlibParameters': {
                    break;
                }
            }
        }

        return (
            <div
                id='app'
                className={theme.palette.type === 'dark' ? 'dark' : 'light'}
                onDragOver={this.handleDragOver}
                onDrop={this.handleDrop}
                // onKeyDown={KeyboardManager.handleKeyDown} tabIndex={-1}
            >
                {page}
                <Dialog
                    manager={modalManager}
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

window.hasFocus = true;

// set offline on page lost focus
// console.log('[ns] window.onblur attach');
window.onblur = function() {
    window.hasFocus = false;

    TdLibController.clientUpdate({
        '@type': 'clientUpdateFocusWindow',
        focused: false
    });
};

// set online on page get focus
// console.log('[ns] window.onfocus attach');
window.onfocus = function() {
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

async function unlockAudio() {
    try {
        const sound = new Audio('sounds/sound_a.mp3');
        sound.autoplay = true;
        sound.pause();
    } finally {
        document.body.removeEventListener('click', unlockAudio)
        document.body.removeEventListener('touchstart', unlockAudio)
    }
}

// if (isSafari()) {
    document.body.addEventListener('click', unlockAudio);
    document.body.addEventListener('touchstart', unlockAudio);
// }

const enhance = compose(
    withLanguage,
    withTranslation(),
    withTelegramTheme,
    withTheme
);

export default enhance(TelegramApp);
