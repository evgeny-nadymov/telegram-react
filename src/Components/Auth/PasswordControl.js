import React from 'react';
import classNames from 'classnames';
import { withStyles } from 'material-ui/styles';
import IconButton from 'material-ui/IconButton';
import Input, { InputLabel, InputAdornment } from 'material-ui/Input';
import { FormControl } from 'material-ui/Form';
import Button from 'material-ui/Button';
import Visibility from 'material-ui-icons/Visibility';
import VisibilityOff from 'material-ui-icons/VisibilityOff';
import './PasswordControl.css';

const styles = theme => ({
    root: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    margin: {
        margin: '8px 0'
    },
    withoutLabel: {
        marginTop: theme.spacing.unit * 3,
    },
    textField: {
        flexBasis: 200,
    },
    button: {
        margin: '20px',
    },
});


class PasswordControl extends React.Component {

    constructor(props){
        super(props);

        this.state ={
            password : '',
            showPassword : false,
            hasError : false
        };

        this.handleClickShowPassword = this.handleClickShowPassword.bind(this);
        this.handleMouseDownPassword = this.handleMouseDownPassword.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.handleNext = this.handleNext.bind(this);
    }

    handleNext(){
        if (this.password
            && this.isValid(this.password)){
            this.props.onPasswordEnter(this.password);
        }
        else{
            this.setState({hasError : true});
        }
    }

    handleBack(){
        this.props.onChangePhone();
    }

    isValid(password){
        return true;
    }

    handleMouseDownPassword = event => {
        event.preventDefault();
    };

    handleClickShowPassword = () => {
        this.setState({ showPassword: !this.state.showPassword });
    };

    handleChange(e){
        this.password = e.target.value;
    }

    render() {
        const { classes } = this.props;

        return (
            <div className='password-wrapper'>
                <FormControl fullWidth className={classNames(classes.margin, classes.textField)}>
                    <InputLabel htmlFor="adornment-password">Password</InputLabel>
                    <Input
                        fullWidth
                        autoFocus
                        id="adornment-password"
                        type={this.state.showPassword ? 'text' : 'password'}
                        onChange={this.handleChange}
                        endAdornment={
                            <InputAdornment position="end">
                                <IconButton
                                    aria-label="Toggle password visibility"
                                    onClick={this.handleClickShowPassword}
                                    onMouseDown={this.handleMouseDownPassword}>
                                    {this.state.showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        }
                    />
                </FormControl>
                <div>
                    <Button className={this.props.classes.button} onClick={this.handleBack}>
                        Back
                    </Button>
                    <Button color='primary' className={this.props.classes.button} onClick={this.handleNext}>
                        Next
                    </Button>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(PasswordControl);