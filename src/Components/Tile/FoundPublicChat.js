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
import { getChatUsername, getGroupChatMembersCount } from '../../Utils/Chat';
import './FoundPublicChat.css';

class FoundPublicChat extends React.PureComponent {

    handleClick = () => {
        const { chatId, onSelect} = this.props;
        if (!onSelect) return;

        onSelect(chatId);
    };

    render() {

        const { chatId, onTileSelect } = this.props;

        const username = getChatUsername(chatId);
        const membersCount = getGroupChatMembersCount(chatId);
        let subscribersString = '';
        if (membersCount > 0){
            subscribersString = membersCount === 1 ? ', 1 subscriber' : `, ${membersCount} subscribers`;
        }

        return (
            <div className='found-public-chat' onClick={this.handleClick}>
                <ChatTileControl chatId={chatId} onSelect={onTileSelect} />
                <div className='dialog-inner-wrapper'>
                    <div className='dialog-row-wrapper'>
                        <DialogTitleControl chatId={chatId} />
                    </div>
                    <div className='dialog-row-wrapper'>
                        <div className='dialog-content'>
                            @{username}
                            {subscribersString}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

FoundPublicChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func
};

export default FoundPublicChat;