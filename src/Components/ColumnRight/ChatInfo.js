/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ChatDetails from './ChatDetails';
import GroupsInCommon from './GroupsInCommon';
import SharedAudios from './SharedMedia/SharedAudios';
import SharedDocuments from './SharedMedia/SharedDocuments';
import SharedLinks from './SharedMedia/SharedLinks';
import SharedMedia from './SharedMedia';
import SharedPhotos from './SharedMedia/SharedPhotos';
import SharedVideos from './SharedMedia/SharedVideos';
import SharedVoiceNotes from './SharedMedia/SharedVoiceNotes';
import { changeChatDetailsVisibility, getChatCounters } from '../../Actions/Chat';
import { getPhotoFromChat, getSupergroupId, isSupergroup } from '../../Utils/Chat';
import { loadProfileMediaViewerContent } from '../../Utils/File';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './ChatInfo.css';

class ChatInfo extends React.Component {
    constructor(props) {
        super(props);

        this.detailsRef = React.createRef();

        const { popup } = props;
        const { chatId, dialogChatId } = AppStore;

        this.state = {
            chatId: popup ? dialogChatId : chatId,
            migratedChatId: 0,
            userChatId: null,
            openGroupInCommon: false,
            openSharedAudios: false,
            openSharedDocuments: false,
            openSharedLinks: false,
            openSharedMedia: false,
            openSharedPhotos: false,
            openSharedVideos: false,
            openSharedVoiceNotes: false,
            counters: null,
            migratedCounters: null
        };
    }

