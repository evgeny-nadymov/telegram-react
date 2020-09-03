/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from '../../Utils/HOC';
import { withSnackbar } from 'notistack';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import CloseIcon from '../../Assets/Icons/Close';
import CopyIcon from '../../Assets/Icons/Copy';
import DeleteIcon from '../../Assets/Icons/Delete';
import FrameCheckIcon from '../../Assets/Icons/FrameCheck';
import EditIcon from '../../Assets/Icons/Edit';
import RemoveCheckIcon from '../../Assets/Icons/RemoveCheck';
import ShareIcon from '../../Assets/Icons/Share';
import StopIcon from '../../Assets/Icons/Stop';
import PinIcon from '../../Assets/Icons/Pin2';
import UnpinIcon from '../../Assets/Icons/Pin2';
import { isPublicSupergroup } from '../../Utils/Supergroup';
import { canMessageBeClosed, canMessageBeDeleted, canMessageBeEdited, canMessageBeForwarded, canMessageBeUnvoted, isMessagePinned } from '../../Utils/Message';
import { canPinMessages, canSendMessages } from '../../Utils/Chat';
import { cancelPollAnswer, stopPoll } from '../../Actions/Poll';
import { copy } from '../../Utils/Text';
import { clearSelection, deleteMessages, editMessage, forwardMessages, replyMessage, selectMessage } from '../../Actions/Client';
import { pinMessage, unpinMessage } from '../../Actions/Message';
import { saveBlob } from '../../Utils/File';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
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
        const { onClose, copyLink, t } = this.props;

        onClose(event);

        if (!copyLink) return;

        copy(copyLink);
        this.handleScheduledAction(t('LinkCopied'));
    };

    handleCopyPublicMessageLink = async event => {
        const { onClose, chatId, messageId, t } = this.props;

        onClose(event);

        const httpUrl = await TdLibController.send({
            '@type': 'getPublicMessageLink',
            chat_id: chatId,
            message_id: messageId,
            for_album: false
        });

        if (!httpUrl) return;
        const { link: copyLink } = httpUrl;

        if (!copyLink) return;

        copy(copyLink);
        this.handleScheduledAction(t('LinkCopied'));
    };

    handleScheduledAction = message => {
        const { enqueueSnackbar, closeSnackbar } = this.props;

        const snackKey = enqueueSnackbar(message, {
            autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
            preventDuplicate: true,
            action: [
                <IconButton
                    key='close'
                    aria-label='Close'
                    color='inherit'
                    className='notification-close-button'
                    onClick={() => {
                        closeSnackbar(snackKey);
                    }}>
                    <CloseIcon />
                </IconButton>
            ]
        });
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

    handleDownload = event => {
        const { chatId, messageId } = this.props;
        const message = MessageStore.get(chatId, messageId);
        if (!message) return;

        const { content } = message;
        if (!content) return;

        const { sticker } = content;
        if (!sticker) return;

        const { sticker: file } = sticker;
        if (!file) return;

        const blob = FileStore.getBlob(file.id);
        if (!blob) return;

        saveBlob(blob, 'sticker.tgs');
    };

    render() {
        const { t, chatId, messageId, anchorPosition, copyLink, open, onClose } = this.props;
        const { confirmStopPoll } = this.state;
        if (!confirmStopPoll && !open) return null;

        const isPinned = isMessagePinned(chatId, messageId);
        const canBeUnvoted = canMessageBeUnvoted(chatId, messageId);
        const canBeClosed = canMessageBeClosed(chatId, messageId);
        const canBeReplied = canSendMessages(chatId);
        const canBePinned = canPinMessages(chatId);
        const canBeForwarded = canMessageBeForwarded(chatId, messageId);
        const canBeDeleted = canMessageBeDeleted(chatId, messageId);
        const canBeEdited = canMessageBeEdited(chatId, messageId) && !AppStore.recording;
        const canBeSelected = !MessageStore.hasSelectedMessage(chatId, messageId);
        const canCopyLink = Boolean(copyLink);
        const canCopyPublicMessageLink = isPublicSupergroup(chatId);

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
                        {/*<MenuItem onClick={this.handleDownload}>*/}
                        {/*    <ListItemIcon>*/}
                        {/*        <CopyIcon />*/}
                        {/*    </ListItemIcon>*/}
                        {/*    <ListItemText primary={t('Download')} />*/}
                        {/*</MenuItem>*/}
                        {canCopyPublicMessageLink && (
                            <MenuItem onClick={this.handleCopyPublicMessageLink}>
                                <ListItemIcon>
                                    <CopyIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('CopyMessageLink')} />
                            </MenuItem>
                        )}
                        {canCopyLink && (
                            <MenuItem onClick={this.handleCopyLink}>
                                <ListItemIcon>
                                    <CopyIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('CopyLink')} />
                            </MenuItem>
                        )}
                        {canBeReplied && (
                            <MenuItem onClick={this.handleReply}>
                                <ListItemIcon>
                                    <ShareIcon style={{transform: 'scaleX(-1)'}}/>
                                </ListItemIcon>
                                <ListItemText primary={t('Reply')} />
                            </MenuItem>
                        )}
                        {canBePinned && (
                            <MenuItem onClick={this.handlePin}>
                                {isPinned ? (
                                    <>
                                        <ListItemIcon>
                                            <UnpinIcon />
                                        </ListItemIcon>
                                        <ListItemText primary={t('UnpinFromTop')} />
                                    </>
                                ) : (
                                    <>
                                        <ListItemIcon>
                                            <PinIcon />
                                        </ListItemIcon>
                                        <ListItemText primary={t('PinToTop')} />
                                    </>
                                )}
                            </MenuItem>
                        )}
                        {canBeSelected && (
                            <MenuItem onClick={this.handleSelect}>
                                <ListItemIcon>
                                    <FrameCheckIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('Select')} />
                            </MenuItem>
                        )}
                        {canBeForwarded && (
                            <MenuItem onClick={this.handleForward}>
                                <ListItemIcon>
                                    <ShareIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('Forward')} />
                            </MenuItem>
                        )}
                        {canBeEdited && (
                            <MenuItem onClick={this.handleEdit}>
                                <ListItemIcon>
                                    <EditIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('Edit')} />
                            </MenuItem>
                        )}
                        {canBeDeleted && (
                            <MenuItem color='secondary' onClick={this.handleDelete}>
                                <ListItemIcon>
                                    <DeleteIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('Delete')} />
                            </MenuItem>
                        )}
                        {canBeUnvoted && (
                            <MenuItem onClick={this.handleUnvote}>
                                <ListItemIcon>
                                    <RemoveCheckIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('Unvote')} />
                            </MenuItem>
                        )}
                        {canBeClosed && (
                            <MenuItem onClick={this.handleConfirmStopPoll}>
                                <ListItemIcon>
                                    <StopIcon />
                                </ListItemIcon>
                                <ListItemText primary={t('StopPoll')} />
                            </MenuItem>
                        )}
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
    copyLink: PropTypes.string
};

const enhance = compose(
    withTranslation(),
    withSnackbar
);

export default enhance(MessageMenu);