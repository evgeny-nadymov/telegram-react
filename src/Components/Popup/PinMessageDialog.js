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
import { getChatShortTitle, isChannelChat, isPrivateChat } from '../../Utils/Chat';
import { modalManager } from '../../Utils/Modal';
import ChatStore from '../../Stores/ChatStore';
import './PinMessageDialog.css';

class PinMessageDialog extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { chatId, messageId } = props;
        const { prevChatId, prevMessageId } = state;

        if (prevChatId !== chatId && prevMessageId !== messageId) {
            return {
                prevChatId: chatId,
                prevMessageIds: messageId,
                revoke: !isPrivateChat(chatId)
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
        const { revoke } = this.state;

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        let text = '';
        switch (chat.type['@type']) {
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                text = t('PinMessageAlertChat');
                break;
            }
            case 'chatTypeBasicGroup': {
                text = t('PinMessageAlert');
                break;
            }
            case 'chatTypeSupergroup': {
                if (isChannelChat(chatId)) {
                    text = t('PinMessageAlertChannel');
                } else {
                    text = t('PinMessageAlert');
                }
                break;
            }
        }

        return (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={true}
                onClose={() => onClose(false, revoke)}
                aria-labelledby='dialog-title'>
                <DialogTitle id='dialog-title'>{t('Confirm')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {text}
                    </DialogContentText>
                    <>
                        {
                            isPrivateChat(chatId) && (
                                <FormControlLabel
                                    control={
                                        <Checkbox checked={revoke} onChange={this.handleRevokeChange} color='primary' />
                                    }
                                    label={`Also pin for ${getChatShortTitle(chatId, false, t)}`}
                                />
                            )
                        }
                    </>
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

PinMessageDialog.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    onClose: PropTypes.func
};

export default withTranslation()(PinMessageDialog);