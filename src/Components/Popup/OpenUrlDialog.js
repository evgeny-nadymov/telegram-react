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
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import { modalManager } from '../../Utils/Modal';
import LStore from '../../Stores/LocalizationStore';
import './OpenUrlDialog.css';

class OpenUrlDialog extends React.Component {
    render() {
        const { url, onClose, t } = this.props;
        if (!url) return null;

        return (
            <Dialog
                open={true}
                manager={modalManager}
                transitionDuration={0}
                onClose={e => onClose(e, false)}
                classes={{ paper: 'alert-dialog' }}>
                <DialogTitle>{t('OpenUrlTitle')}</DialogTitle>
                <DialogContent style={{ overflowWrap: 'break-word' }}>
                    <DialogContentText>
                        {LStore.formatString('OpenUrlAlert2', url)}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={e => onClose(e, false)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={e => onClose(e, true)} color='primary'>
                        {t('Open')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

OpenUrlDialog.propTypes = {
    url: PropTypes.string,
    params: PropTypes.object,
    onClose: PropTypes.func
};

export default withTranslation()(OpenUrlDialog);