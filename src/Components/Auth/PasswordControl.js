/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import withStyles from '@material-ui/core/styles/withStyles';
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
import { cleanProgressStatus, isConnecting } from '../../Utils/Common';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './PasswordControl.css';

const styles = theme => ({
    root: {
        '& .MuiOutlinedInput-root': {
            margin: '0 0',
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
    },
    margin: {
        margin: '12px 0'
    },
    withoutLabel: {
        marginTop: theme.spacing(3)
    },
    textField: {
        width: 360
    }
});

class PasswordControl extends React.Component {
    state = {
        connecting: isConnecting(ApplicationStore.connectionState),
        password: '',
        showPassword: false,
        error: ''
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

                this.setState({ error: errorString });
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    };

    handleMouseDownPassword = event => {
        event.preventDefault();
    };

    handleClickShowPassword = () => {
        this.setState({ showPassword: !this.state.showPassword });
    };

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
        const { classes, passwordHint, t } = this.props;
        const { connecting, loading, error, showPassword } = this.state;

        let title = t('EnterPassword');
        if (connecting) {
            title = cleanProgressStatus(t('Connecting'));
        }

        return (
            <div className={classNames('sign-in', classes.root)}>
                <Typography variant='body1' style={{ fontSize: 32, fontWeight: 500, margin: '0 auto 7px auto' }}>
                    <span>{title}</span>
                    {connecting && <HeaderProgress />}
                </Typography>
                <Typography
                    variant='body1'
                    style={{
                        color: '#707579',
                        width: 235,
                        minHeight: 72,
                        margin: '0 auto 14px auto',
                        textAlign: 'center'
                    }}>
                    {t('YourAccountProtectedWithPassword')}
                </Typography>
                <FormControl fullWidth className={classNames(classes.margin, classes.textField)} variant='outlined'>
                    <InputLabel htmlFor='adornment-password' error={Boolean(error)}>
                        {t('LoginPassword')}
                    </InputLabel>
                    <OutlinedInput
                        fullWidth
                        autoFocus
                        id='adornment-password'
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
                    fullWidth
                    color='primary'
                    variant='contained'
                    disableElevation
                    onClick={this.handleNext}
                    disabled={loading}>
                    {t('Next')}
                </Button>
            </div>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(PasswordControl);
