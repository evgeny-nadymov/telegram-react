/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import { getChatSubtitleWithoutTyping, isAccentChatSubtitle } from '../Utils/Chat';
import './DialogStatusControl.css';

class DialogStatusControl extends React.Component {

    constructor(props){
        super(props);

        const {chatId} = this.props;
        const subtitle = DialogStatusControl.getChatSubtitleInternal(chatId);

        this.state = {
            subtitle: subtitle,
            previousChatId: chatId
        };

        this.onUpdateUserStatus = this.onUpdateUserStatus.bind(this);
        this.onUpdateBasicGroup = this.onUpdateBasicGroup.bind(this);
        this.onUpdateSupergroup = this.onUpdateSupergroup.bind(this);
        this.onUpdateUserFullInfo = this.onUpdateUserFullInfo.bind(this);
        this.onUpdateBasicGroupFullInfo = this.onUpdateBasicGroupFullInfo.bind(this);
        this.onUpdateSupergroupFullInfo = this.onUpdateSupergroupFullInfo.bind(this);
    }

    static getDerivedStateFromProps(props, state) {
        // Any time the current chat changes,
        // Reset any parts of state that are tied to that chat.
        if (props.chatId !== state.prevChatId) {
            const subtitle = DialogStatusControl.getChatSubtitleInternal(props.chatId);

            return {
                prevChatId: props.chatId,
                subtitle: subtitle
            };
        }
        return null;
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        if (nextState.subtitle !== this.state.subtitle){
            return true;
        }

        return false;
    }

    componentDidMount(){
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    componentWillUnmount(){
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
        BasicGroupStore.removeListener('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.removeListener('updateSupergroup', this.onUpdateSupergroup);
        UserStore.removeListener('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.removeListener('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.removeListener('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    onUpdateUserStatus(update){
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup' : {
                const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
                if (fullInfo && fullInfo.members) {
                    const member = fullInfo.members.find(x => x.user_id === update.user_id);
                    if (member) {
                        this.setState({ subtitle: DialogStatusControl.getChatSubtitleInternal(chatId) });
                    }
                }
                break;
            }
            case 'chatTypePrivate' : {
                if (chat.type.user_id === update.user_id) {
                    this.setState({ subtitle: DialogStatusControl.getChatSubtitleInternal(chatId) });
                }
                break;
            }
            case 'chatTypeSecret' : {
                if (chat.type.user_id === update.user_id) {
                    this.setState({ subtitle: DialogStatusControl.getChatSubtitleInternal(chatId) });
                }
                break;
            }
            case 'chatTypeSupergroup' : {
                break;
            }
        }
    }

    onUpdateUserFullInfo(update){
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (chat.type
            && (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret')
            && chat.type.user_id === update.user_id){
            this.setState({ subtitle: DialogStatusControl.getChatSubtitleInternal(chatId) });
        }
    }

    onUpdateBasicGroupFullInfo(update){
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeBasicGroup'
            && chat.type.basic_group_id === update.basic_group_id){
            this.setState({ subtitle: DialogStatusControl.getChatSubtitleInternal(chatId) });
        }
    }

    onUpdateSupergroupFullInfo(update){
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeSupergroup'
            && chat.type.supergroup_id === update.supergroup_id){
            this.setState({ subtitle: DialogStatusControl.getChatSubtitleInternal(chatId) });
        }
    }

    onUpdateBasicGroup(update){
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeBasicGroup'
            && chat.type.basic_group_id === update.basic_group.id){
            this.setState({ subtitle: DialogStatusControl.getChatSubtitleInternal(chatId) });
        }
    }

    onUpdateSupergroup(update){
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeSupergroup'
            && chat.type.supergroup_id === update.supergroup.id){
            this.setState({ subtitle: DialogStatusControl.getChatSubtitleInternal(chatId) });
        }
    }

    static getChatSubtitleInternal(chatId){
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        return getChatSubtitleWithoutTyping(chat);
    }

    render() {
        const { subtitle } = this.state;

        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        let isAccentSubtitle = isAccentChatSubtitle(chat);

        return (
            <div className={isAccentSubtitle ? 'dialog-status-accent' : 'dialog-status'}>
                {subtitle}
            </div>
        );
    }
}

export default DialogStatusControl;