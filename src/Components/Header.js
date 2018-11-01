/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import {withStyles} from '@material-ui/core/styles';
import {getChatSubtitle, isAccentChatSubtitle} from '../Utils/Chat';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import ApplicationStore from '../Stores/ApplicationStore';
import TdLibController from '../Controllers/TdLibController';
import './Header.css';

const styles = {
    button : {
        margin: '14px',
    },
    menuIconButton : {
        margin: '8px -2px 8px 12px',
    },
    searchIconButton : {
        margin: '8px 12px 8px 0',
    },
    messageSearchIconButton : {
        margin: '8px 0 8px 12px',
    },
    moreIconButton : {
        margin: '8px 12px 8px 0',
    }
};

class Header extends Component{

    constructor(props){
        super(props);

        this.state = {
            authorizationState: TdLibController.getState(),
            connectionState : '',
            open: false,
            anchorEl: null
        };

        this.onUpdateConnectionState = this.onUpdateConnectionState.bind(this);
        this.onUpdateAuthorizationState = this.onUpdateAuthorizationState.bind(this);

        this.onUpdateChatTitle = this.onUpdateChatTitle.bind(this);
        this.onUpdateUserStatus = this.onUpdateUserStatus.bind(this);
        this.onUpdateUserChatAction = this.onUpdateUserChatAction.bind(this);
        this.onUpdateBasicGroup = this.onUpdateBasicGroup.bind(this);
        this.onUpdateSupergroup = this.onUpdateSupergroup.bind(this);
        this.onUpdateBasicGroupFullInfo = this.onUpdateBasicGroupFullInfo.bind(this);
        this.onUpdateSupergroupFullInfo = this.onUpdateSupergroupFullInfo.bind(this);
        this.onUpdateUserFullInfo = this.onUpdateUserFullInfo.bind(this);

        this.onClientUpdateSelectedChatId = this.onClientUpdateSelectedChatId.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState !== this.state){
            return true;
        }

        return false;
    }

    componentDidMount(){
        TdLibController.on('tdlib_connection_state', this.onUpdateConnectionState);
        TdLibController.on('tdlib_status', this.onUpdateAuthorizationState);

        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.on('updateUserChatAction', this.onUpdateUserChatAction);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);

        ChatStore.on('clientUpdateSelectedChatId', this.onClientUpdateSelectedChatId);
    }

    componentWillUnmount(){
        TdLibController.removeListener('tdlib_connection_state', this.onUpdateConnectionState);
        TdLibController.removeListener('tdlib_status', this.onUpdateAuthorizationState);

        ChatStore.removeListener('updateChatTitle', this.onUpdateChatTitle);
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.removeListener('updateUserChatAction', this.onUpdateUserChatAction);
        UserStore.removeListener('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.removeListener('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.removeListener('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        BasicGroupStore.removeListener('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.removeListener('updateSupergroup', this.onUpdateSupergroup);

        ChatStore.removeListener('clientUpdateSelectedChatId', this.onClientUpdateSelectedChatId);
    }

    onClientUpdateSelectedChatId(update){
        this.forceUpdate();
    }

    onUpdateConnectionState(state) {
        this.setState({ connectionState: state });
    }

    onUpdateAuthorizationState(state) {
        this.setState({ authorizationState: state });
    }

    onUpdateChatTitle(update){
        const chat = ChatStore.get(ChatStore.getSelectedChatId());
        if (!chat) return;
        if (chat.id !== update.chat_id) return;

        this.forceUpdate();
    }

    onUpdateUserStatus(update){
        const chat = ChatStore.get(ChatStore.getSelectedChatId());
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup' : {
                const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
                if (fullInfo && fullInfo.members) {
                    const member = fullInfo.members.find(x => x.user_id === update.user_id);
                    if (member) {
                        this.forceUpdate();
                    }
                }
                break;
            }
            case 'chatTypePrivate' : {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate();
                }
                break;
            }
            case 'chatTypeSecret' : {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate();
                }
                break;
            }
            case 'chatTypeSupergroup' : {
                break;
            }
        }
    }

    onUpdateUserChatAction(update){
        const selectedChatId = ChatStore.getSelectedChatId();

        if (selectedChatId === update.chat_id){
            this.forceUpdate();
        }
    }

    onUpdateBasicGroup(update){
        const chat = ChatStore.get(ChatStore.getSelectedChatId());
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeBasicGroup'
            && chat.type.basic_group_id === update.basic_group.id){
            this.forceUpdate();
        }
    }

    onUpdateSupergroup(update){
        const chat = ChatStore.get(ChatStore.getSelectedChatId());
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeSupergroup'
            && chat.type.supergroup_id === update.supergroup.id){
            this.forceUpdate();
        }
    }

    onUpdateBasicGroupFullInfo(update){
        const chat = ChatStore.get(ChatStore.getSelectedChatId());
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeBasicGroup'
            && chat.type.basic_group_id === update.basic_group_id){
            this.forceUpdate();
        }
    }

    onUpdateSupergroupFullInfo(update){
        const chat = ChatStore.get(ChatStore.getSelectedChatId());
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeSupergroup'
            && chat.type.supergroup_id === update.supergroup_id){
            this.forceUpdate();
        }
    }

    onUpdateUserFullInfo(update){
        const chat = ChatStore.get(ChatStore.getSelectedChatId());
        if (!chat) return;

        if (chat.type
            && (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret')
            && chat.type.user_id === update.user_id){
            this.forceUpdate();
        }
    }

    openChatDetails(){
        const chatId = ChatStore.getSelectedChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        ApplicationStore.changeChatDetailsVisibility(true);
    }

    render(){
        const {classes} = this.props;
        const {authorizationState, connectionState} = this.state;
        const chat = ChatStore.get(ChatStore.getSelectedChatId());

        let title = '';
        let titleProgressAnimation = (
            <>
                <span className='header-progress'>.</span>
                <span className='header-progress'>.</span>
                <span className='header-progress'>.</span>
            </>);
        let subtitle = '';
        let isAccentSubtitle = isAccentChatSubtitle(chat);
        if (authorizationState && authorizationState.status !== 'ready'){
            title = 'Loading';
        }
        else if (connectionState){
            switch (connectionState['@type'] ){
                case 'connectionStateConnecting':
                    title = 'Connecting';
                    break;
                case 'connectionStateConnectingToProxy':
                    title = 'Connecting to proxy';
                    break;
                case 'connectionStateReady':
                    break;
                case 'connectionStateUpdating':
                    title = 'Updating';
                    break;
                case 'connectionStateWaitingForNetwork':
                    title = 'Waiting for network';
                    break;
            }
        }

        if (title === ''){
            titleProgressAnimation = null;

            if (chat){
                title = chat.title || 'Deleted account';
                subtitle = getChatSubtitle(chat);
            }
        }

        return (
            <div className='header-details'>
                <div className={classNames('header-status', 'grow', chat ? 'cursor-pointer' : 'cursor-default')} onClick={this.openChatDetails}>
                    <span className='header-status-content'>{title}</span>
                    {titleProgressAnimation}
                    <span className={isAccentSubtitle ? 'header-status-title-accent' : 'header-status-title'}>{subtitle}</span>
                    <span className='header-status-tail'/>
                </div>
                {
                    chat &&
                        <>
                            <IconButton className={classes.messageSearchIconButton} aria-label='Search'>
                                <SearchIcon/>
                            </IconButton>
                            < IconButton className={classes.moreIconButton} aria-label='More'>
                            <MoreVertIcon />
                            </IconButton>
                        </>
                }
            </div>
        );
    }
}

export default withStyles(styles)(Header);