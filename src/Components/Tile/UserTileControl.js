/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import { getUserLetters } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import ChatStore from '../../Stores/ChatStore';
import './UserTileControl.css';

class UserTileControl extends Component{
    constructor(props){
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.userId !== this.props.userId){
            return true;
        }

        return false;
    }

    componentWillMount(){
        UserStore.on('user_photo_changed', this.onPhotoUpdated);
        // ChatStore.on('updateChatPhoto', this.onUpdateChatPhoto);

    }

    componentWillUnmount(){
        UserStore.removeListener('user_photo_changed', this.onPhotoUpdated);
        // ChatStore.removeListener('updateChatPhoto', this.onUpdateChatPhoto);
    }

    onPhotoUpdated = (payload) => {
        if (this.props.userId === payload.userId){
            this.forceUpdate();
        }
    };

    onUpdateChatPhoto = (update) => {
        let chat = ChatStore.get(update.chat_id);
        if (chat && chat.type){
            switch (chat.type['@type']) {
                case 'chatTypeBasicGroup' :
                case 'chatTypeSupergroup' : {
                    return;
                }
                case 'chatTypePrivate' :
                case 'chatTypeSecret' : {
                    if (chat.type.user_id === this.props.userId){
                        this.forceUpdate();
                    }
                }
            }
        }
    };

    render(){
        const { userId } = this.props;
        if (!userId) return null;

        const user = UserStore.get(userId);
        if (!user) return null;

        let letters = getUserLetters(user);
        let blob = user.profile_photo && user.profile_photo.small? user.profile_photo.small.blob : null;

        let src;
        try{
            src = blob ? URL.createObjectURL(blob) : null;
        }
        catch(error){
            console.log(`UserTileControl.render user_id=${userId} with error ${error}`);
        }

        let photoClasses = 'tile-photo';
        if (!blob){
            photoClasses += ` tile_color_${(Math.abs(userId) % 8 + 1)}`;
        }

        return src ?
            (<img className={photoClasses} src={src} draggable={false} alt='' />) :
            (<div className={photoClasses}><span className='tile-text'>{letters}</span></div>);
    }
}

export default UserTileControl;