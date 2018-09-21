import React from 'react';
import './DialogCommandControl.css';
import Button from '@material-ui/core/Button/Button';
import {withStyles} from '@material-ui/core/styles';

const styles = {
    button: {
        margin: '14px',
        minWidth: '100px'
    }
};

class DialogCommandControl extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const {classes, command, onCommand} = this.props;

        return (
            <div className='dialog-command-wrapper'>
                <div className='dialog-command-actions'>
                    <Button color='primary' className={classes.button} onClick={onCommand}>
                        {command}
                    </Button>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(DialogCommandControl);