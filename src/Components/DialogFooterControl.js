import React from 'react';
import ChatStore from '../Stores/ChatStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import {withStyles} from '@material-ui/core/styles';
import InputBoxControl from './InputBoxControl';
import DialogCommandControl from './DialogCommandControl';
import { isChatMuted } from '../Utils/Chat';
import './DialogFooterControl.css';
import TdLibController from "../Controllers/TdLibController";

class DialogFooterControl extends React.Component {

    constructor(props){
        super(props);

        this.handleJoin = this.handleJoin.bind(this);
        this.handleMute = this.handleMute.bind(this);
        this.handleUnmute = this.handleUnmute.bind(this);

        this.onUpdate = this.onUpdate.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.selectedChatId !== this.props.selectedChatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ChatStore.on('updateChatNotificationSettings', this.onUpdate);
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatNotificationSettings', this.onUpdate);
    }

    onUpdate(update){
        if (!update.chat_id) return;
        if (update.chat_id !== this.props.selectedChatId) return;

        this.forceUpdate();
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

        const newNotificationSettings = {...chat.notification_settings};
        newNotificationSettings.mute_for = muteFor;

        TdLibController
            .send({
                '@type': 'setChatNotificationSettings',
                chat_id: chatId,
                notification_settings: newNotificationSettings
            });
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
                            return null;
                        }
                        case 'chatMemberStatusCreator' : {
                            return (<InputBoxControl/>);
                        }
                        case 'chatMemberStatusLeft' : {
                            return (<DialogCommandControl command='join' onCommand={this.handleJoin}/>);
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
                            return null;
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