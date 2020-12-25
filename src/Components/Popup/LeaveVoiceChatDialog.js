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
import { modalManager } from '../../Utils/Modal';
import LStore from '../../Stores/LocalizationStore';
import './LeaveVoiceChatDialog.css';

class LeaveVoiceChatDialog extends React.Component {
    state = {
        discard: false
    };

    handleDiscardChange = () => {
        const { discard } = this.state;

        this.setState({
            discard: !discard
        });
    };

    render() {
        const { onClose, t } = this.props;
        const { discard } = this.state;

        return (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={true}
                onClose={() => onClose(false, null)}
                aria-labelledby='dialog-title'>
                <DialogTitle id='dialog-title'>
                    {LStore.getString('VoipGroupLeaveAlertTitle')}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {LStore.getString('VoipGroupLeaveAlertText')}
                    </DialogContentText>
                    <FormControlLabel
                        control={<Checkbox checked={discard} onChange={this.handleDiscardChange} color='primary' />}
                        label={t('VoipGroupEndChat')}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose(false, null)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={() => onClose(true, { discard })} color='secondary'>
                        {t('VoipGroupLeave')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }

}

LeaveVoiceChatDialog.propTypes = {
    onClose: PropTypes.func
};

export default withTranslation()(LeaveVoiceChatDialog);