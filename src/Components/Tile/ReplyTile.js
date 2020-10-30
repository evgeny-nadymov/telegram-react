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
import { THUMBNAIL_BLURRED_SIZE_90 } from '../../Constants';
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
        FileStore.off('clientUpdateAnimationThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.off('clientUpdateAudioThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.off('clientUpdateDocumentThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.off('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        FileStore.off('clientUpdateStickerThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.off('clientUpdateVideoThumbnailBlob', this.onClientUpdatePhotoBlob);
        FileStore.off('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdatePhotoBlob);
    }

    onClientUpdatePhotoBlob = update => {
        const { chatId, messageId, photoSize } = this.props;
        if (!photoSize) return;

        const photo = photoSize.photo || photoSize.file;
        if (!photo) return;

        if (update.chatId === chatId && update.messageId === messageId && update.fileId === photo.id) {
            this.forceUpdate();
        }
    };

    render() {
        const { chatId, messageId, photoSize, minithumbnail, onClick } = this.props;
        if (!photoSize) return null;

        const photo = photoSize.photo || photoSize.file;
        if (!photo) return null;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const src = getSrc(photo);
        const isBlurred = isBlurredThumbnail(photoSize, THUMBNAIL_BLURRED_SIZE_90);
        const isVideoNote = hasVideoNote(chatId, messageId);

        return (
            <div className='reply-tile' onClick={onClick}>
                {miniSrc && (
                    <img
                        className={classNames(
                            'reply-tile-photo',
                            { 'reply-tile-photo-round': isVideoNote },
                            { 'media-mini-blurred': true }
                        )}
                        draggable={false}
                        src={miniSrc}
                        alt=''
                    />
                )}
                {src && (
                    <img
                        className={classNames(
                            'reply-tile-photo',
                            { 'reply-tile-photo-round': isVideoNote },
                            { 'media-blurred': src && isBlurred }
                        )}
                        draggable={false}
                        src={src}
                        alt=''
                    />
                )}
            </div>
        );
    }
}

ReplyTile.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    photoSize: PropTypes.object,
    minithumbnail: PropTypes.object,
    onClick: PropTypes.func
};

export default ReplyTile;
