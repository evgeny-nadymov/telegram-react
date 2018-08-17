import React, {Component} from 'react';
import './Header.css';
import TdLibController from '../Controllers/TdLibController';
import { DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

class Header extends Component{

    constructor(props){
        super(props);

        this.state = {
            authState: TdLibController.getState(),
            connectionState : '',
            open: false,
            completed: 10
        };
        this.onStatusUpdated = this.onStatusUpdated.bind(this);
        this.onConnectionStateUpdated = this.onConnectionStateUpdated.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDone = this.handleDone.bind(this);
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
        TdLibController.on("tdlib_status", this.onStatusUpdated);
        TdLibController.on("tdlib_connection_state", this.onConnectionStateUpdated);
    }

    onConnectionStateUpdated(payload) {
        this.setState({ connectionState: payload});
    }

    onStatusUpdated(payload) {
        this.setState({ authState: payload});
    }

    componentWillUnmount(){
        TdLibController.removeListener("tdlib_connection_state", this.onConnectionStateUpdated);
        TdLibController.removeListener("tdlib_status", this.onStatusUpdated);
    }

    handleSubmit(){
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
                            <div className='header-title'>
                                <i className='header-title-icon'></i>
                            </div>
                        </div>
                        <div className='header-details'>
                            <div className='header-status grow cursor-default'>
                                <span className='header-status-content'>{connectionState}</span>
                            </div>
                            <div className='header-button cursor-pointer' onClick={args => this.handleSubmit(args)}>
                                <span className='header-button-content'>LOG OUT</span>
                            </div>
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
                        <div className='header-title'>
                            <i className='header-title-icon'></i>
                        </div>
                        <div className='header-status'>
                            <span className='header-status-content'>{connectionState}</span>
                        </div>
                    </div>
                );
        }
    }
}

export default Header;