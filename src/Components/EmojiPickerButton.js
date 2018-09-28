import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import Popover from '@material-ui/core/Popover';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core/styles';
import { Picker } from 'emoji-mart';
import './EmojiPickerButton.css';
// import './emoji-mart.css';

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

        return (
            <React.Fragment>
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

                    <Picker
                        set='apple'
                        showPreview={false}
                        perLine={9}
                        onSelect={this.props.onSelect}
                        // style={{ height: '300px' }}
                    />
                </Popover>
            </React.Fragment>
        );
    }
}

export default withStyles(styles)(EmojiPickerButton);