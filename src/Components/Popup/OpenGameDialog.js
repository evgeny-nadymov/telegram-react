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
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import { getUserFullName } from '../../Utils/User';
import { modalManager } from '../../Utils/Modal';
import LStore from '../../Stores/LocalizationStore';
import './OpenGameDialog.css';

class OpenGameDialog extends React.Component {
    render() {
        const { game, params, onClose, t } = this.props;
        if (!game) return null;

        const { userId } = params;

        return (
            <Dialog
                open={true}
                manager={modalManager}
                transitionDuration={0}
                onClose={e => onClose(e, false)}
                classes={{ paper: 'alert-dialog' }}>
                <DialogTitle>{t('AppName')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {LStore.formatString('BotPermissionGameAlert', getUserFullName(userId))}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={e => onClose(e, false)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={e => onClose(e, true)} color='primary'>
                        {t('OK')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

OpenGameDialog.propTypes = {
    game: PropTypes.object,
    params: PropTypes.object,
    onClose: PropTypes.func
};

export default withTranslation()(OpenGameDialog);