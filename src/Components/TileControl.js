import React, {Component} from 'react';
import './TileControl.css';
import ChatStore from "../Stores/ChatStore";

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
        ChatStore.on("chat_photo_changed", this.onPhotoUpdated)
    }

    onPhotoUpdated(payload) {
        if (this.props.chat && this.props.chat.id === payload.chatId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        ChatStore.removeListener("chat_photo_changed", this.onPhotoUpdated);
    }

    getFirstLetter(str){
        if (!str) return '';
        for (let i = 0; i < str.length; i++){
            if (str[i].toUpperCase() !== str[i].toLowerCase()) {
                return str[i];
            }
        }

        return '';
    }

    getChatLetters(chat){
        if (!chat) return null;

        let title = chat.title || 'Deleted account';
        if (title.length === 0) return null;

        let split = title.split(' ');
        if (split.length > 1){
            return this.getFirstLetter(split[0]) + this.getFirstLetter(split[1])
        }

        return chat.title.charAt(0);
    }

    render(){
        const chat = this.props.chat;
        const letters = this.getChatLetters(chat);
        let src;
        try{
            src = chat.blob ? URL.createObjectURL(chat.blob) : null;
        }
        catch(error){
            console.log(`TileControl.render chat_id=${chat.id} with error ${error}`);
        }

        let photoClasses = 'tile-photo';
        if (!chat.blob){
            photoClasses += ` user_bgcolor_${(Math.abs(chat.id) % 8 + 1)}`;
        }

        return src ?
            (<img className={photoClasses} src={src} alt='' />) :
            (<div className={photoClasses}><span className='tile-text'>{letters}</span></div>);
    }
}

export default TileControl;