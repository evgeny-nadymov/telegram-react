/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import CheckMarkIcon from '@material-ui/icons/Check';
import Audio from '../Media/Audio';
import Document from '../Media/Document';
import MessageMenu from '../MessageMenu';
import Meta from '../Meta';
import Photo from '../Media/Photo';
import Video from '../Media/Video';
import { getText, getWebPage, isEmptySelection, openMedia } from '../../../Utils/Message';
import { selectMessage } from '../../../Actions/Client';
import MessageStore from '../../../Stores/MessageStore';
import './AlbumItem.css';

class AlbumItem extends React.Component {

    state = {
        contextMenu: false
    };

    getAlbumItem = (message, displaySize) => {
        const { chat_id, id, content } = message;

        switch (content['@type']) {
            case 'messageAudio': {
                const inlineMeta = (
                    <Meta
                        className='meta-hidden'
                        key={`${chat_id}_${id}_meta`}
                        chatId={chat_id}
                        messageId={id}
                    />
                );

                const webPage = getWebPage(message);
                const text = getText(message, !!webPage ? null : inlineMeta, x => x);

                return (
                    <>
                        <Audio
                            type='message'
                            chatId={chat_id}
                            messageId={id}
                            audio={content.audio}
                            displaySize={displaySize}
                            style={{ width: '100%', height: '100%' }}
                            openMedia={this.openMedia}/>
                        { text && text.length > 0 && (
                            <div className={'message-text'}>
                                {text}
                            </div>
                        )}
                    </>
                );
            }
            case 'messagePhoto': {
                return (
                    <Photo
                        type='message'
                        chatId={chat_id}
                        messageId={id}
                        photo={content.photo}
                        displaySize={displaySize}
                        style={{ width: '100%', height: '100%' }}
                        openMedia={this.openMedia}/>
                    );
            }
            case 'messageVideo': {
                return (
                    <Video
                        type='message'
                        chatId={chat_id}
                        messageId={id}
                        video={content.video}
                        displaySize={displaySize}
                        style={{ width: '100%', height: '100%' }}
                        openMedia={this.openMedia}/>
                );
            }
            case 'messageDocument': {
                const inlineMeta = (
                    <Meta
                        className='meta-hidden'
                        key={`${chat_id}_${id}_meta`}
                        chatId={chat_id}
                        messageId={id}
                    />
                );

                const webPage = getWebPage(message);
                const text = getText(message, !!webPage ? null : inlineMeta, x => x);

                return (
                    <>
                        <Document
                            type='message'
                            chatId={chat_id}
                            messageId={id}
                            document={content.document}
                            displaySize={displaySize}
                            style={{ width: '100%', height: '100%' }}
                            openMedia={this.openMedia}/>
                        { text && text.length > 0 && (
                            <div className={'message-text'}>
                                {text}
                            </div>
                        )}
                    </>
                );
            }
        }

        return null;
    }

    componentDidMount() {
        MessageStore.on('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        // MessageStore.on('clientUpdateMessageShake', this.onClientUpdateMessageShake);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateClearSelection);
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateMessageHighlighted', this.onClientUpdateMessageHighlighted);
        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        // MessageStore.off('clientUpdateMessageShake', this.onClientUpdateMessageShake);
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateClearSelection);
    }

    onClientUpdateMessageHighlighted = update => {
        const { message } = this.props;
        const { selected, highlighted } = this.state;

        if (selected) return;

        if (message.chat_id === update.chatId && message.id === update.messageId) {
            if (highlighted) {
                this.setState({ highlighted: false }, () => {
                    setTimeout(() => {
                        this.setState({ highlighted: true });
                    }, 0);
                });
            } else {
                this.setState({ highlighted: true });
            }
        } else if (highlighted) {
            this.setState({ highlighted: false });
        }
    };

    onClientUpdateClearSelection = update => {
        if (!this.state.selected) return;

        this.setState({ selected: false });
    };

    onClientUpdateMessageSelected = update => {
        const { message } = this.props;
        const { chat_id: chatId, id: messageId } = message;

        const { selected } = update;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({ selected, highlighted: false });
        }
    };

    handleOpenContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;
            const copyLink =
                event.target && event.target.tagName === 'A' && event.target.href ? event.target.href : null;

            this.setState({
                contextMenu: true,
                copyLink,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    openMedia = event => {
        if (MessageStore.selectedItems.size > 0) return;

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        const { message } = this.props;
        if (!message) return;

        const { chat_id, id } = message;

        openMedia(chat_id, id);
    };

    handleSelection = event => {
        // if (!this.mouseDown) return;

        const selection = window.getSelection().toString();
        if (!isEmptySelection(selection)) {
            return;
        }

        const { message } = this.props;
        const { chat_id: chatId, id: messageId } = message;

        if (MessageStore.selectedItems.size === 0) return;

        const selected = !MessageStore.selectedItems.has(`chatId=${chatId}_messageId=${messageId}`);
        selectMessage(chatId, messageId, selected);

        event.preventDefault();
        event.stopPropagation();
    };

    render() {
        const { message, position, displaySize, source } = this.props;
        const { contextMenu, copyLink, top, left, selected, highlighted } = this.state;

        const { chat_id, id } = message;

        let style = {};
        let className = 'album-document-item';
        if (position) {
            style = { width: position.width, height: position.height * displaySize };
            className = 'album-item'
        }

        return (
            <>
                <div
                    className={classNames(className, { 'album-item-highlighted': highlighted && !selected}, { 'item-selected': selected })}
                    onClick={this.handleSelection}
                    onContextMenu={this.handleOpenContextMenu}
                    style={style}>
                    <div className='album-item-wrapper'>{this.getAlbumItem(message, displaySize)}</div>
                    {(selected || highlighted) && (
                        <div className='album-item-selection'>
                            <div className='album-item-selection-mark'>
                                { selected && <CheckMarkIcon className='album-item-select-tick' /> }
                            </div>
                        </div>
                    )}
                </div>
                <MessageMenu
                    chatId={chat_id}
                    messageId={id}
                    anchorPosition={{ top, left }}
                    open={contextMenu}
                    onClose={this.handleCloseContextMenu}
                    copyLink={copyLink}
                    source={source}
                />
            </>
        );
    }
}

AlbumItem.propTypes = {
    message: PropTypes.object,
    position: PropTypes.object,
    displaySize: PropTypes.number
};

export default AlbumItem;