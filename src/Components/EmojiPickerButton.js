/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import Popover from '@material-ui/core/Popover';
import { withStyles } from '@material-ui/core/styles';
import { Picker } from 'emoji-mart';
import './EmojiPickerButton.css';

const styles = {
    iconButton : {
        margin: '8px 0px',
    }
};

class EmojiPickerButton extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            anchorEl: null
        }
    }

    updateAnchorEl = (anchorEl) => {
        this.setState({ anchorEl: anchorEl });
    };

    switchPopover = (event) =>{
        this.updateAnchorEl(this.state.anchorEl ? null : event.currentTarget);
    };

    render() {
        const { classes } = this.props;
        const { anchorEl } = this.state;

        const open = Boolean(anchorEl);

        if (!this.picker){
            this.picker = (
                <Picker
                    set='apple'
                    showPreview={false}
                    onSelect={this.props.onSelect}/>
            );
        }

        return (
            <>
                <IconButton className={classes.iconButton} aria-label='Emoticon' onClick={this.switchPopover}>
                    <InsertEmoticonIcon />
                </IconButton>
                <Popover
                    id="render-props-popover"
                    open={open}
                    anchorEl={anchorEl}
                    onClose={() => {
                        this.updateAnchorEl(null);
                    }}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}>

                    {this.picker}
                </Popover>
            </>
        );
    }
}

export default withStyles(styles)(EmojiPickerButton);