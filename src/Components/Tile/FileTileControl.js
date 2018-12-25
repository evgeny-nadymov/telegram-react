/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getChatLetters } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import FileStore from '../../Stores/FileStore';

class FileTileControl extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        FileStore.on('clientUpdateFileBlob', this.onClientUpdateFileBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateFileBlob', this.onClientUpdateFileBlob);
    }

    onClientUpdateFileBlob = update => {
        if (update.fileId === this.props.fileId) {
            this.forceUpdate();
        }
    };

    render() {
        const { messageId, fileId, onSelect } = this.props;
        if (!fileId) return null;

        const message = MessageStore.get(messageId);
        if (!message) return null;

        const chat = ChatStore.get(message.chat_id);
        if (!chat) return null;

        const letters = getChatLetters(chat);
        const blob = chat.photo && chat.photo.small ? chat.photo.small.blob : null;

        let src;
        try {
            src = FileStore.getBlobUrl(blob);
        } catch (error) {
            console.log(
                `[FileTileControl] render chat_id=${chat.id} with error ${error}`
            );
        }

        const tileColor = `tile_color_${(Math.abs(chatId) % 8) + 1}`;
        const className = classNames(
            'tile-photo',
            { [tileColor]: !blob },
            { pointer: onSelect }
        );

        return src ? (
            <img
                className={className}
                src={src}
                draggable={false}
                alt=''
                onClick={this.handleSelect}
            />
        ) : (
            <div className={className} onClick={this.handleSelect}>
                <span className='tile-text'>{letters}</span>
            </div>
        );
    }
}

FileTileControl.propTypes = {
    fileId: PropTypes.number.isRequired
};

export default FileTileControl;
