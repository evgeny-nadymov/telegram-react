import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const styles = {
    root: {
        margin: 0,
        padding: '24px',
        width: '100%',
        borderRadius: 0,
        color: 'white'
    }
};

class UpdatePanel extends React.Component {
    constructor(props){
        super(props);

        this.handleUpdate = this.handleUpdate.bind(this);
    }

    handleUpdate(){
        if (this.handled) return;

        this.handled = true;
        setTimeout(() => {
            window.location.reload();
        }, 250);
    }

    render() {
        const { classes } = this.props;

        return (
            <Button variant='contained' color='primary' className={classes.root} onClick={this.handleUpdate}>
                Update
            </Button>
        );
    }

}

export default withStyles(styles)(UpdatePanel);