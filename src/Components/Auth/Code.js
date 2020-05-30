/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/EditOutlined';
import TextField from '@material-ui/core/TextField';
import HeaderProgress from '../ColumnMiddle/HeaderProgress';
import { cleanProgressStatus, formatPhoneNumber, isConnecting } from './Phone';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Code.css';

class Code extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            connecting: isConnecting(AppStore.connectionState),
            error: '',
            loading: false
        };

        this.inputRef = React.createRef();
    }

    componentDidMount() {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMonkeyIdle'
        });

        AppStore.on('updateConnectionState', this.onUpdateConnectionState);
    }

    componentWillUnmount() {
        AppStore.off('updateConnectionState', this.onUpdateConnectionState);
    }

    onUpdateConnectionState = update => {
        const { state } = update;

        this.setState({ connecting: isConnecting(state) });
    };

    handleNext = () => {
        if (this.code && this.isValid(this.code)) {
            this.setState({ error: '' });
            this.handleDone();
        } else {
            this.setState({ error: 'Invalid code. Please try again.' });
        }
    };

    handleDone = () => {
        const { t } = this.props;
        const code = this.code;

        this.setState({ loading: true });
        TdLibController.send({
            '@type': 'checkAuthenticationCode',
            code: code,
            first_name: 'A',
            last_name: 'B'
        })
            .then(result => {})
            .catch(error => {
                let errorString = null;
                if (error && error['@type'] === 'error' && error.message) {
                    if (error.message === 'PHONE_CODE_INVALID') {
                        errorString = t('InvalidCode');
                    } else {
                        errorString = error.message;
                    }
                } else {
                    errorString = JSON.stringify(error);
                }

                this.setState({ error: errorString }, () => {
                    setTimeout(() => this.inputRef.current.focus(), 100);
                });
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    };

    handleBack = () => {
        this.props.onChangePhone();
    };

    isValid(code) {
        let isBad = !code.match(/^[\d\-+\s]+$/);
        if (!isBad) {
            code = code.replace(/\D/g, '');
            if (code.length !== 5) {
                isBad = true;
            }
        }

        return !isBad;
    }

    handleChange = e => {
        const prevCode = this.code || '';
        this.code = e.target.value || '';

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMonkeyTracking',
            prevCode,
            code: this.code
        });

        if (this.code && this.codeLength > 0 && this.code.length === this.codeLength) {
            this.handleNext();
        }
    };

    handleKeyPress = e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleNext();
        }
    };

    getPhoneNumber(codeInfo) {
        if (!codeInfo) return null;
        return codeInfo.phone_number;
    }

    getCodeLength(codeInfo) {
        if (!codeInfo) return 0;
        if (!codeInfo.type) return 0;

        switch (codeInfo.type['@type']) {
            case 'authenticationCodeTypeCall': {
                return codeInfo.type.length;
            }
            case 'authenticationCodeTypeFlashCall': {
                return 0;
            }
            case 'authenticationCodeTypeSms': {
                return codeInfo.type.length;
            }
            case 'authenticationCodeTypeTelegramMessage': {
                return codeInfo.type.length;
            }
        }

        return 0;
    }

    getSubtitle(codeInfo, t = k => k) {
        if (!codeInfo) return '';
        if (!codeInfo.type) return '';

        switch (codeInfo.type['@type']) {
            case 'authenticationCodeTypeCall': {
                return 'Telegram dialed your number';
            }
            case 'authenticationCodeTypeFlashCall': {
                return 'Telegram dialed your number';
            }
            case 'authenticationCodeTypeSms': {
                return 'We have sent you a message with activation code to your phone. Please enter it below.';
            }
            case 'authenticationCodeTypeTelegramMessage': {
                return 'Please enter the code you\'ve just received in your previous Telegram app.';
            }
        }

        return '';
    }

    render() {
        const { codeInfo, t } = this.props;
        const { connecting, loading, error } = this.state;

        this.phoneNumber = this.getPhoneNumber(codeInfo);
        this.codeLength = this.getCodeLength(codeInfo);
        const subtitle = this.getSubtitle(codeInfo);

        let title = 'Title';
        if (connecting) {
            title = cleanProgressStatus(t('Connecting'));
        } else if (this.phoneNumber) {
            title = formatPhoneNumber(this.phoneNumber);
        }

        return (
            <form className='auth-root' autoComplete='off'>
                <div className={classNames('code-title', 'auth-title')}>
                    <Typography variant='body1' className='auth-title-typography'>
                        <span>{title}</span>
                        {connecting && <HeaderProgress />}
                    </Typography>
                    <IconButton aria-label='edit' onClick={this.handleBack} disabled={loading}>
                        <EditIcon fontSize='small' />
                    </IconButton>
                </div>
                <Typography variant='body1' className='auth-subtitle' style={{ width: 300 }}>
                    {subtitle}
                </Typography>
                <TextField
                    classes={{ root: 'auth-input' }}
                    inputRef={this.inputRef}
                    variant='outlined'
                    color='primary'
                    disabled={loading}
                    error={Boolean(error)}
                    helperText={error}
                    fullWidth
                    autoFocus
                    autoComplete='off'
                    label={t('Code')}
                    maxLength={this.codeLength > 0 ? this.codeLength : 256}
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
            </form>
        );
    }
}

export default withTranslation()(Code);
