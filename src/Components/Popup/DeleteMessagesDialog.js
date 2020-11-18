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
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { getChatShortTitle, isChannelChat, isPrivateChat, isSupergroup } from '../../Utils/Chat';
import { sprintf } from '../../Utils/Language';
import { modalManager } from '../../Utils/Modal';
import MessageStore from '../../Stores/MessageStore';
import LStore from '../../Stores/LocalizationStore';

class DeleteMessagesDialog extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId, messageIds } = props;
        const { prevChatId, prevMessageIds } = state;

        let canBeDeletedForAllUsers = true;
        for (let messageId of messageIds) {
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

        if (prevChatId !== chatId && prevMessageIds !== messageIds) {
            return {
                prevChatId: chatId,
                prevMessageIds: messageIds,
                canBeDeletedForAllUsers,
                revoke: canBeDeletedForAllUsers
            }
        }

        return null;
    }

    handleRevokeChange = () => {
        const { revoke } = this.state;

        this.setState({ revoke: !revoke });
    };

    render() {
        const { chatId, messageIds, onClose, t } = this.props;
        const { canBeDeletedForAllUsers, revoke } = this.state;

        const count = messageIds ? messageIds.length : 0;

        let confirm = count === 1 ? t('AreYouSureDeleteSingleMessage') : t('AreYouSureDeleteFewMessages');
        if (isSupergroup(chatId) && !isChannelChat(chatId)) {
            confirm = count === 1 ? t('AreYouSureDeleteSingleMessageMega') : t('AreYouSureDeleteFewMessagesMega');
        }

        return (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={true}
                onClose={() => onClose(false, revoke)}
                aria-labelledby='delete-dialog-title'>
                <DialogTitle id='delete-dialog-title'>{LStore.formatString('DeleteMessagesTitle', LStore.formatPluralString('messages', count))}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirm}
                    </DialogContentText>
                    { !isSupergroup(chatId) && canBeDeletedForAllUsers && (
                        <FormControlLabel
                            control={<Checkbox checked={revoke} onChange={this.handleRevokeChange} color='primary' />}
                            label={
                                isPrivateChat(chatId)
                                    ? sprintf(t, 'DeleteForUser', getChatShortTitle(chatId, false, t))
                                    : t('DeleteForAll')
                            }
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose(false, revoke)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={() => onClose(true, revoke)} color='primary'>
                        {t('Ok')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

DeleteMessagesDialog.propTypes = {
    chatId: PropTypes.number,
    messageIds: PropTypes.array,
    onClose: PropTypes.func
};

export default withTranslation()(DeleteMessagesDialog);