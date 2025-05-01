/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { compose } from '../Utils/HOC';
import withLanguage from '../Language';
import withSnackbarNotifications from '../Notifications';
import PipPlayer from './Player/PipPlayer';
import ForwardDialog from './Popup/ForwardDialog';
import ChatInfo from './ColumnRight/ChatInfo';
import Dialogs from './ColumnLeft/Dialogs';
import DialogDetails from './ColumnMiddle/DialogDetails';
import InstantViewer from './InstantView/InstantViewer';
import MediaViewer from './Viewer/MediaViewer';
import ProfileMediaViewer from './Viewer/ProfileMediaViewer';
import { highlightMessage } from '../Actions/Client';
import AppStore from '../Stores/ApplicationStore';
import ChatStore from '../Stores/ChatStore';
import InstantViewStore from '../Stores/InstantViewStore';
import UserStore from '../Stores/UserStore';
import PlayerStore from '../Stores/PlayerStore';
import TdLibController from '../Controllers/TdLibController';
import '../TelegramApp.css';
import Actions from './Actions';
import FileInfo from './ColumnLeft/FileInfo';
// import FilesList from './ColumnMiddle/Storage/FilesList';

class MainPage extends React.Component {
    constructor(props) {
        super(props);
        this.page_change = this.page_change.bind(this);

        this.dialogDetailsRef = React.createRef();

        const { isChatDetailsVisible, mediaViewerContent, profileMediaViewerContent, isSmallWidth } = AppStore;

        this.storageUpdate = this.storageUpdate.bind(this);

        this.state = {
            isChatDetailsVisible,
            mediaViewerContent,
            profileMediaViewerContent,
            isSmallWidth,
            forwardInfo: null,
            instantViewContent: null,
            videoInfo: null,
            page: "chats",
            
            storage: {
                mounted: false,
                path: 'json["@structure"]',
                json: null,
                storageUpdate: this.storageUpdate
            }
        };

    }

    page_change (page) {
        this.setState({ page: page });
        // console.log(this.state);
    }

    getCurrentUserId () {
        return UserStore.getMyId();
    }

    storageUpdate(data) {
        var storage = {
            mounted: true,
            path: data.path,
            json: data.json,
            storageUpdate: this.storageUpdate
        }
        this.setState({ storage: storage });
    }

    componentDidMount() {
        UserStore.on('clientUpdateOpenUser', this.onClientUpdateOpenUser);
        ChatStore.on('clientUpdateOpenChat', this.onClientUpdateOpenChat);

        AppStore.on('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        AppStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.on('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        AppStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        AppStore.on('clientUpdateForward', this.onClientUpdateForward);
        InstantViewStore.on('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        PlayerStore.on('clientUpdatePictureInPicture', this.onClientUpdatePictureInPicture);
    }

    componentWillUnmount() {
        UserStore.off('clientUpdateOpenUser', this.onClientUpdateOpenUser);
        ChatStore.off('clientUpdateOpenChat', this.onClientUpdateOpenChat);

        AppStore.off('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        AppStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.off('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        AppStore.off('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        AppStore.off('clientUpdateForward', this.onClientUpdateForward);
        InstantViewStore.off('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        PlayerStore.off('clientUpdatePictureInPicture', this.onClientUpdatePictureInPicture);
    }

    onClientUpdatePictureInPicture = update => {
        const { videoInfo } = update;

        this.setState({
            videoInfo
        });
    };

    onClientUpdatePageWidth = update => {
        const { isSmallWidth } = update;

        this.setState({ isSmallWidth });
    };

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
        const { isChatDetailsVisible } = AppStore;

        this.setState({ isChatDetailsVisible });
    };

    onClientUpdateMediaViewerContent = update => {
        const { mediaViewerContent } = AppStore;

        this.setState({ mediaViewerContent });
    };

    onClientUpdateProfileMediaViewerContent = update => {
        const { profileMediaViewerContent } = AppStore;

        this.setState({ profileMediaViewerContent });
    };

    onClientUpdateForward = update => {
        const { info } = update;

        this.setState({ forwardInfo: info });
    };

    handleSelectChat = (chatId, messageId = null, popup = false) => {
        const currentChatId = AppStore.getChatId();
        const currentDialogChatId = AppStore.dialogChatId;
        const currentMessageId = AppStore.getMessageId();

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

    storage_operations = (method, type, data=undefined) => {
        if (type == "folders") {
            if (method == "get") return this.state.storage_folders;
            else if (method == "put") this.setState({ storage_folders: data });
        }
        else if (type == "files") {
            if (method == "get") return this.state.storage_files;
            else if (method == "put") this.setState({ storage_files: data });
        }
    };

    render() {
        const {
            instantViewContent,
            isChatDetailsVisible,
            mediaViewerContent,
            profileMediaViewerContent,
            forwardInfo,
            videoInfo,
            isSmallWidth
        } = this.state;

        var page = <></>;
        if (this.state.page == "chats") {
            page = <>
                <Dialogs page_change={this.page_change} />
                <DialogDetails ref={this.dialogDetailsRef} />
                {isChatDetailsVisible && <ChatInfo />}
            </>;
            console.log("Chats Selected");
        }
        else if (this.state.page == "storage") {
            const FilesList = React.lazy(() => import('./ColumnMiddle/Storage/FilesList'));
            page = <>
                <FileInfo page_change={this.page_change} />
                <FilesList 
                    ref={this.dialogDetailsRef} 
                    getCurrentUserId={this.getCurrentUserId} 
                    // storage_operations={this.storage_operations}
                    storage={this.state.storage} 
                />
                {isChatDetailsVisible && <ChatInfo />}
            </>;
            console.log("Storage Selected");
        }

        return (
            <>
                <div
                    className={classNames('page', {
                        'page-small': isSmallWidth,
                        'page-third-column': isChatDetailsVisible
                    })}>
                    {page}
                </div>
                <Actions/>
                {instantViewContent && <InstantViewer {...instantViewContent} />}
                {mediaViewerContent && <MediaViewer {...mediaViewerContent} />}
                {profileMediaViewerContent && <ProfileMediaViewer {...profileMediaViewerContent} />}
                {forwardInfo && <ForwardDialog {...forwardInfo} />}
                {videoInfo && <PipPlayer {...videoInfo}/>}
            </>
        );
    }
}

MainPage.propTypes = {};

const enhance = compose(
    withLanguage,
    withSnackbarNotifications
);

export default enhance(MainPage);
