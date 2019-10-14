/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import BookmarkBorderIcon from '@material-ui/icons/BookmarkBorder';
import ChatStatus from './ChatStatus';
import { getChatLetters, isMeChat, isPrivateChat } from '../../Utils/Chat';
import { getSrc, loadChatContent } from '../../Utils/File';
import ChatStore from '../../Stores/ChatStore';
import FileStore from '../../Stores/FileStore';
import './ChatTile.css';

const styles = {
    statusRoot: {
        position: 'absolute',
        right: 1,
        bottom: 1,
        zIndex: 1
    },
    statusIcon: {},
    iconIndicator: {}
};

class ChatTile extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loaded: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chatId !== this.props.chatId) {
            return true;
        }

        if (nextProps.theme !== this.props.theme) {
            return true;
        }

        if (nextState.loaded !== this.state.loaded) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        FileStore.on('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        ChatStore.on('updateChatPhoto', this.onUpdateChatPhoto);
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
    }

    componentWillUnmount() {
        ChatStore.removeListener('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        FileStore.removeListener('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        ChatStore.removeListener('updateChatPhoto', this.onUpdateChatPhoto);
        ChatStore.removeListener('updateChatTitle', this.onUpdateChatTitle);
    }

    onFastUpdatingComplete = update => {
        this.forceUpdate();
    };

    onClientUpdateChatBlob = update => {
        const { chatId } = this.props;

        if (chatId !== update.chatId) return;

        if (this.state.loaded) {
            this.setState({ loaded: false });
        } else {
            this.forceUpdate();
        }
    };

    onUpdateChatPhoto = update => {
        const { chatId } = this.props;
        const { chat_id, photo } = update;

        if (chat_id !== chatId) return;

        if (this.state.loaded) {
            this.setState({ loaded: false });
        } else {
            this.forceUpdate();
        }

        if (photo) {
            const store = FileStore.getStore();
            loadChatContent(store, chatId);
        }
    };

    onUpdateChatTitle = update => {
        const { chatId } = this.props;
        const { chat_id } = update;

        if (chat_id !== chatId) return;

        this.forceUpdate();
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
        const { classes, chatId, showOnline, showSavedMessages, onSelect } = this.props;
        const { loaded } = this.state;

        if (isMeChat(chatId) && showSavedMessages) {
            const className = classNames('tile-photo', 'tile_color_4', { pointer: onSelect });
            return (
                <div className='chat-tile' onClick={this.handleSelect}>
                    <div className={className}>
                        <div className='tile-saved-messages'>
                            <BookmarkBorderIcon />
                        </div>
                    </div>
                </div>
            );
        }

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { photo } = chat;

        const letters = getChatLetters(chat);
        const src = getSrc(photo ? photo.small : null);
        const tileLoaded = src && loaded;

        const tileColor = `tile_color_${(Math.abs(chatId) % 8) + 1}`;

        return (
            <div
                className={classNames('chat-tile', { [tileColor]: !tileLoaded }, { pointer: onSelect })}
                onClick={this.handleSelect}>
                {!tileLoaded && (
                    <div className='tile-photo'>
                        <span className='tile-text'>{letters}</span>
                    </div>
                )}
                {src && <img className='tile-photo' src={src} onLoad={this.handleLoad} draggable={false} alt='' />}

                {showOnline && isPrivateChat(chatId) && (
                    <ChatStatus
                        chatId={chatId}
                        classes={{
                            root: classes.statusRoot,
                            icon: classes.statusIcon,
                            iconIndicator: classes.iconIndicator
                        }}
                    />
                )}
            </div>
        );
    }
}

ChatTile.propTypes = {
    classes: PropTypes.object,
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func,
    showSavedMessages: PropTypes.bool,
    showOnline: PropTypes.bool
};

ChatTile.defaultProps = {
    showSavedMessages: true,
    showOnline: false
};

export default withStyles(styles, { withTheme: true })(ChatTile);
