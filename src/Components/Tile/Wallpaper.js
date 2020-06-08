/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getSrc } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';
import './Wallpaper.css';
import FileProgress from '../Viewer/FileProgress';

class Wallpaper extends React.Component {
    state = {
        loaded: false
    };

    componentDidMount() {
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    onClientUpdateDocumentThumbnailBlob = update => {
        const { wallpaper } = this.props;
        if (!wallpaper) return;

        const { document } = wallpaper;
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

    handleLoad = () => {
        this.setState({ loaded: true });
    };

    handleClick = () => {
        const { wallpaper, onClick } = this.props;

        if (onClick) {
            onClick(wallpaper);
        }
    };

    render() {
        const { wallpaper, isSelected } = this.props;
        const { loaded  } = this.state;

        const { document } = wallpaper;
        const { minithumbnail, thumbnail } = document;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbSrc = getSrc(thumbnail ? thumbnail.file : null);
        const tileLoaded = thumbSrc && loaded;
        const src = thumbSrc || miniSrc;

        return (
            <div className='shared-photo' onClick={this.handleClick}>
                <div className='shared-photo-content' style={{ backgroundImage: `url(${thumbSrc || miniSrc})`, backgroundSize: 'cover', backgroundPosition: '50%' }}>
                    {src !== thumbSrc && (
                        <div className='shared-photo-main-content' style={{ backgroundImage: `url(${src})` }} />
                    )}
                </div>
                { isSelected && <><div className='wallpaper-selected'/><div className='wallpaper-selected-inner'/></> }
                { document && document.document && <FileProgress file={document.document} cancelButton={false}/> }
            </div>
        );
    }

}

Wallpaper.propTypes = {
    wallpaper: PropTypes.object.isRequired,
    isSelected: PropTypes.bool
};

export default Wallpaper;