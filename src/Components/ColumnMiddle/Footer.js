/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import InputBox from './InputBox';
import FooterCommand from './FooterCommand';
import NotificationsCommand from './NotificationsCommand';
import { hasBasicGroupId, hasSupergroupId, isBotChat } from '../../Utils/Chat';
import { sendBotStartMessage, unblockSender } from '../../Actions/Message';
import AppStore from '../../Stores/ApplicationStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import ChatStore from '../../Stores/ChatStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './Footer.css';

class Footer extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId } = props;
        const { prevChatId } = state;

        if (prevChatId !== chatId) {
            const chat = ChatStore.get(chatId);
            if (chat) {
                const { is_blocked, last_message } = chat;

                return {
                    prevChatId: chatId,

                    isBlocked: is_blocked,
                    hasLastMessage: Boolean(last_message)
                };
            }
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { t, chatId, options } = this.props;
        const { hasLastMessage, isBlocked, clearHistory } = this.state;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.options !== options) {
            return true;
        }


        if (nextProps.t !== t) {
            return true;
        }

        if (nextState.hasLastMessage !== hasLastMessage) {
            return true;
        }

        if (nextState.isBlocked !== isBlocked) {
            return true;
        }

        if (nextState.clearHistory !== clearHistory) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        ChatStore.on('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.on('updateChatIsBlocked', this.onUpdateChatIsBlocked);
        ChatStore.on('updateChatLastMessage', this.onUpdateChatLastMessage);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
    }

    componentWillUnmount() {
        BasicGroupStore.off('updateBasicGroup', this.onUpdateBasicGroup);
        ChatStore.off('clientUpdateClearHistory', this.onClientUpdateClearHistory);
        ChatStore.off('updateChatIsBlocked', this.onUpdateChatIsBlocked);
        ChatStore.off('updateChatLastMessage', this.onUpdateChatLastMessage);
        SupergroupStore.off('updateSupergroup', this.onUpdateSupergroup);
    }

    onClientUpdateClearHistory = update => {
        const { chatId } = this.props;

        if (chatId !== update.chatId) return;

        this.setState({
            clearHistory: update.inProgress
        });
    };

    onUpdateChatLastMessage = update => {
        const { chat_id, last_message } = update;
        const { chatId } = this.props;

        if (chat_id !== chatId) return;

        this.setState({
            hasLastMessage: Boolean(last_message)
        });
    };

    onUpdateChatIsBlocked = update => {
        const { chat_id, is_blocked } = update;
        const { chatId } = this.props;

        if (chat_id !== chatId) return;

        this.setState({
            isBlocked: is_blocked
        });
    };

    onUpdateBasicGroup = update => {
        const { chatId } = this.props;

        if (hasBasicGroupId(chatId, update.basic_group.id)) {
            this.forceUpdate();
        }
    };

    onUpdateSupergroup = update => {
        const { chatId } = this.props;

        if (hasSupergroupId(chatId, update.supergroup.id)) {
            this.forceUpdate();
        }
    };

    handleJoin = () => {
        const { chatId } = this.props;
        if (!chatId) return;

        TdLibController.send({
            '@type': 'joinChat',
            chat_id: chatId
        });
    };

    handleDeleteAndExit = () => {
        const { chatId } = this.props;
        if (!chatId) return;

        TdLibController.send({
            '@type': 'deleteChatHistory',
            chat_id: chatId,
            remove_from_chat_list: true
        });

        // TdLibController
        //     .send({
        //         '@type': 'leaveChat',
        //         chat_id: this.props.chatId
        //     });
    };

    handleUnblock = () => {
        const { chatId } = this.props;

        unblockSender({ '@type': 'messageSenderChat', chat_id: chatId });
    };

    handleStartBot = async () => {
        const { chatId, options } = this.props;

        await AppStore.invokeScheduledAction(`clientUpdateClearHistory chatId=${chatId}`);
        if (options && options.botStartMessage) {
            const { botUserId, parameter } = options.botStartMessage;

            await sendBotStartMessage(chatId, botUserId, parameter);
        } else {
            await TdLibController.send({
                '@type': 'sendMessage',
                chat_id: chatId,
                reply_to_message_id: 0,
                input_message_content: {
                    '@type': 'inputMessageText',
                    text: {
                        '@type': 'formattedText',
                        text: '/start',
                        entities: []
                    },
                    disable_web_page_preview: true,
                    clear_draft: true
                }
            });
        }
    };

    render() {
        const { chatId, options, t } = this.props;
        const { hasLastMessage, clearHistory } = this.state;

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { type, is_blocked } = chat;
        if (!type) return null;

        if (is_blocked) {
            return <FooterCommand command={t('Unblock')} onCommand={this.handleUnblock} />;
        }

        if (options && options.botStartMessage) {
            const isBot = isBotChat(chatId);
            if (isBot) {
                return <FooterCommand command={t('BotStart')} onCommand={this.handleStartBot} />;
            }
        }

        switch (type['@type']) {
            case 'chatTypeBasicGroup': {
                const basicGroup = BasicGroupStore.get(type.basic_group_id);
                if (!basicGroup) return null;

                const { status } = basicGroup;
                if (!status) return null;

                const { is_member, permissions } = status;

                switch (status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return <InputBox />;
                    }
                    case 'chatMemberStatusBanned': {
                        return <FooterCommand command={t('DeleteChat')} onCommand={this.handleDeleteAndExit} />;
                    }
                    case 'chatMemberStatusCreator': {
                        return is_member ? <InputBox /> : <FooterCommand command={t('JoinGroup')} onCommand={this.handleJoin} />;
                    }
                    case 'chatMemberStatusLeft': {
                        return null;
                    }
                    case 'chatMemberStatusMember': {
                        return <InputBox />;
                    }
                    case 'chatMemberStatusRestricted': {
                        if (is_member) {
                            return permissions && permissions.can_send_messages ? <InputBox /> : null;
                        } else {
                            return <FooterCommand command={t('JoinGroup')} onCommand={this.handleJoin} />;
                        }
                    }
                }
                break;
            }
            case 'chatTypeSecret':
            case 'chatTypePrivate': {
                const isBot = isBotChat(chatId);
                if (isBot && (!hasLastMessage || clearHistory)) {
                    return <FooterCommand command={t('BotStart')} onCommand={this.handleStartBot} />;
                }

                return <InputBox />;
            }
            case 'chatTypeSupergroup': {
                const supergroup = SupergroupStore.get(type.supergroup_id);
                if (!supergroup) return null;

                const { is_channel, status } = supergroup;
                if (!status) return null;

                const { is_member, permissions } = status;

                switch (status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return <InputBox />;
                    }
                    case 'chatMemberStatusBanned': {
                        return <FooterCommand command={t('DeleteChat')} onCommand={this.handleDeleteAndExit} />;
                    }
                    case 'chatMemberStatusCreator': {
                        return is_member ? <InputBox /> : <FooterCommand command={is_channel ? t('ChannelJoin') : t('JoinGroup')} onCommand={this.handleJoin} />;
                    }
                    case 'chatMemberStatusLeft': {
                        return (
                            <FooterCommand
                                command={is_channel ? t('ChannelJoin') : t('JoinGroup')}
                                onCommand={this.handleJoin}
                            />
                        );
                    }
                    case 'chatMemberStatusMember': {
                        if (is_channel) {
                            return <NotificationsCommand chatId={chatId} />;
                        } else {
                            return <InputBox />;
                        }
                    }
                    case 'chatMemberStatusRestricted': {
                        if (is_member) {
                            return permissions && permissions.can_send_messages ? <InputBox /> : null;
                        } else {
                            return (
                                <FooterCommand
                                    command={is_channel ? t('ChannelJoin') : t('JoinGroup')}
                                    onCommand={this.handleJoin}
                                />
                            );
                        }
                    }
                }
            }
        }

        return null;
    }
}

export default withTranslation()(Footer);
