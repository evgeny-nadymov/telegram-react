/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import packageJson from '../package.json';
import withLanguage from './Language';
import withTheme from './Theme';
import AuthFormControl from './Components/Auth/AuthFormControl';
import InactivePage from './Components/InactivePage';
import StubPage from './Components/StubPage';
import registerServiceWorker from './registerServiceWorker';
import { OPTIMIZATIONS_FIRST_START } from './Constants';
import ChatStore from './Stores/ChatStore';
import UserStore from './Stores/UserStore';
import ApplicationStore from './Stores/ApplicationStore';
import TdLibController from './Controllers/TdLibController';
import './TelegramApp.css';

const MainPage = React.lazy(() => import('./Components/MainPage'));

const styles = theme => ({
    '@global': {
        a: {
            color: theme.palette.primary.main
        },
        code: {
            color: theme.palette.primary.dark
        }
    }
});

class TelegramApp extends Component {
    constructor(props) {
        super(props);

        console.log(`Start Telegram Web ${packageJson.version}`);

        this.state = {
            authorizationState: null,
            databaseExists: true,
            inactive: false,
            fatalError: false
        };
    }

    componentWillMount() {
        const { location } = this.props;

        TdLibController.init(location);
    }

    componentDidMount() {
        TdLibController.addListener('update', this.onUpdate);

        ApplicationStore.on('clientUpdateAppInactive', this.onClientUpdateAppInactive);
        ApplicationStore.on('clientUpdateDatabaseExists', this.onClientUpdateDatabaseExists);
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        ApplicationStore.on('updateFatalError', this.onUpdateFatalError);
    }

    componentWillUnmount() {
        TdLibController.removeListener('update', this.onUpdate);

        ApplicationStore.removeListener('clientUpdateAppInactive', this.onClientUpdateAppInactive);
        ApplicationStore.removeListener('clientUpdateDatabaseExists', this.onClientUpdateDatabaseExists);
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState);
        ApplicationStore.removeListener('updateFatalError', this.onUpdateFatalError);
    }

    onClientUpdateDatabaseExists = update => {
        const { exists } = update;

        if (!exists) {
            this.setState({
                authorizationState: {
                    '@type': 'authorizationStateWaitTdlib'
                },
                databaseExists: exists
            });
        }
    };

    onUpdate = update => {
        if (OPTIMIZATIONS_FIRST_START) {
            if (!this.checkServiceWorker) {
                this.checkServiceWorker = true;

                const cookieEnabled = navigator.cookieEnabled;
                if (cookieEnabled) {
                    const cookies = new Cookies();
                    const register = cookies.get('register');
                    if (!register) {
                        registerServiceWorker();
                    }
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
        if (authorizationState['@type'] !== 'authorizationStateReady') return;

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
        const { t } = this.props;
        const { inactive, authorizationState, databaseExists, fatalError } = this.state;

        const loading = t('Loading').replace('...', '');
        let page = <StubPage title={loading} />;

        if (inactive) {
            page = <InactivePage />;
        } else if (authorizationState) {
            switch (authorizationState['@type']) {
                case 'authorizationStateClosed':
                case 'authorizationStateClosing':
                case 'authorizationStateLoggingOut':
                case 'authorizationStateReady': {
                    page = (
                        <React.Suspense fallback={<StubPage title='' />}>
                            <MainPage />
                        </React.Suspense>
                    );
                    break;
                }
                case 'authorizationStateWaitCode':
                case 'authorizationStateWaitPassword':
                case 'authorizationStateWaitPhoneNumber':
                case 'authorizationStateWaitTdlib':
                    page = (
                        <AuthFormControl
                            authorizationState={authorizationState}
                            onChangePhone={this.handleChangePhone}
                        />
                    );
                    break;
                case 'authorizationStateWaitEncryptionKey':
                case 'authorizationStateWaitTdlibParameters': {
                    if (!databaseExists) {
                        page = (
                            <AuthFormControl
                                authorizationState={authorizationState}
                                onChangePhone={this.handleChangePhone}
                            />
                        );
                    }

                    break;
                }
            }
        }

        return (
            <div id='app' onDragOver={this.handleDragOver} onDrop={this.handleDrop} onKeyDown={this.handleKeyDown}>
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

    const { authorizationState } = ApplicationStore;
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
window.onblur = function() {
    keyMap.clear();
    //console.log('window.blur key', keyMap);

    const { authorizationState } = ApplicationStore;

    if (!authorizationState) return;
    if (authorizationState['@type'] !== 'authorizationStateReady') return;

    window.hasFocus = false;

    TdLibController.clientUpdate({
        '@type': 'clientUpdateFocusWindow',
        focused: false
    });
};

// set online on page get focus
window.onfocus = function() {
    keyMap.clear();
    //console.log('window.focus key', keyMap);
    const { authorizationState } = ApplicationStore;

    if (!authorizationState) return;
    if (authorizationState['@type'] !== 'authorizationStateReady') return;

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
    withTheme,
    withStyles(styles)
);

export default enhance(TelegramApp);
