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
import classNames from 'classnames';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/EditOutlined';
import TextField from '@material-ui/core/TextField';
import HeaderProgress from '../ColumnMiddle/HeaderProgress';
import { cleanProgressStatus, formatPhoneNumber, isConnecting } from '../../Utils/Common';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './ConfirmCodeControl.css';

const styles = {
    root: {
        '& .MuiTextField-root': {
            margin: '12px 0',
            width: 360,
            [`& fieldset`]: {
                // borderRadius: 8
            },
            [`& input`]: {
                padding: [17.5, 14]
            }
        },
        '& .MuiButton-root': {
            margin: '12px 0',
            padding: '15px 16px',
            width: 360
            // borderRadius: 8
        }
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
        ApplicationStore.off('updateConnectionState', this.onUpdateConnectionState);
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
        const prevCode = this.code || '';
        this.code = e.target.value || '';

        TdLibController.clientUpdate({
            '@type': 'clientUpdateCodeChange',
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
            <div className={classNames('sign-in', classes.root)}>
                <div className='confirm-code-edit'>
                    <Typography variant='body1' style={{ fontSize: 32, fontWeight: 500 }}>
                        <span>{title}</span>
                        {connecting && <HeaderProgress />}
                    </Typography>
                    <IconButton aria-label='edit' onClick={this.handleBack} disabled={loading}>
                        <EditIcon fontSize='small' />
                    </IconButton>
                </div>
                <Typography
                    variant='body1'
                    style={{
                        color: '#707579',
                        minHeight: 72,
                        width: 300,
                        margin: '0 auto 14px auto',
                        textAlign: 'center'
                    }}>
                    {subtitle}
                </Typography>
                <TextField
                    variant='outlined'
                    color='primary'
                    disabled={loading}
                    error={Boolean(error)}
                    helperText={error}
                    fullWidth
                    autoFocus
                    label={t('Code')}
                    maxLength={this.codeLength > 0 ? this.codeLength : 256}
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
            </div>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(ConfirmCodeControl);
