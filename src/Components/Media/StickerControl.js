import React from 'react';
import PropTypes from 'prop-types';
import './StickerControl.css';
import MessageStore from "../../Stores/MessageStore";
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
        MessageStore.on('message_sticker_changed', this.onStickerUpdated);
    }

    onStickerUpdated(payload) {
        if (this.props.message && this.props.message.id === payload.messageId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        MessageStore.removeListener('message_sticker_changed', this.onStickerUpdated);
    }

    render() {
        let file = this.props.message.content.sticker.sticker;
        if (!file) return null;

        let size = {
            width: this.props.message.content.sticker.width,
            height: this.props.message.content.sticker.height
        };

        let fitSize = getFitSize(size, 192);
        let src = '';
        try{
            src = file.blob ? URL.createObjectURL(file.blob) : '';
        }
        catch(error){
            console.log(`StickerControl.render sticker with error ${error}`);
        }

        return (
            <img className='sticker-img' width={fitSize.width} height={fitSize.height} src={src} alt=''/>
        );
    }
}

StickerControl.propTypes = {
    message : PropTypes.object.isRequired,
    openMedia : PropTypes.func.isRequired
};

export default StickerControl;