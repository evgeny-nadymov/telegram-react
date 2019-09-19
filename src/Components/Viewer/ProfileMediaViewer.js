/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import CloseIcon from '@material-ui/icons/Close';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import ReplyIcon from '@material-ui/icons/Reply';
import DeleteIcon from '@material-ui/icons/Delete';
import MediaViewerDownloadButton from './MediaViewerDownloadButton';
import MediaViewerButton from './MediaViewerButton';
import MediaViewerFooterText from './MediaViewerFooterText';
import MediaViewerFooterButton from './MediaViewerFooterButton';
import ProfileMediaViewerContent from './ProfileMediaViewerContent';
import ProfileMediaViewerControl from '../Tile/ProfileMediaViewerControl';
import { setProfileMediaViewerContent } from '../../Actions/Client';
import { getPhotoFromChat, getChatUserId, isPrivateChat } from '../../Utils/Chat';
import { getProfilePhotoDateHint, getProfilePhoto } from '../../Utils/User';
import { loadProfileMediaViewerContent, preloadProfileMediaViewerContent, saveOrDownload } from '../../Utils/File';
import ApplicationStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';
import './ProfileMediaViewer.css';

const forwardIconStyle = {
    padding: 20,
    color: 'white',
    transform: 'scaleX(-1)'
};

const deleteIconStyle = {
    padding: 20,
    color: 'white'
};

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

        const result = await TdLibController.send({
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
        setProfileMediaViewerContent(null);
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

        const photo =
            index > 0 && index < this.history.length ? getProfilePhoto(this.history[index]) : getPhotoFromChat(chatId);
        if (!photo) return;
        if (!photo.big) return;

        const file = FileStore.get(photo.big.id) || photo.big;
        if (!file) return;

        saveOrDownload(file, file.id + '.jpg', chat, () => FileStore.updateChatPhotoBlob(chatId, file.id));
    };

    handleForward = () => {
        const { chatId } = this.props;
        if (!isPrivateChat(chatId)) return;

        const { currentIndex, totalCount } = this.state;

        let index = -1;
        if (totalCount) {
            index = currentIndex;
        }

        if (index < 0 || index >= this.history.length) return;
        const photo = getProfilePhoto(this.history[index]);
        if (!photo) return;

        let { big: file } = photo;
        file = FileStore.get(file.id) || file;
        if (!file) return;

        const photoSize = {
            '@type': 'photoSize',
            type: 'c',
            photo: file,
            width: 640,
            height: 640
        };

        TdLibController.clientUpdate({
            '@type': 'clientUpdateForward',
            info: { photoSize }
        });
    };

    handleDelete = () => {
        const { chatId, messageId } = this.props;
        const { currentIndex, totalCount } = this.state;

        let index = -1;
        if (totalCount) {
            index = currentIndex;
        }

        const photo =
            index > 0 && index < this.history.length ? getProfilePhoto(this.history[index]) : getPhotoFromChat(chatId);

        if (photo) {
            let file = photo.big;
            file = FileStore.get(file.id) || file;
            if (file) {
                const store = FileStore.getReadWriteStore();

                FileStore.deleteLocalFile(store, file);
            }
        }
    };

    hasPreviousMedia = index => {
        if (index === -1) return false;

        const nextIndex = index + 1;
        return nextIndex < this.history.length;
    };

    handlePrevious = event => {
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
    };

    hasNextMedia = index => {
        if (index === -1) return false;

        const nextIndex = index - 1;
        return nextIndex >= 0;
    };

    handleNext = event => {
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
        const { chatId, t } = this.props;
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
        const inHistory = index >= 0 && index < this.history.length;
        const photo = inHistory ? getProfilePhoto(this.history[index]) : getPhotoFromChat(chatId);
        const userProfilePhoto = inHistory ? this.history[index] : null;
        const { big: file } = photo;

        return (
            <div className={classNames('media-viewer', 'media-viewer-default')}>
                {deleteConfirmation}
                <div className='media-viewer-wrapper' onClick={this.handlePrevious}>
                    <div className='media-viewer-left-column'>
                        <div className='media-viewer-button-placeholder' />
                        <MediaViewerButton disabled={!hasNextMedia} grow onClick={this.handleNext}>
                            <NavigateBeforeIcon fontSize='large' />
                        </MediaViewerButton>
                    </div>

                    <div className='media-viewer-content-column'>
                        <ProfileMediaViewerContent chatId={chatId} photo={photo} onClick={this.handlePrevious} />
                    </div>

                    <div className='media-viewer-right-column'>
                        <MediaViewerButton onClick={this.handleClose}>
                            <CloseIcon fontSize='large' />
                        </MediaViewerButton>
                        <MediaViewerButton disabled={!hasPreviousMedia} grow onClick={this.handlePrevious}>
                            <NavigateNextIcon fontSize='large' />
                        </MediaViewerButton>
                    </div>
                </div>
                <div className='media-viewer-footer'>
                    <ProfileMediaViewerControl chatId={chatId} date={getProfilePhotoDateHint(userProfilePhoto)} />
                    <MediaViewerFooterText
                        title={t('AttachPhoto')}
                        subtitle={totalCount && index >= 0 ? `${index + 1} of ${totalCount}` : null}
                    />
                    <MediaViewerDownloadButton title={t('Save')} fileId={file.id} onClick={this.handleSave} />
                    {isPrivateChat(chatId) && (
                        <MediaViewerFooterButton
                            title={t('Forward')}
                            disabled={!inHistory}
                            onClick={this.handleForward}>
                            <ReplyIcon style={forwardIconStyle} />
                        </MediaViewerFooterButton>
                    )}
                    <MediaViewerFooterButton title={t('Delete')} disabled onClick={this.handleDelete}>
                        <DeleteIcon style={deleteIconStyle} />
                    </MediaViewerFooterButton>
                </div>
            </div>
        );
    }
}

ProfileMediaViewer.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(ProfileMediaViewer);
