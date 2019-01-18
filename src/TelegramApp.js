/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { compose } from 'recompose';
import withLanguage from './Language';
import withTheme from './Theme';
import localForage from 'localforage';
import LocalForageWithGetItems from 'localforage-getitems';
import packageJson from '../package.json';
import DialogInfo from './Components/ColumnRight/DialogInfo';
import Dialogs from './Components/ColumnLeft/Dialogs';
import DialogDetails from './Components/ColumnMiddle/DialogDetails';
import AuthFormControl from './Components/Auth/AuthFormControl';
import Footer from './Components/Footer';
import MediaViewer from './Components/Viewer/MediaViewer';
import ProfileMediaViewer from './Components/Viewer/ProfileMediaViewer';
import AppInactiveControl from './Components/Additional/AppInactiveControl';
import registerServiceWorker from './registerServiceWorker';
import ChatStore from './Stores/ChatStore';
import ApplicationStore from './Stores/ApplicationStore';
import TdLibController from './Controllers/TdLibController';
import './TelegramApp.css';
import withSnackbarNotifications from './Notifications';

const styles = theme => ({
    page: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary
    }
});

class TelegramApp extends Component {
    constructor(props) {
        super(props);

        console.log(`Start Telegram Web ${packageJson.version}`);

        this.dialogDetailsRef = React.createRef();

        this.state = {
            authorizationState: null,
            inactive: false,
            mediaViewerContent: ApplicationStore.mediaViewerContent
        };

        /*this.store = localForage.createInstance({
                    name: '/tdlib'
                });*/

        //this.initDB();
    }

    componentWillMount() {
        const { location } = this.props;

        TdLibController.init(location);
    }

    componentDidMount() {
        ApplicationStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        ApplicationStore.on('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        ApplicationStore.on('clientUpdateAppInactive', this.onClientUpdateAppInactive);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('updateAuthorizationState', this.onUpdateAuthorizationState);
        ApplicationStore.removeListener('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        ApplicationStore.removeListener('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.removeListener(
            'clientUpdateProfileMediaViewerContent',
            this.onClientUpdateProfileMediaViewerContent
        );
        ApplicationStore.removeListener('clientUpdateAppInactive', this.onClientUpdateAppInactive);
    }

    onUpdateAuthorizationState = update => {
        const { authorization_state } = update;

        this.setState({ authorizationState: authorization_state });

        if (authorization_state) {
            if (
                authorization_state['@type'] === 'authorizationStateReady' ||
                authorization_state['@type'] === 'authorizationStateWaitCode' ||
                authorization_state['@type'] === 'authorizationStateWaitPassword' ||
                authorization_state['@type'] === 'authorizationStateWaitPhoneNumber'
            ) {
                //registerServiceWorker();
            }

            if (authorization_state['@type'] === 'authorizationStateReady') {
                TdLibController.send({
                    '@type': 'setOption',
                    name: 'online',
                    value: { '@type': 'optionValueBoolean', value: true }
                });
            }
        }
    };

    onClientUpdateChatDetailsVisibility = update => {
        this.setState({
            isChatDetailsVisible: ApplicationStore.isChatDetailsVisible
        });
    };

    onClientUpdateMediaViewerContent = update => {
        this.setState({ mediaViewerContent: ApplicationStore.mediaViewerContent });
    };

    onClientUpdateProfileMediaViewerContent = update => {
        this.setState({
            profileMediaViewerContent: ApplicationStore.profileMediaViewerContent
        });
    };

    onClientUpdateAppInactive = update => {
        this.setState({ inactive: true });
    };

    handleSelectChat = (chatId, messageId = null) => {
        const currentChatId = ApplicationStore.getChatId();
        const currentMessageId = ApplicationStore.getMessageId();

        if (currentChatId === chatId && messageId && currentMessageId === messageId) {
            this.dialogDetailsRef.current.scrollToMessage();
        } else if (currentChatId === chatId && !messageId) {
            const chat = ChatStore.get(chatId);
            if (chat && chat.unread_count > 0) {
                this.dialogDetailsRef.current.scrollToStart();
            } else {
                this.dialogDetailsRef.current.scrollToBottom();
            }
        } else {
            ApplicationStore.setChatId(chatId, messageId);
        }
    };

    handleSelectUser = async userId => {
        if (!userId) return;

        let chat = await TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: userId,
            force: true
        });

        this.handleSelectChat(chat.id);
    };

    clearCache = () => {
        // this.store.clear()
        //     .then(() => alert('cache cleared'));
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

    render() {
        const {
            inactive,
            authorizationState,
            isChatDetailsVisible,
            mediaViewerContent,
            profileMediaViewerContent
        } = this.state;
        const { classes } = this.props;

        let page = (
            <>
                <div className={classNames(classes.page, 'page', { 'page-third-column': isChatDetailsVisible })}>
                    <Dialogs onClearCache={this.clearCache} onSelectChat={this.handleSelectChat} />
                    <DialogDetails
                        ref={this.dialogDetailsRef}
                        onSelectChat={this.handleSelectChat}
                        onSelectUser={this.handleSelectUser}
                    />
                    {isChatDetailsVisible && (
                        <DialogInfo onSelectChat={this.handleSelectChat} onSelectUser={this.handleSelectUser} />
                    )}
                </div>
                <Footer />
            </>
        );

        if (inactive) {
            page = (
                <>
                    <div className='header-wrapper' />
                    <div className={classNames(classes.page, 'page')}>
                        <AppInactiveControl />
                    </div>
                    <Footer />
                </>
            );
        } else if (authorizationState) {
            switch (authorizationState['@type']) {
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
                        <AuthFormControl
                            authorizationState={authorizationState}
                            onChangePhone={this.handleChangePhone}
                        />
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
            <div id='app' onDragOver={this.handleDragOver} onDrop={this.handleDrop}>
                {page}
                {mediaViewerContent && <MediaViewer {...mediaViewerContent} />}
                {profileMediaViewerContent && <ProfileMediaViewer {...profileMediaViewerContent} />}
            </div>
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

window.history.pushState(null, null, window.location.href);
window.onpopstate = function() {
    window.history.go(1);
};

const enhance = compose(
    withLanguage,
    withTheme,
    withStyles(styles),
    withSnackbarNotifications
);

export default enhance(TelegramApp);
