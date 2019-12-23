/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Caption from './Caption';
import Phone from './Phone';
import ConfirmCodeControl from './ConfirmCodeControl';
import PasswordControl from './PasswordControl';
import AuthErrorDialog from './AuthErrorDialog';
import ApplicationStore from '../../Stores/ApplicationStore';
import './AuthFormControl.css';

class AuthFormControl extends React.Component {
    render() {
        const { authorizationState: state } = this.props;
        const { defaultPhone } = ApplicationStore;

        let control = null;
        switch (state['@type']) {
            case 'authorizationStateWaitPhoneNumber':
            case 'authorizationStateWaitEncryptionKey':
            case 'authorizationStateWaitTdlibParameters':
            case 'authorizationStateWaitTdlib': {
                control = <Phone defaultPhone={defaultPhone} />;
                break;
            }
            case 'authorizationStateWaitCode': {
                const { onChangePhone } = this.props;
                const { terms_of_service, code_info } = state;

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
                const { password_hint, has_recovery_email_address, recovery_email_address_pattern } = state;

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
                <div className='authorization-form-content'>
                    <Caption state={state} />
                    {control}
                </div>
                <AuthErrorDialog />
            </div>
        );
    }
}
export default AuthFormControl;
