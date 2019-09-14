/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Document from '../../Message/Media/Document';
import RichText from './RichText';
import ArrowDownwardIcon from '@material-ui/core/SvgIcon/SvgIcon';
import DocumentTile from '../../Tile/DocumentTile';

function Icon(props) {
    const { document, height, width } = props;
    if (!document) return null;

    const { thumbnail, document: file } = document;

    return <DocumentTile thumbnail={thumbnail} file={file} width={width} height={height} />;
}

Icon.propTypes = {
    document: PropTypes.object.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired
};

export default Icon;
