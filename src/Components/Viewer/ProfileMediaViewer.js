/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ProfileMediaViewer.css';
import MediaViewerButton from './MediaViewerButton';
import MediaViewerContent from './MediaViewerContent';
import { PHOTO_BIG_SIZE } from '../../Constants';
import MediaViewerControl from '../Tile/MediaViewerControl';

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

  render() {
    return (
      <div className="media-viewer">
        {deleteConfirmation}
        <div className="media-viewer-wrapper" onClick={this.handlePrevious}>
          <div className="media-viewer-left-column">
            <div className="media-viewer-button-placeholder" />
            <MediaViewerButton
              disabled={!hasPreviousMedia}
              onClick={this.handlePrevious}
            >
              <div className="media-viewer-previous-icon" />
            </MediaViewerButton>
          </div>

          <div className="media-viewer-content-column">
            <MediaViewerContent
              chatId={chatId}
              messageId={currentMessageId}
              size={PHOTO_BIG_SIZE}
              onClick={this.handlePrevious}
            />
          </div>

          <div className="media-viewer-right-column">
            <div
              className="media-viewer-button-close"
              onClick={this.handleClose}
            >
              <div className="media-viewer-close-icon" />
            </div>
            <MediaViewerButton
              disabled={!hasNextMedia}
              onClick={this.handleNext}
            >
              <div className="media-viewer-next-icon" />
            </MediaViewerButton>
          </div>
        </div>
        <div className="media-viewer-footer">
          <MediaViewerControl chatId={chatId} messageId={currentMessageId} />
          <div className="media-viewer-footer-middle-column">
            <div className="media-viewer-footer-text">
              <span>Photo</span>
              {totalCount &&
                index >= 0 && (
                  <span>
                    &nbsp;
                    {totalCount - index} of {totalCount}
                  </span>
                )}
            </div>
          </div>
          <div className="media-viewer-footer-commands">
            <div
              className="media-viewer-button-save"
              title="Save"
              onClick={this.handleSave}
            >
              <div className="media-viewer-button-save-icon" />
            </div>
            <div
              className="media-viewer-button-forward"
              title="Forward"
              onClick={this.handleForward}
            >
              <div className="media-viewer-button-forward-icon" />
            </div>
            {canDeleteMedia && (
              <div
                className="media-viewer-button-delete"
                title="Delete"
                onClick={this.handleDelete}
              >
                <div className="media-viewer-button-delete-icon" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

ProfileMediaViewer.propTypes = {
  chatId: PropTypes.number.isRequired
};

export default ProfileMediaViewer;
