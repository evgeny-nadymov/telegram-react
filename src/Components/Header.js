import React, {Component} from 'react';
import './Header.css';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';
import SupergroupStore from '../Stores/SupergroupStore';
import TdLibController from '../Controllers/TdLibController';
import { DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {withStyles} from '@material-ui/core/styles';
import {getChatSubtitle, isAccentChatSubtitle} from '../Utils/Chat';

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

        this.onAuthorizationStatusUpdated = this.onAuthorizationStatusUpdated.bind(this);
        this.onConnectionStateUpdated = this.onConnectionStateUpdated.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onUpdateUserStatus = this.onUpdateUserStatus.bind(this);
        this.onUpdateUserChatAction = this.onUpdateUserChatAction.bind(this);
        this.onUpdateSupergroupFullInfo = this.onUpdateSupergroupFullInfo.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDone = this.handleDone.bind(this);
        this.handleLogOut = this.handleLogOut.bind(this);
        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.handleMenuClose = this.handleMenuClose.bind(this);
        this.handleClearCache = this.handleClearCache.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState !== this.state){
            return true;
        }
        if (nextProps.selectedChat !== this.props.selectedChat){
            return true;
        }

        return false;
    }

    componentDidMount(){
        TdLibController.on('tdlib_status', this.onAuthorizationStatusUpdated);
        TdLibController.on('tdlib_connection_state', this.onConnectionStateUpdated);

        ChatStore.on('updateChatTitle', this.onUpdate);
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.on('updateUserChatAction', this.onUpdateUserChatAction);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    componentWillUnmount(){
        TdLibController.removeListener('tdlib_status', this.onAuthorizationStatusUpdated);
        TdLibController.removeListener('tdlib_connection_state', this.onConnectionStateUpdated);

        ChatStore.removeListener('updateChatTitle', this.onUpdate);
        UserStore.removeListener('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.removeListener('updateUserChatAction', this.onUpdateUserChatAction);
        SupergroupStore.removeListener('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
    }

    onConnectionStateUpdated(payload) {
        this.setState({ connectionState: payload});
    }

    onAuthorizationStatusUpdated(payload) {
        this.setState({ authorizationState: payload});
    }

    onUpdate(update){
        if (update.chat_id !== this.props.selectedChat.id) return;

        this.forceUpdate();
    }

    onUpdateUserStatus(update){
        const chat = this.props.selectedChat;
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypePrivate'
            && chat.type.user_id === update.user_id){

            this.forceUpdate();
        }
    }

    onUpdateUserChatAction(update){
        const chat = this.props.selectedChat;
        if (!chat) return;

        if (chat.id === update.chat_id){
            this.forceUpdate();
        }
    }

    onUpdateSupergroupFullInfo(update){
        const chat = this.props.selectedChat;
        if (!chat) return;

        if (chat.type
            && chat.type['@type'] === 'chatTypeSupergroup'
            && chat.type.supergroup_id === update.supergroup_id){
            this.forceUpdate();
        }
    }

    handleMenuClick(event){
        this.setState({ anchorEl : event.currentTarget });
    }

    handleMenuClose(){
        this.setState({ anchorEl : null });
    }

    handleLogOut(){
        this.setState({ open: true });

        this.handleMenuClose();
    }

    handleClearCache(){
        this.props.onClearCache();

        this.handleMenuClose();
    }

    handleClose(){
        this.setState({ open: false });
    }

    handleDone(){
        this.setState({ open: false });
        TdLibController.logOut();
    }

    render(){
        const {classes} = this.props;
        const {anchorEl, authorizationState, connectionState} = this.state;
        const chat = this.props.selectedChat;

        let title = '';
        let subtitle = '';
        let isAccentSubtitle = isAccentChatSubtitle(chat);
        if (authorizationState && authorizationState.status !== 'ready'){
            title = 'Loading...';
        }
        else if (connectionState){
            switch (connectionState['@type'] ){
                case 'connectionStateUpdating':
                    title = 'Updating...';
                    break;
                case 'connectionStateConnecting':
                    title = 'Connecting...';
                    break;
                case 'connectionStateReady':
                    break;
            }
        }

        if (title === '' && chat){
            title = chat.title || 'Deleted account';
            subtitle = getChatSubtitle(chat);
        }

        const mainMenuControl = authorizationState && authorizationState.status === 'ready'
            ? (<Menu
                id='simple-menu'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={this.handleMenuClose}>
                <MenuItem onClick={this.handleClearCache}>Clear cache</MenuItem>
                <MenuItem onClick={this.handleLogOut}>Log out</MenuItem>
            </Menu>)
            : null;

        const confirmLogoutDialog = this.state.open?
            (<Dialog
                open={this.state.open}
                onClose={this.handleClose}
                aria-labelledby="form-dialog-title">
                <DialogTitle id="form-dialog-title">Telegram</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to log out?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={this.handleDone} color="primary">
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>)
            : null;


        return (
            <div className='header-wrapper'>
                <div className='header-master'>
                    <IconButton
                        aria-owns={anchorEl ? 'simple-menu' : null}
                        aria-haspopup='true'
                        className={classes.menuIconButton}
                        aria-label='Menu'
                        onClick={this.handleMenuClick}>
                        <MenuIcon />
                    </IconButton>
                    { mainMenuControl }
                    { confirmLogoutDialog }
                    <div className='header-status grow cursor-default'>
                        <span className='header-status-content'>Telegram</span>
                    </div>
                    <IconButton className={classes.searchIconButton} aria-label="Search">
                        <SearchIcon />
                    </IconButton>
                </div>
                <div className='header-details'>
                    <div className='header-status grow cursor-default'>
                        <span className='header-status-content'>{title}</span>
                        <span className={isAccentSubtitle ? 'header-status-title-accent' : 'header-status-title'}>{subtitle}</span>
                    </div>
                    <IconButton className={classes.messageSearchIconButton} aria-label="Search">
                        <SearchIcon />
                    </IconButton>
                    <IconButton className={classes.moreIconButton} aria-label="More">
                        <MoreVertIcon />
                    </IconButton>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(Header);