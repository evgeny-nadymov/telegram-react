import React from 'react';
import './PhotoControl.css';
import ChatStore from "../../Stores/ChatStore";

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
        ChatStore.on("message_photo_changed", this.onPhotoUpdated)
    }

    onPhotoUpdated(payload) {
        if (this.props.message && this.props.message.id === payload.messageId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        ChatStore.removeListener("message_photo_changed", this.onPhotoUpdated);
    }

    getSize(sizes, dimension){
        if (!sizes) return null;
        if (sizes.length === 0) return null;

        return sizes[0];
    }

    render() {
        let size = this.getSize(this.props.message.content.photo.sizes, 90);
        if (!size) return null;
        let width = size.width;
        let height = size.height;

        return size.blob !== undefined ?
            (<img className='photo-img' width={width} height={height} src={URL.createObjectURL(size.blob)} alt="" />) :
            (<img className='photo-img' width={width} height={height} alt="" />) ;
    }
}

export default PhotoControl;