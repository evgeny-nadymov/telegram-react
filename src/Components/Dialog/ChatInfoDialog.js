/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import Dialog from '@material-ui/core/Dialog';
import ChatInfo from '../ColumnRight/ChatInfo';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './ChatInfoDialog.css';

const styles = theme => ({
    chatInfoRoot: {
        width: 336
    },
    containerRoot: {
        alignItems: 'start'
    },
    dialogRoot: {
        color: theme.palette.text.primary,
        zIndex: theme.zIndex.modal
    },
    paperRoot: {
        width: 336
    }
});

class ChatInfoDialog extends React.Component {
    state = {
        chatId: ApplicationStore.dialogChatId
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId } = this.state;

        return nextState.chatId !== chatId;
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateDialogChatId', this.handleClientUpdateDialogChatId);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateDialogChatId', this.handleClientUpdateDialogChatId);
    }

    handleClientUpdateDialogChatId = update => {
        const { chatId } = update;

        this.setState({ chatId });
    };

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateDialogChatId',
            chatId: 0
        });
    };

    render() {
        const { classes } = this.props;
        const { chatId } = this.state;
        if (!chatId) return null;

        return (
            <Dialog
                open
                transitionDuration={0}
                onClose={this.handleClose}
                classes={{ root: classes.dialogRoot, container: classes.containerRoot, paper: classes.paperRoot }}>
                <ChatInfo className={classes.chatInfoRoot} chatId={chatId} popup />
            </Dialog>
        );
    }
}

ChatInfoDialog.propTypes = {};

export default withStyles(styles)(ChatInfoDialog);
