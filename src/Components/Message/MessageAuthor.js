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
import { getChatTitle, isMeChat, isPrivateChat } from '../../Utils/Chat';
import { openUser as openUserCommand, openChat as openChatCommand } from '../../Actions/Client';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import './MessageAuthor.css';
import UserTile from '../Tile/UserTile';
import ChatTile from '../Tile/ChatTile';

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
        let { chatId, userId, openUser, openChat, forwardInfo } = this.props;

        if (isMeChat(chatId) && forwardInfo) {
            switch (forwardInfo.origin['@type']) {
                case 'messageForwardOriginHiddenUser': {
                    userId = 0;
                    chatId = 0;
                    break;
                }
                case 'messageForwardOriginUser': {
                    userId = forwardInfo.origin.sender_user_id;
                    chatId = 0;
                    break;
                }
                case 'messageForwardOriginChannel': {
                    chatId = forwardInfo.origin.chat_id;
                    userId = 0;
                    break;
                }
            }
        }

        event.stopPropagation();

        if (openUser && userId) {
            openUserCommand(userId, true);
            return;
        }

        if (openChat && chatId) {
            openChatCommand(chatId, null, true);
            return;
        }
    };

    render() {
        let { chatId, userId, openUser, openChat, forwardInfo, t } = this.props;
        let { fullName } = this.state;

        // console.log('[MessageAuthor] render', chatId, userId, forwardInfo);

        if (isMeChat(chatId) && forwardInfo) {
            switch (forwardInfo.origin['@type']) {
                case 'messageForwardOriginHiddenUser': {
                    userId = 0;
                    chatId = 0;
                    fullName = forwardInfo.origin.sender_name;
                    break;
                }
                case 'messageForwardOriginUser': {
                    userId = forwardInfo.origin.sender_user_id;
                    chatId = 0;
                    fullName = MessageAuthor.getFullName(userId, chatId, t);
                    break;
                }
                case 'messageForwardOriginChannel': {
                    userId = 0;
                    chatId = forwardInfo.origin.chat_id;
                    fullName = MessageAuthor.getFullName(userId, chatId, t);
                    break;
                }
            }
        }

        if (!userId && !chatId && !fullName) {
            return null;
        }

        if (!chatId) {
            const tileColor = isPrivateChat(chatId)
                ? 'message-author-color'
                : `user_color_${(Math.abs(userId || fullName.charCodeAt(0)) % 7) + 1}`;
            const className = classNames([tileColor], 'message-author');

            return openUser ? (
                <a className={className} onClick={this.handleSelect}>
                    {fullName}
                </a>
            ) : (
                <>{fullName}</>
            );
        }

        const className = classNames('message-author-color', 'message-author');
        return openChat ? (
            <a className={className} onClick={this.handleSelect}>
                {fullName}
            </a>
        ) : (
            <>{fullName}</>
        );
    }
}

MessageAuthor.propTypes = {
    chatId: PropTypes.number,
    userId: PropTypes.number,
    openUser: PropTypes.bool,
    openChat: PropTypes.bool,
    forwardInfo: PropTypes.object
};

MessageAuthor.defaultProps = {
    openUser: false,
    openChat: false
};

export default withTranslation()(MessageAuthor);
