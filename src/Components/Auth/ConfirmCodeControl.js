/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import './ConfirmCodeControl.css';
import FormControl from '@material-ui/core/FormControl';
import { formatPhoneNumber } from '../../Utils/Common';
import FormHelperText from '@material-ui/core/FormHelperText/FormHelperText';
import TdLibController from '../../Controllers/TdLibController';

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
    constructor(props) {
        super(props);

        this.state = {
            error: '',
            loading: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.handleDone = this.handleDone.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleNext() {
        if (this.code && this.isValid(this.code)) {
            this.setState({ error: '' });
            this.handleDone();
        } else {
            this.setState({ error: 'Invalid code. Please try again.' });
        }
    }

    handleDone() {
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
    }

    handleBack() {
        this.props.onChangePhone();
    }

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

    handleChange(e) {
        this.code = e.target.value;

        if (this.code && this.codeLength > 0 && this.code.length === this.codeLength) {
            this.handleNext();
        }
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleNext();
        }
    }

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
        const { loading, error } = this.state;
        const { classes, codeInfo } = this.props;

        this.phoneNumber = this.getPhoneNumber(codeInfo);
        this.codeLength = this.getCodeLength(codeInfo);
        const subtitle = this.getSubtitle(codeInfo);

        const title = this.phoneNumber ? formatPhoneNumber(this.phoneNumber) : 'Your Code';

        return (
            <FormControl fullWidth>
                <div className='authorization-header'>
                    <span className='authorization-header-content'>{title}</span>
                </div>
                <div>{subtitle}</div>
                <TextField
                    color='primary'
                    disabled={loading}
                    error={Boolean(error)}
                    fullWidth
                    autoFocus
                    label='Your code'
                    margin='normal'
                    maxLength={this.codeLength > 0 ? this.codeLength : 256}
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
                <FormHelperText id='confirm-code-error-text'>{error}</FormHelperText>
                <div className='authorization-actions'>
                    <Button fullWidth className={classes.buttonLeft} onClick={this.handleBack} disabled={loading}>
                        Back
                    </Button>
                    <Button
                        fullWidth
                        color='primary'
                        className={classes.buttonRight}
                        onClick={this.handleNext}
                        disabled={loading}>
                        Next
                    </Button>
                </div>
            </FormControl>
        );
    }
}

export default withStyles(styles)(ConfirmCodeControl);
