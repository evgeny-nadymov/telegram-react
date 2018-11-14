/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import { DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment } from '@material-ui/core';
import Dialog from '@material-ui/core/Dialog';
import TdLibController from '../../Controllers/TdLibController';
import './SignInControl.css';
import { formatPhoneNumber } from '../../Utils/Common';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

const styles = {
    button: {
        margin: '16px 0 0 0',
    },
    phone: {
        fontWeight: 'bold',
        textAlign: 'center'
    }
};

class SignInControl extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            error : '',
            openConfirmation : false,
            loading : false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
        this.handleDialogKeyPress = this.handleDialogKeyPress.bind(this);
    }

    handleNext(){
        const phoneNumber = this.phoneNumber || this.props.phone;

        if (this.isValidPhoneNumber(phoneNumber)){
            this.setState({error : '', openConfirmation: true});
        }
        else{
            this.setState({error : 'Invalid phone number. Please try again.'});
        }
    }

    isValidPhoneNumber(phoneNumber){
        if (!phoneNumber) return false;

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

    handleKeyPress(e){
        if (e.key === 'Enter'){
            e.preventDefault();
            this.handleNext();
        }
    }

    handleDialogKeyPress(e){
        if (e.key === 'Enter'){
            e.preventDefault();
            this.handleDone();
        }
    }

    handleClose(){
        this.setState({ openConfirmation: false });
    }

    handleDone = () => {
        const phoneNumber = this.phoneNumber || this.props.phone;

        this.props.onPhoneEnter(phoneNumber);
        this.setState({ openConfirmation: false, loading: true });
        TdLibController
            .send({
                '@type': 'setAuthenticationPhoneNumber',
                phone_number: phoneNumber
            })
            .then(result => {

            })
            .catch(error => {
                let errorString = null;
                if (error
                    && error['@type'] === 'error'
                    && error.message){
                    errorString = error.message;
                }
                else{
                    errorString = JSON.stringify(error);
                }

                this.setState({ error: errorString });
            })
            .finally(() => {
                this.setState({ loading: false });
            });
    };

    render() {
        const {loading, error, openConfirmation} = this.state;
        const {phone, classes} = this.props;
        const phoneNumber = this.phoneNumber || this.props.phone;

        return (
            <FormControl fullWidth>
                <div className='authorization-header'>
                    <span className='authorization-header-content'>Your Phone Number</span>
                </div>
                <div>
                    Please confirm your country code and enter your mobile phone number.
                </div>
                <TextField
                    color='primary'
                    disabled={loading}
                    error={Boolean(error)}
                    fullWidth
                    autoFocus
                    id='phoneNumber'
                    label='Phone number'
                    margin='normal'
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                    defaultValue={phone}/>
                <FormHelperText id='sign-in-error-text'>{error}</FormHelperText>
                <div className='authorization-actions'>
                    <Button
                        fullWidth
                        color='primary'
                        disabled={loading}
                        className={classes.button}
                        onClick={this.handleNext}>
                        {/*<CircularProgress size={24}/>*/}
                        Next
                    </Button>
                </div>
                <Dialog
                    open={openConfirmation}
                    onClose={this.handleClose}
                    onKeyPress={this.handleDialogKeyPress}
                    aria-labelledby='form-dialog-title'>
                    <DialogTitle id='form-dialog-title'>Telegram</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Is this phone number correct?
                        </DialogContentText>
                        <DialogContentText className={classes.phone}>
                            {formatPhoneNumber(phoneNumber)}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose} color='secondary'>
                            Cancel
                        </Button>
                        <Button onClick={this.handleDone} color='primary'>
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            </FormControl>
        );
    }
}

export default withStyles(styles)(SignInControl);