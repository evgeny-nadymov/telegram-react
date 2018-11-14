/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import PhotoIcon from '@material-ui/icons/Photo';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import {withStyles} from '@material-ui/core/styles';

const styles = {
    iconButton : {
        margin: '8px 0px',
    }
};

class AttachButton extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            anchorEl : null
        };

        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.handleMenuClose = this.handleMenuClose.bind(this);
        this.handleAttachDocument = this.handleAttachDocument.bind(this);
        this.handleAttachPhoto = this.handleAttachPhoto.bind(this);
    }

    handleMenuClick(event){
        this.setState({ anchorEl : event.currentTarget });
    }

    handleMenuClose(){
        this.setState({ anchorEl : null });
    }

    handleAttachPhoto(){
        this.handleMenuClose();

        setTimeout(x => x.props.onAttachPhoto(), 300, this);
    }

    handleAttachDocument(){
        this.handleMenuClose();

        setTimeout(x => x.props.onAttachDocument(), 300, this);
    }

    render() {
        const {classes} = this.props;
        const {anchorEl} = this.state;

        return (
            <>
                <IconButton
                    className={classes.iconButton}
                    aria-label='Attach'
                    open={Boolean(anchorEl)}
                    onClick={this.handleMenuClick}>
                    <AttachFileIcon className='inputbox-attach-icon'/>
                </IconButton>
                <Menu
                    id='attach-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    getContentAnchorEl={null}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    onClose={this.handleMenuClose}>
                    <MenuItem onClick={this.handleAttachPhoto}>
                        <ListItemIcon>
                            <PhotoIcon />
                        </ListItemIcon>
                        <ListItemText inset primary='Photo' />
                    </MenuItem>
                    <MenuItem onClick={this.handleAttachDocument}>
                        <ListItemIcon>
                            <InsertDriveFileIcon />
                        </ListItemIcon>
                        <ListItemText inset primary='Document' />
                    </MenuItem>
                </Menu>
            </>
        );
    }
}

export default withStyles(styles)(AttachButton);