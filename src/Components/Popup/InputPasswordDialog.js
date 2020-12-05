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
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import { modalManager } from '../../Utils/Modal';
import LStore from '../../Stores/LocalizationStore';
import './InputPasswordDialog.css';

class InputPasswordDialog extends React.Component {

    state = { };

    handleChange = e => {
        this.password = e.target.value;
    };

    handleClickShowPassword = () => {
        const { showPassword } = this.state;

        this.setState({ showPassword: !showPassword });
    };

    getErrorMessage = error => {
        const { t } = this.props;

        if (!error) return null;

        if (error.message === 'PASSWORD_HASH_INVALID') {
            return t('InvalidPassword');
        } else if (error.message.startsWith('Too Many Requests: retry after ')) {
            const str = error.message.replace('Too Many Requests: retry after ', '');
            try {
                const time = parseInt(str);
                const timeString = time < 60
                    ? LStore.formatPluralString('Seconds', time)
                    : LStore.formatPluralString('Minutes', Math.floor(time / 60));

                return LStore.formatString('FloodWaitTime', timeString);
            } catch (e) {
                return error.message;
            }
        }

        return error.message;
    }

    render() {
        const { state, error, onClose, t } = this.props;
        if (!state) return null;

        const { showPassword, loading } = this.state;
        const { password_hint: passwordHint } = state;

        const errorMessage = this.getErrorMessage(error);

        return (
            <Dialog
                open={true}
                manager={modalManager}
                transitionDuration={0}
                onClose={() => onClose(false)}
                classes={{ paper: 'alert-dialog' }}>
                <DialogTitle>{t('TwoStepVerificationTitle')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('PleaseEnterCurrentPasswordTransfer')}
                    </DialogContentText>
                    <FormControl className='auth-input' fullWidth>
                        <InputLabel htmlFor='adornment-password' error={Boolean(error)}>{t('LoginPassword')}</InputLabel>
                        <Input
                            fullWidth
                            autoFocus
                            autoComplete='off'
                            id='adornment-password'
                            type={showPassword ? 'text' : 'password'}
                            disabled={loading}
                            error={Boolean(error)}
                            onChange={this.handleChange}
                            endAdornment={
                                <InputAdornment position='end'>
                                    <IconButton
                                        aria-label='Toggle password visibility'
                                        onClick={this.handleClickShowPassword}
                                        edge='end'>
                                        {showPassword ? <Visibility /> : <VisibilityOff />}
                                    </IconButton>
                                </InputAdornment>
                            }
                        />
                        {passwordHint && <FormHelperText id='password-hint-text'>{passwordHint}</FormHelperText>}
                        <FormHelperText id='password-error-text' error>{errorMessage || ' '}</FormHelperText>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose(false)} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={() => onClose(true, this.password)} color='primary'>
                        {t('OK')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

InputPasswordDialog.propTypes = {
    state: PropTypes.object,
    error: PropTypes.object,
    onClose: PropTypes.func
};

export default withTranslation()(InputPasswordDialog);