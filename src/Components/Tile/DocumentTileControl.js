/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import FileStore from '../../Stores/FileStore';
import './DocumentTileControl.css';

class DocumentTileControl extends React.Component {
    constructor(props){
        super(props);
    }

    componentDidMount(){
        FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    componentWillUnmount(){
        FileStore.removeListener('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
    }

    onClientUpdateDocumentThumbnailBlob = (update) => {
        const { document } = this.props;
        if (!document) return;

        const { thumbnail } = document;
        if (!thumbnail) return;

        const file = thumbnail.photo;
        if (!file) return;

        const { fileId } = update;

        if (file.id === fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { document, showProgress } = this.props;
        if (!document) return null;

        const { thumbnail } = document;

        const blob = thumbnail && thumbnail.photo? thumbnail.photo.blob : null;

        const file = document.document;

        let iconClassName = file && file.idb_key || file.local && file.local.is_downloading_completed
            ? 'document-tile-save-icon'
            : 'document-tile-download-icon';

        //console.log('%c updateFile documentTileControl idb_key=' + document.document.idb_key, 'background: #222; color: #bada55');

        let src;
        try{
            src = blob ? URL.createObjectURL(blob) : null;
        }
        catch(error){
            console.log(`DocumentTileControl.render document_id=${document.id} with error ${error}`);
        }

        const className = classNames(
            'tile-photo',
            {'document-tile-background': !blob}
        );

        return src ?
            (<img className={className} src={src} draggable={false} alt=''/>) :
            (<div className={className}>
                { !showProgress && <i className={iconClassName}/> }
                {
                    showProgress &&
                    <svg className='document-tile-cancel'>
                        <line x1='2' y1='2' x2='16' y2='16' className='document-tile-cancel-line'/>
                        <line x1='2' y1='16' x2='16' y2='2' className='document-tile-cancel-line'/>
                    </svg>
                }
            </div>);
    }
}

export default DocumentTileControl;