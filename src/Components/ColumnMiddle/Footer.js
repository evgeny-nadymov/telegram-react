/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import InputBoxControl from './InputBoxControl';
import FooterCommand from './FooterCommand';
import NotificationsCommandControl from './NotificationsCommandControl';
import { hasBasicGroupId, hasSupergroupId } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './Footer.css';

class Footer extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chatId !== this.props.chatId) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
    }

    componentWillUnmount() {
        BasicGroupStore.off('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.off('updateSupergroup', this.onUpdateSupergroup);
    }

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

    render() {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { type } = chat;
        if (!type) return null;

        switch (type['@type']) {
            case 'chatTypeBasicGroup': {
                const basicGroup = BasicGroupStore.get(type.basic_group_id);
                if (!basicGroup) return null;

                const { status } = basicGroup;
                if (!status) return null;

                const { is_member, permissions } = status;

                switch (status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return <InputBoxControl />;
                    }
                    case 'chatMemberStatusBanned': {
                        return <FooterCommand command='delete and exit' onCommand={this.handleDeleteAndExit} />;
                    }
                    case 'chatMemberStatusCreator': {
                        return is_member ? <InputBoxControl /> : null;
                    }
                    case 'chatMemberStatusLeft': {
                        return null;
                    }
                    case 'chatMemberStatusMember': {
                        return <InputBoxControl />;
                    }
                    case 'chatMemberStatusRestricted': {
                        if (is_member) {
                            return permissions && permissions.can_send_messages ? <InputBoxControl /> : null;
                        } else {
                            return <FooterCommand command='join' onCommand={this.handleJoin} />;
                        }
                    }
                }
                break;
            }
            case 'chatTypePrivate': {
                return <InputBoxControl />;
            }
            case 'chatTypeSecret': {
                return <InputBoxControl />;
            }
            case 'chatTypeSupergroup': {
                const supergroup = SupergroupStore.get(type.supergroup_id);
                if (!supergroup) return null;

                const { is_channel, status } = supergroup;
                if (!status) return null;

                const { is_member, permissions } = status;

                switch (status['@type']) {
                    case 'chatMemberStatusAdministrator': {
                        return <InputBoxControl />;
                    }
                    case 'chatMemberStatusBanned': {
                        return <FooterCommand command='delete and exit' onCommand={this.handleDeleteAndExit} />;
                    }
                    case 'chatMemberStatusCreator': {
                        return is_member ? <InputBoxControl /> : null;
                    }
                    case 'chatMemberStatusLeft': {
                        return <FooterCommand command='join' onCommand={this.handleJoin} />;
                    }
                    case 'chatMemberStatusMember': {
                        if (is_channel) {
                            return <NotificationsCommandControl chatId={chatId} />;
                        } else {
                            return <InputBoxControl />;
                        }
                    }
                    case 'chatMemberStatusRestricted': {
                        if (is_member) {
                            return permissions && permissions.can_send_messages ? <InputBoxControl /> : null;
                        } else {
                            return <FooterCommand command='join' onCommand={this.handleJoin} />;
                        }
                    }
                }
            }
        }

        return null;
    }
}

export default Footer;
