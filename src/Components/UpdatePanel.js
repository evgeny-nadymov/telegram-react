import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import ApplicationStore from '../Stores/ApplicationStore';

const styles = {
    root : {
        margin : 0,
        padding : '24px',
        width : '100%',
        borderRadius : 0,
        color : 'white'
    }
};

class UpdatePanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            newContentAvailable : false
        };

        this.handleUpdate = this.handleUpdate.bind(this);
        this.onClientUpdateNewContentAvailable = this.onClientUpdateNewContentAvailable.bind(this);
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateNewContentAvailable', this.onClientUpdateNewContentAvailable);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateNewContentAvailable', this.onClientUpdateNewContentAvailable);
    }

    onClientUpdateNewContentAvailable() {
        this.setState({ newContentAvailable : true });
    }

    handleUpdate() {
        if (this.handled) return;

        this.handled = true;
        setTimeout(() => {
            window.location.reload();
        }, 250);
    }

    render() {
        const { newContentAvailable } = this.state;
        const { classes } = this.props;

        const content = newContentAvailable
            ? (<Button variant='contained' color='primary' className={classes.root}
                       onClick={this.handleUpdate}>Update</Button>)
            : null;

        return (
            <>
                {content}
            </>
        );
    }

}

export default withStyles(styles)(UpdatePanel);