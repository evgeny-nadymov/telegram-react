import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import './SignInControl.css';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel/FormControlLabel';

const styles = {
    button: {
        margin: '20px',
    },
    phone: {
        fontWeight: 'bold',
        textAlign: 'center'
    },
    disableTransition: {
        transition: 'none',
    }
};

class SignInControl extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            hasError : false,
            openConfirmation : false,
            testServer : false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSignIn = this.handleSignIn.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleDone = this.handleDone.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleChangeServer = this.handleChangeServer.bind(this);
    }

    handleSignIn(){
        if (this.phoneNumber
            && this.isValidPhoneNumber(this.phoneNumber)){
            this.setState({hasError : false, openConfirmation: true});
        }
        else{
            this.setState({hasError : true});
        }
    }

    isValidPhoneNumber(phoneNumber){
        let isBad = !phoneNumber.match(/^[\d\-+\s]+$/);
        if (!isBad) {
            phoneNumber = phoneNumber.replace(/\D/g, '');
            if (phoneNumber.length < 7) {
                isBad = true
            }
        }

        return !isBad;
    }

    handleChange(e) {
        this.phoneNumber = e.target.value;
    }

    handleChangeServer(e){
        this.setState({ testServer: e.target.checked })
    }

    handleKeyPress(e){
        if (e.key === 'Enter'){
            e.preventDefault();
            this.handleSignIn();
        }
    }

    handleClose(){
        this.setState({ openConfirmation: false });
    }

    handleDone(){
        this.setState({ openConfirmation: false });

        this.props.onPhoneEnter(this.phoneNumber, this.state.testServer);
    }
    
    handleKeyDown(e){
        if (e.key === 'Enter'){
            this.handleDone();
        }
    }

    render() {
        return (
            <div className='sign-in-wrapper'>
                <TextField
                    fullWidth
                    autoFocus
                    error={this.state.hasError}
                    id='phoneNumber'
                    label='Phone number'
                    margin='normal'
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
                {/*<FormControlLabel*/}
                    {/*control={*/}
                        {/*<Switch color='primary' checked={this.state.testServer} onChange={this.handleChangeServer}/>*/}
                    {/*}*/}
                    {/*label='test server'*/}
                {/*/>*/}
                <Button color='primary' className={this.props.classes.button} onClick={this.handleSignIn}>
                    Next
                </Button>
                <Dialog
                    open={this.state.openConfirmation}
                    onClose={this.handleClose}
                    onKeyDown={this.handleKeyDown}
                    aria-labelledby="form-dialog-title">
                    <DialogTitle id="form-dialog-title">Telegram</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Is this phone number correct?
                        </DialogContentText>
                        <DialogContentText className={this.props.classes.phone}>
                            {this.phoneNumber}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose} color="secondary">
                            Cancel
                        </Button>
                        <Button onClick={this.handleDone} color="primary">
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default withStyles(styles)(SignInControl);