import React, {Component} from 'react';
import './UserTileControl.css';
import UserStore from '../Stores/UserStore';

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

    getFirstLetter(str){
        if (!str) return '';
        for (let i = 0; i < str.length; i++){
            if (str[i].toUpperCase() !== str[i].toLowerCase()) {
                return str[i];
            }
            else if (str[i] >= '0' && str[i] <= '9'){
                return str[i];
            }
        }

        return '';
    }

    getLetters(user){
        if (!user) return null;

        let title = user.first_name + ' ' + user.last_name || 'Deleted account';
        if (title.length === 0) return null;

        let split = title.split(' ');
        if (split.length > 1){
            return this.getFirstLetter(split[0]) + this.getFirstLetter(split[1])
        }

        return user.first_name ? user.first_name.charAt(0) : (user.last_name ? user.last_name.charAt(0) : '');
    }

    render(){
        const user = this.props.user;
        if (!user) return null;

        const letters = this.getLetters(user);
        let src;
        try{
            src = user.blob ? URL.createObjectURL(user.blob) : null;
        }
        catch(error){
            console.log(`UserTileControl.render user_id=${user.id} with error ${error}`);
        }

        let photoClasses = 'tile-photo';
        if (!user.blob){
            photoClasses += ` user_bgcolor_${(Math.abs(user.id) % 8 + 1)}`;
        }

        return src ?
            (<img className={photoClasses} src={src} alt='' />) :
            (<div className={photoClasses}><span className='tile-text'>{letters}</span></div>);
    }
}

export default UserTileControl;