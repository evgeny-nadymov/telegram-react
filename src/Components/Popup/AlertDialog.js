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
import { modalManager } from '../../Utils/Modal';
import { getFormattedText } from '../../Utils/Message';
import './AlertDialog.css';

class AlertDialog extends React.Component {

    handleClose = result => {
        const { onClose } = this.props;

        onClose && onClose(result);
    };

    render() {
        const { params, t } = this.props;
        if (!params) return null;

        let { title, message, ok, cancel } = params;

        if (message['@type'] === 'formattedText') {
            message = getFormattedText(message, t, {});
        }

        return (
            <Dialog
                open={true}
                manager={modalManager}
                transitionDuration={0}
                onClose={this.handleClose}
                classes={{ paper: 'alert-dialog' }}>
                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    { cancel && (
                        <Button onClick={() => this.handleClose(false)} color='primary'>
                            {cancel}
                        </Button>
                    )}
                    { ok && (
                        <Button onClick={() => this.handleClose(true)} color='primary'>
                            {ok}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        );
    }
}

AlertDialog.propTypes = {
    params: PropTypes.object
};

export default withTranslation()(AlertDialog);