/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import withStyles from '@material-ui/core/styles/withStyles';
import classNames from 'classnames';
import SignInControl from './SignInControl';
import ConfirmCodeControl from './ConfirmCodeControl';
import PasswordControl from './PasswordControl';
import AuthErrorDialog from './AuthErrorDialog';
import './AuthFormControl.css';

const styles = theme => ({
    button: {
        margin: '20px'
    },
    authorizationFormContent: {
        background: theme.palette.background.default,
        color: theme.palette.text.primary
    }
});

class AuthFormControl extends React.Component {
    constructor(props) {
        super(props);

        this.phone = null;

        this.handlePhoneEnter = this.handlePhoneEnter.bind(this);
    }

    handlePhoneEnter(phone) {
        this.phone = phone;
    }

    render() {
        const { classes, authorizationState } = this.props;

        let control = null;
        switch (authorizationState['@type']) {
            case 'authorizationStateWaitPhoneNumber':
                // control = (
                //     <>
                //         <SignInControl phone={this.phone} onPhoneEnter={this.handlePhoneEnter}/>
                //         <ConfirmCodeControl phone={this.phone} onCodeEnter={this.handleCodeEnter} onChangePhone={this.handleChangePhone}/>
                //         <PasswordControl passwordHint='hint' onPasswordEnter={this.handlePasswordEnter} onChangePhone={this.handleChangePhone}/>
                //         <SignUpControl/>
                //     </>);
                control = <SignInControl phone={this.phone} onPhoneEnter={this.handlePhoneEnter} />;
                break;
            case 'authorizationStateWaitCode':
                control = (
                    <ConfirmCodeControl
                        termsOfService={authorizationState.terms_of_service}
                        codeInfo={authorizationState.code_info}
                        onBack={this.props.onChangePhone}
                    />
                );
                break;
            case 'authorizationStateWaitPassword':
                control = (
                    <PasswordControl
                        passwordHint={authorizationState.password_hint}
                        hasRecoveryEmailAddress={authorizationState.has_recovery_email_address}
                        recoveryEmailAddressPattern={authorizationState.recovery_email_address_pattern}
                        onBack={this.props.onChangePhone}
                    />
                );
                break;
            default:
                break;
        }

        return (
            <div className='sign-in-wrap'>
                <div className={classNames(classes.authorizationFormContent, 'authorization-form-content')}>
                    {control}
                </div>
                <AuthErrorDialog />
            </div>
        );
    }
}
export default withStyles(styles)(AuthFormControl);
