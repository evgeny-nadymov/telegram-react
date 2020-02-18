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
import AppStore from '../../Stores/ApplicationStore';
import AuthStore from '../../Stores/AuthorizationStore';
import './AuthForm.css';

class AuthForm extends React.Component {
    state = {
        data: null
    };

    componentDidMount() {
        this.loadData();
    }

    async loadData() {
        const { data } = this.state;
        if (data) return;

        try {
            const response = await fetch('data/countries.dat');
            const text = await response.text();

            const lines = text.split('\n');
            const data2 = [];
            lines.forEach(x => {
                const split = x.split(';');
                const item = {
                    prefix: split[0],
                    code: split[1],
                    name: split[2],
                    pattern: split[3],
                    count: Number(split[4]),
                    emoji: split[5]
                };
                data2.push(item);
            });
            data2.forEach(x => {
                x.phone = '+' + x.prefix;
            });

            AuthStore.data = data2.filter(x => x.emoji);

            this.setState({ data: AuthStore.data });
        } catch (error) {
            console.error(error);
        }
    }

    render() {
        const { authorizationState: state } = this.props;
        const { data } = this.state;
        const { defaultPhone } = AppStore;

        let control = null;
        switch (state['@type']) {
            case 'authorizationStateWaitPhoneNumber':
            case 'authorizationStateWaitEncryptionKey':
            case 'authorizationStateWaitTdlibParameters':
            case 'authorizationStateWaitTdlib': {
                control = <Phone defaultPhone={defaultPhone} data={data} />;
                break;
            }
            case 'authorizationStateWaitCode': {
                const { onChangePhone } = this.props;
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
                const { onChangePhone } = this.props;
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
            <div className='authorization-form'>
                <div className='authorization-form-content'>
                    <Caption state={state} />
                    {control}
                </div>
                <AuthErrorDialog />
            </div>
        );
    }
}
export default AuthForm;
