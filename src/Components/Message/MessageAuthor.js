/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { getUserFullName } from '../../Utils/User';
import { getChatTitle } from '../../Utils/Chat';
import UserStore from '../../Stores/UserStore';
import ChatStore from '../../Stores/ChatStore';
import './MessageAuthor.css';

class MessageAuthor extends React.Component {
    constructor(props){
        super(props);
    }

    handleSelect = () => {
        const { chatId, userId, onSelectUser, onSelectChat } = this.props;

        if (onSelectUser){
            onSelectUser(userId);
            return;
        }

        if (onSelectChat){
            onSelectChat(chatId);
            return;
        }
    };

    render() {
        const { chatId, userId, onSelectUser, onSelectChat } = this.props;

        const user = UserStore.get(userId);
        if (user){
            const fullName = getUserFullName(user);

            return (
                onSelectUser
                    ? <a className='message-author' onClick={this.handleSelect}>{fullName}</a>
                    : <>{fullName}</>
            );
        }

        const chat = ChatStore.get(chatId);
        if (chat){
            const fullName = getChatTitle(chat);

            return (
                onSelectChat
                    ? <a className='message-author' onClick={this.handleSelect}>{fullName}</a>
                    : <>{fullName}</>
            );
        }

        return null;
    }
}

export default MessageAuthor;