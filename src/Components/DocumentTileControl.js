import React, {PropTypes} from 'react';
import './DocumentTileControl.css';
import MessageStore from '../Stores/MessageStore';

class DocumentTileControl extends React.Component {
    constructor(props){
        super(props);

        this.onPhotoUpdated = this.onPhotoUpdated.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chat !== this.props.chat){
            return true;
        }

        return false;
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
            (<div><img className={photoClasses} src={src} alt=''/></div>) :
            (<div className={photoClasses}><i className='document-tile-save-icon'/></div>);
    }
}

export default DocumentTileControl;