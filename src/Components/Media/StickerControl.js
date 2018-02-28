import React from 'react';
import './StickerControl.css';
import ChatStore from "../../Stores/ChatStore";
import {getFitSize} from "../../Utils/Common";

class StickerControl extends React.Component {
    constructor(props){
        super(props);

        this.onStickerUpdated = this.onStickerUpdated.bind(this);
    }

    /*shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chat !== this.props.chat){
            return true;
        }

        return false;
    }*/

    componentWillMount(){
        ChatStore.on("message_sticker_changed", this.onStickerUpdated)
    }

    onStickerUpdated(payload) {
        if (this.props.message && this.props.message.id === payload.messageId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        ChatStore.removeListener("message_sticker_changed", this.onStickerUpdated);
    }

    render() {
        let file = this.props.message.content.sticker.sticker;
        if (!file) return null;

        let size = {
            width: this.props.message.content.sticker.width,
            height: this.props.message.content.sticker.height
        };

        let fitSize = getFitSize(size, 192);

        return file.blob !== undefined ?
            (<img className='sticker-img' width={fitSize.width} height={fitSize.height} src={URL.createObjectURL(file.blob)} alt=""></img>) :
            (<img className='sticker-img' width={fitSize.width} height={fitSize.height} src="" alt=""></img>);
    }
}

export default StickerControl;