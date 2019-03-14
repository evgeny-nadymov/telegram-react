/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import FileStore from '../../Stores/FileStore';
import './DocumentTile.css';
import PropTypes from 'prop-types';
import { getSrc } from '../../Utils/File';

const styles = theme => ({
    documentTileBackground: {
        background: theme.palette.primary.main,
        borderRadius: '50%',
        width: 48,
        height: 48
    }
});

class DocumentTile extends React.Component {
    componentDidMount() {
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    onClientUpdateDocumentThumbnailBlob = update => {
        const { thumbnail } = this.props;
        if (!thumbnail) return;

        const file = thumbnail.photo;
        if (!file) return;

        const { fileId } = update;

        if (file.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { classes, thumbnail } = this.props;

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const className = classNames('tile-photo', { 'document-tile-background': !thumbnailSrc });

        return thumbnailSrc ? (
            <img className={className} src={thumbnailSrc} draggable={false} alt='' />
        ) : (
            <div className={classes.documentTileBackground} />
        );
    }
}

DocumentTile.propTypes = {
    thumbnail: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(DocumentTile);
