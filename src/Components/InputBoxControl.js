import React, {Component} from 'react';
import './InputBoxControl.css';
import ChatTileControl from './ChatTileControl';
import OutputTypingManager from '../Utils/OutputTypingManager';
import UserTileControl from './UserTileControl';
import FileController from '../Controllers/FileController';
import MessageStore from '../Stores/MessageStore';
import TdLibController from '../Controllers/TdLibController';
import {getSize} from '../Utils/Common';
import {PHOTO_SIZE} from '../Constants';

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

        this.handleSendPhoto = this.handleSendPhoto.bind(this);
        this.handleSendingMessage = this.handleSendingMessage.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.selectedChat !== this.props.selectedChat){
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps, prevState){

    }

    getSnapshotBeforeUpdate(prevProps, prevState){
        let previousChat = prevProps.selectedChat;
        if (!previousChat) return;
        if (previousChat === this.props.selectedChat) return;

        let newDraft = this.getInputText();
        let previousDraft = '';
        if (previousChat.draft_message
            && previousChat.draft_message.input_message_text
            && previousChat.draft_message.input_message_text.text){
            previousDraft = previousChat.draft_message.input_message_text.text.text;
        }

        if (newDraft !== previousDraft){
            let newDraftMessage = null;
            if (newDraft){
                newDraftMessage = {
                    '@type': 'draftMessage',
                    reply_to_message_id: 0,
                    input_message_text: {
                        '@type': 'inputMessageText',
                        text: {
                            '@type': 'formattedText',
                            text: newDraft,
                            entities: null
                        },
                        disable_web_page_preview: true,
                        clear_draft: false
                    }
                };
            }

            TdLibController
                .send({
                    '@type': 'setChatDraftMessage',
                    chat_id: previousChat.id,
                    draft_message: newDraftMessage
                });
        }

        return null;
    }

    handleSubmit(){
        let text = this.refs.newMessage.innerText || this.refs.newMessage.textContent;
        this.refs.newMessage.innerText = null;
        this.refs.newMessage.textContent = null;

        if (!text) return;

        const content = {
            '@type': 'inputMessageText',
            text: {
                '@type': 'formattedText',
                text: text,
                entities: null
            },
            disable_web_page_preview: false,
            clear_draft: true
        };

        this.onSendInternal(
            content,
            result => { });
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

        for (let i = 0; i < files.length; i++){
            let file = files[i];
            const content = {
                '@type': 'inputMessageDocument',
                document: { '@type': 'inputFileBlob', name: file.name, blob: file }
            };

            this.onSendInternal(
                content,
                result => {
                    FileController.uploadFile(result.content.document.document.id, result);
                });
        }

        this.refs.attachDocument.value = '';
    }

    handleAttachPhotoComplete(){
        let files = this.refs.attachPhoto.files;
        if (files.length === 0) return;

        for (let i = 0; i < files.length; i++){
            let file = files[i];

            this.readImage(
                file,
                result => {
                    this.handleSendPhoto(result);
                });
        }

        this.refs.attachPhoto.value = '';
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

    handleSendPhoto(file){
        if (!file) return;

        const content = {
            '@type': 'inputMessagePhoto',
            photo: { '@type': 'inputFileBlob', name: file.name, blob: file },
            width: file.photoWidth,
            height: file.photoHeight
        };

        this.onSendInternal(
            content,
            result => {
                let cachedMessage = MessageStore.get(result.chat_id, result.id);
                if (cachedMessage != null){
                    this.handleSendingMessage(cachedMessage, file);
                }

                FileController.uploadFile(result.content.photo.sizes[0].photo.id, result);
            });
    }

    handleSendingMessage(message, blob){
        if (message
            && message.sending_state
            && message.sending_state['@type'] === 'messageSendingStatePending'){

            if (message.content
                && message.content['@type'] === 'messagePhoto'
                && message.content.photo){

                let size = getSize(message.content.photo.sizes, PHOTO_SIZE);
                if (!size) return;

                let file = size.photo;
                if (file
                    && file.local
                    && file.local.is_downloading_completed
                    && !file.idb_key
                    && !file.blob){

                    file.blob = blob;
                    MessageStore.updateMessagePhoto(message.id);
                }
            }
        }
    }

    onSendInternal(content, callback){
        if (!this.props.selectedChat) return;
        if (!content) return;

        TdLibController
            .send({
                '@type': 'sendMessage',
                chat_id: this.props.selectedChat.id,
                reply_to_message_id: 0,
                input_message_content: content
            })
            .then(result => {

                //MessageStore.set(result);

                let messageIds = [];
                messageIds.push(result.id);

                TdLibController
                    .send({
                        '@type': 'viewMessages',
                        chat_id: this.props.selectedChat.id,
                        message_ids: messageIds
                    });

                callback(result);
            })
            .catch(error =>{
                alert('sendMessage error ' + error);
            });

        /*if (this.state.selectedChat.draft_message){
            TdLibController
                .send({
                    '@type': 'setChatDraftMessage',
                    chat_id: this.state.selectedChat.id,
                    draft_message: null
                });
        }*/
    }

    render(){
        const {selectedChat} = this.props;

        let text = '';
        if (selectedChat){
            const {draft_message} = selectedChat;
            if (draft_message
                && draft_message.input_message_text
                && draft_message.input_message_text.text){
                text = draft_message.input_message_text.text.text;
            }
        }

        return (
            <div className='dialogdetails-input-wrapper'>
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
                                <input className='inputbox-attach-button' type='file' multiple='multiple' accept='image/*' ref='attachPhoto' onChange={this.handleAttachPhotoComplete}/>
                                <i className='inputbox-attach-photo-icon' onClick={this.handleAttachPhoto}/>
                            </div>
                            <div className='inputbox-send-button' onClick={this.handleSubmit}>
                                <span className='inputbox-send-text'>SEND</span>
                            </div>
                        </div>
                    </div>
                    <div className='inputbox-right-column'>
                        <ChatTileControl chatId={selectedChat.id}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default InputBoxControl;