/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getChatSubtitle, isAccentChatSubtitle } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import './HeaderChatSubtitle.css';

class HeaderChatSubtitle extends React.Component {
    componentDidMount() {
        ChatStore.on('updateChatOnlineMemberCount', this.onUpdateChatOnlineMemberCount);
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.on('updateUserChatAction', this.onUpdateUserChatAction);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
    }

    componentWillUnmount() {
        ChatStore.off('updateChatOnlineMemberCount', this.onUpdateChatOnlineMemberCount);
        ChatStore.off('updateChatTitle', this.onUpdateChatTitle);
        UserStore.off('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.off('updateUserChatAction', this.onUpdateUserChatAction);
        UserStore.off('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.off('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.off('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        BasicGroupStore.off('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.off('updateSupergroup', this.onUpdateSupergroup);
    }

    onUpdateChatOnlineMemberCount = update => {
        const { chatId } = this.props;
        if (chatId !== update.chat_id) return;

        this.forceUpdate();
    };

    onUpdateChatTitle = update => {
        const { chatId } = this.props;
        if (chatId !== update.chat_id) return;

        this.forceUpdate();
    };

    onUpdateUserChatAction = update => {
        const { chatId } = this.props;
        if (chatId !== update.chat_id) return;

        this.forceUpdate();
    };

    onUpdateUserStatus = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
                if (fullInfo && fullInfo.members) {
                    const member = fullInfo.members.find(x => x.user_id === update.user_id);
                    if (member) {
                        this.forceUpdate();
                    }
                }
                break;
            }
            case 'chatTypePrivate': {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate();
                }
                break;
            }
            case 'chatTypeSecret': {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate();
                }
                break;
            }
            case 'chatTypeSupergroup': {
                break;
            }
        }
    };

    onUpdateUserFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        if (
            (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret') &&
            chat.type.user_id === update.user_id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateBasicGroupFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        if (chat.type['@type'] === 'chatTypeBasicGroup' && chat.type.basic_group_id === update.basic_group_id) {
            this.forceUpdate();
        }
    };

    onUpdateSupergroupFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        if (chat.type['@type'] === 'chatTypeSupergroup' && chat.type.supergroup_id === update.supergroup_id) {
            this.forceUpdate();
        }
    };

    onUpdateBasicGroup = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        if (chat.type['@type'] === 'chatTypeBasicGroup' && chat.type.basic_group_id === update.basic_group.id) {
            this.forceUpdate();
        }
    };

    onUpdateSupergroup = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        if (chat.type['@type'] === 'chatTypeSupergroup' && chat.type.supergroup_id === update.supergroup.id) {
            this.forceUpdate();
        }
    };

    render() {
        const { chatId } = this.props;

        const subtitle = getChatSubtitle(chatId, true);
        const isAccentSubtitle = isAccentChatSubtitle(chatId);

        return (
            <div className={classNames('header-chat-subtitle', { 'header-chat-subtitle-accent': isAccentSubtitle })}>
                {subtitle}
            </div>
        );
    }
}

HeaderChatSubtitle.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default HeaderChatSubtitle;
