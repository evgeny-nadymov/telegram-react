/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import Button from '@material-ui/core/Button';
import ApplicationStore from '../../Stores/ApplicationStore';

const styles = {
    root: {
        margin: 0,
        padding: '24px',
        width: '100%',
        borderRadius: 0,
        color: 'white',
        maxHeight: '65px'
    }
};

class UpdatePanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            newContentAvailable: false
        };
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateNewContentAvailable', this.onClientUpdateNewContentAvailable);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateNewContentAvailable', this.onClientUpdateNewContentAvailable);
    }

    onClientUpdateNewContentAvailable = () => {
        this.setState({ newContentAvailable: true });
    };

    handleUpdate = () => {
        if (this.handled) return;

        this.handled = true;
        setTimeout(() => {
            window.location.reload();
        }, 250);
    };

    render() {
        const { newContentAvailable } = this.state;
        const { classes } = this.props;

        const content = newContentAvailable ? (
            <Button variant='contained' color='primary' className={classes.root} onClick={this.handleUpdate}>
                Update
            </Button>
        ) : null;

        return <>{content}</>;
    }
}

export default withStyles(styles)(UpdatePanel);
