import React, {Component} from 'react';
import './MessageControl.css';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import MessageStore from '../Stores/MessageStore';
import TdLibController from '../Controllers/TdLibController';
import FileController from '../Controllers/FileController';
import ReplyControl from './ReplyControl';
import classNames from 'classnames';
import fileDownload from 'react-file-download';
import {getTitle, getDate, getDateHint, getText, getMedia, getReply, getForward, getUnread} from '../Utils/Message';

class MessageControl extends Component{
    constructor(props){
        super(props);

        this.openForward = this.openForward.bind(this);
        this.openMedia = this.openMedia.bind(this);
        this.handleUpdateMessageEdited = this.handleUpdateMessageEdited.bind(this);
        this.handleUpdateMessageViews = this.handleUpdateMessageViews.bind(this);
        this.handleUpdateMessageContent = this.handleUpdateMessageContent.bind(this);
        this.handleUpdateChatReadOutbox = this.handleUpdateChatReadOutbox.bind(this);
    }

    componentWillMount(){
        MessageStore.on('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.on('updateMessageViews', this.handleUpdateMessageViews);
        MessageStore.on('updateMessageContent', this.handleUpdateMessageContent);

        ChatStore.on('updateChatReadOutbox', this.handleUpdateChatReadOutbox);
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

    handleUpdateChatReadOutbox(payload) {
        if (this.props.message.chat_id === payload.chat_id
            && this.props.message.is_outgoing
            && this.unread
            && this.props.message.id <= payload.last_read_outbox_message_id){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        MessageStore.removeListener('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.removeListener('updateMessageViews', this.handleUpdateMessageViews);
        MessageStore.removeListener('updateMessageContent', this.handleUpdateMessageContent);

        ChatStore.removeListener('updateChatReadOutbox', this.handleUpdateChatReadOutbox);
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
                        if (file
                            && file.local
                            && file.local.can_be_downloaded
                            && !file.local.is_downloading_active) {

                            if (file.local.is_downloading_completed){
                                if (file.arr && document.file_name){
                                    fileDownload(file.arr, document.file_name);
                                }
                            }
                            else{
                                FileController.getRemoteFile(file.id, 1, message);
                            }
                        }
                    }
                }

                break;
            }
        }
    }

    render(){
        let message = this.props.message;
        if (!message) return (<div>[empty message]</div>);

        //const messageClassName = this.props.sendingState ? 'message sending' : 'message';

        const messageStatusClassName = this.props.sendingState ? 'sending' : '';

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
                    {this.unread && <i className={classNames('message-status-icon', messageStatusClassName)}/>}
                    <div className='message-content'>
                        <div className='message-meta'>
                            {message.views > 0 && <i className='message-views-icon'/>}
                            {message.views > 0 && <span className='message-views'> {message.views}&nbsp;&nbsp;</span>}
                            {message.edit_date > 0 && <span>edited </span>}
                            <span className='message-date' title={dateHint}>{date}</span>
                        </div>
                        <div className='message-body'>
                            {!forward && <div className='message-author'>{title}</div>}
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