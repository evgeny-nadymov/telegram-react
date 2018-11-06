/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {PropTypes} from 'react';
import './DocumentTileControl.css';
import MessageStore from '../Stores/MessageStore';

class DocumentTileControl extends React.Component {
    constructor(props){
        super(props);

        this.onPhotoUpdated = this.onPhotoUpdated.bind(this);
    }

     shouldComponentUpdate(nextProps, nextState){
    //     if (nextProps.document !== this.props.document
    //         || nextProps.document.document !== this.props.document.document
    //         ){
    //         return true;
    //     }

        return true;
    }

    componentWillMount(){
        MessageStore.on('message_document_thumbnail_changed', this.onPhotoUpdated);
    }

    onPhotoUpdated(payload) {
        if (this.props.document
            && this.props.document.thumbnail
            && this.props.document.thumbnail.photo
            && this.props.document.thumbnail.photo.id === payload.fileId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        MessageStore.removeListener('message_document_thumbnail_changed', this.onPhotoUpdated);
    }


    render() {
        const document = this.props.document;
        if (!document) return null;

        let blob =
            document.thumbnail
            && document.thumbnail.photo
            && document.thumbnail.photo.blob? document.thumbnail.photo.blob : null;

        let iconClassName =
            document.document && document.document.idb_key
            || document.document.local && document.document.local.is_downloading_completed
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

        let photoClasses = 'tile-photo';
        if (!blob){
            photoClasses += ` document-tile-background`;
        }

        return src ?
            (<img className={photoClasses} src={src} draggable={false} alt=''/>) :
            (<div className={photoClasses}>
                { !this.props.showProgress && <i className={iconClassName}/> }
                {
                    this.props.showProgress &&
                    <svg className='document-tile-cancel'>
                        <line x1='2' y1='2' x2='16' y2='16' className='document-tile-cancel-line'/>
                        <line x1='2' y1='16' x2='16' y2='2' className='document-tile-cancel-line'/>
                    </svg>
                }
            </div>);
    }
}

export default DocumentTileControl;