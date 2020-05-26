/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import { getUserLetters, isDeletedUser } from '../../Utils/User';
import { getSrc, loadChatContent } from '../../Utils/File';
import UserStore from '../../Stores/UserStore';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import './UserTile.css';
import DeletedAccountIcon from '../../Assets/Icons/DeletedAccount';

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
        FileStore.off('clientUpdateUserBlob', this.onClientUpdateUserBlob);
        FileStore.off('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        ChatStore.off('updateChatPhoto', this.onUpdateChatPhoto);
        ChatStore.off('updateChatTitle', this.onUpdateChatTitle);
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
        const { className, userId, fistName, lastName, onSelect, small, dialog, poll, t } = this.props;
        const { loaded } = this.state;

        const user = UserStore.get(userId);
        if (!user && !(fistName || lastName)) return null;

        if (isDeletedUser(userId)) {
            return (
                <div
                    className={classNames(
                        className,
                        'user-tile',
                        'tile_color_0',
                        { pointer: onSelect },
                        { 'tile-dialog': dialog },
                        { 'tile-small': small },
                        { 'tile-poll': poll }
                    )}
                    onClick={this.handleSelect}>
                    <div className='tile-photo'>
                        <div className='tile-saved-messages'>
                            <DeletedAccountIcon fontSize='default' />
                        </div>
                    </div>
                </div>
            );
        }

        const letters = getUserLetters(userId, fistName, lastName, t);
        const src = getSrc(user && user.profile_photo ? user.profile_photo.small : null);
        const tileLoaded = src && loaded;

        const tileColor = `tile_color_${(Math.abs(userId) % 7) + 1}`;

        return (
            <div
                className={classNames(
                    className,
                    'user-tile',
                    { [tileColor]: !tileLoaded },
                    { pointer: onSelect },
                    { 'tile-dialog': dialog },
                    { 'tile-small': small },
                    { 'tile-poll': poll }
                )}
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
    onSelect: PropTypes.func,
    small: PropTypes.bool
};

export default withTranslation()(UserTile);
