/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import Country from './Country';
import HeaderProgress from '../ColumnMiddle/HeaderProgress';
import { KEY_SUGGESTED_LANGUAGE_PACK_ID } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import AuthStore from '../../Stores/AuthorizationStore';
import OptionStore from '../../Stores/OptionStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Phone.css';

export function cleanProgressStatus(status) {
    if (!status) return status;

    return status.replace('...', '').replace('…', '');
}

export function isConnecting(state) {
    if (!state) return false;

    switch (state['@type']) {
        case 'connectionStateConnecting': {
            return true;
        }
        case 'connectionStateConnectingToProxy': {
            return true;
        }
        case 'connectionStateReady': {
            return false;
        }
        case 'connectionStateUpdating': {
            return false;
        }
        case 'connectionStateWaitingForNetwork': {
            return false;
        }
    }

    return false;
}

function isValidPhoneNumber(phoneNumber) {
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

function formatByPattern(phone, pattern) {
    phone = clearPhone(phone);

    let result = '';
    let index = 0;
    for (let i = 0; i < pattern.length && index < phone.length; i++) {
        if (pattern[i] >= '0' && pattern[i] <= '9') {
            result += pattern[i];
            if (phone[index] === pattern[i]) {
                index++;
            }
        } else if (pattern[i] === ' ') {
            result += pattern[i];
        } else if (pattern[i] === 'X') {
            result += phone[index++];
        }
    }

    result += ' ' + phone.substring(index);

    return '+' + result;
}

export function formatPhoneNumber(phone) {
    const { data } = AuthStore;
    if (!data) return phone;

    const country = getCountryFromPhone(phone, data);
    if (!country) return phone;

    return formatByPattern(phone, country.pattern);
}

function phoneEquals(phone1, phone2) {
    return clearPhone(phone1) === clearPhone(phone2);
}

function isWhitelistKey(key) {
    if (key >= '0' && key <= '9') return true;
    if (key === ' ') return true;
    if (key === '+') return true;

    return false;
}

function clearPhone(phone) {
    if (!phone) return phone;

    return phone
        .replace(/ /g, '')
        .replace('+', '')
        .toLowerCase();
}

function isPhoneWithOptionCode(phone, option) {
    if (!phone) return false;
    if (!option) return false;

    phone = clearPhone(phone);
    const code = clearPhone(option.phone);

    return phone.startsWith(code);
}

function isValidOption(x, value) {
    if (!x) return false;
    if (!value) return true;

    if (value.length > 0 && value[0] === '(') {
        value = value.substring(1);
    }

    const names = x.name.toLowerCase().split(' ');
    for (let i = 0; i < names.length; i++) {
        if (names[i].length > 0 && names[i][0] === '(') {
            names[i] = names[i].substring(1);
        }
    }
    const phone = clearPhone(x.phone);

    if (names.some(x => x.startsWith(value))) return true;
    if (phone.startsWith(value) || value.startsWith(phone)) return true;

    return false;
}

function getCountryFromPhone(phone, data) {
    if (!data) return null;

    const index = data.findIndex(x => isPhoneWithOptionCode(phone, x));

    return index !== -1 ? data[index] : null;
}

function getCountryFromCode(code, data) {
    if (!code) return null;
    if (!data) return null;

    const index = data.findIndex(x => x.code.toLowerCase() === code.toLowerCase());

    return index !== -1 ? data[index] : null;
}

class Phone extends React.Component {
    constructor(props) {
        super(props);

        const { defaultPhone, data } = props;

        let phone = defaultPhone || '';
        let country = getCountryFromPhone(phone, data);
        if (!phone && !country) {
            const { code } = AuthStore;
            if (code) {
                const [p, c] = this.getPhoneCountry(code);
                phone = p;
                country = c;
            }
        }

        this.state = {
            connecting: isConnecting(AppStore.connectionState),
            error: null,
            loading: false,
            suggestedLanguage: localStorage.getItem(KEY_SUGGESTED_LANGUAGE_PACK_ID),
            keep: true,

            phone,
            country
        };

        this.phoneInputRef = React.createRef();
    }

    getPhoneCountry(code) {
        if (!code) return [null, null];

        const { data } = this.props;
        if (!data) return [null, null];

        let phone = null;
        const country = getCountryFromCode(code.text, data);
        if (country) {
            phone = '+' + clearPhone(country.phone) + ' ';
        }

        return [phone, country];
    }

    onClientUpdateCountryCode = update => {
        const { code } = AuthStore;
        if (!code) return;

        const [phone, country] = this.getPhoneCountry(code);
        if (this.state.phone) {
            return;
        }

        this.setState({ phone, country });
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return true;
    }

    componentDidMount() {
        this.setSuggestedLanguagePackId();

        AuthStore.on('clientUpdateCountryCode', this.onClientUpdateCountryCode);
        AppStore.on('clientUpdateSetPhoneCanceled', this.onClientUpdateSetPhoneCanceled);
        AppStore.on('clientUpdateSetPhoneError', this.onClientUpdateSetPhoneError);
        AppStore.on('clientUpdateSetPhoneResult', this.onClientUpdateSetPhoneResult);
        AppStore.on('updateConnectionState', this.onUpdateConnectionState);
        OptionStore.on('updateOption', this.onUpdateOption);
    }

    componentWillUnmount() {
        AuthStore.off('clientUpdateCountryCode', this.onClientUpdateCountryCode);
        AppStore.off('clientUpdateSetPhoneCanceled', this.onClientUpdateSetPhoneCanceled);
        AppStore.off('clientUpdateSetPhoneError', this.onClientUpdateSetPhoneError);
        AppStore.off('clientUpdateSetPhoneResult', this.onClientUpdateSetPhoneResult);
        AppStore.off('updateConnectionState', this.onUpdateConnectionState);
        OptionStore.off('updateOption', this.onUpdateOption);
    }

    onUpdateConnectionState = update => {
        const { state } = update;

        this.setState({ connecting: isConnecting(state) });
    };

    onClientUpdateSetPhoneCanceled = update => {
        this.setState({ loading: false });
    };

    onClientUpdateSetPhoneError = update => {
        const { error } = update;

        let errorString = null;
        if (error && error['@type'] === 'error' && error.message) {
            if (error.message === 'PHONE_NUMBER_INVALID') {
                this.setState({ error: { code: 'InvalidPhoneNumber' }, loading: false });
                return;
            } else {
                errorString = error.message;
            }
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
            this.setSuggestedLanguagePackId();
        }
    };

    async setSuggestedLanguagePackId() {
        const { i18n } = this.props;
        if (!i18n) return;

        const languagePackId = OptionStore.get('suggested_language_pack_id');
        if (!languagePackId) return;

        const { value } = languagePackId;

        await LocalizationStore.loadLanguage(value);

        this.setState({ suggestedLanguage: value });
    }

    handleKeyPress = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleDone();
        } else if (!isWhitelistKey(event.key)) {
            event.preventDefault();
            event.stopPropagation();
        }
    };

    handleDone = () => {
        const { phone } = this.state;
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

        const nextLanguage = suggestedLanguage === i18n.language ? LocalizationStore.fallbackLng : suggestedLanguage;

        TdLibController.clientUpdate({ '@type': 'clientUpdateLanguageChange', language: nextLanguage });
    };

    handleFilterOptions = (options, { inputValue }) => {
        if (!options) return;

        let value = inputValue.toLowerCase().replace(/ /g, '');
        value = value.length > 0 && value[0] === '+' ? value.substring(1) : value;

        return options.filter(x => isValidOption(x, value));
    };

    handleCountryChange = (event, nextCountry) => {
        if (!nextCountry) return;

        const { phone, country } = this.state;

        const prevPhone = country ? phone.replace(country.phone, '') : phone;
        const nextPhone = nextCountry.phone + ' ' + prevPhone.trimStart();

        this.setState({ country: nextCountry, phone: nextPhone }, () => {
            this.phoneInputRef.current.focus();
        });
    };

    handleKeepChange = (event, value) => {
        this.setState({ keep: !this.state.keep });
    };

    handlePhoneChange = event => {
        let nextPhone = event.target.value;

        const { data } = this.props;
        let { country } = this.state;
        if (country) {
            if (!nextPhone.startsWith(country.phone)) {
                country = null;
            }
        }

        if (!country && data && nextPhone) {
            country = getCountryFromPhone(nextPhone, data);
            if (country && phoneEquals(nextPhone, country.phone)) {
                nextPhone = '+' + clearPhone(nextPhone) + ' ';
            }
        }

        this.setState({ phone: nextPhone, country });
    };

    handlePaste = event => {
        const plainText = event.clipboardData.getData('text/plain');
        if (plainText) {
            event.preventDefault();
            // const phoneRegExp = '/^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g';

            let phone = '';
            for (let ch of plainText) {
                if (isWhitelistKey(ch)) {
                    phone += ch;
                }
            }

            document.execCommand('insertText', false, phone);
        }
    };

    handleQRCode = () => {
        const { onRequestQRCode } = this.props;

        onRequestQRCode && onRequestQRCode();
    };

    render() {
        const { data, i18n, t } = this.props;
        const { connecting, loading, error, suggestedLanguage, keep, phone, country } = this.state;

        let errorString = '';
        if (error) {
            const { code, string } = error;
            if (code) {
                errorString = t(code);
            } else {
                errorString = string;
            }
        }

        const title = connecting ? cleanProgressStatus(t('Connecting')) : t('SignInToTelegram');
        let nextLanguage = suggestedLanguage;
        if (suggestedLanguage === i18n.language && i18n.language !== LocalizationStore.fallbackLng) {
            nextLanguage = LocalizationStore.fallbackLng;
        }

        return (
            <form className='auth-root' autoComplete='off'>
                <Typography variant='body1' className='auth-title'>
                    <span>{title}</span>
                    {connecting && <HeaderProgress />}
                </Typography>
                <Typography variant='body1' className='auth-subtitle' style={{ width: 254 }}>
                    {t('StartText')}
                </Typography>
                <Autocomplete
                    debug={false}
                    id='country-select'
                    noOptionsText={t('NoResult')}
                    options={data || []}
                    disabled={loading}
                    autoHighlight
                    getOptionLabel={option => option.name}
                    renderOption={option => <Country name={option.name} emoji={option.emoji} phone={option.phone} />}
                    renderInput={params => (
                        <TextField
                            classes={{ root: 'auth-input' }}
                            {...params}
                            label={t('Country')}
                            variant='outlined'
                            inputProps={{
                                ...params.inputProps
                            }}
                            fullWidth
                            autoComplete='off'
                        />
                    )}
                    filterOptions={this.handleFilterOptions}
                    value={country}
                    onChange={this.handleCountryChange}
                />
                <TextField
                    id='phoneNumber'
                    classes={{ root: 'auth-input' }}
                    inputRef={this.phoneInputRef}
                    variant='outlined'
                    color='primary'
                    label={t('PhoneNumber')}
                    disabled={loading}
                    error={Boolean(errorString)}
                    helperText={errorString}
                    fullWidth
                    autoFocus
                    autoComplete='off'
                    value={phone}
                    onChange={this.handlePhoneChange}
                    onKeyPress={this.handleKeyPress}
                    onPaste={this.handlePaste}
                />
                <div className='sign-in-keep'>
                    <Checkbox color='primary' checked={keep} disabled={loading} onChange={this.handleKeepChange} />
                    <Typography variant='body1'>{t('KeepMeSignedIn')}</Typography>
                </div>
                <Button
                    classes={{ root: 'auth-button' }}
                    variant='contained'
                    disableElevation
                    fullWidth
                    color='primary'
                    disabled={loading}
                    onClick={this.handleDone}>
                    {t('Next')}
                </Button>
                <Typography className='sign-in-continue-on'>
                    <Link onClick={this.handleQRCode}>
                        {t('LogInViaQR')}
                    </Link>
                </Typography>
                { !!nextLanguage && (
                    <Typography className='sign-in-continue-on'>
                        <Link onClick={this.handleChangeLanguage}>
                            {t('ContinueOnThisLanguage', { lng: nextLanguage })}
                        </Link>
                    </Typography>
                )}
            </form>
        );
    }
}

Phone.propTypes = {
    defaultPhone: PropTypes.string
};

export default withTranslation()(Phone);
