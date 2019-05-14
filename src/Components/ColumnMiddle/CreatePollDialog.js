/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import './CreatePollDialog.css';

const styles = {};

class CreatePollDialog extends React.Component {
    render() {
        const { classes, t } = this.props;

        return (
            <Dialog transitionDuration={0} onClose={this.handleClose} aria-labelledby='dialog-title' open>
                <DialogTitle id='dialog-title'>{t('NewPoll')}</DialogTitle>
                <DialogContent />
                <DialogActions>
                    <Button color='primary'>{t('Cancel')}</Button>
                    <Button color='primary'>{t('Send')}</Button>
                </DialogActions>
            </Dialog>
        );
    }
}

CreatePollDialog.propTypes = {};

const enhance = compose(
    withStyles(styles),
    withTranslation()
);

export default enhance(CreatePollDialog);
