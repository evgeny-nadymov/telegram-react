/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import DownloadIcon from '../../../Assets/Icons/Download';
import DocumentIcon from '../../../Assets/Icons/Document';
import DocumentTile from '../../Tile/DocumentTile';
import DocumentAction from './DocumentAction';
import { getExtension } from '../../../Utils/File';
import './Document.css';

class Document extends React.Component {
    render() {
        const { document, openMedia, width, height, meta, title, caption, date } = this.props;
        // console.log("props", this.props);
        if (!document) return null;

        const { minithumbnail, thumbnail, file_name } = document;
        const file = document.document;

        const style = width && height ? { width, height } : null;
        const completeIconFunc = thumb =>
            thumb ? null : (
                <div className='document-tile-complete-icon'>
                    <DocumentIcon className='document-tile-icon-fill' viewBox='0 0 54 54' />
                    <div className='document-tile-file-ext'>{getExtension(file_name)}</div>
                </div>
            );
        
            // console.log("Doc:", document);

        return (
            <div className={classNames('document', { 'media-title': title })} style={style}>
                <DocumentTile
                    minithumbnail={minithumbnail}
                    thumbnail={thumbnail}
                    file={file}
                    openMedia={openMedia}
                    icon={<DownloadIcon />}
                    completeIcon={completeIconFunc}
                />
                <div className='document-content'>
                    <div className='document-title'>
                        <a
                            className='document-name'
                            onClick={openMedia}
                            title={file_name}
                            data-name={file_name}
                            data-ext={'.' + getExtension(file_name)}>
                            {file_name}
                        </a>
                    </div>
                    <DocumentAction file={file} meta={caption ? null : meta} date={date} />
                </div>
            </div>
        );
    }
}

Document.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    document: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
    width: PropTypes.number,
    height: PropTypes.number,
    date: PropTypes.string
};

export default Document;
