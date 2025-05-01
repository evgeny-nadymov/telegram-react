/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import { getUserFullName } from '../../Utils/User';
import { getChatTitle, isPrivateChat } from '../../Utils/Chat';
import { openUser as openUserCommand, openChat as openChatCommand } from '../../Actions/Client';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import './MessageAuthor.css';

class MessageAuthor extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId, userId, t } = props;

        if (state.prevChatId !== chatId || state.prevUserId !== userId) {
            return {
                prevChatId: chatId,
                prevUserId: userId,

                fullName: MessageAuthor.getFullName(userId, chatId, t)
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { fullName } = this.state;

        return fullName !== nextState.fullName;
    }

    componentDidMount() {
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
        UserStore.on('updateUser', this.onUpdateUser);
    }

    componentWillUnmount() {
        ChatStore.off('updateChatTitle', this.onUpdateChatTitle);
        UserStore.off('updateUser', this.onUpdateUser);
    }

    onUpdateUser = update => {
        const { chatId, userId, t } = this.props;
        const { user } = update;

        if (userId !== user.id) return;

        const fullName = MessageAuthor.getFullName(userId, chatId, t);
        this.setState({ fullName });
    };

    onUpdateChatTitle = update => {
        const { chatId, userId, t } = this.props;
        const { chat_id } = update;

        if (chat_id !== chatId) return;
        if (userId) return;

        const fullName = MessageAuthor.getFullName(userId, chatId, t);
        this.setState({ fullName });
    };

    static getFullName = (userId, chatId, t) => {
        const user = UserStore.get(userId);
        if (user) {
            return getUserFullName(userId, null, t);
        }

        const chat = ChatStore.get(chatId);
        if (chat) {
            return getChatTitle(chatId, false, t);
        }

        return '';
    };

    handleSelect = event => {
        const { chatId, userId, openUser, openChat } = this.props;

        if (openUser && userId) {
            event.stopPropagation();

            openUserCommand(userId, true);
            return;
        }

        if (openChat && chatId) {
            event.stopPropagation();

            openChatCommand(chatId, null, true);
            return;
        }
    };

    render() {
        const { chatId, userId, openUser, openChat } = this.props;
        const { fullName } = this.state;

        const user = UserStore.get(userId);
        if (user) {
            const tileColor = isPrivateChat(chatId)
                ? 'message-author-color'
                : `user_color_${(Math.abs(userId) % 8) + 1}`;
            const className = classNames([tileColor], 'message-author');

            return openUser ? (
                <a className={className} onClick={this.handleSelect}>
                    {fullName}
                </a>
            ) : (
                <>{fullName}</>
            );
        }

        const chat = ChatStore.get(chatId);
        if (chat) {
            const className = classNames('message-author-color', 'message-author');

            return openChat ? (
                <a className={className} onClick={this.handleSelect}>
                    {fullName}
                </a>
            ) : (
                <>{fullName}</>
            );
        }

        return null;
    }
}

MessageAuthor.propTypes = {
    chatId: PropTypes.number,
    userId: PropTypes.number,
    openUser: PropTypes.bool,
    openChat: PropTypes.bool
};

MessageAuthor.defaultProps = {
    openUser: false,
    openChat: false
};

export default withTranslation()(MessageAuthor);
