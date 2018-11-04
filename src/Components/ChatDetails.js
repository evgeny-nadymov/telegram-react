/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import copy from 'copy-to-clipboard';
import {withStyles} from '@material-ui/core/styles';
import PhotoIcon from '@material-ui/icons/Photo';
import AlternateEmailIcon from '@material-ui/icons/AlternateEmail';
import CallIcon from '@material-ui/icons/Call';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import CloseIcon from '@material-ui/icons/Close';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ChatTileControl from './ChatTileControl';
import ChatDetailsHeaderControl from './ChatDetailsHeaderControl';
import DialogTitleControl from './DialogTitleControl';
import DialogStatusControl from './DialogStatusControl';
import NotificationsListItem from './NotificationsListItem';
import {
    getChatUsername,
    getChatPhoneNumber,
    getChatBio,
    isChatMuted,
    isGroupChat,
    isChannelChat,
    isChatMember
} from '../Utils/Chat';
import { isUserBlocked } from '../Utils/User';
import { formatPhoneNumber } from '../Utils/Common';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import BasicGroupStore from '../Stores/BasicGroupStore';
import SupergroupStore from '../Stores/SupergroupStore';
import TdLibController from '../Controllers/TdLibController';
import './ChatDetails.css';

const styles = theme => ({
    closeIconButton : {
        margin: '8px -2px 8px 12px',
    },
    nested: {
        // paddingLeft: theme.spacing.unit * 4,
    },
    close: {
        padding: theme.spacing.unit / 2,
    }
});

class ChatDetails extends React.Component {

    constructor(props) {
        super(props);

        const selectedChatId = ChatStore.getSelectedChatId();

        this.state = {
            selectedChatId: selectedChatId
        };

        this.handleBlock = this.handleBlock.bind(this);

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

        const selectedChatId = ChatStore.getSelectedChatId();
        const chat = ChatStore.get(selectedChatId);
        const isMuted = isChatMuted(chat);

        this.setState({ selectedChatId: selectedChatId, isMuted: isMuted, open: false });
    }

    handleClick = () => {
        this.setState(state => ({ open: !state.open }));
    };

    handleUsernameHint = () => {
        const { selectedChatId } = this.state;
        const username = getChatUsername(selectedChatId);
        if (!username) return;

        copy('https://t.me/' + username);

        this.setState({ openUsernameHint: true });
    };

    handleCloseUsernameHint = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ openUsernameHint: false });
    };

    handlePhoneHint = () => {
        const { selectedChatId } = this.state;
        const phoneNumber = getChatPhoneNumber(selectedChatId);
        if (!phoneNumber) return;

        copy(formatPhoneNumber(phoneNumber));

        this.setState({ openPhoneHint: true });
    };

    handleClosePhoneHint = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ openPhoneHint: false });
    };

    handleBlock(){
        const { selectedChatId } = this.state;

        const chat = ChatStore.get(selectedChatId);
        if (!chat) return;
        if (!chat.type) return;

        const { user_id } = chat.type;
        if (!user_id) return;

        TdLibController
            .send({
                '@type': isUserBlocked(user_id) ? 'unblockUser' : 'blockUser',
                user_id: user_id
            });
    }

    render() {
        const { classes } = this.props;
        const { selectedChatId } = this.state;
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
        const isGroup = isGroupChat(selectedChatId);
        let isBlocked = false;
        if (!isGroup && chat.type){
            isBlocked = isUserBlocked(chat.type.user_id);
        }
        const isMember = isChatMember(selectedChatId);
        const isChannel = isChannelChat(selectedChatId);

        return (
            <div className='chat-details'>
                <ChatDetailsHeaderControl/>
                <div className='chat-details-list'>
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
                                <>
                                    <ListItem button onClick={this.handleUsernameHint}>
                                        <ListItemIcon>
                                            <AlternateEmailIcon/>
                                        </ListItemIcon>
                                        <ListItemText primary={username}/>
                                    </ListItem>
                                    <Snackbar
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        }}
                                        open={this.state.openUsernameHint}
                                        autoHideDuration={3000}
                                        onClose={this.handleCloseUsernameHint}
                                        ContentProps={{
                                            'aria-describedby': 'message-id',
                                        }}
                                        message={<span id="message-id">Link copied</span>}
                                        action={[
                                            <IconButton
                                                key='close'
                                                aria-label='Close'
                                                color='inherit'
                                                className={classes.close}
                                                onClick={this.handleCloseUsernameHint}>
                                                <CloseIcon />
                                            </IconButton>,
                                        ]}
                                    />
                                </>
                        }
                        {
                            phoneNumber &&
                                <>
                                    <ListItem button onClick={this.handlePhoneHint}>
                                        <ListItemIcon>
                                            <CallIcon/>
                                        </ListItemIcon>
                                        <ListItemText primary={formatPhoneNumber(phoneNumber)}/>
                                    </ListItem>
                                    <Snackbar
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        }}
                                        open={this.state.openPhoneHint}
                                        autoHideDuration={3000}
                                        onClose={this.handleClosePhoneHint}
                                        ContentProps={{
                                            'aria-describedby': 'message-id',
                                        }}
                                        message={<span id='message-id'>Phone copied</span>}
                                        action={[
                                            <IconButton
                                                key='close'
                                                aria-label='Close'
                                                color='inherit'
                                                className={classes.close}
                                                onClick={this.handleClosePhoneHint}>
                                                <CloseIcon />
                                            </IconButton>,
                                        ]}
                                    />
                                </>
                        }
                        {
                            bio &&
                            <ListItem>
                                <ListItemIcon>
                                    <ErrorOutlineIcon className='chat-details-info-icon'/>
                                </ListItemIcon>
                                <ListItemText primary={bio} style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}/>
                            </ListItem>
                        }
                    </List>
                    <Divider/>
                    <List>
                        <NotificationsListItem chatId={selectedChatId}/>
                        <ListItem button onClick={this.handleClick}>
                            <ListItemIcon>
                                <MoreHorizIcon/>
                            </ListItemIcon>
                            <ListItemText primary='More'/>
                            {this.state.open ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={this.state.open} timeout='auto' unmountOnExit>
                            <List component='div' disablePadding>
                                {
                                    !isGroup &&
                                    <ListItem button onClick={this.handleBlock}>
                                        <ListItemText inset primary={ isBlocked? 'Unblock' : 'Block' }/>
                                    </ListItem>
                                }
                                {
                                    isGroup && isMember &&
                                    <ListItem button>
                                        <ListItemText inset primary={ isChannel? 'Leave Channel' : 'Delete and Exit' } />
                                    </ListItem>
                                }
                                {
                                    isGroup && !isMember &&
                                    <ListItem button>
                                        <ListItemText inset primary='Report' />
                                    </ListItem>
                                }
                            </List>
                        </Collapse>
                    </List>
                    <Divider/>
                    <List>
                        <ListItem button>
                            <ListItemIcon>
                                <PhotoIcon/>
                            </ListItemIcon>
                            <ListItemText primary='Shared Media'/>
                        </ListItem>
                        {/*<ListItem button>*/}
                            {/*<ListItemIcon>*/}
                                {/*<CloseIcon/>*/}
                            {/*</ListItemIcon>*/}
                            {/*<ListItemText primary='Groups in Common'/>*/}
                        {/*</ListItem>*/}
                    </List>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(ChatDetails);