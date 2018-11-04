/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import InputBoxControl from './InputBoxControl';
import DialogCommandControl from './DialogCommandControl';
import NotificationsCommandControl from './NotificationsCommandControl';
import ChatStore from '../Stores/ChatStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import TdLibController from '../Controllers/TdLibController';
import './DialogFooterControl.css';

class DialogFooterControl extends React.Component {

    constructor(props){
        super(props);

        this.handleJoin = this.handleJoin.bind(this);
        this.handleDeleteAndExit = this.handleDeleteAndExit.bind(this);

        this.onUpdateBasicGroup = this.onUpdateBasicGroup.bind(this);
        this.onUpdateSupergroup = this.onUpdateSupergroup.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.selectedChatId !== this.props.selectedChatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
    }

    componentWillUnmount(){
        BasicGroupStore.removeListener('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.removeListener('updateSupergroup', this.onUpdateSupergroup);
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
        const { selectedChatId } = this.props;
        const chat = ChatStore.get(selectedChatId);
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
                                return (<NotificationsCommandControl chatId={selectedChatId}/>);
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