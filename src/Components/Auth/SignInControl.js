/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { withNamespaces } from 'react-i18next';
import { compose } from 'recompose';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import { formatPhoneNumber } from '../../Utils/Common';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import OptionStore from '../../Stores/OptionStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './SignInControl.css';

const styles = {
    button: {
        margin: '16px 0 0 0'
    },
    phone: {
        fontWeight: 'bold',
        textAlign: 'center'
    },
    continueAtLanguage: {
        transform: 'translateY(80px)'
    }
};

class SignInControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            error: '',
            openConfirmation: false,
            loading: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleDialogKeyPress = this.handleDialogKeyPress.bind(this);
    }

    componentDidMount() {
        const suggestedOption = OptionStore.get('suggested_language_pack_id');
        if (suggestedOption && suggestedOption.value !== this.props.i18n.language) {
            LocalizationStore.loadLanguage(suggestedOption.value).then(() => {
                this.setState({ suggestedLanguage: suggestedOption.value });
            });
        }
    }

    handleNext() {
        const phoneNumber = this.phoneNumber || this.props.phone;

        if (this.isValidPhoneNumber(phoneNumber)) {
            this.setState({ error: '', openConfirmation: true });
        } else {
            this.setState({ error: 'Invalid phone number. Please try again.' });
        }
    }

    isValidPhoneNumber(phoneNumber) {
        if (!phoneNumber) return false;

        let isBad = !phoneNumber.match(/^[\d\-+\s]+$/);
        if (!isBad) {
            phoneNumber = phoneNumber.replace(/\D/g, '');
            if (phoneNumber.length < 7) {
                isBad = true;
            }
        }

        return !isBad;
    }

    handleChange(e) {
        this.phoneNumber = e.target.value;
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleNext();
        }
    }

    handleDialogKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleDone();
        }
    }

    handleClose() {
        this.setState({ openConfirmation: false });
    }

    handleDone = () => {
        const phoneNumber = this.phoneNumber || this.props.phone;

        this.props.onPhoneEnter(phoneNumber);
        this.setState({ openConfirmation: false, loading: true });
        TdLibController.send({
            '@type': 'setAuthenticationPhoneNumber',
            phone_number: phoneNumber
        })
            .then(result => {})
            .catch(error => {
                let errorString = null;
                if (error && error['@type'] === 'error' && error.message) {
                    errorString = error.message;
                } else {
                    errorString = JSON.stringify(error);
                }

                this.setState({ error: errorString });
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    };

    handleChangeLanguage = () => {
        const { i18n } = this.props;
        const { suggestedLanguage } = this.state;

        if (!i18n) return;
        if (!suggestedLanguage) return;

        this.setState({ suggestedLanguage: i18n.language });

        TdLibController.clientUpdate({ '@type': 'clientUpdateLanguageChange', language: suggestedLanguage });
    };

    render() {
        const { phone, classes, t } = this.props;
        const { loading, error, openConfirmation, suggestedLanguage } = this.state;
        const phoneNumber = this.phoneNumber || this.props.phone;

        return (
            <FormControl fullWidth>
                <div className='authorization-header'>
                    <span className='authorization-header-content'>{t('YourPhone')}</span>
                </div>
                <div>{t('StartText')}</div>
                <TextField
                    color='primary'
                    disabled={loading}
                    error={Boolean(error)}
                    fullWidth
                    autoFocus
                    id='phoneNumber'
                    label=''
                    margin='normal'
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                    defaultValue={phone}
                />
                <FormHelperText id='sign-in-error-text'>{error}</FormHelperText>
                <div className='authorization-actions'>
                    <Button
                        fullWidth
                        color='primary'
                        disabled={loading}
                        className={classes.button}
                        onClick={this.handleNext}>
                        {t('Next')}
                    </Button>
                    <Typography className={classes.continueAtLanguage}>
                        <Link onClick={this.handleChangeLanguage}>
                            {Boolean(suggestedLanguage) ? t('ContinueOnThisLanguage', { lng: suggestedLanguage }) : ' '}
                        </Link>
                    </Typography>
                </div>
                <Dialog
                    open={openConfirmation}
                    onClose={this.handleClose}
                    onKeyPress={this.handleDialogKeyPress}
                    aria-labelledby='form-dialog-title'>
                    <DialogTitle id='form-dialog-title'>Telegram</DialogTitle>
                    <DialogContent>
                        <DialogContentText>Is this phone number correct?</DialogContentText>
                        <DialogContentText className={classes.phone}>
                            {formatPhoneNumber(phoneNumber)}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose} color='secondary'>
                            Cancel
                        </Button>
                        <Button onClick={this.handleDone} color='primary'>
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            </FormControl>
        );
    }
}

const enhance = compose(
    withNamespaces(),
    withStyles(styles, { withTheme: true })
);

export default enhance(SignInControl);