    componentDidMount() {
        this.loadContent(this.state.chatId);

        AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);
        AppStore.on('clientUpdatePageWidth', this.onClientUpdatePageWidth);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);
        AppStore.off('clientUpdatePageWidth', this.onClientUpdatePageWidth);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { chatId } = this.state;
        if (chatId !== prevState.chatId) {
            this.loadContent(chatId);
        }
    }

    onClientUpdatePageWidth = update => {
        const { isSmallWidth } = update;
        if (!isSmallWidth) return;

        const { popup } = this.props;
        if (popup) return;

        this.handleCloseChatDetails();
    };

    onClientUpdateChatId = update => {
        const { popup } = this.props;
        const { chatId } = this.state;

        if (popup) return;
        if (chatId === update.nextChatId) return;

        this.sharedAudios = null;
        this.sharedDocuments = null;
        this.sharedLinks = null;
        this.sharedPhotos = null;
        this.sharedVideos = null;
        this.sharedVoiceNotes = null;

        this.setState({
            chatId: update.nextChatId,
            migratedChatId: 0,
            userChatId: null,
            openGroupInCommon: false,
            openSharedAudios: false,
            openSharedDocuments: false,
            openSharedLinks: false,
            openSharedMedia: false,
            openSharedPhotos: false,
            openSharedVideos: false,
            openSharedVoiceNotes: false,
            counters: ChatStore.getCounters(update.nextChatId),
            migratedCounters: null
        });

        if (!update.nextChatId) {
            this.handleCloseChatDetails();
        }
    };

    loadContent = chatId => {
        this.loadChatCounters(chatId);
        this.loadMigratedCounters(chatId);

        const photo = getPhotoFromChat(chatId);
        if (!photo) return;
        loadProfileMediaViewerContent(chatId, [photo]);
    };

    loadChatCounters = async chatId => {
        const counters = await getChatCounters(chatId);
        ChatStore.setCounters(chatId, counters);

        if (chatId !== this.state.chatId) return;

        this.setState({ counters });
    };

    loadMigratedCounters = async chatId => {
        if (!isSupergroup(chatId)) return;

        const fullInfo = SupergroupStore.getFullInfo(getSupergroupId(chatId));
        if (!fullInfo) return;

        const { upgraded_from_basic_group_id: basic_group_id } = fullInfo;
        if (!basic_group_id) return;

        const chat = await TdLibController.send({
            '@type': 'createBasicGroupChat',
            basic_group_id,
            force: true
        });

        if (!chat) return;

        const counters = await getChatCounters(chat.id);
        ChatStore.setCounters(chat.id, counters);

        if (this.state.chatId !== chatId) return;

        this.setState({ migratedChatId: chat.id, migratedCounters: ChatStore.getCounters(chat.id) });
    };

    handleOpenSharedMedia = () => {
        this.setState({ openSharedMedia: true });
    };

    handleCloseSharedMedia = () => {
        this.setState({ openSharedMedia: false });
    };

    handleOpenGroupInCommon = () => {
        this.setState({ openGroupInCommon: true });
    };

    handleCloseGroupsInCommon = () => {
        this.setState({ openGroupInCommon: false });
    };

    handleCloseChatDetails = () => {
        const { popup } = this.props;
        const { userChatId } = this.state;

        if (userChatId) {
            this.setState({ userChatId: null });
        } else if (popup) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateDialogChatId',
                chatId: 0
            });
        } else {
            changeChatDetailsVisibility(false);
        }
    };

    handleOpenSharedDocuments = () => {
        this.setState({ openSharedDocuments: true });
    };

    handleCloseSharedDocuments = () => {
        this.setState({ openSharedDocuments: false });
    };

    handleOpenSharedAudios = () => {
        this.setState({ openSharedAudios: true });
    };

    handleCloseSharedAudios = () => {
        this.setState({ openSharedAudios: false });
    };

    handleOpenSharedVoiceNotes = () => {
        this.setState({ openSharedVoiceNotes: true });
    };

    handleCloseSharedVoiceNotes = () => {
        this.setState({ openSharedVoiceNotes: false });
    };

    handleOpenSharedLinks = () => {
        this.setState({ openSharedLinks: true });
    };

    handleCloseSharedLinks = () => {
        this.setState({ openSharedLinks: false });
    };

    handleOpenSharedPhotos = () => {
        this.setState({ openSharedPhotos: true });
    };

    handleCloseSharedPhotos = () => {
        this.setState({ openSharedPhotos: false });
    };

    handleOpenSharedVideos = () => {
        this.setState({ openSharedVideos: true });
    };

    handleCloseSharedVideos = () => {
        this.setState({ openSharedVideos: false });
    };

    render() {
        const { className, popup } = this.props;
        const {
            chatId,
            counters,
            migratedChatId,
            migratedCounters,
            userChatId,
            openSharedAudios,
            openSharedDocuments,
            openSharedLinks,
            openSharedMedia,
            openSharedPhotos,
            openSharedVideos,
            openSharedVoiceNotes,
            openGroupInCommon
        } = this.state;

        const currentChatId = chatId || userChatId;
        const minHeight = this.detailsRef && this.detailsRef.current ? this.detailsRef.current.getContentHeight() : 0;

        let content = null;
        if (openSharedMedia) {
            content = (
                <SharedMedia
                    chatId={currentChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedMedia}
                />
            );
        } else if (openSharedAudios) {
            this.sharedAudios = this.sharedAudios || (
                <SharedAudios
                    chatId={currentChatId}
                    migratedChatId={migratedChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedAudios}
                />
            );

            content = this.sharedAudios;
        } else if (openSharedDocuments) {
            this.sharedDocuments = this.sharedDocuments || (
                <SharedDocuments
                    chatId={currentChatId}
                    migratedChatId={migratedChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedDocuments}
                />
            );

            content = this.sharedDocuments;
        } else if (openSharedLinks) {
            this.sharedLinks = this.sharedLinks || (
                <SharedLinks
                    chatId={currentChatId}
                    migratedChatId={migratedChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedLinks}
                />
            );

            content = this.sharedLinks;
        } else if (openSharedPhotos) {
            this.sharedPhotos = this.sharedPhotos || (
                <SharedPhotos
                    chatId={currentChatId}
                    migratedChatId={migratedChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedPhotos}
                />
            );

            content = this.sharedPhotos;
        } else if (openSharedVideos) {
            this.sharedVideos = this.sharedVideos || (
                <SharedVideos
                    chatId={currentChatId}
                    migratedChatId={migratedChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedVideos}
                />
            );

            content = this.sharedVideos;
        } else if (openSharedVoiceNotes) {
            this.sharedVoiceNotes = this.sharedVoiceNotes || (
                <SharedVoiceNotes
                    chatId={currentChatId}
                    migratedChatId={migratedChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseSharedVoiceNotes}
                />
            );

            content = this.sharedVoiceNotes;
        } else if (openGroupInCommon) {
            content = (
                <GroupsInCommon
                    chatId={currentChatId}
                    popup={popup}
                    minHeight={minHeight}
                    onClose={this.handleCloseGroupsInCommon}
                />
            );
        } else {
            content = (
                <ChatDetails
                    ref={this.detailsRef}
                    chatId={currentChatId}
                    popup={popup}
                    backButton={userChatId === chatId}
                    counters={counters}
                    migratedCounters={migratedCounters}
                    onOpenGroupInCommon={this.handleOpenGroupInCommon}
                    onOpenSharedAudios={this.handleOpenSharedAudios}
                    onOpenSharedDocuments={this.handleOpenSharedDocuments}
                    onOpenSharedMedia={this.handleOpenSharedMedia}
                    onOpenSharedLinks={this.handleOpenSharedLinks}
                    onOpenSharedPhotos={this.handleOpenSharedPhotos}
                    onOpenSharedVideos={this.handleOpenSharedVideos}
                    onOpenSharedVoiceNotes={this.handleOpenSharedVoiceNotes}
                    onClose={this.handleCloseChatDetails}
                />
            );
        }

        return popup ? (
            <>{content}</>
        ) : (
            <div className={classNames('chat-info', { 'right-column': !popup }, className)}>{content}</div>
        );
    }
}

ChatInfo.propTypes = {
    className: PropTypes.string,
    classes: PropTypes.object,
    popup: PropTypes.bool
};

ChatInfo.defaultProps = {
    className: null,
    classes: null,
    popup: false
};

export default ChatInfo;
