import React, {Component} from 'react';
import './MessageControl.css';
import UserStore from '../Stores/UserStore';
import ChatStore from '../Stores/ChatStore';

class MessageControl extends Component{

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.message !== this.props.message){
            return true;
        }

        if (nextProps.sendingState !== this.props.sendingState){
            return true;
        }

        return false;
    }

    render(){
        let message = this.props.message;
        if (!message) return (<div>[empty message]</div>);

        let text = null;//JSON.stringify(message);
        if (message.content
            && message.content['@type'] === 'messageText'
            && message.content.text
            && message.content.text['@type'] === 'formattedText'
            && message.content.text.text) {
            text = message.content.text.text;
        }
        else {
            text = '[' + message.content['@type'] + ']';//JSON.stringify(x);
            if (message.content && message.content.caption
                && message.content.caption['@type'] === 'formattedText'
                && message.content.caption.text){
                text += "\n" + message.content.caption.text;
            }
        }

        const messageClassName = this.props.sendingState ? 'message sending' : 'message';

        let from = null;
        let title = null;
        if (message.sender_user_id && message.sender_user_id !== 0){
            from = UserStore.get(message.sender_user_id);
            if (from) title = from.first_name;
        }
        else if (message.chat_id){
            from = ChatStore.get(message.chat_id);
            if (from) title = from.title;
        }

        let date = new Date(message.date * 1000);
        let dateFormatted = date.toDateString();
        return (
            <div className={messageClassName}>
                <div className='message-wrapper'>
                    <div className='message-content'>
                        <div className='message-meta'>
                            <span className='message-date'>{dateFormatted}</span>
                        </div>
                        <div className='message-body'>
                            <div className='message-author'>{title}</div>
                            <div className='message-text'><span>{text}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default MessageControl;