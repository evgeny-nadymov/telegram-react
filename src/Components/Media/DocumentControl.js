import React from 'react';
import PropTypes from 'prop-types';
import './DocumentControl.css';
import DocumentTileControl from '../DocumentTileControl';
import FileController from '../../Controllers/FileController';

class DocumentControl extends React.Component {

    constructor(props){
        super(props);
        this.onProgressUpdated = this.onProgressUpdated.bind(this);
    }

    componentWillMount(){
        FileController.on('file_update', this.onProgressUpdated);
        FileController.on('file_upload_update', this.onProgressUpdated);
    }

    onProgressUpdated(payload) {
        if (this.props.message
            && this.props.message.content
            && this.props.message.content.document
            && this.props.message.content.document.document
            && this.props.message.content.document.document.id === payload.id){
            this.props.message.content.document.document = payload;
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        FileController.removeListener('file_upload_update', this.onProgressUpdated);
        FileController.removeListener('file_update', this.onProgressUpdated);
    }

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

        let size = this.getSize(file);
        let progressSize = null;
        if (isDownloadingActive){
            progressSize = this.getDownloadedSize(file);
        }
        else if (isUploadingActive){
            progressSize = this.getUploadedSize(file);
        }

        let sizeString = progressSize ? `${progressSize}/${size}` : `${size}`;

        return (
            <div className='document'>
                <div className='document-tile'>
                    <DocumentTileControl document={document}/>
                </div>
                <div className='document-content'>
                    <div className='document-title'>
                        <a className='document-name' onClick={this.props.openMedia} title={document.file_name}>{document.file_name}</a>

                    </div>
                    <div className='document-action'>
                        <span className='document-size'>{`${sizeString} `}</span>
                        {isDownloadingCompleted && <a onClick={this.props.openMedia}>Open</a>}
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