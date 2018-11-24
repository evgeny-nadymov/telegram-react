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
import CloseIcon from '@material-ui/icons/Close';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import UserControl from '../Tile/UserControl';
import ChatControl from '../Tile/ChatControl';
import ChatDetailsHeaderControl from './ChatDetailsHeaderControl';
import NotificationsListItem from './NotificationsListItem';
import MoreListItem from './MoreListItem';
import {
    getChatUsername,
    getChatPhoneNumber,
    getChatBio,
    isGroupChat,
    getGroupChatMembers,
    getChatFullInfo
} from '../../Utils/Chat';
import {
    getUserStatusOrder,
} from '../../Utils/User';
import {
    loadUserPhotos,
    loadChatPhotos
} from '../../Utils/File';
import { formatPhoneNumber } from '../../Utils/Common';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import OptionStore from '../../Stores/OptionStore';
import FileStore from '../../Stores/FileStore';
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

        this.chatDetailsListRef = React.createRef();

        const { chatId } = this.props;

        this.members = new Map();
        this.state = {
            prevChatId: chatId
        };
    }

    static getDerivedStateFromProps(props, state){
        if (props.chatId !== state.prevChatId){

            return {
                prevChatId: props.chatId
            }
        }

        return null;
    }

    getSnapshotBeforeUpdate(prevProps, prevState) {
        const { chatId } = this.props;

        const list = this.chatDetailsListRef.current;
        const { scrollTop, scrollHeight, offsetHeight } = list;
        const snapshot = {
            scrollTop : scrollTop,
            scrollHeight : scrollHeight,
            offsetHeight : offsetHeight
        };

        console.log(`[ChatDetails] getSnapshotBeforeUpdate chatId=${chatId} scrollTop=${scrollTop} scrollHeight=${scrollHeight} offsetHeight=${offsetHeight}`);

        return snapshot;
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        if (nextState.openUsernameHint !== this.state.openUsernameHint){
            return true;
        }

        if (nextState.openPhoneHint !== this.state.openPhoneHint){
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        const { chatId } = this.props;
        if (prevProps.chatId !== chatId) {
            this.handleSelectChat();
        }

        const list = this.chatDetailsListRef.current;
        const { scrollTop, scrollHeight, offsetHeight } = snapshot;
        console.log(`[ChatDetails] componentDidUpdate before chatId=${chatId} list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight}`);
        list.scrollTop = scrollTop + (list.scrollHeight - scrollHeight);
        console.log(`[ChatDetails] componentDidUpdate after chatId=${chatId} list.scrollTop=${list.scrollTop} list.offsetHeight=${list.offsetHeight} list.scrollHeight=${list.scrollHeight}`);
    }

    componentDidMount(){
        this.handleSelectChat();

        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    componentWillUnmount(){
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
        UserStore.removeListener('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.removeListener('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.removeListener('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    onUpdateBasicGroupFullInfo = (update) => {
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeBasicGroup'
            && chat.type.basic_group_id === update.basic_group_id){

            console.log('[ChatDetails] onUpdateBasicGroupFullInfo');
            this.handleSelectChat();

            this.forceUpdate(); // update bio

        }
    };

    onUpdateSupergroupFullInfo = (update) => {
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeSupergroup'
            && chat.type.supergroup_id === update.supergroup_id){

            console.log('[ChatDetails] onUpdateSupergroupFullInfo');
            this.forceUpdate(); // update bio
        }
    };

    onUpdateUserFullInfo = (update) => {
        const chat = ChatStore.get(this.props.chatId);
        if (!chat) return;

        if (chat.type
            && (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret')
            && chat.type.user_id === update.user_id){

            console.log('[ChatDetails] onUpdateUserFullInfo');
            this.forceUpdate(); // update bio
        }
    };

    onUpdateUserStatus = (update) => {
        if (this.members.has(update.user_id)){

            console.log('[ChatDetails] onUpdateUserStatus');
            this.forceUpdate();
        }
    };

    handleSelectChat = () => {
        this.getFullInfo();

        this.loadChatContents();
    };

    loadChatContents = () => {
        const { chatId } = this.props;

        const store = FileStore.getStore();

        loadChatPhotos(store, [chatId]);
        const members = getGroupChatMembers(chatId).map(x => x.user_id);
        loadUserPhotos(store, members);
    };

    getFullInfo = () => {
        const { chatId } = this.props;

        getChatFullInfo(chatId);
    };

    handleUsernameHint = () => {
        const { chatId } = this.props;
        const username = getChatUsername(chatId);
        if (!username) return;

        const telegramUrlOption = OptionStore.get('t_me_url');
        const usernameLink = telegramUrlOption ? telegramUrlOption.value : 'https://telegram.org/';

        copy(usernameLink + username);

        this.setState({ openUsernameHint: true, openPhoneHint: false });
    };

    handleCloseUsernameHint = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ openUsernameHint: false });
    };

    handlePhoneHint = () => {
        const { chatId } = this.props;
        const phoneNumber = getChatPhoneNumber(chatId);
        if (!phoneNumber) return;

        copy(formatPhoneNumber(phoneNumber));

        this.setState({ openUsernameHint: false, openPhoneHint: true });
    };

    handleClosePhoneHint = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        this.setState({ openPhoneHint: false });
    };

    handleGroupsInCommon = () => {

    };

    handleHeaderClick = () => {
        console.log('[ChatDetails] handleHeaderClick');
        this.chatDetailsListRef.current.scrollTop = 0;
    };

    render() {
        const { chatId, classes, openSharedMedia, onSelectUser } = this.props;
        const { openUsernameHint, openPhoneHint } = this.state;

        const chat = ChatStore.get(chatId);
        if (!chat) {
            return (
                <div className='chat-details'>
                    <ChatDetailsHeaderControl/>
                </div>
            );
        }

        const username = getChatUsername(chatId);
        const phoneNumber = getChatPhoneNumber(chatId);
        const bio = getChatBio(chatId);
        const isGroup = isGroupChat(chatId);

        const members = getGroupChatMembers(chatId);
        const users = [];
        this.members = new Map();
        members.forEach((member) => {
            const user = UserStore.get(member.user_id);
            if (user){
                this.members.set(user.id, user.id);
                users.push(user);
            }
        });

        const sortedUsers = users.sort((x, y) => {
            return getUserStatusOrder(y) - getUserStatusOrder(x);
        });
        const items = sortedUsers.map(user => (<ListItem button key={user.id}><UserControl userId={user.id} onSelect={onSelectUser}/></ListItem>));
        // const items = sortedUsers.map(user => (<div key={user.id} style={{margin: '12px', height: '50px', width: '50px', background: 'red'}}/>));

        return (
            <div className='chat-details'>
                <ChatDetailsHeaderControl
                    backButton={this.props.backButton}
                    onClose={this.props.onClose}
                    onClick={this.handleHeaderClick}/>
                <div ref={this.chatDetailsListRef} className='chat-details-list'>
                    <div className='chat-details-info'>
                        <ChatControl chatId={chatId}/>
                    </div>
                    <List>
                        {
                            username &&
                                <>
                                    <ListItem button onClick={this.handleUsernameHint}>
                                        <ListItemIcon>
                                            <AlternateEmailIcon/>
                                        </ListItemIcon>
                                        <ListItemText primary={<Typography variant='inherit' noWrap>{username}</Typography>}/>
                                    </ListItem>
                                    <Snackbar
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        }}
                                        open={openUsernameHint}
                                        autoHideDuration={3000}
                                        onClose={this.handleCloseUsernameHint}
                                        ContentProps={{
                                            'aria-describedby': 'message-id',
                                        }}
                                        message={<span id="message-id">Link copied</span>}
                                        action={
                                            <IconButton
                                                key='close'
                                                aria-label='Close'
                                                color='inherit'
                                                className={classes.close}
                                                onClick={this.handleCloseUsernameHint}>
                                                <CloseIcon />
                                            </IconButton>
                                        }
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
                                        <ListItemText primary={<Typography variant='inherit' noWrap>{formatPhoneNumber(phoneNumber)}</Typography>}/>
                                    </ListItem>
                                    <Snackbar
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        }}
                                        open={openPhoneHint}
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
                        <NotificationsListItem chatId={chatId}/>
                        <MoreListItem chatId={chatId}/>
                    </List>
                    <Divider/>
                    <List>
                        <ListItem button onClick={openSharedMedia}>
                            <ListItemIcon>
                                <PhotoIcon/>
                            </ListItemIcon>
                            <ListItemText primary={<Typography variant='inherit' noWrap>Shared Media</Typography>}/>
                        </ListItem>
                        {
                            !isGroup &&
                            <ListItem button onClick={this.handleGroupsInCommon}>
                                <ListItemText inset primary={<Typography variant='inherit' noWrap>Groups in Common</Typography>}/>
                            </ListItem>
                        }
                    </List>
                    <Divider/>
                    <List>
                        {items}
                    </List>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(ChatDetails);