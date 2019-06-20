/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import SignInControl from './SignInControl';
import ConfirmCodeControl from './ConfirmCodeControl';
import PasswordControl from './PasswordControl';
import AuthErrorDialog from './AuthErrorDialog';
import ApplicationStore from '../../Stores/ApplicationStore';
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
    render() {
        const { classes, authorizationState } = this.props;
        const { defaultPhone } = ApplicationStore;

        let control = null;
        switch (authorizationState['@type']) {
            case 'authorizationStateWaitPhoneNumber':
            case 'authorizationStateWaitEncryptionKey':
            case 'authorizationStateWaitTdlibParameters':
            case 'authorizationStateWaitTdlib': {
                // control = (
                //     <>
                //         <SignInControl phone={this.phone} onPhoneEnter={this.handlePhoneEnter}/>
                //         <ConfirmCodeControl phone={this.phone} onCodeEnter={this.handleCodeEnter} onChangePhone={this.handleChangePhone}/>
                //         <PasswordControl passwordHint='hint' onPasswordEnter={this.handlePasswordEnter} onChangePhone={this.handleChangePhone}/>
                //         <SignUpControl/>
                //     </>);
                control = <SignInControl defaultPhone={defaultPhone} />;
                break;
            }
            case 'authorizationStateWaitCode': {
                const { onChangePhone } = this.props;
                const { terms_of_service, code_info } = authorizationState;

                control = (
                    <ConfirmCodeControl
                        termsOfService={terms_of_service}
                        codeInfo={code_info}
                        onChangePhone={onChangePhone}
                    />
                );
                break;
            }
            case 'authorizationStateWaitPassword': {
                const { onChangePhone } = this.props;
                const {
                    password_hint,
                    has_recovery_email_address,
                    recovery_email_address_pattern
                } = authorizationState;

                control = (
                    <PasswordControl
                        passwordHint={password_hint}
                        hasRecoveryEmailAddress={has_recovery_email_address}
                        recoveryEmailAddressPattern={recovery_email_address_pattern}
                        onChangePhone={onChangePhone}
                    />
                );
                break;
            }
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
