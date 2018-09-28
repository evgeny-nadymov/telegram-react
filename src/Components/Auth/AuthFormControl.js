import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import SignInControl from './SignInControl'
import ConfirmCodeControl from './ConfirmCodeControl'
import PasswordControl from './PasswordControl'
import SignUpControl from './SignUpControl'
import './AuthFormControl.css';
import TdLibController from '../../Controllers/TdLibController';
import AuthErrorDialog from './AuthErrorDialog';

const styles = {
    button: {
        margin: '20px',
    },
};

class AuthFormControl extends React.Component {

    constructor(props){
        super(props);

        this.phone = null;

        this.handlePhoneEnter = this.handlePhoneEnter.bind(this);
    }
    
    handlePhoneEnter(phone){
        this.phone = phone;
    }

    render() {
        const {authorizationState} = this.props;

        let control = null;
        switch (authorizationState['@type']){
            case 'authorizationStateWaitPhoneNumber':
                // control = (
                //     <React.Fragment>
                //         <SignInControl phone={this.phone} onPhoneEnter={this.handlePhoneEnter}/>
                //         <ConfirmCodeControl phone={this.phone} onCodeEnter={this.handleCodeEnter} onChangePhone={this.handleChangePhone}/>
                //         <PasswordControl passwordHint='hint' onPasswordEnter={this.handlePasswordEnter} onChangePhone={this.handleChangePhone}/>
                //         <SignUpControl/>
                //     </React.Fragment>);
                control = (
                    <SignInControl
                        phone={this.phone}
                        onPhoneEnter={this.handlePhoneEnter}/>
                );
                break;
            case 'authorizationStateWaitCode':
                control = (
                    <ConfirmCodeControl
                        termsOfService={authorizationState.terms_of_service}
                        codeInfo={authorizationState.code_info}
                        onChangePhone={this.props.onChangePhone}/>
                );
                //control = (<SignUpControl/>);
                break;
            case 'authorizationStateWaitPassword':
                control = (
                    <PasswordControl
                        passwordHint={authorizationState.password_hint}
                        hasRecoveryEmailAddress={authorizationState.has_recovery_email_address}
                        recoveryEmailAddressPattern={authorizationState.recovery_email_address_pattern}
                        onChangePhone={this.props.onChangePhone}/>
                );
                break;
            default:
                break;
        }
        
        return (
            <div className='sign-in-wrap'>
                <div className='authorization-form-content'>
                    {control}
                </div>
                <AuthErrorDialog/>
            </div>
        );
    }
}
export default withStyles(styles)(AuthFormControl);