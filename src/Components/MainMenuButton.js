/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {withStyles} from '@material-ui/core/styles';
import TdLibController from '../Controllers/TdLibController';
import {update} from '../registerServiceWorker';

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

class MainMenuButton extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            authorizationState: TdLibController.getState(),
            anchorEl: null
        };

        this.handleMenuClose = this.handleMenuClose.bind(this);
        this.handleButtonClick = this.handleButtonClick.bind(this);
        this.handleCheckUpdates = this.handleCheckUpdates.bind(this);
        this.handleLogOut = this.handleLogOut.bind(this);

        this.onUpdateAuthorizationState = this.onUpdateAuthorizationState.bind(this);
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

    handleButtonClick(event){
        this.setState({ anchorEl : event.currentTarget });
    }

    handleMenuClose(){
        this.setState({ anchorEl : null });
    }

    handleLogOut(){
        this.handleMenuClose();
        this.props.onLogOut();
    }

    handleCheckUpdates(){
        this.handleMenuClose();

        update();
        //this.props.onCheckUpdates();
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
                <MenuItem onClick={this.handleCheckUpdates}>Check for updates</MenuItem>
                <MenuItem onClick={this.handleLogOut}>Log out</MenuItem>
            </Menu>)
            : null;

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className={classes.menuIconButton}
                    aria-label='Menu'
                    onClick={this.handleButtonClick}>
                    <MenuIcon />
                </IconButton>
                { mainMenuControl }
            </>
        );
    }
}

export default withStyles(styles)(MainMenuButton);