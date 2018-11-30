import React from 'react';
import PropTypes from 'prop-types';
import FileDownloadProgress from './FileDownloadProgress';
import FileStore from '../../Stores/FileStore';
import { getChatUserId } from '../../Utils/Chat';
import './ProfileMediaViewer.css';

class ProfileMediaViewerContent extends React.Component {
  constructor(props) {
    super(props);

    const { chatId, photo } = this.props;

    const file = photo.big;

    this.state = {
      prevChatId: chatId,
      prevPhoto: photo,
      width: 640,
      height: 640,
      file: file
    };
  }

  static getDerivedStateFromProps(props, state) {
    const { chatId, photo } = props;

    if (chatId !== state.prevChatId || photo !== state.prevPhoto) {
      return {
        prevChatId: chatId,
        prevPhoto: photo,
        width: 640,
        height: 640,
        file: photo.big
      };
    }

    return null;
  }

  componentDidMount() {
    FileStore.on('clientUpdateChatBlob', this.onClientUpdateChatBlob);
    FileStore.on('clientUpdatePhotoBlob', this.onClientUpdateUserBlob);
  }

  componentWillUnmount() {
    FileStore.removeListener(
      'clientUpdateChatBlob',
      this.onClientUpdateChatBlob
    );
    FileStore.removeListener(
      'clientUpdatePhotoBlob',
      this.onClientUpdateUserBlob
    );
  }

  onClientUpdateChatBlob = update => {
    const { chatId, photo } = this.props;

    if (chatId === update.chatId && photo.big.id === update.fileId) {
      const file = FileStore.get(update.fileId) || this.state.file;
      this.setState({
        file: file
      });
    }
  };

  onClientUpdateUserBlob = update => {
    const { chatId, photo } = this.props;
    const userId = getChatUserId(chatId);

    if (userId === update.userId && photo.big.id === update.fileId) {
      const file = FileStore.get(update.fileId) || this.state.file;
      this.setState({
        file: file
      });
    }
  };

  handleContentClick = event => {
    if (event) event.stopPropagation();

    this.props.onClick(event);
  };

  render() {
    const { width, height, file } = this.state;
    if (!file) return null;

    const latestFile = FileStore.get(file.id) || file;
    const blob = FileStore.getBlob(file.id) || file.blob;
    const src = FileStore.getBlobUrl(blob);

    return (
      <div className="media-viewer-content">
        <img
          className="media-viewer-content-image"
          src={src}
          alt=""
          onClick={this.handleContentClick}
        />
        {/*<img className='media-viewer-content-image-preview' src={previewSrc} alt='' />*/}
        <FileDownloadProgress file={latestFile} />
      </div>
    );
  }
}

ProfileMediaViewerContent.propTypes = {
  chatId: PropTypes.number.isRequired,
  photo: PropTypes.object.isRequired
};

export default ProfileMediaViewerContent;
