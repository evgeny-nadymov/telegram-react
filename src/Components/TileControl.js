import React, {Component} from 'react';
import './TileControl.css';
import ChatStore from "../Stores/ChatStore";
import {getLetters} from '../Utils/Common';

class TileControl extends Component{
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
        ChatStore.on('chat_photo_changed', this.onPhotoUpdated);
    }

    onPhotoUpdated(payload) {
        if (this.props.chat && this.props.chat.id === payload.chatId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        ChatStore.removeListener('chat_photo_changed', this.onPhotoUpdated);
    }

    getChatLetters(chat){
        if (!chat) return null;

        let title = chat.title || 'Deleted account';
        if (title.length === 0) return null;

        let letters = getLetters(title);
        if (letters && letters.length > 0){
            return letters;
        }

        return chat.title.charAt(0);
    }

    render(){
        const chat = this.props.chat;
        let letters = this.getChatLetters(chat);
        let blob = chat.photo && chat.photo.small? chat.photo.small.blob : null;
        let src;
        try{
            src = blob ? URL.createObjectURL(blob) : null;
        }
        catch(error){
            console.log(`TileControl.render chat_id=${chat.id} with error ${error}`);
        }

        let chatId = chat.id || 1;
        let photoClasses = 'tile-photo';
        if (!blob){
            photoClasses += ` user_bgcolor_${(Math.abs(chatId) % 8 + 1)}`;
        }

        return src ?
            (<img className={photoClasses} src={src} alt='' />) :
            (<div className={photoClasses}><span className='tile-text'>{letters}</span></div>);
    }
}

export default TileControl;