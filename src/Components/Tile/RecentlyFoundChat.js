/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ChatTileControl from './ChatTileControl';
import DialogTitleControl from './DialogTitleControl';
import './RecentlyFoundChat.css';

class RecentlyFoundChat extends React.PureComponent {

    handleClick = () => {
        const { chatId, onSelect} = this.props;
        if (!onSelect) return;

        onSelect(chatId);
    };

    render() {

        const { chatId, onTileSelect } = this.props;

        return (
            <div className='recently-found-chat' onClick={this.handleClick}>
                <div className='chat-wrapper'>
                    <ChatTileControl chatId={chatId} onSelect={onTileSelect} />
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <DialogTitleControl chatId={chatId} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

RecentlyFoundChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func
};

export default RecentlyFoundChat;