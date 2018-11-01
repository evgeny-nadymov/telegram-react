/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import InputBoxControl from './InputBoxControl';
import DialogCommandControl from './DialogCommandControl';
import { isChatMuted } from '../Utils/Chat';
import { debounce } from '../Utils/Common';
import ChatStore from '../Stores/ChatStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import ApplicationStore from '../Stores/ApplicationStore';
import TdLibController from '../Controllers/TdLibController';
import './DialogFooterControl.css';

class DialogFooterControl extends React.Component {

    constructor(props){
        super(props);

        this.handleJoin = this.handleJoin.bind(this);
        this.handleMute = this.handleMute.bind(this);
        this.handleUnmute = this.handleUnmute.bind(this);
        this.handleDeleteAndExit = this.handleDeleteAndExit.bind(this);

        this.onUpdateBasicGroup = this.onUpdateBasicGroup.bind(this);
        this.onUpdateSupergroup = this.onUpdateSupergroup.bind(this);
        this.onUpdateChatNotificationSettings = this.onUpdateChatNotificationSettings.bind(this);
        this.onUpdateScopeNotificationSettings = this.onUpdateScopeNotificationSettings.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.selectedChatId !== this.props.selectedChatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ChatStore.on('updateChatNotificationSettings', this.onUpdateChatNotificationSettings);
        ApplicationStore.on('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatNotificationSettings', this.onUpdateChatNotificationSettings);
        ApplicationStore.removeListener('updateScopeNotificationSettings', this.onUpdateScopeNotificationSettings);
        BasicGroupStore.removeListener('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.removeListener('updateSupergroup', this.onUpdateSupergroup);
    }

    onUpdateChatNotificationSettings(update){
        if (!update.chat_id) return;
        if (update.chat_id !== this.props.selectedChatId) return;

        this.forceUpdate();
    }

    onUpdateScopeNotificationSettings(update){
        const chat = ChatStore.get(this.props.selectedChatId);
        if (!chat) return;

        switch (update.scope['@type']) {
            case 'notificationSettingsScopeGroupChats': {
                if (chat.type['@type'] === 'chatTypeBasicGroup'
                    || chat.type['@type'] === 'chatTypeSupergroup'){
                    this.forceUpdate();
                }
                break;
            }
            case 'notificationSettingsScopePrivateChats':{
                if (chat.type['@type'] === 'chatTypePrivate'
                    || chat.type['@type'] === 'chatTypeSecret'){
                    this.forceUpdate();
                }
                break;
            }
        }
    }

    onUpdateBasicGroup(update){
        const chat = ChatStore.get(this.props.selectedChatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeBasicGroup'
            && chat.type.basic_group_id === update.basic_group.id){
            this.forceUpdate();
        }
    }

    onUpdateSupergroup(update){
        const chat = ChatStore.get(this.props.selectedChatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeSupergroup'
            && chat.type.supergroup_id === update.supergroup.id){
            this.forceUpdate();
        }
    }

    handleJoin(){
        if (!this.props.selectedChatId) return;

        TdLibController
            .send({
                '@type': 'joinChat',
                chat_id: this.props.selectedChatId
            });
    }

    handleMute(){
        if (!this.props.selectedChatId) return;

        this.setChatNotificationSettings(this.props.selectedChatId, 2147483647); // int32.max = 2^32 - 1
    }

    handleUnmute(){
        if (!this.props.selectedChatId) return;

        this.setChatNotificationSettings(this.props.selectedChatId, 0);
    }

    setChatNotificationSettings(chatId, muteFor){
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.notification_settings) return;

        const newNotificationSettings = {...chat.notification_settings, use_default_mute_for : false, mute_for : muteFor};

        TdLibController
            .send({
                '@type': 'setChatNotificationSettings',
                chat_id: chatId,
                notification_settings: newNotificationSettings
            });
    }

    handleDeleteAndExit(){
        if (!this.props.selectedChatId) return;

        TdLibController
            .send({
                '@type': 'deleteChatHistory',
                chat_id: this.props.selectedChatId,
                remove_from_chat_list: true
            });

        // TdLibController
        //     .send({
        //         '@type': 'leaveChat',
        //         chat_id: this.props.selectedChatId
        //     });
    }

    render() {
        const chat = ChatStore.get(this.props.selectedChatId);
        if (!chat) return null;
        if (!chat.type) return null;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup' : {
                const basicGroup = BasicGroupStore.get(chat.type.basic_group_id);
                if (basicGroup && basicGroup.status){
                    switch (basicGroup.status['@type']) {
                        case 'chatMemberStatusAdministrator' : {
                            return (<InputBoxControl/>);
                        }
                        case 'chatMemberStatusBanned' : {
                            return (<DialogCommandControl command='delete and exit' onCommand={this.handleDeleteAndExit}/>);
                        }
                        case 'chatMemberStatusCreator' : {
                            return (<InputBoxControl/>);
                        }
                        case 'chatMemberStatusLeft' : {
                            return null;
                        }
                        case 'chatMemberStatusMember' : {
                            return (<InputBoxControl/>);
                        }
                        case 'chatMemberStatusRestricted' : {
                            if (basicGroup.status.is_member){
                                return (<InputBoxControl/>);
                            }
                            else{
                                return (<DialogCommandControl command='join' onCommand={this.handleJoin}/>);
                            }
                        }
                    }
                }
                
                break;
            }
            case 'chatTypePrivate' : {
                return (<InputBoxControl/>);
            }
            case 'chatTypeSecret' : {
                return (<InputBoxControl/>);
            }
            case 'chatTypeSupergroup' : {
                const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                if (supergroup && supergroup.status){
                    switch (supergroup.status['@type']) {
                        case 'chatMemberStatusAdministrator' : {
                            return (<InputBoxControl/>);
                        }
                        case 'chatMemberStatusBanned' : {
                            return (<DialogCommandControl command='delete and exit' onCommand={this.handleDeleteAndExit}/>);
                        }
                        case 'chatMemberStatusCreator' : {
                            return (<InputBoxControl/>);
                        }
                        case 'chatMemberStatusLeft' : {
                            return (<DialogCommandControl command='join' onCommand={this.handleJoin}/>);
                        }
                        case 'chatMemberStatusMember' : {
                            if (supergroup.is_channel){
                                const isMuted = isChatMuted(chat);
                                return (
                                    <DialogCommandControl
                                        command={isMuted ? 'unmute' : 'mute'}
                                        onCommand={isChatMuted(chat) ? this.handleUnmute : this.handleMute}/>
                                );
                            }
                            else{
                                return (<InputBoxControl/>);
                            }
                        }
                        case 'chatMemberStatusRestricted' : {
                            if (supergroup.status.is_member){
                                return (<InputBoxControl/>);
                            }
                            else{
                                return (<DialogCommandControl command='join' onCommand={this.handleJoin}/>);
                            }
                        }
                    }
                }
            }
        }

        return null;
    }
}

export default DialogFooterControl;