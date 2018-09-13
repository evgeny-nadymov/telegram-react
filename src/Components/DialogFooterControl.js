import React from 'react';
import Button from '@material-ui/core/Button/Button';
import {withStyles} from '@material-ui/core';
import './DialogFooterControl.css';

const styles = {
    button: {
        margin: '11px',
    }
};

class DialogFooterControl extends React.Component {

    constructor(props){
        super(props);
    }

    render() {

        const command='test';

        return (
            <div className='dialog-footer'>
                <div className='dialog-footer-wrapper'>
                    <div className='dialog-footer-border'/>
                    <div className='dialog-footer-actions'>
                        <Button color='primary' className={this.props.classes.button} onClick={this.props.onCommand}>
                            {command}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(DialogFooterControl);