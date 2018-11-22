/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import SendIcon from '@material-ui/icons/Send';
import EmojiPickerButton from './../ColumnMiddle/EmojiPickerButton';
import AttachButton from './../ColumnMiddle/AttachButton';
import OutputTypingManager from '../../Utils/OutputTypingManager';
import {getSize, readImageSize} from '../../Utils/Common';
import {PHOTO_SIZE} from '../../Constants';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import ChatStore from '../../Stores/ChatStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import FileController from '../../Controllers/FileController';
import TdLibController from '../../Controllers/TdLibController';
import './InputBoxControl.css';

const styles = {
    iconButton : {
        margin: '8px 0px',
    }
};

class InputBoxControl extends Component{

    constructor(props){
        super(props);

        this.attachDocument = React.createRef();
        this.attachPhoto = React.createRef();
        this.newMessage = React.createRef();

        this.state = {
            currentChatId : ApplicationStore.getChatId(),
            anchorEl : null
        };

        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleAttachDocument = this.handleAttachDocument.bind(this);
        this.handleAttachPhoto = this.handleAttachPhoto.bind(this);
        this.handleAttachDocumentComplete = this.handleAttachDocumentComplete.bind(this);
        this.handleAttachPhotoComplete = this.handleAttachPhotoComplete.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleEmojiSelect = this.handleEmojiSelect.bind(this);

        this.handleSendPhoto = this.handleSendPhoto.bind(this);
        this.handleSendingMessage = this.handleSendingMessage.bind(this);
        this.getNewChatDraftMessage = this.getNewChatDraftMessage.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.currentChatId !== this.state.currentChatId){
            return true;
        }

        if (nextState.anchorEl !== this.state.anchorEl){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount(){
        const newChatDraftMessage = this.getNewChatDraftMessage(this.state.currentChatId);

        this.setChatDraftMessage(newChatDraftMessage);

        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = (update) => {
        this.setState({ currentChatId : update.nextChatId });
    };

    componentDidUpdate(prevProps, prevState, snapshot){

        this.setChatDraftMessage(snapshot);
    }

    getSnapshotBeforeUpdate(prevProps, prevState){
        if (prevState.currentChatId === this.state.currentChatId) return;

        return this.getNewChatDraftMessage(prevState.currentChatId);
    }

    setChatDraftMessage(chatDraftMessage){
        if (!chatDraftMessage) return;

        const { chatId, draftMessage } = chatDraftMessage;
        if (!chatId) return;

        TdLibController
            .send({
                '@type': 'setChatDraftMessage',
                chat_id: chatId,
                draft_message: draftMessage
            });
    }

    getNewChatDraftMessage(currentChatId){
        let chat = ChatStore.get(currentChatId);
        if (!chat) return;

        const {draft_message} = chat;

        let newDraft = this.getInputText();
        let previousDraft = '';
        if (draft_message
            && draft_message.input_message_text
            && draft_message.input_message_text.text){
            previousDraft = draft_message.input_message_text.text.text;
        }

        if (newDraft !== previousDraft){
            const draftMessage = {
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

            return { chatId : currentChatId, draftMessage : draftMessage } ;
        }

        return null;
    }

    handleMenuClick(event){
        this.setState({ anchorEl : event.currentTarget });
    }

    handleSubmit(){
        let text = this.getInputText();
        this.newMessage.current.innerText = null;
        this.newMessage.current.textContent = null;

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

    handleAttachPhoto(){
        this.attachPhoto.current.click();
    }

    handleAttachDocument(){
        this.attachDocument.current.click();
    }

    handleAttachDocumentComplete(){
        let files = this.attachDocument.current.files;
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

        this.attachDocument.current.value = '';
    }

    handleAttachPhotoComplete(){
        let files = this.attachPhoto.current.files;
        if (files.length === 0) return;

        for (let i = 0; i < files.length; i++){
            let file = files[i];

            readImageSize(
                file,
                result => {
                    this.handleSendPhoto(result);
                });
        }

        this.attachPhoto.current.value = '';
    }

    getInputText(){
        let innerText = this.newMessage.current.innerText;
        let innerHTML = this.newMessage.current.innerHTML;

        if (innerText
            && innerText === '\n'
            && innerHTML
            && (innerHTML === '<br>' || innerHTML === '<div><br></div>')){
            this.newMessage.current.innerHTML = '';
        }

        return innerText;
    }

    handleInputChange(){
        let innerText = this.newMessage.current.innerText;
        let innerHTML = this.newMessage.current.innerHTML;

        if (innerText
            && innerText === '\n'
            && innerHTML
            && (innerHTML === '<br>' || innerHTML === '<div><br></div>')){
            this.newMessage.current.innerHTML = '';
        }

        if (innerText){
            const selectedChat = ChatStore.get(this.state.currentChatId);
            if (!selectedChat.OutputTypingManager){
                selectedChat.OutputTypingManager = new OutputTypingManager(selectedChat.id);
            }

            selectedChat.OutputTypingManager.setTyping({'@type' : 'chatActionTyping'});
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
                    FileStore.updatePhotoBlob(message.chat_id, message.id, file.id);
                }
            }
        }
    }

    onSendInternal(content, callback){
        if (!this.state.currentChatId) return;
        if (!content) return;

        TdLibController
            .send({
                '@type': 'sendMessage',
                chat_id: this.state.currentChatId,
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
                        chat_id: this.state.currentChatId,
                        message_ids: messageIds
                    });

                callback(result);
            })
            .catch(error => {
                alert('sendMessage error ' + JSON.stringify(error));
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

    handleEmojiSelect(emoji){
        if (!emoji) return;

        this.newMessage.current.innerText += emoji.native;
    }

    render(){
        const {classes} = this.props;

        const {currentChatId, anchorEl} = this.state;
        const selectedChat = ChatStore.get(currentChatId);

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
            <div className='inputbox-wrapper'>
                <div className='inputbox-left-column'>
                    {/*<IconButton className={classes.iconButton} aria-label='Emoticon'>*/}
                        {/*<InsertEmoticonIcon />*/}
                    {/*</IconButton>*/}
                    <EmojiPickerButton onSelect={this.handleEmojiSelect}/>
                </div>
                <div className='inputbox-middle-column'>
                    <div
                        id='inputbox-message'
                        ref={this.newMessage}
                        placeholder='Type a message'
                        key={Date()}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onKeyDown={this.handleKeyDown}
                        onKeyUp={this.handleInputChange}>
                        {text}
                    </div>
                </div>
                <div className='inputbox-right-column'>
                    <input ref={this.attachDocument} className='inputbox-attach-button' type='file' multiple='multiple' onChange={this.handleAttachDocumentComplete}/>
                    <input ref={this.attachPhoto} className='inputbox-attach-button' type='file' multiple='multiple' accept='image/*' onChange={this.handleAttachPhotoComplete}/>
                    <AttachButton
                        onAttachPhoto={this.handleAttachPhoto}
                        onAttachDocument={this.handleAttachDocument}/>

                    {/*<IconButton>*/}
                        {/*<KeyboardVoiceIcon />*/}
                    {/*</IconButton>*/}
                    <IconButton className={classes.iconButton} aria-label='Send' onClick={this.handleSubmit}>
                        <SendIcon />
                    </IconButton>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(InputBoxControl);