/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import MediaViewerButton from './MediaViewerButton';
import MediaViewerFooterText from './MediaViewerFooterText';
import MediaViewerFooterButton from './MediaViewerFooterButton';
import ProfileMediaViewerContent from './ProfileMediaViewerContent';
import ProfileMediaViewerControl from '../Tile/ProfileMediaViewerControl';
import {
    getPhotoFromChat,
    getChatUserId,
    isPrivateChat
} from '../../Utils/Chat';
import {
    getProfilePhotoDateHint,
    getProfilePhotoFromPhoto
} from '../../Utils/User';
import {
    loadProfileMediaViewerContent,
    preloadProfileMediaViewerContent,
    saveOrDownload
} from '../../Utils/File';
import { MEDIA_SLICE_LIMIT, PHOTO_BIG_SIZE } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import MessageStore from '../../Stores/MessageStore';
import FileStore from '../../Stores/FileStore';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';
import './ProfileMediaViewer.css';
import MediaViewerContent from './MediaViewerContent';
import MediaViewerDownloadButton from './MediaViewerDownloadButton';

class ProfileMediaViewer extends React.Component {
    constructor(props) {
        super(props);

        this.history = [];

        const { chatId, fileId } = this.props;

        this.state = {
            prevChatId: chatId,
            prevFileId: fileId,
            currentIndex: 0,
            hasNextMedia: false,
            hasPreviousMedia: false,
            deleteConfirmationOpened: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId } = this.props;
        const {
            currentFileId,
            hasPreviousMedia,
            hasNextMedia,
            firstSliceLoaded,
            totalCount,
            deleteConfirmationOpened
        } = this.state;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.messageId !== messageId) {
            return true;
        }

        if (nextState.currentFileId !== currentFileId) {
            return true;
        }

        if (nextState.hasPrevousMedia !== hasPreviousMedia) {
            return true;
        }

        if (nextState.hasNextMedia !== hasNextMedia) {
            return true;
        }

        if (nextState.firstSliceLoaded !== firstSliceLoaded) {
            return true;
        }

        if (nextState.totalCount !== totalCount) {
            return true;
        }

        if (nextState.deleteConfirmationOpened !== deleteConfirmationOpened) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        const { chatId } = this.props;
        const photo = getPhotoFromChat(chatId);
        loadProfileMediaViewerContent(chatId, [photo]);

        this.loadHistory();

