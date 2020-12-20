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

class MainPage extends React.Component {
    constructor(props) {
        super(props);

        this.dialogDetailsRef = React.createRef();

        const { isChatDetailsVisible, mediaViewerContent, profileMediaViewerContent, isSmallWidth } = AppStore;

        this.state = {
            isChatDetailsVisible,
            mediaViewerContent,
            profileMediaViewerContent,
            isSmallWidth,
            forwardInfo: null,
            instantViewContent: null,
            videoInfo: null,
            IsFullWith:localStorage.IsFullWith==="true" && localStorage.IsFullWith
            ? true
            : false, 
        };
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
        AppStore.on("ToogleFullWith",this.ToogleFullWith)
    }
    ToogleFullWith = ()=>{
       let {IsFullWith} = this.state 
       this.setState({
        IsFullWith : !IsFullWith
       })
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
        const { chatId, messageId, popup, options } = update;

        this.handleSelectChat(chatId, messageId, popup, options || AppStore.chatSelectOptions);
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

    handleSelectChat = (chatId, messageId = null, popup = false, options = {}) => {
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

        if (currentChatId === chatId && messageId && currentMessageId === messageId && !options) {
            this.dialogDetailsRef.current.scrollToMessage();
            if (messageId) {
                highlightMessage(chatId, messageId);
            }
        } else if (currentChatId === chatId && !messageId && !options) {
            this.dialogDetailsRef.current.scrollToStart();
        } else {
            TdLibController.setChatId(chatId, messageId, options);
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
        const {
            instantViewContent,
            isChatDetailsVisible,
            mediaViewerContent,
            profileMediaViewerContent,
            forwardInfo,
            videoInfo,
            isSmallWidth,
            IsFullWith
        } = this.state;

        return (
            <>
                <div
                    className={classNames('page',
                    `${IsFullWith ?"FullWith": "" }`
                    , {
                        'page-small': isSmallWidth,
                        'page-third-column': isChatDetailsVisible ,  
                    })}>
                    <Dialogs />
                    <DialogDetails ref={this.dialogDetailsRef} />
                    {isChatDetailsVisible && <ChatInfo />}
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
