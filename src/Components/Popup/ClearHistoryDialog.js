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
import ChatTile from '../Tile/ChatTile';
import { getChatShortTitle, isPrivateChat } from '../../Utils/Chat';
import { modalManager } from '../../Utils/Modal';
import ChatStore from '../../Stores/ChatStore';

class ClearHistoryDialog extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId } = props;
        const { prevChatId } = state;

        const chat = ChatStore.get(chatId);

        const { can_be_deleted_for_all_users: canBeDeletedForAllUsers } = chat;

        if (prevChatId !== chatId) {
            return {
                prevChatId: chatId,
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
        const { chatId, onClose, t } = this.props;
        const { canBeDeletedForAllUsers, revoke } = this.state;

        return (
            <Dialog
                manager={modalManager}
                open={true}
                transitionDuration={0}
                onClose={() => onClose(false, revoke)}
                aria-labelledby='delete-dialog-title'>
                <DialogTitle id='delete-dialog-title'>{getChatShortTitle(chatId, false, t)}</DialogTitle>
                <DialogContent>
                    <div className='delete-dialog-content'>
                        <ChatTile chatId={chatId} />
                        <div>
                            <DialogContentText id='delete-dialog-description'>
                                Are you sure you want clear history?
                            </DialogContentText>
                            {
                                canBeDeletedForAllUsers && (
                                    <FormControlLabel
                                        control={
                                            <Checkbox checked={revoke} onChange={this.handleRevokeChange} color='primary' />
                                        }
                                        label={
                                            isPrivateChat(chatId)
                                                ? `Also delete for ${getChatShortTitle(chatId, false, t)}`
                                                : 'Delete for all members'
                                        }
                                        style={{ marginLeft: 0 }}
                                    />
                                )
                            }
                        </div>
                    </div>
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

ClearHistoryDialog.propTypes = {
    chatId: PropTypes.number,
    onClose: PropTypes.func
};

export default withTranslation()(ClearHistoryDialog);