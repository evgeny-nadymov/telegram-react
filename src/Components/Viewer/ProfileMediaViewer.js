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
import {
  getPhotoFromChat,
  getChatUserId,
  isPrivateChat
} from '../../Utils/Chat';
import {
  loadProfileMediaViewerContent,
  saveOrDownload
} from '../../Utils/File';
import { getSize } from '../../Utils/Common';
import { MEDIA_SLICE_LIMIT, PHOTO_BIG_SIZE } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import MessageStore from '../../Stores/MessageStore';
import FileStore from '../../Stores/FileStore';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';
import './ProfileMediaViewer.css';

class ProfileMediaViewer extends React.Component {
  constructor(props) {
    super(props);

    this.history = [];

    const { chatId, fileId } = this.props;

    this.state = {
      prevChatId: chatId,
      prevFileId: fileId,
      currentFileId: fileId,
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
    // MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
    // MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
    // MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.onKeyDown, false);
    // MessageStore.removeListener('updateDeleteMessages', this.onUpdateDeleteMessages);
    // MessageStore.removeListener('updateNewMessage', this.onUpdateNewMessage);
    // MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent);
  }

  onKeyDown = event => {
    if (event.keyCode === 27) {
      const { deleteConfirmationOpened } = this.state;
      if (deleteConfirmationOpened) return;

      this.handleClose();
    } else if (event.keyCode === 39) {
      // this.handleNext();
    } else if (event.keyCode === 37) {
      // this.handlePrevious();
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

    //filterMessages(result, this.history);
    //MessageStore.setItems(result.messages);

    this.history = result.photos;
    this.firstSliceLoaded = result.photos.length === 0;

    const { currentMessageId } = this.state;
    const index = this.history.findIndex(x => x.id === currentMessageId);

    this.setState({
      hasNextMedia: this.hasNextMedia(index),
      hasPreviousMedia: this.hasPreviousMedia(index)
    });

    //preloadProfileMediaViewerContent(index, this.history);
  };

  hasPreviousMedia = index => {
    if (index === -1) return false;

    const nextIndex = index + 1;
    return nextIndex < this.history.length;
  };

  hasNextMedia = index => {
    if (index === -1) return false;

    const nextIndex = index - 1;
    return nextIndex >= 0;
  };

  handleClose = () => {
    ApplicationStore.setProfileMediaViewerContent(null);
  };

  handleSave = () => {
    const { chatId } = this.props;
    const { currentMessageId } = this.state;

    const chat = ChatStore.get(chatId);
    if (!chat) return;

    const photo = getPhotoFromChat(chatId);
    if (!photo) return;
    if (!photo.big) return;

    const file = photo.big;
    if (!file) return;

    saveOrDownload(file, file.id + '.jpg', chat);
  };

  handleForward = () => {};

  handleDelete = () => {
    return;
    this.handleDialogOpen();
    return;

    const { chatId, messageId } = this.props;
    const { currentMessageId } = this.state;

    const message = MessageStore.get(chatId, currentMessageId);
    if (!message) return;
    if (!message.content) return;

    const { photo } = message.content;
    if (photo) {
      const photoSize = getSize(photo.sizes, PHOTO_BIG_SIZE);
      if (photoSize) {
        let file = photoSize.photo;
        file = FileStore.get(file.id) || file;
        if (file) {
          const store = FileStore.getReadWriteStore();

          FileStore.deleteLocalFile(store, file);
        }
      }
    }
  };

  render() {
    const { chatId } = this.props;
    const {
      currentMessageId,
      hasNextMedia,
      hasPreviousMedia,
      firstSliceLoaded,
      totalCount,
      deleteConfirmationOpened,
      deleteForAll
    } = this.state;

    let index = -1;
    if (totalCount && firstSliceLoaded) {
      index = this.history.findIndex(x => x.id === currentMessageId);
    }

    // const message = MessageStore.get(chatId, currentMessageId);
    // const {
    // 	can_be_forwarded,
    // 	can_be_deleted_only_for_self,
    // 	can_be_deleted_for_all_users
    // } = message;

    // const canBeDeleted = can_be_deleted_only_for_self || can_be_deleted_for_all_users;
    // const canBeForwarded = can_be_forwarded;

    const deleteConfirmation = null;
    const photo = getPhotoFromChat(chatId);
    return (
      <div className="media-viewer">
        {deleteConfirmation}
        <div className="media-viewer-wrapper" onClick={this.handlePrevious}>
          <div className="media-viewer-left-column">
            <div className="media-viewer-button-placeholder" />
            <MediaViewerButton
              disabled={!hasPreviousMedia}
              grow
              onClick={this.handlePrevious}
            >
              <div className="media-viewer-previous-icon" />
            </MediaViewerButton>
          </div>

          <div className="media-viewer-content-column">
            <ProfileMediaViewerContent chatId={chatId} photo={photo} />
          </div>

          <div className="media-viewer-right-column">
            <MediaViewerButton onClick={this.handleClose}>
              <div className="media-viewer-close-icon" />
            </MediaViewerButton>
            <MediaViewerButton
              disabled={!hasNextMedia}
              grow
              onClick={this.handleNext}
            >
              <div className="media-viewer-next-icon" />
            </MediaViewerButton>
          </div>
        </div>
        <div className="media-viewer-footer">
          <MediaViewerFooterText
            title="Photo"
            subtitle={
              totalCount && index >= 0
                ? `${totalCount - index} of ${totalCount}`
                : null
            }
          />
          <MediaViewerFooterButton title="Save" onClick={this.handleSave}>
            <div className="media-viewer-save-icon" />
          </MediaViewerFooterButton>
          <MediaViewerFooterButton
            title="Forward"
            disabled={true}
            onClick={this.handleForward}
          >
            <div className="media-viewer-forward-icon" />
          </MediaViewerFooterButton>
          <MediaViewerFooterButton
            title="Delete"
            disabled={true}
            onClick={this.handleDelete}
          >
            <div className="media-viewer-delete-icon" />
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
