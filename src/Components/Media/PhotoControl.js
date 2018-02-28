import React from 'react';
import './PhotoControl.css';
import ChatStore from "../../Stores/ChatStore";
import {getSize, getFitSize} from '../../Utils/Common';

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

    render() {
        const max = 260;

        let size = getSize(this.props.message.content.photo.sizes, max);
        if (!size) return null;

        let fitSize = getFitSize(size, max);
        if (!fitSize) return null;

        return size.blob !== undefined ?
            (<img className='photo-img' width={fitSize.width} height={fitSize.height} src={URL.createObjectURL(size.blob)} alt=""></img>) :
            (<img className='photo-img' width={fitSize.width} height={fitSize.height} src="" alt=""></img>);
    }
}

export default PhotoControl;