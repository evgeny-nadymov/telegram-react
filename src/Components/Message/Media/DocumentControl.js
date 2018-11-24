/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import DocumentTileControl from '../../Tile/DocumentTileControl';
import FileStore from '../../../Stores/FileStore';
import './DocumentControl.css';

const circleStyle = { circle: 'document-progress-circle' };

class DocumentControl extends React.Component {

    constructor(props){
        super(props);
    }

    componentWillMount(){
        this.mount = true;
        FileStore.on('file_update', this.onProgressUpdated);
        FileStore.on('file_upload_update', this.onProgressUpdated);
    }

    componentWillUnmount(){
        FileStore.removeListener('file_upload_update', this.onProgressUpdated);
        FileStore.removeListener('file_update', this.onProgressUpdated);
        this.mount = false;
    }

    onProgressUpdated = (payload) => {
        if (this.props.message
            && this.props.message.content
            && this.props.message.content.document
            && this.props.message.content.document.document
            && this.props.message.content.document.document.id === payload.id){
            this.props.message.content.document.document = payload;
            this.payload = payload;
            this.forceUpdate();
        }
    };

    getSizeString(size){
        if (!size) return `0 B`;

        if (size < 1024){
            return `${size} B`;
        }

        if (size < 1024 * 1024){
            return `${(size / 1024).toFixed(1)} KB`;
        }

        if (size < 1024 * 1024 * 1024){
            return `${(size / 1024 / 1024).toFixed(1)} MB`;
        }

        return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
    }

    getSize(file){
        if (!file) return null;

        let size = file.size;
        if (!size) return null;

        return this.getSizeString(size);
    }

    getDownloadedSize(file){
        if (!file) return '0';
        if (!file.local) return '0';
        if (!file.local.is_downloading_active) return '0';

        return this.getSizeString(file.local.downloaded_size);
    }

    getUploadedSize(file){
        if (!file) return '0';
        if (!file.remote) return '0';
        if (!file.remote.is_uploading_active) return '0';

        return this.getSizeString(file.remote.uploaded_size);
    }

    render() {
        let message = this.props.message;
        if (!message) return null;

        let document = message.content.document;
        if (!document) return null;

        let file = document.document;
        if (!file) return null;

        let isDownloadingActive = file.local && file.local.is_downloading_active;
        let isUploadingActive = file.remote && file.remote.is_uploading_active;
        let isDownloadingCompleted = file.local && file.local.is_downloading_completed;
        let isUploadingCompleted = file.remote && file.remote.is_uploading_completed;

        let size = this.getSize(file);
        let progressSize = null;
        if (isDownloadingActive){
            progressSize = this.getDownloadedSize(file);
        }
        else if (isUploadingActive){
            progressSize = this.getUploadedSize(file);
        }

        let progress = 0;
        if (isDownloadingActive){
            progress = file.local.downloaded_size && file.size && this.isDownloadingActive
                ? 100 - (file.size - file.local.downloaded_size) / file.size * 100
                : 1;
        }
        else if (isUploadingActive){
            progress = file.remote.uploaded_size && file.size && this.isUploadingActive
                ? 100 - (file.size - file.remote.uploaded_size) / file.size * 100
                : 1;
        }

        let showProgress = isDownloadingActive || isUploadingActive;

        let timeToCompleteAnimation = 300;
        if (this.isDownloadingActive && !isDownloadingActive){
            progress = isDownloadingCompleted ? 100 : 0;
            showProgress = true;
            setTimeout(() =>{
                if (!this.mount) return;

                this.forceUpdate();
            }, timeToCompleteAnimation);
        }
        else if (this.isUploadingActive && !isUploadingActive){
            progress = isUploadingCompleted ? 100 : 0;
            showProgress = true;
            setTimeout(() =>{
                if (!this.mount) return;

                this.forceUpdate();
            }, timeToCompleteAnimation);
        }

        console.log('updateFile progress=' + progress + ' show_progress=' + showProgress + ' payload=' + this.payload);

        this.isDownloadingActive = isDownloadingActive;
        this.isUploadingActive = isUploadingActive;

        let sizeString = progressSize ? `${progressSize}/${size}` : `${size}`;
        let action = isDownloadingActive || isUploadingActive ? 'Cancel' : isDownloadingCompleted || file.idb_key ? 'Open' : '';
        return (
            <div className='document'>
                <div className='document-tile' onClick={this.props.openMedia}>
                    <DocumentTileControl document={document} showProgress={showProgress}/>
                    {showProgress &&
                        <div className='document-progress'>
                            <CircularProgress classes={circleStyle} variant='static' value={progress} size={42} thickness={3} />
                        </div>
                    }
                    {/*<CircularProgress classes={circleStyle} variant='static' value={10} size={42} thickness={3} />*/}
                </div>

                <div className='document-content'>
                    <div className='document-title'>
                        <a className='document-name' onClick={this.props.openMedia} title={document.file_name} data-name={document.file_name} data-ext=".dat">{document.file_name}</a>
                    </div>
                    <div className='document-action'>
                        <span className='document-size'>{`${sizeString} `}</span>
                        {action && <a onClick={this.props.openMedia}>{action}</a>}
                    </div>
                </div>
            </div>
        );
    }
}

DocumentControl.propTypes = {
    message : PropTypes.object.isRequired,
    openMedia : PropTypes.func.isRequired
};

export default DocumentControl;