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
import { getUserShortName } from '../../Utils/User';
import { getFormattedText, getSimpleMarkupEntities } from '../../Utils/Message';
import { getChatLocation, isChannelChat } from '../../Utils/Chat';
import { modalManager } from '../../Utils/Modal';
import LStore from '../../Stores/LocalizationStore';
import './BlockSenderDialog.css';

class BlockSenderDialog extends React.Component {
    state = {
        reportSpam: true,
        deleteChat: true
    };

    handleReportSpamChange = () => {
        const { reportSpam } = this.state;

        this.setState({
            reportSpam: !reportSpam
        });
    };

    handleDeleteChatChange = () => {
        const { deleteChat } = this.state;

        this.setState({
            deleteChat: !deleteChat
        });
    };

    render() {
        const { sender, onClose, t } = this.props;
        if (!sender) return null;

        const { reportSpam, deleteChat } = this.state;

        let title = null;
        let text = null;
        const entities = [];
        let reportText = null;
        switch (sender['@type']) {
            case 'messageSenderUser': {
                const { user_id } = sender;

                title = LStore.formatString('BlockUserTitle', getUserShortName(user_id, t));
                text = LStore.formatString('BlockUserAlert', getUserShortName(user_id, t));
                text = getSimpleMarkupEntities(text, entities);
                reportText = LStore.getString('BlockContact');
                break;
            }
            case 'messageSenderChat': {
                const { chat_id } = sender;

                const location = getChatLocation(chat_id);
                if (location) {
                    title = LStore.getString('ReportUnrelatedGroup');
                    if (location.address) {
                        text = LStore.formatString('ReportUnrelatedGroupText', location.address);
                        text = getSimpleMarkupEntities(text, entities);
                    } else {
                        text = LStore.getString('ReportUnrelatedGroupTextNoAddress');
                    }
                } else {
                    title = LStore.getString('ReportSpamTitle');
                    if (isChannelChat(chat_id)) {
                        text = LStore.getString('ReportSpamAlertChannel');
                    } else {
                        text = LStore.getString('ReportSpamAlertGroup');
                    }
                }
                reportText = LStore.getString('ReportChat');
                break;
            }
        }

        return (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={true}
                onClose={() => onClose(false, null)}
                aria-labelledby='dialog-title'>
                <DialogTitle id='dialog-title'>
                    {title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {getFormattedText({ '@type': 'formattedText', text, entities })}
                    </DialogContentText>
                    { sender['@type'] === 'messageSenderUser' && (
                        <div className='block-sender-params'>
                            <FormControlLabel
                                control={<Checkbox checked={reportSpam} onChange={this.handleReportSpamChange} color='primary' />}
                                label={t('DeleteReportSpam')}
                            />
                            <FormControlLabel
                                control={<Checkbox checked={deleteChat} onChange={this.handleDeleteChatChange} color='primary' />}
                                label={t('DeleteThisChat')}
                            />
                        </div>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose(false, null)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={() => onClose(true, sender && sender['@type'] === 'messageSenderUser' ? { reportSpam, deleteChat } : null)} color='secondary'>
                        {reportText}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

}

BlockSenderDialog.propTypes = {
    sender: PropTypes.object
};

export default withTranslation()(BlockSenderDialog);