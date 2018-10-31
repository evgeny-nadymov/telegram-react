/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import ChatTileControl from './ChatTileControl';
import ChatDetailsHeaderControl from './ChatDetailsHeaderControl';
import ChatStore from '../Stores/ChatStore';
import DialogTitleControl from './DialogTitleControl';
import DialogStatusControl from './DialogStatusControl';
import CloseIcon from '@material-ui/icons/Close';
import AlternateEmailIcon from '@material-ui/icons/AlternateEmail';
import CallIcon from '@material-ui/icons/Call';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsActiveIcon from '@material-ui/icons/NotificationsActive';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import StarBorder from '@material-ui/icons/StarBorder';
import Collapse from '@material-ui/core/Collapse';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Switch from '@material-ui/core/Switch';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import List from '@material-ui/core/List';
import { getChatUsername, getChatPhoneNumber, getChatBio, isAccentChatSubtitle } from '../Utils/Chat';
import { formatPhoneNumber } from '../Utils/Common';
import './ChatDetails.css';
import UserStore from '../Stores/UserStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';

const styles = {
    closeIconButton : {
        margin: '8px -2px 8px 12px',
    },
    nested: {
        // paddingLeft: theme.spacing.unit * 4,
    },
};

class ChatDetails extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selectedChatId: ChatStore.getSelectedChatId(),
            notifications: true
        };

        this.handleToggleNotifications = this.handleToggleNotifications.bind(this);
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
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        ChatStore.on('clientUpdateSelectedChatId', this.onClientUpdateSelectedChatId);
    }

    componentWillUnmount(){
        UserStore.removeListener('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.removeListener('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.removeListener('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        ChatStore.removeListener('clientUpdateSelectedChatId', this.onClientUpdateSelectedChatId);
    }

    onUpdateBasicGroupFullInfo(update){
        const chat = ChatStore.get(this.state.selectedChatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeBasicGroup'
            && chat.type.basic_group_id === update.basic_group_id){
            this.forceUpdate(); // update bio
        }
    }

    onUpdateSupergroupFullInfo(update){
        const chat = ChatStore.get(this.state.selectedChatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeSupergroup'
            && chat.type.supergroup_id === update.supergroup_id){
            this.forceUpdate(); // update bio
        }
    }

    onUpdateUserFullInfo(update){
        const chat = ChatStore.get(this.state.selectedChatId);
        if (!chat) return;

        if (chat.type
            && (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret')
            && chat.type.user_id === update.user_id){
            this.forceUpdate(); // update bio
        }
    }

    onClientUpdateSelectedChatId(update){
        this.setState({ selectedChatId: ChatStore.getSelectedChatId() });
    }

    handleToggleNotifications(){
        this.setState({ notifications: !this.state.notifications });
    }

    handleClick = () => {
        this.setState(state => ({ open: !state.open }));
    };

    render() {
        // const { classes } = this.props;
        const { selectedChatId, notifications } = this.state;
        const chat = ChatStore.get(selectedChatId);
        if (!chat) {
            return (
                <div className='chat-details'>
                    <ChatDetailsHeaderControl/>
                </div>
            );
        }

        const username = getChatUsername(selectedChatId);
        const phoneNumber = getChatPhoneNumber(selectedChatId);
        const bio = getChatBio(selectedChatId);

        return (
            <div className='chat-details'>
                <ChatDetailsHeaderControl/>
                <div className='chat-details-info'>
                    <div className='dialog-wrapper'>
                        <ChatTileControl chatId={selectedChatId}/>
                        <div className='dialog-inner-wrapper'>
                            <div className='dialog-row-wrapper'>
                                <DialogTitleControl chatId={selectedChatId}/>
                            </div>
                            <div className='dialog-row-wrapper'>
                                <DialogStatusControl chatId={selectedChatId}/>
                            </div>
                        </div>
                    </div>
                </div>
                <List>
                    {
                        username &&
                        <ListItem>
                            <ListItemIcon>
                                <AlternateEmailIcon/>
                            </ListItemIcon>
                            <ListItemText primary={username}/>
                        </ListItem>
                    }
                    {
                        phoneNumber &&
                        <ListItem>
                            <ListItemIcon>
                                <CallIcon/>
                            </ListItemIcon>
                            <ListItemText primary={formatPhoneNumber(phoneNumber)}/>
                        </ListItem>
                    }
                    {
                        bio &&
                        <ListItem>
                            <ListItemIcon>
                                <ErrorOutlineIcon/>
                            </ListItemIcon>
                            <ListItemText primary={bio}/>
                        </ListItem>
                    }
                </List>
                <Divider/>
                <List>
                    <ListItem button onClick={this.handleToggleNotifications}>
                        <ListItemIcon>
                            {
                                notifications
                                    ? <NotificationsActiveIcon/>
                                    : <NotificationsIcon/>
                            }
                        </ListItemIcon>
                        <ListItemText primary='Notifications'/>
                        <ListItemSecondaryAction>
                            <Switch
                                color='primary'
                                onChange={this.handleToggleNotifications}
                                checked={notifications}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <ListItem button onClick={this.handleClick}>
                        <ListItemIcon>
                            <MoreHorizIcon/>
                        </ListItemIcon>
                        <ListItemText primary='More'/>
                        {this.state.open ? <ExpandLess /> : <ExpandMore />}
                    </ListItem>
                    <Collapse in={this.state.open} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                            <ListItem button>
                                <ListItemIcon>
                                    <StarBorder />
                                </ListItemIcon>
                                <ListItemText inset primary="Starred" />
                            </ListItem>
                        </List>
                    </Collapse>
                </List>
                <Divider/>
                <List>
                    <ListItem button>
                        <ListItemIcon>
                            <CloseIcon/>
                        </ListItemIcon>
                        <ListItemText primary='Shared Media'/>
                    </ListItem>
                    <ListItem button>
                        <ListItemIcon>
                            <CloseIcon/>
                        </ListItemIcon>
                        <ListItemText primary='Groups in Common'/>
                    </ListItem>
                </List>
            </div>
        );
    }
}

export default withStyles(styles)(ChatDetails);