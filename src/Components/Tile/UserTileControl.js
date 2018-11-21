/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getUserLetters } from '../../Utils/User';
import UserStore from '../../Stores/UserStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
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
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        FileStore.on('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        ChatStore.on('updateChatPhoto', this.onUpdateChatPhoto);

    }

    componentWillUnmount(){
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        FileStore.removeListener('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        ChatStore.removeListener('updateChatPhoto', this.onUpdateChatPhoto);
    }

    onClientUpdatePhotoBlob = (update) => {
        const { userId } = this.props;

        if (userId === update.userId) {
            this.forceUpdate();
        }
    };

    onClientUpdateChatBlob = (update) => {
        const { userId } = this.props;

        const chat = ChatStore.get(update.chatId);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup' :
            case 'chatTypeSupergroup' : {
                return;
            }
            case 'chatTypePrivate' :
            case 'chatTypeSecret' : {
                if (chat.type.user_id === userId){
                    this.forceUpdate();
                }
            }
        }
    };

    onUpdateChatPhoto = (update) => {
        const { userId } = this.props;

        const chat = ChatStore.get(update.chat_id);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup' :
            case 'chatTypeSupergroup' : {
                return;
            }
            case 'chatTypePrivate' :
            case 'chatTypeSecret' : {
                if (chat.type.user_id === userId){
                    this.forceUpdate();
                }
            }
        }
    };

    handleSelect = () => {
        const { userId, onSelect } = this.props;
        if (!onSelect) return;

        onSelect(userId);
    };

    render(){
        const { userId, onSelect } = this.props;
        if (!userId) return null;

        const user = UserStore.get(userId);
        if (!user) return null;

        const letters = getUserLetters(user);
        const blob = user.profile_photo && user.profile_photo.small? user.profile_photo.small.blob : null;

        let src;
        try{
            src = blob ? URL.createObjectURL(blob) : null;
        }
        catch(error){
            console.log(`[UserTileControl] render user_id=${userId} with error ${error}`);
        }

        const tileColor = `tile_color_${(Math.abs(userId) % 8 + 1)}`;
        const className = classNames(
            'tile-photo',
            {[tileColor]: !blob},
            {pointer: onSelect}
        );

        return src ?
            (<img className={className} src={src} draggable={false} alt='' onClick={this.handleSelect}/>) :
            (<div className={className} onClick={this.handleSelect}><span className='tile-text'>{letters}</span></div>);
    }
}

UserTileControl.propTypes = {
    userId : PropTypes.number.isRequired,
    onSelect : PropTypes.func
};

export default UserTileControl;