/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import Input from '@material-ui/core/Input';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import Button from '@material-ui/core/Button';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import TdLibController from '../../Controllers/TdLibController';
import './PasswordControl.css';

const styles = theme => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap'
    },
    margin: {
        margin: '16px 0 8px 0'
    },
    withoutLabel: {
        marginTop: theme.spacing.unit * 3
    },
    textField: {
        flexBasis: 200
    },
    buttonLeft: {
        marginRight: '8px',
        marginTop: '16px'
    },
    buttonRight: {
        marginLeft: '8px',
        marginTop: '16px'
    }
});

class PasswordControl extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            password: '',
            showPassword: false,
            error: ''
        };

        this.handleClickShowPassword = this.handleClickShowPassword.bind(this);
        this.handleMouseDownPassword = this.handleMouseDownPassword.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleDone = this.handleDone.bind(this);
    }

    handleNext() {
        if (this.password) {
            this.setState({ error: '' });
            this.handleDone();
        } else {
            this.setState({ error: 'Invalid password. Please try again.' });
        }
    }

    handleBack() {
        this.props.onChangePhone();
    }

    handleDone() {
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
    }

    handleMouseDownPassword = event => {
        event.preventDefault();
    };

    handleClickShowPassword = () => {
        this.setState({ showPassword: !this.state.showPassword });
    };

    handleChange(e) {
        this.password = e.target.value;
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.handleNext();
        }
    }

    render() {
        const { loading, error, showPassword } = this.state;
        const { passwordHint, classes } = this.props;

        return (
            <div>
                <div className='authorization-header'>
                    <span className='authorization-header-content'>Cloud Password Check</span>
                </div>
                <div>Please enter your cloud password.</div>
                <FormControl fullWidth className={classNames(classes.margin, classes.textField)}>
                    <InputLabel htmlFor='adornment-password' error={Boolean(error)}>
                        Your cloud password
                    </InputLabel>
                    <Input
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
                                    onMouseDown={this.handleMouseDownPassword}>
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                </FormControl>
                {passwordHint && (
                    <FormHelperText id='password-hint-text'>
                        <span className='password-hint-label'>Hint: </span>
                        {passwordHint}
                    </FormHelperText>
                )}
                <FormHelperText id='password-error-text'>{error}</FormHelperText>
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
            </div>
        );
    }
}

export default withStyles(styles)(PasswordControl);
