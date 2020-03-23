/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import { canMessageBeClosed, canMessageBeDeleted, canMessageBeEdited, canMessageBeForwarded, canMessageBeUnvoted, isMessagePinned } from '../../Utils/Message';
import { canPinMessages, canSendMessages } from '../../Utils/Chat';
import { cancelPollAnswer, stopPoll } from '../../Actions/Poll';
import { copy } from '../../Utils/Text';
import { clearSelection, deleteMessages, editMessage, forwardMessages, replyMessage, selectMessage } from '../../Actions/Client';
import { pinMessage, unpinMessage } from '../../Actions/Message';
import MessageStore from '../../Stores/MessageStore';
import './MessageMenu.css';

class MessageMenu extends React.PureComponent {
    state = {
        confirmStopPoll: false
    };

    handleConfirmStopPoll = event => {
        const { dialog } = this.state;
        if (dialog) return;

        this.setState({
            confirmStopPoll: true,
            contextMenu: false
        });
    };

    handleCloseConfirm = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ confirmStopPoll: false });
    };

    handleStopPoll = event => {
        event.stopPropagation();

        const { chatId, messageId } = this.props;
        const { confirmStopPoll } = this.state;

        if (confirmStopPoll) {
            this.setState({ confirmStopPoll: false });
        }

        stopPoll(chatId, messageId);
    };

    handleUnvote = event => {
        if (event) {
            event.stopPropagation();
        }

        const { chatId, messageId, onClose } = this.props;

        onClose(event);
        cancelPollAnswer(chatId, messageId);
    };

    handleCopyLink = event => {
        const { onClose } = this.props;
        const { copyLink } = this.state;

        onClose(event);

        if (!copyLink) return;
        copy(copyLink);
    };

    handleReply = event => {
        const { chatId, messageId, onClose } = this.props;

        clearSelection();
        onClose(event);
        replyMessage(chatId, messageId);
    };

    handlePin = event => {
        const { chatId, messageId, onClose } = this.props;

        clearSelection();
        onClose(event);

        if (isMessagePinned(chatId, messageId)) {
            unpinMessage(chatId);
        } else {
            pinMessage(chatId, messageId);
        }
    };

    handleForward = event => {
        const { chatId, messageId, onClose } = this.props;

        onClose(event);
        forwardMessages(chatId, [messageId]);
    };

    handleEdit = event => {
        const { chatId, messageId, onClose } = this.props;

        clearSelection();
        onClose(event);
        editMessage(chatId, messageId);
    };

    handleSelect = event => {
        const { chatId, messageId, onClose } = this.props;

        onClose(event);
        selectMessage(chatId, messageId, true);
    };

    handleDelete = event => {
        const { chatId, messageId, onClose } = this.props;

        onClose(event);
        deleteMessages(chatId, [messageId]);
    };

    render() {
        const { t, chatId, messageId, anchorPosition, canCopyLink, open, onClose } = this.props;
        const { confirmStopPoll } = this.state;

        const isPinned = isMessagePinned(chatId, messageId);
        const canBeUnvoted = canMessageBeUnvoted(chatId, messageId);
        const canBeClosed = canMessageBeClosed(chatId, messageId);
        const canBeReplied = canSendMessages(chatId);
        const canBePinned = canPinMessages(chatId);
        const canBeForwarded = canMessageBeForwarded(chatId, messageId);
        const canBeDeleted = canMessageBeDeleted(chatId, messageId);
        const canBeEdited = canMessageBeEdited(chatId, messageId);
        const canBeSelected = !MessageStore.hasSelectedMessage(chatId, messageId);

        return (
            <>
                <Popover
                    open={open}
                    onClose={onClose}
                    anchorReference='anchorPosition'
                    anchorPosition={anchorPosition}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    onMouseDown={e => e.stopPropagation()}>
                    <MenuList onClick={e => e.stopPropagation()}>
                        {canCopyLink && <MenuItem onClick={this.handleCopyLink}>{t('CopyLink')}</MenuItem>}
                        {canBeReplied && <MenuItem onClick={this.handleReply}>{t('Reply')}</MenuItem>}
                        {canBePinned && (
                            <MenuItem onClick={this.handlePin}>{isPinned ? t('Unpin') : t('Pin')}</MenuItem>
                        )}
                        {canBeSelected && <MenuItem onClick={this.handleSelect}>{t('Select')}</MenuItem>}
                        {canBeForwarded && <MenuItem onClick={this.handleForward}>{t('Forward')}</MenuItem>}
                        {canBeEdited && <MenuItem onClick={this.handleEdit}>{t('Edit')}</MenuItem>}
                        {canBeDeleted && <MenuItem onClick={this.handleDelete}>{t('Delete')}</MenuItem>}
                        {canBeUnvoted && <MenuItem onClick={this.handleUnvote}>{t('Unvote')}</MenuItem>}
                        {canBeClosed && <MenuItem onClick={this.handleConfirmStopPoll}>{t('StopPoll')}</MenuItem>}
                    </MenuList>
                </Popover>
                <Dialog
                    transitionDuration={0}
                    open={confirmStopPoll}
                    onClose={this.handleCloseConfirm}
                    aria-labelledby='form-dialog-title'>
                    <DialogTitle id='form-dialog-title'>{t('StopPollAlertTitle')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>{t('StopPollAlertText')}</DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseConfirm} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handleStopPoll} color='primary'>
                            {t('Stop')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }

}

MessageMenu.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    anchorPosition: PropTypes.object,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    canCopyLink: PropTypes.bool
};

export default withTranslation()(MessageMenu);