import React from 'react';
import PropTypes from 'prop-types';
import './PhotoControl.css';
import MessageStore from '../../Stores/MessageStore';
import {getSize, getFitSize} from '../../Utils/Common';
import {PHOTO_SIZE, PHOTO_DISPLAY_SIZE} from '../../Constants';

class PhotoControl extends React.Component {
    constructor(props){
        super(props);

        this.onPhotoUpdated = this.onPhotoUpdated.bind(this);
    }

    /*shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chat !== this.props.chat){
            return true;
        }

        return false;
    }*/

    componentWillMount(){
        MessageStore.on('message_photo_changed', this.onPhotoUpdated)
    }

    onPhotoUpdated(payload) {
        if (this.props.message && this.props.message.id === payload.messageId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        MessageStore.removeListener('message_photo_changed', this.onPhotoUpdated);
    }

    render() {
        let size = getSize(this.props.message.content.photo.sizes, PHOTO_SIZE);
        if (!size) return null;

        let fitSize = getFitSize(size, PHOTO_DISPLAY_SIZE);
        if (!fitSize) return null;

        let className = 'photo-img';
        let file = size.photo;
        let src = '';
        try{
            src = file && file.blob ? URL.createObjectURL(file.blob) : '';
        }
        catch(error){
            console.log(`PhotoControl.render photo with error ${error}`);
        }

        if (!file.blob && this.props.message.content.photo.sizes.length > 0)
        {
            let previewSize = this.props.message.content.photo.sizes[0];
            if (previewSize){
                let previewFile = previewSize.photo;
                if (previewFile && previewFile.blob){
                    className += ' photo-img-blur';
                    try{
                        src = previewFile && previewFile.blob ? URL.createObjectURL(previewFile.blob) : '';
                    }
                    catch(error){
                        console.log(`PhotoControl.render photo with error ${error}`);
                    }
                }
            }
        }

        return (
                <div className='photo-img-wrapper' style={{width: fitSize.width, height: fitSize.height}}>
                    <img className={className} width={fitSize.width} height={fitSize.height} src={src} alt=''/>
                </div>
            );
    }
}

PhotoControl.propTypes = {
    message : PropTypes.object.isRequired,
    openMedia : PropTypes.func.isRequired
};

export default PhotoControl;