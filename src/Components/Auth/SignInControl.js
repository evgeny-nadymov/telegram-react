/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import { formatPhoneNumberSimple } from '../../Utils/Common';
import { getCountryList, getDefaultCountryCode, getCountryPhoneData, lookupCountryByPhone } from '../../Utils/Country';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import OptionStore from '../../Stores/OptionStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import { formatIncompletePhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';
import TdLibController from '../../Controllers/TdLibController';
import './SignInControl.css';

const styles = {
    button: {
        margin: '16px 0 0 0'
    },
    continueAtLanguage: {
        transform: 'translateY(100px)',
        textAlign: 'center',
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0
    },
    fldPhoneCode: {
        fontWeight: 'bold',
        width: 80
    },
    fldPhoneNumber: {
        fontWeight: 'bold'
    }
};

const DEFAULT_COUNTRY_CODE = getDefaultCountryCode(),
    PHONE_CODE_INPUT_PROPS = { maxLength: 4 };

class SignInControl extends React.Component {
    constructor(props) {
        super(props);

        this.phoneFieldRef = React.createRef();

        const parts = formatIncompletePhoneNumber('+' + this.props.phone).split(' '),
            phoneCode = parts.shift().replace(/\D/g, ''),
            phoneNumber = parts.join(' ').replace(/\D/g, ''),
            phoneData = phoneNumber
                ? { phoneCode, phoneNumber, countryCode: lookupCountryByPhone(phoneCode, phoneNumber) }
                : getCountryPhoneData(DEFAULT_COUNTRY_CODE);

        this.state = {
            error: null,
            loading: false,
            phoneCode,
            phoneNumber,
            countryCode: DEFAULT_COUNTRY_CODE,
            ...phoneData
        };
    }

    componentDidMount() {
        this.onSuggestedLanguagePackId();

        OptionStore.on('updateOption', this.onUpdateOption);
    }

    componentWillUnmount() {
        OptionStore.removeListener('updateOption', this.onUpdateOption);
    }

    onUpdateOption = update => {
        const { name } = update;

        if (name === 'suggested_language_pack_id') {
            this.onSuggestedLanguagePackId();
        }
    };

    onSuggestedLanguagePackId = () => {
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

    onKeyPress = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onDone();
        }
    };

    onDone = () => {
        const { onPhoneEnter } = this.props,
            { phoneCode, phoneNumber, countryCode } = this.state,
            fullPhoneNumber = phoneCode + phoneNumber,
            phoneData = parsePhoneNumberFromString('+' + fullPhoneNumber, countryCode);

        if (!phoneData || !phoneData.isValid()) {
            this.setState({ error: { code: 'InvalidPhoneNumber' } });
            return;
        }

        onPhoneEnter(fullPhoneNumber);

        this.setState({ error: null, loading: true });
        TdLibController.send({
            '@type': 'setAuthenticationPhoneNumber',
            phone_number: fullPhoneNumber
        })
            .then(result => {})
            .catch(error => {
                let errorString = null;
                if (error && error['@type'] === 'error' && error.message) {
                    errorString = error.message;
                } else {
                    errorString = JSON.stringify(error);
                }

                this.setState({ error: { string: errorString } });
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    };

    onChangeLanguage = () => {
        const { i18n } = this.props,
            { suggestedLanguage } = this.state;

        if (!i18n || !suggestedLanguage) return;

        this.setState({ suggestedLanguage: i18n.language });

        TdLibController.clientUpdate({ '@type': 'clientUpdateLanguageChange', language: suggestedLanguage });
    };

    focusPhoneNumber = () => {
        setTimeout(() => {
            const el = this.phoneFieldRef.current,
                l = el.value.length;

            el.focus();
            el.setSelectionRange(l, l);
        }, 50);
    };

    onCountryChange = event => {
        const countryCode = event.target.value,
            { phoneCode, phoneNumber } = getCountryPhoneData(countryCode);

        this.setState({ countryCode, phoneCode, phoneNumber });
        this.focusPhoneNumber();
    };

    onCodeChange = event => {
        const phoneCode = event.target.value.replace(/\D/g, ''),
            { phoneNumber } = this.state,
            currentPhoneData = getCountryPhoneData(this.state.countryCode),
            countryCode = phoneCode ? lookupCountryByPhone(phoneCode, phoneNumber) : '';

        if (currentPhoneData.phoneCode && phoneCode.length > currentPhoneData.phoneCode.length) {
            this.setState({ phoneNumber: phoneCode.substr(currentPhoneData.phoneCode.length) });
            this.focusPhoneNumber();
            return;
        }

        this.setState({ phoneCode, countryCode });
    };

    onPhoneNumberChange = event => {
        const phoneNumber = event.target.value.replace(/\D/g, '');

        this.setState({ phoneNumber });
    };

    renderCountries = lang => {
        const { i18n, t } = this.props;

        if (!i18n) return null;

        const placeholder = (
                <MenuItem key='placeholder' disabled value='000'>
                    <em>{t('Country')}</em>
                </MenuItem>
            ),
            countries = [
                placeholder,
                ...getCountryList(i18n.language).map((country, i) => {
                    return (
                        <MenuItem key={i} color='primary' value={country.code}>
                            <span className={`flag-icon flag-icon-${country.codeLC}`} />
                            {country.name}
                        </MenuItem>
                    );
                })
            ];

        return countries;
    };

    render() {
        const { classes, t } = this.props;
        const { loading, error, suggestedLanguage, countryCode, phoneCode, phoneNumber } = this.state,
            phoneNumberStr = formatPhoneNumberSimple(phoneCode, phoneNumber, countryCode);

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
                <div className='sign-in-country-container'>
                    <Select
                        color='primary'
                        className='sign-in-country'
                        value={countryCode || '000'}
                        disabled={loading}
                        input={<OutlinedInput labelWidth={0} />}
                        onChange={this.onCountryChange}>
                        {this.renderCountries()}
                    </Select>
                </div>
                <div className='sign-in-phone-container'>
                    <TextField
                        className={classes.fldPhoneCode}
                        color='primary'
                        disabled={loading}
                        error={Boolean(errorString)}
                        id='phoneCode'
                        label=''
                        size={2}
                        margin='normal'
                        onChange={this.onCodeChange}
                        onKeyPress={this.onKeyPress}
                        value={`+${phoneCode}`}
                        inputProps={PHONE_CODE_INPUT_PROPS}
                    />
                    <TextField
                        inputRef={this.phoneFieldRef}
                        className={classes.fldPhoneNumber}
                        color='primary'
                        disabled={loading}
                        error={Boolean(errorString)}
                        fullWidth
                        autoFocus
                        id='phoneNumber'
                        label=''
                        margin='normal'
                        onChange={this.onPhoneNumberChange}
                        onKeyPress={this.onKeyPress}
                        value={phoneNumberStr}
                    />
                </div>
                <FormHelperText id='sign-in-error-text'>{errorString}</FormHelperText>
                <div className='sign-in-actions'>
                    <Button
                        fullWidth
                        color='primary'
                        disabled={loading}
                        className={classes.button}
                        onClick={this.onDone}>
                        {t('Next')}
                    </Button>
                    <Typography className={classes.continueAtLanguage}>
                        <Link onClick={this.onChangeLanguage}>
                            {Boolean(suggestedLanguage) ? t('ContinueOnThisLanguage', { lng: suggestedLanguage }) : ' '}
                        </Link>
                    </Typography>
                </div>
            </FormControl>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(SignInControl);
