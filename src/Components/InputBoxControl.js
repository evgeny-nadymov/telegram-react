import React, {Component} from 'react';
import './InputBoxControl.css';
import TileControl from "./TileControl";
import OutputTypingManager from "../Utils/OutputTypingManager";
import UserTileControl from './UserTileControl';

class InputBoxControl extends Component{

    constructor(props){
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleAttachDocument = this.handleAttachDocument.bind(this);
        this.handleAttachPhoto = this.handleAttachPhoto.bind(this);
        this.handleAttachDocumentComplete = this.handleAttachDocumentComplete.bind(this);
        this.handleAttachPhotoComplete = this.handleAttachPhotoComplete.bind(this);
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

    handleAttachDocument(){
        this.refs.attachDocument.click();
    }

    handleAttachPhoto(){
        this.refs.attachPhoto.click();
    }

    handleAttachDocumentComplete(){
        let files = this.refs.attachDocument.files;
        if (files.length === 0) return;

        this.props.onSendDocument(files);
        this.refs.attachDocument.value = '';
    }

    handleAttachPhotoComplete(){
        let files = this.refs.attachPhoto.files;
        if (files.length === 0) return;

        this.readImage(
            files[0],
            result => {
                this.props.onSendPhoto(result);
                this.refs.attachPhoto.value = '';
        });
    }

    readImage (file, callback) {

        let useBlob = false;
        // Create a new FileReader instance
        // https://developer.mozilla.org/en/docs/Web/API/FileReader
        var reader = new FileReader();

        // Once a file is successfully readed:
        reader.addEventListener("load", function () {

            // At this point `reader.result` contains already the Base64 Data-URL
            // and we've could immediately show an image using
            // `elPreview.insertAdjacentHTML("beforeend", "<img src='"+ reader.result +"'>");`
            // But we want to get that image's width and height px values!
            // Since the File Object does not hold the size of an image
            // we need to create a new image and assign it's src, so when
            // the image is loaded we can calculate it's width and height:
            var image  = new Image();
            image.addEventListener("load", function () {

                // Concatenate our HTML image info
                var imageInfo = file.name    +' '+ // get the value of `name` from the `file` Obj
                    image.width  +'×'+ // But get the width from our `image`
                    image.height +' '+
                    file.type    +' '+
                    Math.round(file.size/1024) +'KB';

                //alert(imageInfo);
                file.photoWidth = image.width;
                file.photoHeight = image.height;
                // Finally append our created image and the HTML info string to our `#preview`
                //elPreview.appendChild( this );
                //elPreview.insertAdjacentHTML("beforeend", imageInfo +'<br>');

                // If we set the variable `useBlob` to true:
                // (Data-URLs can end up being really large
                // `src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAA...........etc`
                // Blobs are usually faster and the image src will hold a shorter blob name
                // src="blob:http%3A//example.com/2a303acf-c34c-4d0a-85d4-2136eef7d723"
                if (useBlob) {
                    // Free some memory for optimal performance
                    window.URL.revokeObjectURL(image.src);
                }

                callback(file);
            });

            image.src = useBlob ? window.URL.createObjectURL(file) : reader.result;

        });

        // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
        reader.readAsDataURL(file);
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
                            <input className='inputbox-attach-button' type='file' multiple='multiple' ref='attachDocument' onChange={this.handleAttachDocumentComplete}/>
                            <i className='inputbox-attach-document-icon' onClick={this.handleAttachDocument}/>
                            <input className='inputbox-attach-button' type='file' accept='image/*' ref='attachPhoto' onChange={this.handleAttachPhotoComplete}/>
                            <i className='inputbox-attach-photo-icon' onClick={this.handleAttachPhoto}/>
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