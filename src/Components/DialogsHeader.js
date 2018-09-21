import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu/Menu';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';
import Dialog from '@material-ui/core/Dialog/Dialog';
import {DialogActions, DialogContent, DialogContentText, DialogTitle} from '@material-ui/core';
import Button from '@material-ui/core/Button/Button';
import IconButton from '@material-ui/core/IconButton/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import MenuIcon from '@material-ui/icons/Menu';
import TdLibController from '../Controllers/TdLibController';
import './Header.css';

const styles = {
    menuIconButton : {
        margin: '8px -2px 8px 12px',
    },
    searchIconButton : {
        margin: '8px 12px 8px 0',
    }
};

const menuAnchorOrigin = {
    vertical: 'bottom',
    horizontal: 'left'
};

class DialogsHeader extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            authorizationState: TdLibController.getState(),
            open: false,
            anchorEl: null
        };

        this.onUpdateAuthorizationState = this.onUpdateAuthorizationState.bind(this);

        this.handleClose = this.handleClose.bind(this);
        this.handleDone = this.handleDone.bind(this);
        this.handleLogOut = this.handleLogOut.bind(this);
        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.handleMenuClose = this.handleMenuClose.bind(this);
        this.handleClearCache = this.handleClearCache.bind(this);
    }

    componentDidMount(){
        TdLibController.on('tdlib_status', this.onUpdateAuthorizationState);
    }

    componentWillUnmount(){
        TdLibController.removeListener('tdlib_status', this.onUpdateAuthorizationState);
    }

    onUpdateAuthorizationState(state) {
        this.setState({ authorizationState: state });
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

    render() {
        const {classes} = this.props;
        const {anchorEl, authorizationState} = this.state;

        const mainMenuControl = authorizationState && authorizationState.status === 'ready'
            ? (<Menu
                id='main-menu'
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={this.handleMenuClose}
                getContentAnchorEl={null}
                anchorOrigin={menuAnchorOrigin}>
                {/*<MenuItem onClick={this.handleClearCache}>Clear cache</MenuItem>*/}
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
            </div>);
    }
}

export default withStyles(styles)(DialogsHeader);