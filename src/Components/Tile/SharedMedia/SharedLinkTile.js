/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getSrc } from '../../../Utils/File';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { hasVideoNote } from '../../../Utils/Message';
import { THUMBNAIL_BLURRED_SIZE_90 } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './SharedLinkTile.css';

class SharedLinkTile extends React.Component {
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
        const { thumbnail } = this.props;
        if (!thumbnail) return;

        const file = thumbnail.file || thumbnail.photo;
        if (!file) return;

        if (update.fileId === file.id) {
            this.forceUpdate();
        }
    };

    render() {
        const { chatId, messageId, thumbnail, minithumbnail, title } = this.props;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const src = getSrc(thumbnail ? thumbnail.file || thumbnail.photo : null);
        const isBlurred = (!src && miniSrc) || isBlurredThumbnail(thumbnail, THUMBNAIL_BLURRED_SIZE_90);
        const isVideoNote = hasVideoNote(chatId, messageId);
        const hasSrc = Boolean(src || miniSrc);

        const tileColor = `tile_color_${(Math.abs(title.charCodeAt(0)) % 7) + 1}`;

        return (
            <div className={classNames('shared-link-tile', { [tileColor]: !hasSrc })}>
                {hasSrc? (
                    <img
                        className={classNames(
                            'shared-link-tile-photo',
                            { 'shared-link-tile-photo-round': isVideoNote },
                            { 'media-blurred': src && isBlurred },
                            { 'media-mini-blurred': !src && miniSrc && isBlurred }
                        )}
                        draggable={false}
                        src={src || miniSrc}
                        alt=''
                    />
                ) : (
                    <span>{title}</span>
                )}
            </div>
        );
    }
}

SharedLinkTile.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    minithumbnail: PropTypes.object,
    thumbnail: PropTypes.object,
    title: PropTypes.string
};

export default SharedLinkTile;
