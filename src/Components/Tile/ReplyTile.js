/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getSrc } from '../../Utils/File';
import { isBlurredThumbnail } from '../../Utils/Media';
import { hasVideoNote } from '../../Utils/Message';
import FileStore from '../../Stores/FileStore';
import './ReplyTile.css';

class ReplyTile extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateAnimationThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.on('clientUpdateAudioThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        FileStore.on('clientUpdateStickerThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.on('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdatePhotoBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateAnimationThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.removeListener('clientUpdateAudioThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.removeListener('clientUpdateDocumentThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        FileStore.removeListener('clientUpdateStickerThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.removeListener('clientUpdateVideoThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.removeListener('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdatePhotoBlob);
    }

    onClientUpdatePhotoBlob = update => {
        const { chatId, messageId, photoSize } = this.props;
        if (!photoSize) return;

        const { photo } = photoSize;
        if (!photo) return;

        if (update.chatId === chatId && update.messageId === messageId && update.fileId === photo.id) {
            this.forceUpdate();
        }
    };

    render() {
        const { chatId, messageId, photoSize } = this.props;
        if (!photoSize) return null;

        const { photo } = photoSize;
        if (!photo) return null;

        const src = getSrc(photo);
        const isBlurred = isBlurredThumbnail(photo);
        const isVideoNote = hasVideoNote(chatId, messageId);

        return (
            <div className='reply-tile'>
                <img
                    className={classNames(
                        'reply-tile-photo',
                        { 'reply-tile-photo-round': isVideoNote },
                        { 'reply-tile-photo-loading': !src },
                        { 'media-blurred': isBlurred }
                    )}
                    draggable={false}
                    src={src}
                    alt=''
                />
            </div>
        );
    }
}

ReplyTile.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    photoSize: PropTypes.object.isRequired
};

export default ReplyTile;
