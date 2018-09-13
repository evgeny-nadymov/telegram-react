import React, {Component} from 'react';
import './Header.css';
import ChatStore from '../Stores/ChatStore';
import TdLibController from '../Controllers/TdLibController';
import { DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import {withStyles} from '@material-ui/core';

const styles = {
    button: {
        margin: '14px',
    },
    iconButton:{
        margin: '8px 12px',
    }
};

class Header extends Component{

    constructor(props){
        super(props);

        this.state = {
            authState: TdLibController.getState(),
            connectionState : '',
            open: false
        };
        this.onStatusUpdated = this.onStatusUpdated.bind(this);
        this.onConnectionStateUpdated = this.onConnectionStateUpdated.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDone = this.handleDone.bind(this);
        this.handleLogOut = this.handleLogOut.bind(this);
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
        TdLibController.on('tdlib_status', this.onStatusUpdated);
        TdLibController.on('tdlib_connection_state', this.onConnectionStateUpdated);

        ChatStore.on('updateChatTitle', this.onUpdate);
    }

    componentWillUnmount(){
        TdLibController.removeListener('tdlib_connection_state', this.onConnectionStateUpdated);
        TdLibController.removeListener('tdlib_status', this.onStatusUpdated);

        ChatStore.removeListener('updateChatTitle', this.onUpdate);
    }

    onConnectionStateUpdated(payload) {
        this.setState({ connectionState: payload});
    }

    onStatusUpdated(payload) {
        this.setState({ authState: payload});
    }

    onUpdate(update){
        if (update.chat_id !== this.props.selectedChat.id) return;

        this.forceUpdate();
    }

    handleLogOut(){
        this.setState({open: true});
    }

    handleDestroy(){
        TdLibController.destroy();
    }

    handleClearCache(args){
        args.preventDefault();

        this.props.onClearCache();
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
        const status = this.state.authState.status;
        let connectionState = this.state.connectionState? this.state.connectionState['@type'] : '';

        switch (connectionState){
            case 'connectionStateUpdating':
                connectionState = 'Updating...';
                break;
            case 'connectionStateConnecting':
                connectionState = 'Connecting...';
                break;
            case 'connectionStateReady':
            case '':
                connectionState = this.props.selectedChat ? this.props.selectedChat.title : '';
                break;
        }

        switch (status){
            case 'ready':
                return (
                    <div className='header-wrapper'>
                        <div className='header-master'>
                            <IconButton className={classes.iconButton} aria-label="Menu">
                                <MenuIcon />
                            </IconButton>
                            <div className='header-status grow cursor-default'>
                                <span className='header-status-content'>Chats</span>
                            </div>
                            <IconButton className={classes.iconButton} aria-label="Search">
                                <SearchIcon />
                            </IconButton>
                        </div>
                        <div className='header-details'>
                            <div className='header-status grow cursor-default'>
                                <span className='header-status-content'>{connectionState}</span>
                            </div>

                            <Button color='primary' className={this.props.classes.button} onClick={this.handleLogOut}>
                                Log out
                            </Button>
                        </div>

                        { this.state.open &&
                            <Dialog
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
                            </Dialog>
                        }
                    </div>
                );
            default:
                return (
                    <div className='header-wrapper'>
                        <div className='header-master'>
                            <IconButton className={classes.iconButton} aria-label="Menu">
                                <MenuIcon />
                            </IconButton>
                            <div className='header-status grow cursor-default'>
                                <span className='header-status-content'>Chats</span>
                            </div>
                            <IconButton className={classes.iconButton} aria-label="Search">
                                <SearchIcon />
                            </IconButton>
                        </div>
                        <div className='header-details'>
                            <div className='header-status'>
                                <span className='header-status-content'>{connectionState}</span>
                            </div>
                        </div>
                    </div>
                );
        }
    }
}

export default withStyles(styles)(Header);