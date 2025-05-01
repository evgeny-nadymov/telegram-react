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
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import CloseIcon from '../../Assets/Icons/Close';
import NavigateBeforeIcon from '../../Assets/Icons/Left';
import ReplyIcon from '../../Assets/Icons/Share';
import DeleteIcon from '../../Assets/Icons/Delete';
import MediaViewerDownloadButton from './MediaViewerDownloadButton';
import MediaViewerButton from './MediaViewerButton';
import MediaViewerFooterText from './MediaViewerFooterText';
import MediaViewerFooterButton from './MediaViewerFooterButton';
import ProfileMediaViewerContent from './ProfileMediaViewerContent';
import ProfileMediaInfo from '../Tile/ProfileMediaInfo';
import { forward, setProfileMediaViewerContent } from '../../Actions/Client';
import { getPhotoFromChat, getChatUserId, isPrivateChat, isMeChat } from '../../Utils/Chat';
import { getProfilePhotoDateHint, getProfilePhoto } from '../../Utils/User';
import { loadProfileMediaViewerContent, preloadProfileMediaViewerContent, saveOrDownload } from '../../Utils/File';
import { modalManager } from '../../Utils/Modal';
import { PROFILE_PHOTO_BIG_SIZE } from '../../Constants';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './ProfileMediaViewer.css';

class ProfileMediaViewer extends React.Component {
    constructor(props) {
        super(props);

        this.history = [];
        this.keyboardHandler = new KeyboardHandler(this.handleKeyDown);

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

        this.loadHistory(photo);

        KeyboardManager.add(this.keyboardHandler);
    }

    componentWillUnmount() {
        KeyboardManager.remove(this.keyboardHandler);
    }

    handleKeyDown = event => {
        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        switch (event.key) {
            case 'Escape': {
                this.handleClose();
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            case 'ArrowLeft': {
                this.handleNext();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
            case 'ArrowRight': {
                this.handlePrevious();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
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
        const { currentIndex, totalCount } = this.state;

        let index = -1;
        if (totalCount) {
            index = currentIndex;
        }

        let inputFile = null;
        // let inputMessagePhoto = null;
        const inHistory = this.history && index >= 0 && index < this.history.length;
        if (inHistory) {
            const photo = getProfilePhoto(this.history[index]);
            if (!photo) return;

            let { big: file } = photo;
            if (!file) return;

            inputFile = {
                '@type': 'inputFileId',
                id: file.id
            };
        } else {
            const chatPhoto = getPhotoFromChat(chatId);
            if (!chatPhoto) return;

            const { big: file } = chatPhoto;
            if (!file) return;

            const blob = FileStore.getBlob(file.id);
            if (!blob) return;

            inputFile = {
                '@type': 'inputFileBlob',
                data: blob,
                name: ''
            };
        }

        if (!inputFile) return;

        const inputMessageContent = {
            '@type': 'inputMessagePhoto',
            photo: inputFile,
            thumbnail: null,
            added_sticker_file_ids: [],
            width: PROFILE_PHOTO_BIG_SIZE,
            height: PROFILE_PHOTO_BIG_SIZE,
            caption: {
                '@type': 'formattedText',
                text: '',
                entities: null
            },
            ttl: 0
        };

        forward(inputMessageContent);
    };

    handleDelete = async () => {
        const { chatId } = this.props;
        const {
            currentIndex,
            totalCount,
            hasNextMedia,
            hasPreviousMedia
        } = this.state;

        let index = -1;
        if (totalCount) {
            index = currentIndex;
        }

        const photo = index > 0 && index < this.history.length ? getProfilePhoto(this.history[index]) : getPhotoFromChat(chatId);
        if (!photo) return;

        const { id } = photo;
        if (!id) return;

        await TdLibController.send({
            '@type': 'deleteProfilePhoto',
            profile_photo_id: id
        });

        this.history.splice(index, 1);
        if (!this.history.length) {
            this.handleClose();
            return;
        }

        this.setState({
            totalCount: totalCount - 1
        });

        if (hasNextMedia) {
            const nextIndex = currentIndex - 1;

            return this.loadMedia(nextIndex, { totalCount: totalCount - 1 }, () => {
                if (nextIndex === 0) {
                    this.loadNext();
                }
            });
        }

        if (hasPreviousMedia) {
            const nextIndex = currentIndex;

            return this.loadMedia(nextIndex, { totalCount: totalCount - 1 }, () => {
                if (nextIndex === this.history.length - 1) {
                    this.loadPrevious();
                }
            });
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

        return this.loadMedia(nextIndex, { }, () => {
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

        return this.loadMedia(nextIndex, { }, () => {
            if (nextIndex === 0) {
                this.loadNext();
            }
        });
    };

    loadNext = async () => {
        return;
    };

    loadMedia = (index, obj, callback) => {
        if (index < 0) return false;
        if (index >= this.history.length) return false;

        this.setState(
            {
                currentIndex: index,
                ...obj,
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
            totalCount,
        } = this.state;

        let index = -1;
        if (totalCount) {
            index = currentIndex;
        }

        const inHistory = index >= 0 && index < this.history.length;
        const profilePhoto = inHistory ? getProfilePhoto(this.history[index]) : null;
        const profilePhotoBig = profilePhoto ? profilePhoto.big : null;
        const profilePhotoBlob = profilePhotoBig ? profilePhotoBig.blob || FileStore.getBlob(profilePhotoBig.id) : null;
        const photo = profilePhotoBlob ? profilePhoto : getPhotoFromChat(chatId);
        const userProfilePhoto = inHistory ? this.history[index] : null;
        const { big: file } = photo;
        const isMe = isMeChat(chatId);

        return (
            <div className={classNames('media-viewer', 'media-viewer-default')}>
                <div className='media-viewer-footer'>
                    <ProfileMediaInfo chatId={chatId} date={getProfilePhotoDateHint(userProfilePhoto)} />
                    <MediaViewerFooterText
                        title={t('AttachPhoto')}
                        subtitle={totalCount && index >= 0 ? `${index + 1} of ${totalCount}` : null}
                    />
                    <MediaViewerDownloadButton title={t('Save')} fileId={file.id} onClick={this.handleSave} />
                    <MediaViewerDownloadButton title={t('Forward')} fileId={file.id} onClick={this.handleForward}>
                        <ReplyIcon />
                    </MediaViewerDownloadButton>
                    {isMe && (
                        <MediaViewerFooterButton title={t('Delete')} onClick={this.handleDelete}>
                            <DeleteIcon />
                        </MediaViewerFooterButton>
                    )}
                    <MediaViewerFooterButton title={t('Close')} onClick={this.handleClose}>
                        <CloseIcon />
                    </MediaViewerFooterButton>
                </div>
                <div className='media-viewer-wrapper' onClick={this.handlePrevious}>
                    <div className='media-viewer-left-column'>
                        <MediaViewerButton disabled={!hasNextMedia} grow onClick={this.handleNext}>
                            <NavigateBeforeIcon />
                        </MediaViewerButton>
                    </div>

                    <div className='media-viewer-content-column'>
                        <ProfileMediaViewerContent chatId={chatId} photo={photo} onClose={this.handleClose} onPrevious={this.handlePrevious}/>
                    </div>

                    <div className='media-viewer-right-column'>
                        <MediaViewerButton disabled={!hasPreviousMedia} grow onClick={this.handlePrevious}>
                            <NavigateBeforeIcon style={{ transform: 'rotate(180deg)' }} />
                        </MediaViewerButton>
                    </div>
                </div>
            </div>
        );
    }
}

ProfileMediaViewer.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default withTranslation()(ProfileMediaViewer);
