/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import {withStyles} from '@material-ui/core/styles';

const styles = {
    menuIconButton : {
        margin: '8px 12px 8px 0',
    }
};

const menuAnchorOrigin = {
    vertical: 'bottom',
    horizontal: 'right'
};

const menuTransformOrigin = {
    vertical: 'top',
    horizontal: 'right'
};

class MainMenuButton extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            anchorEl: null
        };
    }

    handleButtonClick = (event) => {
        this.setState({ anchorEl : event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl : null });
    };

    handleChatInfo = () => {
        this.handleMenuClose();
        setTimeout(() => this.props.openChatDetails(), 150);
    };

    render() {
        const { classes } = this.props;
        const { anchorEl } = this.state;

        return(
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className={classes.menuIconButton}
                    aria-label='Menu'
                    onClick={this.handleButtonClick}>
                    <MoreVertIcon/>
                </IconButton>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    anchorOrigin={menuAnchorOrigin}
                    transformOrigin={menuTransformOrigin}>
                    <MenuItem onClick={this.handleChatInfo}>Chat info</MenuItem>
                </Menu>
            </>
        );
    }
}

export default withStyles(styles)(MainMenuButton);