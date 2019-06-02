/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox/';
import withStyles from '@material-ui/core/styles/withStyles';
import { borderStyle } from '../Theme';
import { canSendMessages, getChatShortTitle, isPrivateChat } from '../../Utils/Chat';
import MessageStore from '../../Stores/MessageStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './HeaderCommand.css';

const styles = theme => ({
    buttonLeft: {
        margin: '14px 0 14px 14px',
        minWidth: '100px'
    },
    buttonRight: {
        margin: '14px 14px 14px 0',
        minWidth: '100px'
    },
    ...borderStyle(theme)
});

class HeaderCommand extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            openDeleteDialog: false
        };
    }

    handleCancel = () => {
        TdLibController.clientUpdate({ '@type': 'clientUpdateClearSelection' });
    };

    handleDelete = () => {
        let canBeDeletedForAllUsers = true;
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            const message = MessageStore.get(chatId, messageId);
            if (!message) {
                canBeDeletedForAllUsers = false;
                break;
            }
            if (!message.can_be_deleted_for_all_users) {
                canBeDeletedForAllUsers = false;
                break;
            }
        }

        this.setState({
            openDeleteDialog: true,
            canBeDeletedForAllUsers: canBeDeletedForAllUsers,
            revoke: canBeDeletedForAllUsers
        });
    };

    handleDeleteContinue = () => {
        const { revoke } = this.state;

        let id;
        const messageIds = [];
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            id = chatId;
            messageIds.push(messageId);
        }

        this.handleCancel();

        TdLibController.send({
            '@type': 'deleteMessages',
            chat_id: id,
            message_ids: messageIds,
            revoke: revoke
        });
    };

    handleRevokeChange = () => {
        this.setState({ revoke: !this.state.revoke });
    };

    handleCloseDelete = () => {
        this.setState({ openDeleteDialog: false });
    };

    handleForward = () => {
        let id;
        const messageIds = [];
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            id = chatId;
            messageIds.push(messageId);
        }

        this.handleCancel();

        TdLibController.clientUpdate({
            '@type': 'clientUpdateForward',
            info: {
                chatId: id,
                messageIds: messageIds
            }
        });
    };

    handleReply = () => {
        if (MessageStore.selectedItems.size !== 1) return;

        const { chatId, messageId } = MessageStore.selectedItems.values().next().value;

        this.handleCancel();

        TdLibController.clientUpdate({ '@type': 'clientUpdateReply', chatId: chatId, messageId: messageId });
    };

    render() {
        const { classes, t, count } = this.props;
        const { openDeleteDialog, canBeDeletedForAllUsers, revoke } = this.state;

        const chatId = ApplicationStore.getChatId();

        let canBeDeleted = true;
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            const message = MessageStore.get(chatId, messageId);
            if (!message) {
                canBeDeleted = false;
                break;
            }
            if (!message.can_be_deleted_only_for_self && !message.can_be_deleted_for_all_users) {
                canBeDeleted = false;
                break;
            }
        }

        let canBeForwarded = true;
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            const message = MessageStore.get(chatId, messageId);
            if (!message) {
                canBeForwarded = false;
                break;
            }
            if (!message.can_be_forwarded) {
                canBeDeleted = false;
                break;
            }
        }

        const canBeReplied = count === 1 && canSendMessages(chatId);

        return (
            <>
                <div className={classNames(classes.borderColor, 'header-command')}>
                    {canBeForwarded && (
                        <Button color='primary' className={classes.buttonLeft} onClick={this.handleForward}>
                            {count <= 1 ? t('Forward') : `${t('Forward')} ${count}`}
                        </Button>
                    )}
                    {canBeDeleted && (
                        <Button color='primary' className={classes.buttonLeft} onClick={this.handleDelete}>
                            {count <= 1 ? t('Delete') : `${t('Delete')} ${count}`}
                        </Button>
                    )}
                    {canBeReplied && (
                        <Button color='primary' className={classes.buttonLeft} onClick={this.handleReply}>
                            {t('Reply')}
                        </Button>
                    )}
                    <div className='header-command-space' />
                    <Button color='primary' className={classes.buttonRight} onClick={this.handleCancel}>
                        {t('Cancel')}
                    </Button>
                </div>
                <Dialog
                    transitionDuration={0}
                    open={openDeleteDialog}
                    onClose={this.handleCloseDelete}
                    aria-labelledby='delete-dialog-title'>
                    <DialogTitle id='delete-dialog-title'>Confirm</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {count === 1
                                ? 'Are you sure you want to delete 1 message?'
                                : `Are you sure you want to delete ${count} messages?`}
                        </DialogContentText>
                        {canBeDeletedForAllUsers && (
                            <FormControlLabel
                                control={
                                    <Checkbox checked={revoke} onChange={this.handleRevokeChange} color='primary' />
                                }
                                label={
                                    isPrivateChat(chatId) ? `Delete for ${getChatShortTitle(chatId)}` : 'Delete for all'
                                }
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseDelete} color='primary'>
                            Cancel
                        </Button>
                        <Button onClick={this.handleDeleteContinue} color='primary'>
                            Ok
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

HeaderCommand.propTypes = {
    count: PropTypes.number
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(HeaderCommand);
