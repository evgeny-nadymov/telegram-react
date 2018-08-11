import React, {Component} from 'react';
import './InputBoxControl.css';
import TileControl from "./TileControl";
import OutputTypingManager from "../Utils/OutputTypingManager";
import UserTileControl from './UserTileControl';

class InputBoxControl extends Component{

    constructor(props){
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleAttach = this.handleAttach.bind(this);
        this.handleAttachComplete = this.handleAttachComplete.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.selectedChat !== this.props.selectedChat){
            return true;
        }

        return false;
    }

    handleSubmit(){
        let text = this.refs.newMessage.innerText || this.refs.newMessage.textContent;
        this.refs.newMessage.innerText = null;
        this.refs.newMessage.textContent = null;

        this.props.onSendText(text);
    }

    handleAttach(){
        this.refs.attachFile.click();
    }

    handleAttachComplete(){
        let files = this.refs.attachFile.files;
        if (files.length === 0) return;

        this.props.onSendFile(files[0]);
        this.refs.attachFile.value = '';
    }

    getInputText(){
        let innerText = this.refs.newMessage.innerText;
        let innerHTML = this.refs.newMessage.innerHTML;

        if (innerText
            && innerText === '\n'
            && innerHTML
            && (innerHTML === '<br>' || innerHTML === '<div><br></div>')){
            this.refs.newMessage.innerHTML = '';
        }

        return innerText;
    }

    handleInputChange(){
        let innerText = this.refs.newMessage.innerText;
        let innerHTML = this.refs.newMessage.innerHTML;

        if (innerText
            && innerText === '\n'
            && innerHTML
            && (innerHTML === '<br>' || innerHTML === '<div><br></div>')){
            this.refs.newMessage.innerHTML = '';
        }

        if (innerText){
            if (!this.props.selectedChat.OutputTypingManager){
                this.props.selectedChat.OutputTypingManager = new OutputTypingManager(this.props.selectedChat.id);
            }

            this.props.selectedChat.OutputTypingManager.setTyping({'@type' : 'chatActionTyping'});
        }
    }

    handleKeyDown(e){
        if (e.key === 'Enter' && !e.shiftKey){
            e.preventDefault();
            this.handleSubmit();
        }
    }

    render(){
        let text = '';
        if (this.props.selectedChat
            && this.props.selectedChat.draft_message
            && this.props.selectedChat.draft_message.input_message_text
            && this.props.selectedChat.draft_message.input_message_text.text){
            text = this.props.selectedChat.draft_message.input_message_text.text.text;
        }

        return (
            <div className='inputbox-wrapper'>
                <div className='inputbox-left-column'>
                    <UserTileControl user={this.props.currentUser}/>
                </div>
                <div className='inputbox-middle-column'>
                    <div id='inputbox-message' ref='newMessage' placeholder='Write a message...' key={Date()} contentEditable={true} suppressContentEditableWarning={true} onKeyDown={this.handleKeyDown} onKeyUp={this.handleInputChange}>
                        {text}
                    </div>
                    <div className='inputbox-buttons'>
                        <div className='inputbox-attach-wrapper'>
                            <input className='inputbox-attach-button' type='file' ref='attachFile' onChange={this.handleAttachComplete}/>
                            <i className='inputbox-attach-icon' onClick={this.handleAttach}/>
                        </div>
                        <div className='inputbox-send-button' onClick={this.handleSubmit}>
                            <span className='inputbox-send-text'>SEND</span>
                        </div>
                    </div>
                </div>
                <div className='inputbox-right-column'>
                    <TileControl chat={this.props.selectedChat}/>
                </div>
            </div>
        );
    }
}

export default InputBoxControl;