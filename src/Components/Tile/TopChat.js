/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getChatShortTitle } from '../../Utils/Chat';
import ChatTileControl from './ChatTileControl';
import './TopChat.css';

class TopChat extends React.Component {
    shouldComponentUpdate(nextProps, nextState){
        return nextProps.chatId !== this.props.chatId;
    }

    render() {
        const { chatId, onSelect } = this.props;

        const shortTitle = getChatShortTitle(chatId);

        return (
            <div className='top-chat'>
                <ChatTileControl chatId={chatId} onSelect={onSelect}/>
                <div className='top-chat-title'>{shortTitle}</div>
            </div>
        );
    }
}

TopChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func
};

export default TopChat;