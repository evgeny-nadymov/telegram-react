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
import { hasBasicGroupId, hasSupergroupId } from '../../Utils/Chat';
import { unblockSender } from '../../Actions/Message';
import ChatStore from '../../Stores/ChatStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './Footer.css';

class Footer extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        const { t, chatId } = this.props;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.t !== t) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        ChatStore.on('updateChatIsBlocked', this.onUpdateChatIsBlocked);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
    }

    componentWillUnmount() {
        BasicGroupStore.off('updateBasicGroup', this.onUpdateBasicGroup);
        ChatStore.off('updateChatIsBlocked', this.onUpdateChatIsBlocked);
        SupergroupStore.off('updateSupergroup', this.onUpdateSupergroup);
    }

    onUpdateChatIsBlocked = update => {
        const { chatId } = this.props;

        if (chatId === update.chat_id) {
            this.forceUpdate();
        }
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
    }

    render() {
        const { chatId, t } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { type, is_blocked } = chat;
        if (!type) return null;

        if (is_blocked) {
            return <FooterCommand command={t('Unblock')} onCommand={this.handleUnblock} />;
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
