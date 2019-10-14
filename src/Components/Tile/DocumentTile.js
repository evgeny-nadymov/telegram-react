/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import FileProgress from '../../Components/Viewer/FileProgress';
import { getSrc } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';
import './DocumentTile.css';

const styles = theme => ({
    background: {
        background: theme.palette.primary.main,
        borderRadius: '50%',
        width: 48,
        height: 48
    }
});

class DocumentTile extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loaded: false
        };
    }

    componentDidMount() {
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
        FileStore.on('clientUpdateAudioThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
        FileStore.removeListener('clientUpdateAudioThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    onClientUpdateDocumentThumbnailBlob = update => {
        const { thumbnail } = this.props;
        if (!thumbnail) return;

        const file = thumbnail.photo;
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
        const { classes, thumbnail, file, icon, completeIcon, openMedia } = this.props;
        const { loaded } = this.state;

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const tileLoaded = thumbnailSrc && loaded;

        return (
            <div
                className={classNames('document-tile', { 'document-tile-background': !thumbnailSrc })}
                onClick={openMedia}>
                {!tileLoaded && <div className={classes.background} />}
                {thumbnailSrc && (
                    <img className='tile-photo' src={thumbnailSrc} onLoad={this.handleLoad} draggable={false} alt='' />
                )}
                {file && (
                    <FileProgress
                        file={file}
                        thumbnailSrc={thumbnailSrc}
                        download
                        upload
                        cancelButton
                        zIndex={1}
                        icon={icon}
                        completeIcon={completeIcon}
                    />
                )}
            </div>
        );
    }
}

DocumentTile.propTypes = {
    thumbnail: PropTypes.object,
    file: PropTypes.object,
    openMedia: PropTypes.func,
    icon: PropTypes.node,
    completeIcon: PropTypes.node
};

export default withStyles(styles, { withTheme: true })(DocumentTile);
