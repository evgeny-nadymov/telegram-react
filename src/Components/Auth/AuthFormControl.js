import React from 'react';
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
import { withStyles } from 'material-ui/styles';
import SignInControl from './SignInControl'
import ConfirmCodeControl from './ConfirmCodeControl'
import PasswordControl from './PasswordControl'
import SignUpControl from './SignUpControl'
import './AuthFormControl.css';
import TdLibController from "../../Controllers/TdLibController";
import AuthErrorDialog from "./AuthErrorDialog";

const theme = createMuiTheme({
    palette: {
        primary: { main: '#6bace1'},
    },
});

const styles = {
    button: {
        margin: '20px',
    },
};

class AuthFormControl extends React.Component {

    constructor(props){
        super(props);

        this.handlePhoneEnter = this.handlePhoneEnter.bind(this);
        this.handleCodeEnter = this.handleCodeEnter.bind(this);
        this.handleChangePhone = this.handleChangePhone.bind(this);
        this.handlePasswordEnter = this.handlePasswordEnter.bind(this);
    }

    handleSubmit(status, text){
        TdLibController.onInputExternal(status, text);
    }
    
    handlePhoneEnter(phone){
        this.handleSubmit('waitPhoneNumber', phone);
    }

    handleChangePhone(){
        TdLibController.setState({ status: 'waitPhoneNumber' });
    }

    handleCodeEnter(code){
        this.handleSubmit('waitCode', code);
    }

    handlePasswordEnter(password){
        this.handleSubmit('waitPassword', password);
    }

    render() {
        let control = null;
        switch (this.props.authState){
            case 'waitPhoneNumber':
                control = (<SignInControl onPhoneEnter={this.handlePhoneEnter}/>);
                break;
            case 'waitCode':
                control = (<ConfirmCodeControl onCodeEnter={this.handleCodeEnter} onChangePhone={this.handleChangePhone}/>);
                break;
            case 'waitPassword':
                control = (<PasswordControl onPasswordEnter={this.handlePasswordEnter} onChangePhone={this.handleChangePhone}/>);
                break;
            case 'signup':
                control = (<SignUpControl/>);
                break;
            default:
                break;
        }
        
        return (
            <MuiThemeProvider theme={theme}>
                <div className='sign-in-wrap'>
                    <div className='sign-in-head-background'></div>
                    <div className='sign-in-page'>
                        <div className='sign-in-page'>
                            <div className='sign-in-head-wrap'>
                                <a className='sign-in-head-logo-link' href='https://telegram.org' target='_blank'>
                                    <i className='icon icon-tg-logo'></i>
                                    <i className='icon icon-tg-title'></i>
                                </a>
                                <div className='sign-in-middle-column'></div>
                            </div>
                            <div className='sign-in-form-wrap'>
                                {control}
                            </div>
                        </div>
                    </div>
                    <AuthErrorDialog/>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withStyles(styles)(AuthFormControl);