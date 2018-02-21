import React, {Component} from 'react';
import './InputBoxControl.css';

class InputBoxControl extends Component{

    handleSubmit(args){
        args.preventDefault();
        let text = this.refs.newMessage.value;
        this.refs.newMessage.value = null;

        this.props.onSendText(text);
    }

    handleAttach(){
        let files = this.refs.attachFile.files;
        if (files.length === 0) return;

        this.props.onSendFile(files[0]);
        this.refs.attachFile.value = '';
    }

    render(){
        return (
            <form id='send-form' onSubmit={args => this.handleSubmit(args)}>
                <input id='attach-button' type='file' ref='attachFile' onChange={() => this.handleAttach()}/>
                <input id='new-message' type='text' ref='newMessage'/>
                <input id='send-button' type='submit' value='send'/>
            </form>
        );
    }
}

export default InputBoxControl;