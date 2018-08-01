import React, {Component} from 'react';
import './MessageControl.css';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';
import MessageStore from '../Stores/MessageStore';
import TdLibController from '../Controllers/TdLibController';
import ReplyControl from './ReplyControl';
import {getTitle, getDate, getDateHint, getText, getMedia, getReply, getForward} from '../Utils/Message';

class MessageControl extends Component{
    constructor(props){
        super(props);

        this.openForward = this.openForward.bind(this);
        this.handleUpdateMessageEdited = this.handleUpdateMessageEdited.bind(this);
        this.handleUpdateMessageViews = this.handleUpdateMessageViews.bind(this);
        this.handleUpdateMessageContent = this.handleUpdateMessageContent.bind(this);
    }

    componentWillMount(){
        MessageStore.on('updateMessageEdited', this.handleUpdateMessageEdited);
        MessageStore.on('updateMessageViews', this.handleUpdateMessageViews);
        MessageStore.on('updateMessageContent', this.handleUpdateMessageContent);
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
        MessageStore.removeListener('updateMessageContent', this.handleUpdateMessageContent);
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

    render(){
        let message = this.props.message;
        if (!message) return (<div>[empty message]</div>);

        const messageClassName = this.props.sendingState ? 'message sending' : 'message';

        let title = this.props.showTitle? getTitle(message) : null;
        let text = getText(message);//JSON.stringify(message);
        let date = getDate(message);
        let dateHint = getDateHint(message);
        let media = getMedia(message);
        let reply = getReply(message);
        let forward = getForward(message);
        return (
            <div className={messageClassName}>
                <div className='message-wrapper'>
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