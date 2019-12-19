import React from 'react';
import PropTypes from 'prop-types';
import FileProgress from './FileProgress';
import { getChatUserId } from '../../Utils/Chat';
import { PROFILE_PHOTO_BIG_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import './ProfileMediaViewer.css';

class ProfileMediaViewerContent extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, photo } = this.props;

        let { big: file } = photo;
        file = FileStore.get(file.id) || file;

        this.state = {
            prevChatId: chatId,
            prevPhoto: photo,
            width: PROFILE_PHOTO_BIG_SIZE,
            height: PROFILE_PHOTO_BIG_SIZE,
            file: file
        };
    }

    static getDerivedStateFromProps(props, state) {
        const { chatId, photo } = props;

        if (chatId !== state.prevChatId || photo !== state.prevPhoto) {
            return {
                prevChatId: chatId,
                prevPhoto: photo,
                width: PROFILE_PHOTO_BIG_SIZE,
                height: PROFILE_PHOTO_BIG_SIZE,
                file: photo.big
            };
        }

        return null;
    }

    componentDidMount() {
        FileStore.on('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        FileStore.on('clientUpdateUserBlob', this.onClientUpdateUserBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        FileStore.off('clientUpdateUserBlob', this.onClientUpdateUserBlob);
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

        const blob = FileStore.getBlob(file.id) || file.blob;
        const src = FileStore.getBlobUrl(blob);

        return (
            <div className='media-viewer-content'>
                <img className='media-viewer-content-image' src={src} alt='' onClick={this.handleContentClick} />
                <FileProgress file={file} />
            </div>
        );
    }
}

ProfileMediaViewerContent.propTypes = {
    chatId: PropTypes.number.isRequired,
    photo: PropTypes.object.isRequired
};

export default ProfileMediaViewerContent;
