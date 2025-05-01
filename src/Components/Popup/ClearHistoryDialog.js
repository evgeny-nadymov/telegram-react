/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import ChatTile from '../Tile/ChatTile';
import { getChatShortTitle } from '../../Utils/Chat';

class ClearHistoryDialog extends React.Component {
    render() {
        const { chatId, onClose, t } = this.props;

        return (
            <Dialog
                open={true}
                transitionDuration={0}
                onClose={() => onClose(false)}
                aria-labelledby='delete-dialog-title'>
                <DialogTitle id='delete-dialog-title'>{getChatShortTitle(chatId, false, t)}</DialogTitle>
                <DialogContent>
                    <div className='delete-dialog-content'>
                        <ChatTile chatId={chatId} />
                        <DialogContentText id='delete-dialog-description'>
                            Are you sure you want clear history?
                        </DialogContentText>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose(false)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={() => onClose(true)} color='primary' autoFocus>
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