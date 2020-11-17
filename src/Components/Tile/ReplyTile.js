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
import { THUMBNAIL_BLURRED_SIZE_40, THUMBNAIL_BLURRED_SIZE_90 } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import './ReplyTile.css';

class ReplyTile extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateAnimationThumbnailBlob', this.onClientUpdateBlob);
        FileStore.on('clientUpdateAudioThumbnailBlob', this.onClientUpdateBlob);
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateBlob);
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdateBlob);
        FileStore.on('clientUpdateStickerThumbnailBlob', this.onClientUpdateBlob);
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateBlob);
        FileStore.on('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateAnimationThumbnailBlob', this.onClientUpdateBlob);
        FileStore.off('clientUpdateAudioThumbnailBlob', this.onClientUpdateBlob);
        FileStore.off('clientUpdateDocumentThumbnailBlob', this.onClientUpdateBlob);
        FileStore.off('clientUpdatePhotoBlob', this.onClientUpdateBlob);
        FileStore.off('clientUpdateStickerThumbnailBlob', this.onClientUpdateBlob);
        FileStore.off('clientUpdateVideoThumbnailBlob', this.onClientUpdateBlob);
        FileStore.off('clientUpdateVideoNoteThumbnailBlob', this.onClientUpdateBlob);
    }

    onClientUpdateBlob = update => {
        const { chatId, messageId, thumbnail } = this.props;
        if (!thumbnail) return;

        const file = thumbnail.photo || thumbnail.file;
        if (!file) return;

        if (update.chatId === chatId && update.messageId === messageId && update.fileId === file.id) {
            this.forceUpdate();
        }
    };

    render() {
        const { chatId, messageId, thumbnail, minithumbnail, onClick } = this.props;
        if (!thumbnail) return null;

        const file = thumbnail.photo || thumbnail.file;
        if (!file) return null;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const src = getSrc(file);
        const isBlurred = isBlurredThumbnail(thumbnail, THUMBNAIL_BLURRED_SIZE_90, THUMBNAIL_BLURRED_SIZE_40);
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
    minithumbnail: PropTypes.object,
    thumbnail: PropTypes.object,
    onClick: PropTypes.func
};

export default ReplyTile;
