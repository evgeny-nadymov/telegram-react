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
import { senderEquals } from '../../Utils/Message';

class MessageAuthor extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { sender, t } = props;

        if (!senderEquals(state.prevSender, sender)) {
            return {
                prevSender: sender,

                fullName: MessageAuthor.getFullName(sender, t)
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
        const { sender, t } = this.props;
        const { user } = update;

        if (sender && sender.user_id !== user.id) return;

        const fullName = MessageAuthor.getFullName(sender, t);
        this.setState({ fullName });
    };

    onUpdateChatTitle = update => {
        const { sender, t } = this.props;
        const { chat_id } = update;

        if (sender && sender.chat_id !== chat_id) return;

        const fullName = MessageAuthor.getFullName(sender, t);
        this.setState({ fullName });
    };

    static getFullName = (sender, t) => {
        if (!sender) return '';

        switch (sender['@type']) {
            case 'messageSenderUser': {
                return getUserFullName(sender.user_id, null, t);
            }
            case 'messageSenderChat': {
                return getChatTitle(sender.chat_id, false, t);
            }
        }

        return '';
    };

    handleSelect = event => {
        const { sender, openUser, openChat, forwardInfo } = this.props;

        let { user_id: userId, chat_id: chatId } = sender;

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
        const { sender, openUser, openChat, forwardInfo, t } = this.props;
        let { fullName } = this.state;

        let { chat_id: chatId, user_id: userId } = sender;

        if (UserStore.getMyId() === sender.user_id && forwardInfo) {
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
                    fullName = MessageAuthor.getFullName({ '@type': 'messageSenderUser', user_id: userId }, t);
                    break;
                }
                case 'messageForwardOriginChannel': {
                    userId = 0;
                    chatId = forwardInfo.origin.chat_id;
                    fullName = MessageAuthor.getFullName({ '@type': 'messageSenderChat', chat_id: chatId }, t);
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
    sender: PropTypes.object,
    forwardInfo: PropTypes.object,
    openUser: PropTypes.bool,
    openChat: PropTypes.bool
};

MessageAuthor.defaultProps = {
    openUser: false,
    openChat: false
};

export default withTranslation()(MessageAuthor);
