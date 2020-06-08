/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getSrc } from '../../../Utils/File';
import FileStore from '../../../Stores/FileStore';

class Icon extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
        FileStore.on('clientUpdateDocumentBlob', this.onClientUpdateDocumentBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
        FileStore.off('clientUpdateDocumentBlob', this.onClientUpdateDocumentBlob);
    }

    onClientUpdateDocumentThumbnailBlob = update => {
        const { document } = this.props;
        if (!document) return;

        const { thumbnail } = document;
        if (!thumbnail) return;

        const { file } = thumbnail;
        if (!file) return;

        const { fileId } = update;

        if (file.id !== fileId) {
            return;
        }

        this.forceUpdate();
    };

    onClientUpdateDocumentBlob = update => {
        const { document } = this.props;
        if (!document) return;

        const file = document.document;
        if (!file) return;

        const { fileId } = update;

        if (file.id !== fileId) {
            return;
        }

        this.forceUpdate();
    };

    emptyPlaceholderSrc(width, height) {
        return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"%3E%3C/svg%3E`;
    }

    render() {
        const { document, height, width } = this.props;
        if (!document) return null;

        const { thumbnail, document: file } = document;
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.file : null);
        const src = getSrc(file);

        return (
            <img
                src={src || thumbnailSrc || this.emptyPlaceholderSrc(1, 1)}
                width={width > 0 ? width : null}
                height={height > 0 ? height : null}
                draggable={false}
                alt=''
            />
        );
    }
}

Icon.propTypes = {
    document: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired
};

export default Icon;
