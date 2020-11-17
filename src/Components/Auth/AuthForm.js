/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Caption from './Caption';
import Code from './Code';
import Password from './Password';
import Phone from './Phone';
import AuthErrorDialog from './AuthErrorDialog';
import { loadData } from '../../Utils/Phone';
import AppStore from '../../Stores/ApplicationStore';
import AuthStore from '../../Stores/AuthorizationStore';
import './AuthForm.css';
import QRCode from './QRCode';
import Footer from '../Footer';

class AuthForm extends React.Component {
    state = {
        data: null
    };

    componentDidMount() {
        setTimeout(this.loadContent, 100);
    }

    loadContent = async () => {
        const { data } = this.state;
        if (data) return;

        try {
            AuthStore.data = await loadData();

            this.setState({ data: AuthStore.data });
        } catch (error) {
            console.error(error);
        }
    };

    render() {
        const { authorizationState: state, onChangePhone, onRequestQRCode } = this.props;
        const { data } = this.state;
        const { defaultPhone } = AppStore;

        let control = null;
        switch (state['@type']) {
            case 'authorizationStateWaitOtherDeviceConfirmation': {
                control = (
                    <QRCode
                        state={state}
                        onChangePhone={onChangePhone}
                    />);
                break;
            }
            case 'authorizationStateWaitPhoneNumber':
            case 'authorizationStateWaitRegistration':
            case 'authorizationStateWaitEncryptionKey':
            case 'authorizationStateWaitTdlibParameters':
            case 'authorizationStateWaitTdlib': {
                control = (
                    <Phone
                        defaultPhone={defaultPhone}
                        data={data}
                        onRequestQRCode={onRequestQRCode} />);
                break;
            }
            case 'authorizationStateWaitCode': {
                const { terms_of_service, code_info } = state;

                control = (
                    <Code
                        termsOfService={terms_of_service}
                        codeInfo={code_info}
                        onChangePhone={onChangePhone}
                        data={data}
                    />
                );
                break;
            }
            case 'authorizationStateWaitPassword': {
                const { password_hint, has_recovery_email_address, recovery_email_address_pattern } = state;

                control = (
                    <Password
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
            <div className='authorization-form' onLoad={this.handleLoad}>
                <div className='authorization-form-content'>
                    <Caption state={state} />
                    {control}
                    <Footer/>
                </div>
                <AuthErrorDialog />
            </div>
        );
    }
}
export default AuthForm;