        document.addEventListener('keydown', this.onKeyDown, false);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.onKeyDown, false);
    }

    onKeyDown = event => {
        if (event.keyCode === 27) {
            const { deleteConfirmationOpened } = this.state;
            if (deleteConfirmationOpened) return;

            this.handleClose();
        } else if (event.keyCode === 39) {
            this.handlePrevious();
        } else if (event.keyCode === 37) {
            this.handleNext();
        }
    };

    loadHistory = async () => {
        const { chatId } = this.props;

        if (!isPrivateChat(chatId)) return;

        let result = await TdLibController.send({
            '@type': 'getUserProfilePhotos',
            user_id: getChatUserId(chatId),
            offset: 0,
            limit: 100
        });

        this.history = result.photos;
        this.firstSliceLoaded = result.photos.length === 0;

        const index = 0;

        this.setState({
            currentIndex: index,
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index),
            totalCount: result.total_count
        });

        preloadProfileMediaViewerContent(chatId, index, this.history);
    };

    handleClose = () => {
        ApplicationStore.setProfileMediaViewerContent(null);
    };

    handleSave = () => {
        const { chatId } = this.props;
        const { currentIndex, totalCount } = this.state;

        const chat = ChatStore.get(chatId);
        if (!chat) return;

        let index = -1;
        if (totalCount) {
            index = currentIndex;
        }

        const photo = index > 0 && index < this.history.length ? getProfilePhotoFromPhoto(this.history[index]) : getPhotoFromChat(chatId);
        if (!photo) return;
        if (!photo.big) return;

        const file = FileStore.get(photo.big.id) || photo.big;
        if (!file) return;

        saveOrDownload(file, file.id + '.jpg', chat);
    };

    handleForward = () => {};

    handleDelete = () => {
        // return;
        // this.handleDialogOpen();
        // return;

        const { chatId, messageId } = this.props;
        const { currentIndex, totalCount } = this.state;

        let index = -1;
        if (totalCount) {
            index = currentIndex;
        }

        const photo = index > 0 && index < this.history.length ? getProfilePhotoFromPhoto(this.history[index]) : getPhotoFromChat(chatId);
        if (photo) {
            let file = photo.big;
            file = FileStore.get(file.id) || file;
            if (file) {
                const store = FileStore.getReadWriteStore();

                FileStore.deleteLocalFile(store, file);
            }
        }
    };

    hasPreviousMedia = (index) => {
        if (index === -1) return false;

        const nextIndex = index + 1;
        return nextIndex < this.history.length;
    };

    handlePrevious = (event) => {
        if (event) {
            event.stopPropagation();
        }

        const { currentIndex } = this.state;
        const nextIndex = currentIndex + 1;

        return this.loadMedia(nextIndex, () => {
            if (nextIndex === this.history.length - 1) {
                this.loadPrevious();
            }
        });
    };

    loadPrevious = async () => {
        return;
        const { chatId } = this.props;
        const { currentMessageId } = this.state;

        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: currentMessageId,
            offset: 0,
            limit: MEDIA_SLICE_LIMIT,
            filter: { '@type': 'searchMessagesFilterPhoto' }
        });

        //filterMessages(result, this.history);
        //MessageStore.setItems(result.messages);

        this.history = this.history.concat(result.messages);

        const index = this.history.findIndex(x => x.id === currentMessageId);

        this.setState({
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index),
            totalCount: result.total_count
        });
    };

    hasNextMedia = (index) => {
        if (index === -1) return false;

        const nextIndex = index - 1;
        return nextIndex >= 0;
    };

    handleNext = (event) => {
        if (event) {
            event.stopPropagation();
        }

        const { currentIndex } = this.state;
        const nextIndex = currentIndex - 1;

        return this.loadMedia(nextIndex, () => {
            if (nextIndex === 0) {
                this.loadNext();
            }
        });
    };

    loadNext = async () => {
        return;
        const { chatId } = this.props;
        const { currentMessageId } = this.state;

        let result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: currentMessageId,
            offset: -MEDIA_SLICE_LIMIT,
            limit: MEDIA_SLICE_LIMIT + 1,
            filter: { '@type': 'searchMessagesFilterPhoto' }
        });

        //filterMessages(result, this.history);
        MessageStore.setItems(result.messages);

        this.firstSliceLoaded = result.messages.length === 0;
        this.history = result.messages.concat(this.history);

        const index = this.history.findIndex(x => x.id === currentMessageId);

        this.setState({
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index),
            firstSliceLoaded: this.firstSliceLoaded,
            totalCount: result.total_count
        });
    };

    loadMedia = (index, callback) => {
        if (index < 0) return false;
        if (index >= this.history.length) return false;

        this.setState(
            {
                currentIndex: index,
                hasNextMedia: this.hasNextMedia(index),
                hasPreviousMedia: this.hasPreviousMedia(index)
            },
            callback
        );

        const { chatId } = this.props;

        preloadProfileMediaViewerContent(chatId, index, this.history);
        return true;
    };

    render() {
        const { chatId } = this.props;
        const {
            currentIndex,
            hasNextMedia,
            hasPreviousMedia,
            firstSliceLoaded,
            totalCount,
            deleteConfirmationOpened,
            deleteForAll
        } = this.state;

        let index = -1;
        if (totalCount) {
            index = currentIndex;
        }

        const deleteConfirmation = null;
        const photo = index > 0 && index < this.history.length ? getProfilePhotoFromPhoto(this.history[index]) : getPhotoFromChat(chatId);
        const userProfilePhoto = index >= 0 && index < this.history.length ? this.history[index] : null;
        const fileId = photo.big.id;
        return (
            <div className='media-viewer'>
                {deleteConfirmation}
                <div className='media-viewer-wrapper' onClick={this.handlePrevious}>
                    <div className='media-viewer-left-column'>
                        <div className='media-viewer-button-placeholder' />
                        <MediaViewerButton disabled={!hasNextMedia} grow onClick={this.handleNext}>
                            <div className='media-viewer-previous-icon' />
                        </MediaViewerButton>
                    </div>

                    <div className='media-viewer-content-column'>
                        <ProfileMediaViewerContent
                            chatId={chatId}
                            photo={photo}
                            onClick={this.handlePrevious} />
                    </div>

                    <div className='media-viewer-right-column'>
                        <MediaViewerButton onClick={this.handleClose}>
                            <div className='media-viewer-close-icon' />
                        </MediaViewerButton>
                        <MediaViewerButton disabled={!hasPreviousMedia} grow onClick={this.handlePrevious}>
                            <div className='media-viewer-next-icon' />
                        </MediaViewerButton>
                    </div>
                </div>
                <div className='media-viewer-footer'>
                    <ProfileMediaViewerControl chatId={chatId} date={getProfilePhotoDateHint(userProfilePhoto)} />
                    <MediaViewerFooterText
                        title='Photo'
                        subtitle={
                            totalCount && index >= 0
                                ? `${totalCount - index} of ${totalCount}`
                                : null
                        }/>
                    <MediaViewerDownloadButton fileId={fileId} onClick={this.handleSave}>
                        <div className='media-viewer-save-icon' />
                    </MediaViewerDownloadButton>
                    <MediaViewerFooterButton title='Forward' disabled={true} onClick={this.handleForward}>
                        <div className='media-viewer-forward-icon' />
                    </MediaViewerFooterButton>
                    <MediaViewerFooterButton title='Delete' disabled={true} onClick={this.handleDelete}>
                        <div className='media-viewer-delete-icon' />
                    </MediaViewerFooterButton>
                </div>
            </div>
        );
    }
}

ProfileMediaViewer.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default ProfileMediaViewer;
