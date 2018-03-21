import React from 'react';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import './ConfirmCodeControl.css';

const styles = {
    button: {
        margin: '20px',
    },
};

class ConfirmCodeControl extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            hasError : false,
            openConfirmation : false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleNext = this.handleNext.bind(this);
        this.handleBack = this.handleBack.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    handleNext(){
        if (this.code
            && this.isValid(this.code)){
            this.props.onCodeEnter(this.code);
        }
        else{
            this.setState({hasError : true});
        }
    }

    handleBack(){
        this.props.onChangePhone();
    }

    isValid(code){
        let isBad = !code.match(/^[\d\-+\s]+$/);
        if (!isBad) {
            code = code.replace(/\D/g, '');
            if (code.length !== 5) {
                isBad = true
            }
        }

        return !isBad;
    }

    handleChange(e) {
        this.code = e.target.value;
    }

    handleKeyPress(e){
        if (e.key === 'Enter'){
            e.preventDefault();
            this.handleNext();
        }
    }

    render() {
        return (
            <div className='confirm-code-wrapper'>
                <TextField
                    fullWidth
                    autoFocus
                    error={this.state.hasError}
                    label='Your code'
                    margin='normal'
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
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

export default withStyles(styles)(ConfirmCodeControl);