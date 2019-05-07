/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getUserLetters } from '../../Utils/User';
import { loadChatContent } from '../../Utils/File';
import UserStore from '../../Stores/UserStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import './UserTileControl.css';

class UserTileControl extends Component {
    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.userId !== this.props.userId) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        FileStore.on('clientUpdateUserBlob', this.onClientUpdateUserBlob);
        FileStore.on('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        ChatStore.on('updateChatPhoto', this.onUpdateChatPhoto);
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateUserBlob', this.onClientUpdateUserBlob);
        FileStore.removeListener('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        ChatStore.removeListener('updateChatPhoto', this.onUpdateChatPhoto);
        ChatStore.removeListener('updateChatTitle', this.onUpdateChatTitle);
    }

    onClientUpdateUserBlob = update => {
        const { userId } = this.props;

        if (userId === update.userId) {
            this.forceUpdate();
        }
    };

    onClientUpdateChatBlob = update => {
        const { userId } = this.props;

        const chat = ChatStore.get(update.chatId);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup':
            case 'chatTypeSupergroup': {
                return;
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                if (chat.type.user_id === userId) {
                    //console.log('UserTileControl.onClientUpdateChatBlob user_id=' + userId);
                    this.forceUpdate();
                }
            }
        }
    };

    onUpdateChatPhoto = update => {
        const { userId } = this.props;

        const chat = ChatStore.get(update.chat_id);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup':
            case 'chatTypeSupergroup': {
                return;
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                if (chat.type.user_id === userId) {
                    if (!update.photo) {
                        //console.log('UserTileControl.onUpdateChatPhoto user_id=' + userId);
                        this.forceUpdate();
                    } else {
                        const store = FileStore.getStore();
                        loadChatContent(store, chat);
                    }
                }
            }
        }
    };

    onUpdateChatTitle = update => {
        const { userId } = this.props;

        const chat = ChatStore.get(update.chat_id);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup':
            case 'chatTypeSupergroup': {
                return;
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                if (chat.type.user_id === userId && !chat.photo) {
                    //console.log('UserTileControl.onUpdateChatTitle user_id=' + userId);
                    this.forceUpdate();
                }
            }
        }
    };

    handleSelect = event => {
        const { userId, onSelect } = this.props;
        if (!onSelect) return;

        event.stopPropagation();
        onSelect(userId);
    };

    render() {
        const { userId, onSelect } = this.props;
        let { user } = this.props;
        if (!userId && !user) return null;

        user = UserStore.get(userId) || user;
        if (!user) return null;

        const { profile_photo } = user;

        const letters = getUserLetters(user);
        const blob = profile_photo && profile_photo.small ? FileStore.getBlob(profile_photo.small.id) : null;
        const src = FileStore.getBlobUrl(blob);
        const tileColor = `tile_color_${(Math.abs(userId) % 8) + 1}`;
        const className = classNames('tile-photo', { [tileColor]: !blob }, { pointer: onSelect });

        return src ? (
            <img className={className} src={src} draggable={false} alt='' onClick={this.handleSelect} />
        ) : (
            <div className={className} onClick={this.handleSelect}>
                <span className='tile-text'>{letters}</span>
            </div>
        );
    }
}

UserTileControl.propTypes = {
    userId: PropTypes.number.isRequired,
    user: PropTypes.object,
    onSelect: PropTypes.func
};

export default UserTileControl;
