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
import BookmarkBorderIcon from '../../Assets/Icons/Saved';
import DeletedAccountIcon from '../../Assets/Icons/DeletedAccount';
import OnlineStatus from './OnlineStatus';
import { getChatLetters, isMeChat, isPrivateChat, isDeletedPrivateChat, getChatTypeId } from '../../Utils/Chat';
import { getSrc, loadChatContent } from '../../Utils/File';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import './ChatTile.css';

class ChatTile extends Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId, t } = props;

        if (state.prevChatId !== chatId) {
            const chat = ChatStore.get(chatId);
            const file = chat && chat.photo? chat.photo.small : null;

            const fileId = file ? file.id : -1;
            const src = getSrc(file);
            const loaded = state.src === src && src !== '' || fileId === -1;
            const letters = getChatLetters(chatId, t);

            return {
                prevChatId: chatId,

                fileId,
                src,
                loaded,
                letters
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId } = this.props;
        const { fileId, src, loaded, letters } = this.state;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextState.fileId !== fileId) {
            return true;
        }

        if (nextState.src !== src) {
            return true;
        }

        if (nextState.loaded !== loaded) {
            return true;
        }

        if (nextState.letters !== letters) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('updateChatPhoto', this.onUpdateChatPhoto);
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
        FileStore.on('clientUpdateChatBlob', this.onClientUpdateChatBlob);
    }

    componentWillUnmount() {
        ChatStore.off('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.off('updateChatPhoto', this.onUpdateChatPhoto);
        ChatStore.off('updateChatTitle', this.onUpdateChatTitle);
        FileStore.off('clientUpdateChatBlob', this.onClientUpdateChatBlob);
    }

    onFastUpdatingComplete = update => {
        this.forceUpdate();
    };

    onClientUpdateChatBlob = update => {
        const { chatId } = this.props;
        const { fileId, loaded } = this.state;

        if (chatId !== update.chatId) return;
        if (fileId !== update.fileId) return;

        if (!loaded) {
            const chat = ChatStore.get(chatId);
            if (!chat) return null;

            const { photo } = chat;
            const src = getSrc(photo ? photo.small : null);

            this.setState({
                src
            });
        }
    };

    onUpdateChatPhoto = update => {
        const { chatId } = this.props;
        const { chat_id, photo } = update;

        if (chat_id !== chatId) return;

        const chat = ChatStore.get(chatId);
        const file = chat && chat.photo? chat.photo.small : null;

        const fileId = file ? file.id : -1;
        const src = getSrc(file);
        const loaded = this.state.src === src && src !== '' || fileId === -1;

        this.setState({
            fileId,
            src,
            loaded
        });

        if (photo) {
            const store = FileStore.getStore();
            loadChatContent(store, chatId);
        }
    };

    onUpdateChatTitle = update => {
        const { chatId, t } = this.props;
        const { chat_id } = update;

        if (chat_id !== chatId) return;

        const letters = getChatLetters(chatId, t);

        this.setState({ letters });
    };

    handleSelect = event => {
        const { chatId, onSelect } = this.props;
        if (!onSelect) return;

        event.stopPropagation();
        onSelect(chatId);
    };

    handleLoad = () => {
        this.setState({ loaded: true });
    };

    render() {
        const { chatId, showOnline, showSavedMessages, onSelect, small, dialog, big, size } = this.props;
        const { src, loaded, letters } = this.state;

        let style = null;
        if (size) {
            style = {
                width: size,
                height: size
            };
        }

        if (isDeletedPrivateChat(chatId)) {
            return (
                <div
                    className={classNames(
                        'chat-tile',
                        { 'tile-small': small },
                        { 'tile-dialog': dialog },
                        { 'tile-big': big }
                    )}
                    style={style}
                    onClick={this.handleSelect}>
                    <div className={classNames('tile-photo', 'tile_color_0', { pointer: onSelect })}>
                        <div className='tile-saved-messages'>
                            <DeletedAccountIcon fontSize={big ? 'large' : 'default'} />
                        </div>
                    </div>
                </div>
            );
        }

        if (isMeChat(chatId) && showSavedMessages) {
            return (
                <div
                    className={classNames(
                        'chat-tile',
                        { 'tile-small': small },
                        { 'tile-dialog': dialog },
                        { 'tile-big': big }
                    )}
                    style={style}
                    onClick={this.handleSelect}>
                    <div className={classNames('tile-photo', 'tile_color_6', { pointer: onSelect })}>
                        <div className='tile-saved-messages'>
                            <BookmarkBorderIcon fontSize={big ? 'large' : 'default'} />
                        </div>
                    </div>
                </div>
            );
        }

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const tileLoaded = src && loaded;
        const typeId = getChatTypeId(chatId);
        const tileColor = `tile_color_${(Math.abs(typeId) % 7) + 1}`;

        return (
            <div
                className={classNames(
                    'chat-tile',
                    { [tileColor]: !tileLoaded },
                    { pointer: onSelect },
                    { 'tile-dialog': dialog },
                    { 'tile-small': small },
                    { 'tile-big': big }
                )}
                style={style}
                onClick={this.handleSelect}>
                {!tileLoaded && (
                    <div className='tile-photo'>
                        <span className='tile-text'>{letters}</span>
                    </div>
                )}
                {src && <img className='tile-photo' src={src} onLoad={this.handleLoad} draggable={false} alt='' />}
                {showOnline && isPrivateChat(chatId) && <OnlineStatus chatId={chatId} />}
            </div>
        );
    }
}

ChatTile.propTypes = {
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func,
    showSavedMessages: PropTypes.bool,
    showOnline: PropTypes.bool,
    size: PropTypes.number
};

ChatTile.defaultProps = {
    showSavedMessages: true,
    showOnline: false
};

export default withTranslation()(ChatTile);
