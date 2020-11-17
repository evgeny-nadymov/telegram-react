/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
                file
            });
        }
    };

    onClientUpdateUserBlob = update => {
        const { chatId, photo } = this.props;
        const userId = getChatUserId(chatId);

        if (userId === update.userId && photo.big.id === update.fileId) {
            const file = FileStore.get(update.fileId) || this.state.file;
            this.setState({
                file
            });
        }
    };

    handleContentClick = event => {
        if (event) event.stopPropagation();

        const { onClose } = this.props;

        onClose && onClose(event);
    };

    handlePhotoClick = event => {
        if (event) event.stopPropagation();

        const { onPrevious } = this.props;

        onPrevious && onPrevious(event);
    };

    render() {
        const { file } = this.state;
        if (!file) return null;

        const blob = FileStore.getBlob(file.id) || file.blob;
        const src = FileStore.getBlobUrl(blob);

        return (
            <div className='media-viewer-content' onClick={this.handleContentClick} >
                <img className='media-viewer-content-image' src={src} alt='' onClick={this.handlePhotoClick}/>
                <FileProgress file={file} />
            </div>
        );
    }
}

ProfileMediaViewerContent.propTypes = {
    chatId: PropTypes.number.isRequired,
    photo: PropTypes.object.isRequired,

    onClose: PropTypes.func,
    onPrevious: PropTypes.func
};

export default ProfileMediaViewerContent;
