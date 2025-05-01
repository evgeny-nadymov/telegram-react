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
import { THUMBNAIL_BLURRED_SIZE_90 } from '../../Constants';

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

        const { photo } = photoSize;
        if (!photo) return;

        if (update.chatId === chatId && update.messageId === messageId && update.fileId === photo.id) {
            this.forceUpdate();
        }
    };

    render() {
        const { chatId, messageId, photoSize, minithumbnail } = this.props;
        if (!photoSize) return null;

        const { photo } = photoSize;
        if (!photo) return null;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const src = getSrc(photo);
        const isBlurred = (!src && miniSrc) || isBlurredThumbnail(photoSize, THUMBNAIL_BLURRED_SIZE_90);
        const isVideoNote = hasVideoNote(chatId, messageId);
        const hasSrc = Boolean(src || miniSrc);

        return (
            <div className='reply-tile'>
                {hasSrc && (
                    <img
                        className={classNames(
                            'reply-tile-photo',
                            { 'reply-tile-photo-round': isVideoNote },
                            { 'reply-tile-photo-loading': !src },
                            { 'media-blurred': src && isBlurred },
                            { 'media-mini-blurred': !src && miniSrc && isBlurred }
                        )}
                        draggable={false}
                        src={src || miniSrc}
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
    minithumbnail: PropTypes.object
};

export default ReplyTile;
