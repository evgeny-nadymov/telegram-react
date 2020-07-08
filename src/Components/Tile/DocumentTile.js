/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import FileProgress from '../../Components/Viewer/FileProgress';
import { getSrc } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';
import './DocumentTile.css';

class DocumentTile extends React.Component {
    state = {
        loaded: false
    };

    componentDidMount() {
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
        FileStore.on('clientUpdateAudioThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
        FileStore.off('clientUpdateAudioThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    onClientUpdateDocumentThumbnailBlob = update => {
        const { thumbnail } = this.props;

        if (!thumbnail) return;

        const { file } = thumbnail;
        if (!file) return;

        const { fileId } = update;

        if (file.id !== fileId) {
            return;
        }

        this.forceUpdate();
    };

    handleLoad = () => {
        this.setState({ loaded: true });
    };

    render() {
        const { minithumbnail, thumbnail, file, icon, completeIcon, openMedia, streaming } = this.props;
        const { loaded } = this.state;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbnailSrc = getSrc(thumbnail ? thumbnail.file : null);
        const tileLoaded = thumbnailSrc && loaded;
        const src = thumbnailSrc || miniSrc;

        return (
            <div
                className={classNames('document-tile', { 'document-tile-image': !src }, { pointer: openMedia })}
                onClick={openMedia}>
                {file && (
                    <FileProgress
                        file={file}
                        thumbnailSrc={src}
                        download={!streaming}
                        upload
                        cancelButton
                        zIndex={1}
                        icon={icon}
                        completeIcon={typeof completeIcon === 'function' ? completeIcon(src) : completeIcon}
                    />
                )}
                {src && <img className='tile-photo' src={src} onLoad={this.handleLoad} draggable={false} alt='' />}
                {!tileLoaded && <div className='document-tile-background' />}
            </div>
        );
    }
}

DocumentTile.defaultProps = {
    streaming: false
};

DocumentTile.propTypes = {
    minithumbnail: PropTypes.object,
    thumbnail: PropTypes.object,
    file: PropTypes.object,
    openMedia: PropTypes.func,
    icon: PropTypes.node,
    completeIcon: PropTypes.oneOfType([PropTypes.node, PropTypes.func])
};

export default DocumentTile;
