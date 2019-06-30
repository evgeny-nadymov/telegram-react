/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import withStyles from '@material-ui/core/styles/withStyles';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText/FormHelperText';
import TextField from '@material-ui/core/TextField';
import HeaderProgress from '../ColumnMiddle/HeaderProgress';
import { cleanProgressStatus, formatPhoneNumber, isConnecting } from '../../Utils/Common';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './ConfirmCodeControl.css';

const styles = {
    buttonLeft: {
        marginRight: '8px',
        marginTop: '16px'
    },
    buttonRight: {
        marginLeft: '8px',
        marginTop: '16px'
    }
};

class ConfirmCodeControl extends React.Component {
    state = {
        connecting: isConnecting(ApplicationStore.connectionState),
        error: '',
        loading: false
    };

    componentDidMount() {
        ApplicationStore.on('updateConnectionState', this.onUpdateConnectionState);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('updateConnectionState', this.onUpdateConnectionState);
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
        this.code = e.target.value;

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

    getSubtitle(codeInfo) {
        if (!codeInfo) return 'Subtitle';
        if (!codeInfo.type) return 'Subtitle';

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
                return "Please enter the code you've just received in your previous Telegram app.";
            }
        }

        return 'Subtitle';
    }

    render() {
        const { classes, codeInfo, t } = this.props;
        const { connecting, loading, error } = this.state;

        this.phoneNumber = this.getPhoneNumber(codeInfo);
        this.codeLength = this.getCodeLength(codeInfo);
        const subtitle = this.getSubtitle(codeInfo);

        let title = t('YourCode');
        if (connecting) {
            title = cleanProgressStatus(t('Connecting'));
        } else if (this.phoneNumber) {
            title = formatPhoneNumber(this.phoneNumber);
        }

        return (
            <FormControl fullWidth>
                <div className='authorization-header'>
                    <span className='authorization-header-content'>{title}</span>
                    {connecting && <HeaderProgress />}
                </div>
                <div>{subtitle}</div>
                <TextField
                    color='primary'
                    disabled={loading}
                    error={Boolean(error)}
                    fullWidth
                    autoFocus
                    label=''
                    margin='normal'
                    maxLength={this.codeLength > 0 ? this.codeLength : 256}
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
                <FormHelperText id='confirm-code-error-text'>{error}</FormHelperText>
                <div className='authorization-actions'>
                    <Button fullWidth className={classes.buttonLeft} onClick={this.handleBack} disabled={loading}>
                        {t('Back')}
                    </Button>
                    <Button
                        fullWidth
                        color='primary'
                        className={classes.buttonRight}
                        onClick={this.handleNext}
                        disabled={loading}>
                        {t('Next')}
                    </Button>
                </div>
            </FormControl>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(ConfirmCodeControl);
