import React, {Component} from 'react';
import './MessageControl.css';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import MessageStore from '../Stores/MessageStore';
import TdLibController from '../Controllers/TdLibController';
import FileController from '../Controllers/FileController';
import ReplyControl from './ReplyControl';
import {saveData, saveBlob} from '../Utils/File';
import {getTitle, getDate, getDateHint, getText, getMedia, getReply, getForward, getUnread} from '../Utils/Message';
import MessageStatusControl from './MessageStatusControl';
import {getPhotoSize} from '../Utils/Common';
import {PHOTO_SIZE} from '../Constants';

class MessageControl extends Component{
    constructor(props){
        super(props);

        this.random = Math.random() % 1024;

        this.openForward = this.openForward.bind(this);
        this.openMedia = this.openMedia.bind(this);
        this.handleUpdateMessageEdited = this.handleUpdateMessageEdited.bind(this);
        this.handleUpdateMessageViews = this.handleUpdateMessageViews.bind(this);
        this.handleUpdateMessageContent = this.handleUpdateMessageContent.bind(this);
    }

    componentWillMount(){
        MessageStore.on('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.on('updateMessageViews', this.handleUpdateMessageViews);
        //MessageStore.on('updateMessageContent', this.handleUpdateMessageContent);
    }

    handleUpdateMessageEdited(payload) {
        if (this.props.message.chat_id === payload.chat_id
            && this.props.message.id === payload.message_id){
            this.forceUpdate();
        }
    }

    handleUpdateMessageViews(payload) {
        if (this.props.message.chat_id === payload.chat_id
            && this.props.message.id === payload.message_id){
            this.forceUpdate();
        }
    }

    handleUpdateMessageContent(payload) {
        if (this.props.message.chat_id === payload.chat_id
            && this.props.message.id === payload.message_id){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        MessageStore.removeListener('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.removeListener('updateMessageViews', this.handleUpdateMessageViews);
        //MessageStore.removeListener('updateMessageContent', this.handleUpdateMessageContent);
    }


    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.message !== this.props.message){
            return true;
        }

        if (nextProps.sendingState !== this.props.sendingState){
            return true;
        }

        return false;
    }

    openForward(){
        let message = this.props.message;

        if (!message) return;
        if (!message.forward_info) return null;

        switch (message.forward_info['@type']) {
            case 'messageForwardedFromUser': {
                let user = UserStore.get(message.forward_info.sender_user_id);
                if (user) {
                    TdLibController
                        .send({
                            '@type': 'createPrivateChat',
                            user_id: message.forward_info.sender_user_id,
                            force: true
                        })
                        .then(chat => {
                            this.props.onSelectChat(chat);
                        });
                }
                break;
            }
            case 'messageForwardedPost': {
                let chat = ChatStore.get(message.forward_info.chat_id);

                this.props.onSelectChat(chat);
                break;
            }
        }
    }

    openMedia(){
        let message = this.props.message;

        if (!message) return;
        if (!message.content) return null;

        switch (message.content['@type']) {
            case 'messageContact': {
                let user = UserStore.get(message.content.contact.user_id);
                if (user) {
                    TdLibController
                        .send({
                            '@type': 'createPrivateChat',
                            user_id: message.content.contact.user_id,
                            force: true
                        })
                        .then(chat => {
                            this.props.onSelectChat(chat);
                        });
                }
                break;
            }
            case 'messageDocument': {
                if (message.content){

                    let document = message.content.document;
                    if (document){

                        let file = document.document;
                        if (file) {

                            if (file.local.is_downloading_active){
                                FileController.cancelGetRemoteFile(file.id, message);
                            }
                            else if (file.remote.is_uploading_active){
                                FileController.cancelUploadFile(file.id, message);
                            }
                            else {
                                this.saveOrDownload(file, document.file_name, message);
                            }
                        }
                    }
                }

                break;
            }
            case 'messagePhoto': {
                if (message.content){

                    let photo = message.content.photo;
                    if (photo){

                        let photoSize = getPhotoSize(this.props.message.content.photo.sizes);
                        if (photoSize){
                            let file = photoSize.photo;
                            if (file) {

                                if (file.local.is_downloading_active){
                                    FileController.cancelGetRemoteFile(file.id, message);
                                }
                                else if (file.remote.is_uploading_active){
                                    FileController.cancelUploadFile(file.id, message);
                                }
                                else {
                                    this.saveOrDownload(file, document.file_name, message);
                                }
                            }
                        }
                    }
                }

                break;
            }
        }
    }

    saveOrDownload(file, fileName, message){
        if (!file) return;
        if (!fileName) return;

        if (file.arr) {
            saveData(file.arr, fileName);
            return;
        }

        if (file.idb_key){
            let store = FileController.getStore();

            FileController.getLocalFile(store, file, file.idb_key, null,
                () => {
                    if (file.blob){
                        saveBlob(file.blob, fileName);
                    }
                },
                () => {
                    if (file.local.can_be_downloaded){
                        FileController.getRemoteFile(file.id, 1, message);
                    }
                });
            return;
        }

        if (file.local.can_be_downloaded){
            FileController.getRemoteFile(file.id, 1, message);
        }
    }

    render(){
        let message = this.props.message;
        if (!message) return (<div>[empty message]</div>);

        let title = this.props.showTitle? getTitle(message) : null;
        let text = getText(message);
        let date = getDate(message);
        let dateHint = getDateHint(message);
        let media = getMedia(message, this.openMedia);
        let reply = getReply(message);
        let forward = getForward(message);
        this.unread = getUnread(message);

        return (
            <div className='message'>
                <div className='message-wrapper'>
                    {this.unread && <MessageStatusControl chatId={message.chat_id} messageId={message.id} sendingState={message.sending_state}/>}
                    <div className='message-content'>
                        <div className='message-meta'>
                            {/*{message.views > 0 && <i className='message-views-icon'/>}*/}
                            {/*{message.views > 0 && <span className='message-views'> {message.views}&nbsp;&nbsp;</span>}*/}
                            {message.edit_date > 0 && <span>edited </span>}
                            <span className='message-date' title={dateHint}>{date}</span>
                        </div>
                        <div className='message-body'>
                            {!forward &&
                                <div className='message-author'>
                                    {title}
                                    {message.views > 0 &&
                                        <div className='message-meta'>
                                            <i className='message-views-icon'/>
                                            <span className='message-views'> {message.views}&nbsp;&nbsp;</span>
                                        </div>
                                    }
                                </div>
                            }
                            {forward && <div className='message-author'>Forwarded from <a onClick={this.openForward}>{forward}</a></div>}
                            {reply && <ReplyControl chatId={message.chat_id} messageId={reply}/>}
                            {media}
                            <div className='message-text'>{text}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MessageControl;