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
import { getSrc, loadChatContent } from '../../Utils/File';
import UserStore from '../../Stores/UserStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import './UserTile.css';

class UserTile extends Component {
    constructor(props) {
        super(props);

        if (process.env.NODE_ENV !== 'production') {
            this.state = {
                user: UserStore.get(this.props.userId),
                loaded: false
            };
        } else {
            this.state = {
                loaded: false
            };
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.userId !== this.props.userId) {
            return true;
        }

        if (nextState.loaded !== this.state.loaded) {
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

        if (userId !== update.userId) return;

        if (this.state.loaded) {
            this.setState({ loaded: false });
        } else {
            this.forceUpdate();
        }
    };

    onClientUpdateChatBlob = update => {
        const { userId } = this.props;
        const { chatId } = update;

        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup':
            case 'chatTypeSupergroup': {
                return;
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                if (chat.type.user_id !== userId) return;

                if (this.state.loaded) {
                    this.setState({ loaded: false });
                } else {
                    this.forceUpdate();
                }
            }
        }
    };

    onUpdateChatPhoto = update => {
        const { userId } = this.props;
        const { chat_id, photo } = update;

        const chat = ChatStore.get(chat_id);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup':
            case 'chatTypeSupergroup': {
                return;
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                if (chat.type.user_id !== userId) return;

                if (this.state.loaded) {
                    this.setState({ loaded: false });
                } else {
                    this.forceUpdate();
                }

                if (photo) {
                    const store = FileStore.getStore();
                    loadChatContent(store, chat);
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
                if (chat.type.user_id !== userId && !chat.photo) return;

                this.forceUpdate();
            }
        }
    };

    handleSelect = event => {
        const { userId, onSelect } = this.props;
        if (!onSelect) return;

        event.stopPropagation();
        onSelect(userId);
    };

    handleLoad = () => {
        this.setState({ loaded: true });
    };

    render() {
        const { userId, fistName, lastName, onSelect } = this.props;
        const { loaded } = this.state;

        const user = UserStore.get(userId);
        if (!user && !(fistName || lastName)) return null;

        const letters = getUserLetters(userId, fistName, lastName);
        const src = getSrc(user && user.profile_photo ? user.profile_photo.small : null);
        const tileLoaded = src && loaded;

        const tileColor = `tile_color_${(Math.abs(userId) % 8) + 1}`;

        return (
            <div
                className={classNames('user-tile', { [tileColor]: !tileLoaded }, { pointer: onSelect })}
                onClick={this.handleSelect}>
                {!tileLoaded && (
                    <div className='tile-photo'>
                        <span className='tile-text'>{letters}</span>
                    </div>
                )}
                {src && <img className='tile-photo' src={src} onLoad={this.handleLoad} draggable={false} alt='' />}
            </div>
        );
    }
}

UserTile.propTypes = {
    userId: PropTypes.number.isRequired,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    onSelect: PropTypes.func
};

export default UserTile;
