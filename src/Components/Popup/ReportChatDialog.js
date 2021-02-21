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
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { modalManager } from '../../Utils/Modal';
import './ReportChatDialog.css';

class ReportChatDialog extends React.Component {

    handleReport = type => {
        const { onClose } = this.props;

        onClose && onClose(true, { '@type': type });
    }

    render() {
        const { onClose, t } = this.props;

        return (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={true}
                onClose={() => onClose(false)}
                aria-labelledby='dialog-title'>
                <DialogTitle id='dialog-title'>{t('ReportChat')}</DialogTitle>
                <div className='report-chat-dialog-content'>
                    <ListItem className='report-chat-dialog-item' button onClick={() => this.handleReport('chatReportReasonSpam')}>
                        <ListItemText primary={t('ReportChatSpam')}/>
                    </ListItem>
                    <ListItem className='report-chat-dialog-item' button onClick={() => this.handleReport('chatReportReasonFake')}>
                        <ListItemText primary={t('ReportChatFakeAccount')}/>
                    </ListItem>
                    <ListItem className='report-chat-dialog-item' button onClick={() => this.handleReport('chatReportReasonViolence')}>
                        <ListItemText primary={t('ReportChatViolence')}/>
                    </ListItem>
                    <ListItem className='report-chat-dialog-item' button onClick={() => this.handleReport('chatReportReasonPornography')}>
                        <ListItemText primary={t('ReportChatPornography')}/>
                    </ListItem>
                    <ListItem className='report-chat-dialog-item' button onClick={() => this.handleReport('chatReportReasonChildAbuse')}>
                        <ListItemText primary={t('ReportChatChild')}/>
                    </ListItem>
                    <ListItem className='report-chat-dialog-item' button onClick={() => this.handleReport('chatReportReasonCustom')}>
                        <ListItemText primary={t('ReportChatOther')}/>
                    </ListItem>
                </div>
                <DialogActions>
                    <Button onClick={() => onClose(false)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={() => onClose(false)} color='primary'>
                        {t('ReportChat')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

ReportChatDialog.propTypes = {
    onClose: PropTypes.func
};

export default withTranslation()(ReportChatDialog);