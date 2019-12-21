/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Typography from '@material-ui/core/Typography';
import Country from './Country';
import HeaderProgress from '../ColumnMiddle/HeaderProgress';
import { cleanProgressStatus, isConnecting, isValidPhoneNumber } from '../../Utils/Common';
import { KEY_SUGGESTED_LANGUAGE_PACK_ID } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import OptionStore from '../../Stores/OptionStore';
import LocalizationStore from '../../Stores/LocalizationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Phone.css';

class Phone extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            connecting: isConnecting(AppStore.connectionState),
            error: null,
            loading: false,
            suggestedLanguage: localStorage.getItem(KEY_SUGGESTED_LANGUAGE_PACK_ID),
            keep: true,
            phone: '',
            country: null,
            countryCode: null
        };

        this.phoneInputRef = React.createRef();
    }

    async setCountryCode() {
        const { countryCode } = this.state;
        if (countryCode) return;

        const code = await TdLibController.send({ '@type': 'getCountryCode' });
        if (!code) return;

        let { country, phone, data } = this.state;
        if (!country && !phone && data) {
            const index = data.findIndex(x => x.code.toLowerCase() === code.text.toLowerCase());
            if (index !== -1) {
                country = data[index];
                phone = data[index].phones[0] + ' ';
            }
        }

        this.setState({ phone, country, countryCode });
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return true;

        // const { t } = this.props;
        // const { phone, country, keep, loading, data, error, connecting } = this.state;

        // if (nextProps.t !== t) {
        //     return true;
        // }
        //
        // if (nextState.phone !== phone) {
        //     return true;
        // }
        //
        // if (nextState.country !== country) {
        //     return true;
        // }
        //
        // if (nextState.keep !== keep) {
        //     return true;
        // }
        //
        // if (nextState.data !== data) {
        //     return true;
        // }
        //
        // if (nextState.connecting !== connecting) {
        //     return true;
        // }
        //
        // if (nextState.loading !== loading) {
        //     return true;
        // }
        //
        // if (nextState.error !== error) {
        //     return true;
        // }
        //
        // return false;
    }

    componentDidMount() {
        this.setSuggestedLanguagePackId();
        this.loadData();

        AppStore.on('clientUpdateSetPhoneCanceled', this.onClientUpdateSetPhoneCanceled);
        AppStore.on('clientUpdateSetPhoneError', this.onClientUpdateSetPhoneError);
        AppStore.on('clientUpdateSetPhoneResult', this.onClientUpdateSetPhoneResult);
        AppStore.on('updateConnectionState', this.onUpdateConnectionState);
        OptionStore.on('updateOption', this.onUpdateOption);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateSetPhoneCanceled', this.onClientUpdateSetPhoneCanceled);
        AppStore.off('clientUpdateSetPhoneError', this.onClientUpdateSetPhoneError);
        AppStore.off('clientUpdateSetPhoneResult', this.onClientUpdateSetPhoneResult);
        AppStore.off('updateConnectionState', this.onUpdateConnectionState);
        OptionStore.off('updateOption', this.onUpdateOption);
    }

    loadData = async () => {
        const input = 'json/countries.json';
        try {
            const response = await fetch(input);
            const data = await response.json();
            this.setState({ data: data.filter(x => x.emoji) });
        } catch (error) {
            console.error(error);
        }
    };

    onUpdateConnectionState = update => {
        const { state } = update;

        if (state['@type'] === 'connectionStateReady') {
            this.setCountryCode();
        }

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

    setSuggestedLanguagePackId = async () => {
        const { i18n } = this.props;
        if (!i18n) return;

        const languagePackId = OptionStore.get('suggested_language_pack_id');
        if (!languagePackId) return;

        const { value } = languagePackId;

        await LocalizationStore.loadLanguage(value);

        this.setState({ suggestedLanguage: value });
    };

    handleKeyDown = event => {
        console.log('[kp] keyDown', event.key);
    };

    isWhitelistKey(key) {
        if (key >= '0' && key <= '9') return true;
        if (key === ' ') return true;
        if (key === '+') return true;

        return false;
    }

    handleKeyPress = event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleDone();
        } else if (!this.isWhitelistKey(event.key)) {
            event.preventDefault();
            event.stopPropagation();
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

        const nextLanguage =
            suggestedLanguage === i18n.language ? LocalizationStore.defaultLanguage : suggestedLanguage;

        TdLibController.clientUpdate({ '@type': 'clientUpdateLanguageChange', language: nextLanguage });
    };

    handleFilterOptions = (options, { inputValue }) => {
        if (!options) return;

        let value = inputValue.toLowerCase().replace(/ /g, '');
        value = value.length > 0 && value[0] === '+' ? value.substring(1) : value;

        return options.filter(x => this.isValidOption(x, value));
    };

    phoneEquals = (phone1, phone2) => {
        return this.cleanPhone(phone1) === this.cleanPhone(phone2);
    };

    cleanPhone = phone => {
        if (!phone) return phone;

        return phone
            .replace(/ /g, '')
            .replace('+', '')
            .toLowerCase();
    };

    isValidOption = (x, value) => {
        if (!x) return false;
        if (!value) return true;

        const names = x.name.toLowerCase().split(' ');
        const phone = x.phones[0]
            .replace(/ /g, '')
            .replace('+', '')
            .toLowerCase();

        if (names.some(x => x.startsWith(value))) return true;
        if (phone.startsWith(value) || value.startsWith(phone)) return true;

        return false;
    };

    isPhoneWithOptionCode = (phone, x) => {
        if (!phone) return false;
        if (!x) return false;

        phone = phone
            .replace(/ /g, '')
            .replace('+', '')
            .toLowerCase();
        const code = x.phones[0]
            .replace(/ /g, '')
            .replace('+', '')
            .toLowerCase();

        return phone.startsWith(code);
    };

    handleCountryChange = (event, nextCountry) => {
        if (!nextCountry) return;

        const { phone, country } = this.state;

        const prevPhone = country ? phone.replace(country.phones[0], '') : phone;
        const nextPhone = nextCountry.phones[0] + ' ' + prevPhone.trimStart();

        this.setState({ country: nextCountry, phone: nextPhone }, () => {
            this.phoneInputRef.current.focus();
        });
    };

    handleKeepChange = (event, value) => {
        this.setState({ keep: !this.state.keep });
    };

    handlePhoneChange = event => {
        this.enteredPhone = event.target.value;

        let nextPhone = event.target.value;

        let { country, data } = this.state;
        if (country) {
            if (!nextPhone.startsWith(country.phones[0])) {
                country = null;
            }
        }

        if (!country && data && nextPhone) {
            const index = data.findIndex(x => this.isPhoneWithOptionCode(nextPhone, x));
            if (index !== -1) {
                country = data[index];
                if (nextPhone[0] !== '+') {
                    nextPhone = '+' + nextPhone;
                    if (this.phoneEquals(nextPhone, data[index].phones[0])) {
                        nextPhone = nextPhone + ' ';
                    }
                }
            }
        }

        this.setState({ phone: nextPhone, country });
    };

    render() {
        const { defaultPhone, i18n, t } = this.props;
        const { connecting, loading, error, suggestedLanguage, data, keep, phone, country } = this.state;

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
        const nextLanguage =
            suggestedLanguage === i18n.language ? LocalizationStore.defaultLanguage : suggestedLanguage;

        return (
            <div className='sign-in'>
                <Typography variant='body1' className='auth-title'>
                    <span>{title}</span>
                    {connecting && <HeaderProgress />}
                </Typography>
                <Typography variant='body1' className='auth-subtitle'>
                    {t('StartText')}
                </Typography>
                <Autocomplete
                    debug={false}
                    id='country-select'
                    noOptionsText={t('NoResult')}
                    options={data}
                    disabled={loading}
                    fullWidth
                    autoHighlight
                    getOptionLabel={option => option.name}
                    renderOption={option => (
                        <Country name={option.name} emoji={option.emoji} phone={option.phones[0]} />
                    )}
                    renderInput={params => (
                        <TextField
                            classes={{ root: 'auth-input' }}
                            {...params}
                            label={t('Country')}
                            variant='outlined'
                            inputProps={{
                                ...params.inputProps,
                                autoComplete: 'disabled'
                            }}
                            fullWidth
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
                    defaultValue={defaultPhone}
                    value={phone}
                    onChange={this.handlePhoneChange}
                    onKeyPress={this.handleKeyPress}
                    onKeyDown={this.handleKeyDown}
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
                    <Link onClick={this.handleChangeLanguage}>
                        {Boolean(nextLanguage) ? t('ContinueOnThisLanguage', { lng: nextLanguage }) : ' '}
                    </Link>
                </Typography>
            </div>
        );
    }
}

Phone.propTypes = {
    defaultPhone: PropTypes.string
};

const enhance = compose(withTranslation());

export default enhance(Phone);
