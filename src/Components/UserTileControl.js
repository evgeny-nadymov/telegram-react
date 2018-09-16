import React, {Component} from 'react';
import './UserTileControl.css';
import UserStore from '../Stores/UserStore';
import {getLetters} from '../Utils/Common';

class UserTileControl extends Component{
    constructor(props){
        super(props);

        this.onPhotoUpdated = this.onPhotoUpdated.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.user !== this.props.user){
            return true;
        }

        return false;
    }

    componentWillMount(){
        UserStore.on('user_photo_changed', this.onPhotoUpdated)
    }

    onPhotoUpdated(payload) {
        if (this.props.user && this.props.user.id === payload.userId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        UserStore.removeListener('user_photo_changed', this.onPhotoUpdated);
    }

    getUserLetters(user){
        if (!user) return null;

        let title = user.first_name + ' ' + user.last_name || 'Deleted account';
        if (title.length === 0) return null;

        let letters = getLetters(title);
        if (letters && letters.length > 0){
            return letters;
        }

        return user.first_name ? user.first_name.charAt(0) : (user.last_name ? user.last_name.charAt(0) : '');
    }

    render(){
        const user = this.props.user;
        if (!user) return null;

        let letters = this.getUserLetters(user);
        let blob = user.profile_photo && user.profile_photo.small? user.profile_photo.small.blob : null;

        let src;
        try{
            src = blob ? URL.createObjectURL(blob) : null;
        }
        catch(error){
            console.log(`UserTileControl.render user_id=${user.id} with error ${error}`);
        }

        let photoClasses = 'tile-photo';
        if (!blob){
            photoClasses += ` tile_color_${(Math.abs(user.id) % 8 + 1)}`;
        }

        return src ?
            (<img className={photoClasses} src={src} draggable={false} alt='' />) :
            (<div className={photoClasses}><span className='tile-text'>{letters}</span></div>);
    }
}

export default UserTileControl;