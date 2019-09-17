/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import withLanguage from '../Language';
import withTheme from '../Theme';
import withSnackbarNotifications from '../Notifications';
import ForwardDialog from './Popup/ForwardDialog';
import ChatInfo from './ColumnRight/ChatInfo';
import Dialogs from './ColumnLeft/Dialogs';
import DialogDetails from './ColumnMiddle/DialogDetails';
import Footer from './Footer';
import MediaViewer from './Viewer/MediaViewer';
import ProfileMediaViewer from './Viewer/ProfileMediaViewer';
import { highlightMessage } from '../Actions/Client';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import ApplicationStore from '../Stores/ApplicationStore';
import TdLibController from '../Controllers/TdLibController';
import '../TelegramApp.css';
import InstantViewer from './InstantView/InstantViewer';

const styles = theme => ({
    page: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary
    }
});

class MainPage extends React.Component {
    constructor(props) {
        super(props);

        this.dialogDetailsRef = React.createRef();

        this.state = {
            isChatDetailsVisible: ApplicationStore.isChatDetailsVisible,
            mediaViewerContent: ApplicationStore.mediaViewerContent,
            profileMediaViewerContent: ApplicationStore.profileMediaViewerContent,
            forwardInfo: null,
            instantViewContent: null
        };

        /*this.store = localForage.createInstance({
                    name: 'tdlib'
                });*/

        //this.initDB();
    }

    componentDidMount() {
        UserStore.on('clientUpdateOpenUser', this.onClientUpdateOpenUser);
        ChatStore.on('clientUpdateOpenChat', this.onClientUpdateOpenChat);

        ApplicationStore.on('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        ApplicationStore.on('clientUpdateForward', this.onClientUpdateForward);
        ApplicationStore.on('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
    }

    componentWillUnmount() {
        UserStore.removeListener('clientUpdateOpenUser', this.onClientUpdateOpenUser);
        ChatStore.removeListener('clientUpdateOpenChat', this.onClientUpdateOpenChat);

        ApplicationStore.removeListener('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        ApplicationStore.removeListener('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.removeListener(
            'clientUpdateProfileMediaViewerContent',
            this.onClientUpdateProfileMediaViewerContent
        );
        ApplicationStore.removeListener('clientUpdateForward', this.onClientUpdateForward);
        ApplicationStore.removeListener('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
    }

    onClientUpdateInstantViewContent = update => {
        const { content } = update;

        this.setState({
            instantViewContent: content
        });
    };

    onClientUpdateOpenChat = update => {
        const { chatId, messageId, popup } = update;

        this.handleSelectChat(chatId, messageId, popup);
    };

    onClientUpdateOpenUser = update => {
        const { userId, popup } = update;

        this.handleSelectUser(userId, popup);
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

    onClientUpdateForward = update => {
        const { info } = update;

        this.setState({ forwardInfo: info });
    };

    handleSelectChat = (chatId, messageId = null, popup = false) => {
        const currentChatId = ApplicationStore.getChatId();
        const currentDialogChatId = ApplicationStore.dialogChatId;
        const currentMessageId = ApplicationStore.getMessageId();

        if (popup) {
            if (currentDialogChatId !== chatId) {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateDialogChatId',
                    chatId
                });
            }

            return;
        }

        if (currentChatId === chatId && messageId && currentMessageId === messageId) {
            this.dialogDetailsRef.current.scrollToMessage();
            if (messageId) {
                highlightMessage(chatId, messageId);
            }
        } else if (currentChatId === chatId && !messageId) {
            this.dialogDetailsRef.current.scrollToStart();
        } else {
            TdLibController.setChatId(chatId, messageId);
        }
    };

    handleSelectUser = async (userId, popup) => {
        if (!userId) return;

        const chat = await TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: userId,
            force: true
        });

        this.handleSelectChat(chat.id, null, popup);
    };

    render() {
        const { classes } = this.props;
        const {
            instantViewContent,
            isChatDetailsVisible,
            mediaViewerContent,
            profileMediaViewerContent,
            forwardInfo
        } = this.state;

        return (
            <>
                <div className={classNames(classes.page, 'page', { 'page-third-column': isChatDetailsVisible })}>
                    <Dialogs />
                    <DialogDetails ref={this.dialogDetailsRef} />
                    {isChatDetailsVisible && <ChatInfo />}
                </div>
                <Footer />
                {instantViewContent && <InstantViewer {...instantViewContent} />}
                {mediaViewerContent && <MediaViewer {...mediaViewerContent} />}
                {profileMediaViewerContent && <ProfileMediaViewer {...profileMediaViewerContent} />}
                {forwardInfo && <ForwardDialog {...forwardInfo} />}
            </>
        );
    }
}

MainPage.propTypes = {};

const enhance = compose(
    withLanguage,
    withTheme,
    withStyles(styles),
    withSnackbarNotifications
);

export default enhance(MainPage);
