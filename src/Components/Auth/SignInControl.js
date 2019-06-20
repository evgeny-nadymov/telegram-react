/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import { isValidPhoneNumber } from '../../Utils/Common';
import ApplicationStore from '../../Stores/ApplicationStore';
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
        transform: 'translateY(100px)',
        textAlign: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0
    }
};

class SignInControl extends React.Component {
    state = {
        error: null,
        loading: false
    };

    componentDidMount() {
        this.handleSuggestedLanguagePackId();

        ApplicationStore.on('clientUpdateSetPhoneCanceled', this.onClientUpdateSetPhoneCanceled);
        ApplicationStore.on('clientUpdateSetPhoneError', this.onClientUpdateSetPhoneError);
        ApplicationStore.on('clientUpdateSetPhoneResult', this.onClientUpdateSetPhoneResult);
        OptionStore.on('updateOption', this.onUpdateOption);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateSetPhoneCanceled', this.onClientUpdateSetPhoneCanceled);
        ApplicationStore.removeListener('clientUpdateSetPhoneError', this.onClientUpdateSetPhoneError);
        ApplicationStore.removeListener('clientUpdateSetPhoneResult', this.onClientUpdateSetPhoneResult);
        OptionStore.removeListener('updateOption', this.onUpdateOption);
    }

    onClientUpdateSetPhoneCanceled = update => {
        this.setState({ loading: false });
    };

    onClientUpdateSetPhoneError = update => {
        const { error } = update;

        let errorString = null;
        if (error && error['@type'] === 'error' && error.message) {
            errorString = error.message;
        } else {
            errorString = JSON.stringify(error);
        }

        this.setState({ error: { string: errorString }, loading: false });
    };

    onClientUpdateSetPhoneResult = update => {
        this.setState({ loading: false });
    };

    onUpdateOption = update => {
        const { name } = update;

        if (name === 'suggested_language_pack_id') {
            this.handleSuggestedLanguagePackId();
        }
    };

    handleSuggestedLanguagePackId = () => {
        const { i18n } = this.props;
        if (!i18n) return;

        const languagePackId = OptionStore.get('suggested_language_pack_id');
        if (!languagePackId) return;

        const { value } = languagePackId;
        if (value === i18n.language) {
            this.setState({ suggestedLanguage: null });
            return;
        }

        LocalizationStore.loadLanguage(value).then(() => {
            this.setState({ suggestedLanguage: value });
        });
    };

    handleNext = () => {
        const { defaultPhone } = this.props;

        const phone = this.enteredPhone || defaultPhone;

        if (isValidPhoneNumber(phone)) {
            this.setState({ error: null, openConfirmation: true });
        } else {
            this.setState({ error: { code: 'InvalidPhoneNumber' } });
        }
    };

    handleChange = event => {
        this.enteredPhone = event.target.value;
    };

    handleKeyPress = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleNext();
        }
    };

    handleDone = () => {
        const { defaultPhone } = this.props;

        const phone = this.enteredPhone || defaultPhone;
        if (!isValidPhoneNumber(phone)) {
            this.setState({ error: { code: 'InvalidPhoneNumber' } });
            return;
        }

        this.setState({ error: null, loading: true });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateSetPhone',
            phone
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
        const { defaultPhone, classes, t } = this.props;
        const { loading, error, suggestedLanguage } = this.state;

        let errorString = '';
        if (error) {
            const { code, string } = error;
            if (code) {
                errorString = t(code);
            } else {
                errorString = string;
            }
        }

        return (
            <FormControl fullWidth>
                <div className='authorization-header'>
                    <span className='authorization-header-content'>{t('YourPhone')}</span>
                </div>
                <div>{t('StartText')}</div>
                <TextField
                    color='primary'
                    disabled={loading}
                    error={Boolean(errorString)}
                    fullWidth
                    autoFocus
                    id='phoneNumber'
                    label=''
                    margin='normal'
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                    defaultValue={defaultPhone}
                />
                <FormHelperText id='sign-in-error-text'>{errorString}</FormHelperText>
                <div className='sign-in-actions'>
                    <Button
                        fullWidth
                        color='primary'
                        disabled={loading}
                        className={classes.button}
                        onClick={this.handleDone}>
                        {t('Next')}
                    </Button>
                    <Typography className={classes.continueAtLanguage}>
                        <Link onClick={this.handleChangeLanguage}>
                            {Boolean(suggestedLanguage) ? t('ContinueOnThisLanguage', { lng: suggestedLanguage }) : ' '}
                        </Link>
                    </Typography>
                </div>
            </FormControl>
        );
    }
}

SignInControl.propTypes = {
    defaultPhone: PropTypes.string
};

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(SignInControl);
