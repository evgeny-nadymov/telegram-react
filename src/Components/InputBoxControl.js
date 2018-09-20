import React, {Component} from 'react';
import './InputBoxControl.css';
import OutputTypingManager from '../Utils/OutputTypingManager';
import FileController from '../Controllers/FileController';
import MessageStore from '../Stores/MessageStore';
import ChatStore from '../Stores/ChatStore';
import TdLibController from '../Controllers/TdLibController';
import {getSize, readImageSize} from '../Utils/Common';
import {PHOTO_SIZE} from '../Constants';
import {withStyles} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import PhotoIcon from '@material-ui/icons/Photo';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import InsertEmoticonIcon from '@material-ui/icons/InsertEmoticon';
import SendIcon from '@material-ui/icons/Send';
import KeyboardVoiceIcon from '@material-ui/icons/KeyboardVoice';
import MenuItem from '@material-ui/core/MenuItem/MenuItem';
import Menu from '@material-ui/core/Menu/Menu';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

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
            selectedChatId : ChatStore.getSelectedChatId(),
            anchorEl : null
        };

        this.handleMenuClick = this.handleMenuClick.bind(this);
        this.handleMenuClose = this.handleMenuClose.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleAttachDocument = this.handleAttachDocument.bind(this);
        this.handleAttachPhoto = this.handleAttachPhoto.bind(this);
        this.handleAttachDocumentComplete = this.handleAttachDocumentComplete.bind(this);
        this.handleAttachPhotoComplete = this.handleAttachPhotoComplete.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);

        this.handleSendPhoto = this.handleSendPhoto.bind(this);
        this.handleSendingMessage = this.handleSendingMessage.bind(this);
        this.onUpdateSelectedChatId = this.onUpdateSelectedChatId.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.selectedChatId !== this.state.selectedChatId){
            return true;
        }

        if (nextState.anchorEl !== this.state.anchorEl){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ChatStore.on('clientUpdateSelectedChatId', this.onUpdateSelectedChatId);
    }

    componentWillUnmount(){
        ChatStore.removeListener('clientUpdateSelectedChatId', this.onUpdateSelectedChatId);
    }

    onUpdateSelectedChatId(update){
        this.setState({ selectedChatId : update.nextChatId });
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        if (!snapshot) return;

        const { chatId, newDraft } = snapshot;
        if (!chatId) return;

        const newDraftMessage = {
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

        TdLibController
            .send({
                '@type': 'setChatDraftMessage',
                chat_id: chatId,
                draft_message: newDraftMessage
            });
    }

    getSnapshotBeforeUpdate(prevProps, prevState){
        let previousChat = ChatStore.get(prevState.selectedChatId);
        if (!previousChat) return;
        if (previousChat.id === this.state.selectedChatId) return;

        const {draft_message} = previousChat;

        let newDraft = this.getInputText();
        let previousDraft = '';
        if (draft_message
            && draft_message.input_message_text
            && draft_message.input_message_text.text){
            previousDraft = draft_message.input_message_text.text.text;
        }

        if (newDraft !== previousDraft){
            return { chatId : previousChat.id, newDraft : newDraft } ;
        }

        return null;
    }

    handleMenuClick(event){
        this.setState({ anchorEl : event.currentTarget });
    }

    handleMenuClose(){
        this.setState({ anchorEl : null });
    }

    handleSubmit(){
        let text = this.newMessage.current.innerText || this.newMessage.current.textContent;
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

    handleAttachDocument(){
        this.handleMenuClose();

        setTimeout(that => { that.attachDocument.current.click(); }, 300, this);
    }

    handleAttachPhoto(){
        this.handleMenuClose();

        setTimeout(that => { that.attachPhoto.current.click(); }, 300, this);
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
            const selectedChat = ChatStore.get(this.state.selectedChatId);
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
                    MessageStore.updateMessagePhoto(message.id);
                }
            }
        }
    }

    onSendInternal(content, callback){
        if (!this.state.selectedChatId) return;
        if (!content) return;

        TdLibController
            .send({
                '@type': 'sendMessage',
                chat_id: this.state.selectedChatId,
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
                        chat_id: this.state.selectedChatId,
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
        const {classes} = this.props;

        const {selectedChatId, anchorEl} = this.state;
        const selectedChat = ChatStore.get(selectedChatId);

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
                    <IconButton
                        className={classes.iconButton} 
                        aria-label='Attach'
                        open={Boolean(anchorEl)}
                        onClick={this.handleMenuClick}>
                        <AttachFileIcon />
                    </IconButton>
                    <Menu
                        id='attach-menu'
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        getContentAnchorEl={null}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right'
                        }}
                        onClose={this.handleMenuClose}>
                        <MenuItem onClick={this.handleAttachPhoto}>
                            <ListItemIcon>
                                <PhotoIcon />
                            </ListItemIcon>
                            <ListItemText inset primary='Photo' />
                        </MenuItem>
                        <MenuItem onClick={this.handleAttachDocument}>
                            <ListItemIcon>
                                <InsertDriveFileIcon />
                            </ListItemIcon>
                            <ListItemText inset primary='Document' />
                        </MenuItem>
                    </Menu>
                </div>
                <div className='inputbox-middle-column'>
                    <div
                        id='inputbox-message'
                        ref={this.newMessage}
                        placeholder='Write a message...'
                        key={Date()}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onKeyDown={this.handleKeyDown}
                        onKeyUp={this.handleInputChange}>
                        {text}
                    </div>
                    <input ref={this.attachDocument} className='inputbox-attach-button' type='file' multiple='multiple' onChange={this.handleAttachDocumentComplete}/>
                    <input ref={this.attachPhoto} className='inputbox-attach-button' type='file' multiple='multiple' accept='image/*' onChange={this.handleAttachPhotoComplete}/>
                </div>
                <div className='inputbox-right-column'>
                    <IconButton className={classes.iconButton} aria-label='Emoticon'>
                        <InsertEmoticonIcon />
                    </IconButton>
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