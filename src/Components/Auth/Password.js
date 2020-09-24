/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Typography from '@material-ui/core/Typography';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Button from '@material-ui/core/Button';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import HeaderProgress from '../ColumnMiddle/HeaderProgress';
import { cleanProgressStatus, isConnecting } from './Phone';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Password.css';

class Password extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            connecting: isConnecting(AppStore.connectionState),
            password: '',
            showPassword: false,
            error: ''
        };

        this.inputRef = React.createRef();
    }

    componentDidMount() {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMonkeyClose'
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
        if (this.password) {
            this.setState({ error: '' });
            this.handleDone();
        } else {
            this.setState({ error: 'Invalid password. Please try again.' });
        }
    };

    handleBack = () => {
        this.props.onChangePhone();
    };

    handleDone = () => {
        const password = this.password;

        this.setState({ loading: true });
        TdLibController.send({
            '@type': 'checkAuthenticationPassword',
            password: password
        })
            .then(result => {})
            .catch(error => {
                let errorString = null;
                if (error && error['@type'] === 'error' && error.message) {
                    errorString = error.message;
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

    handleMouseDownPassword = event => {
        event.preventDefault();
    };

    handleClickShowPassword = () => {
        const { showPassword } = this.state;

        this.setState({ showPassword: !showPassword });

        this.sendMonkeyPeek(!showPassword);
    };

    sendMonkeyPeek(peek) {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMonkeyPeek',
            peek
        });
    }

    handleChange = e => {
        this.password = e.target.value;
    };

    handleKeyPress = e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleNext();
        }
    };

    render() {
        const { passwordHint, t } = this.props;
        const { connecting, loading, error, showPassword } = this.state;

        let title = t('EnterPassword');
        if (connecting) {
            title = cleanProgressStatus(t('Connecting'));
        }

        return (
            <form className='auth-root' autoComplete='off'>
                <Typography variant='body1' className='auth-title'>
                    <span>{title}</span>
                    {connecting && <HeaderProgress />}
                </Typography>
                <Typography variant='body1' className='auth-subtitle' style={{ width: 235 }}>
                    {t('YourAccountProtectedWithPassword')}
                </Typography>
                <FormControl className='auth-input' fullWidth variant='outlined'>
                    <InputLabel htmlFor='adornment-password' error={Boolean(error)}>
                        {t('LoginPassword')}
                    </InputLabel>
                    <OutlinedInput
                        fullWidth
                        autoFocus
                        autoComplete='off'
                        id='adornment-password'
                        inputRef={this.inputRef}
                        type={showPassword ? 'text' : 'password'}
                        disabled={loading}
                        error={Boolean(error)}
                        onChange={this.handleChange}
                        onKeyPress={this.handleKeyPress}
                        endAdornment={
                            <InputAdornment position='end'>
                                <IconButton
                                    aria-label='Toggle password visibility'
                                    onClick={this.handleClickShowPassword}
                                    onMouseDown={this.handleMouseDownPassword}
                                    edge='end'>
                                    {showPassword ? <Visibility /> : <VisibilityOff />}
                                </IconButton>
                            </InputAdornment>
                        }
                        labelWidth={70}
                    />
                    {passwordHint && <FormHelperText id='password-hint-text'>{passwordHint}</FormHelperText>}
                    {error && (
                        <FormHelperText id='password-error-text' error>
                            {error}
                        </FormHelperText>
                    )}
                </FormControl>
                <Button
                    classes={{ root: 'auth-button' }}
                    fullWidth
                    color='primary'
                    variant='contained'
                    disableElevation
                    onClick={this.handleNext}
                    disabled={loading}>
                    {t('Next')}
                </Button>
            </form>
        );
    }
}

export default withTranslation()(Password);
