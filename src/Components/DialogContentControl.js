import React from 'react';
import ChatStore from '../Stores/ChatStore';
import './DialogContentControl.css';
import {
    getChatTypingString,
    getChatDraft,
    getLastMessageSenderName,
    getLastMessageContent
} from '../Utils/Chat';

class DialogContentControl extends React.Component {
    constructor(props){
        super(props);

        this.onUpdate = this.onUpdate.bind(this);
    }

    componentWillMount(){
        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('onUpdateChatLastMessage', this.onUpdate);
        ChatStore.on('updateUserChatAction', this.onUpdate);
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate);
        ChatStore.removeListener('onUpdateChatLastMessage', this.onUpdate);
        ChatStore.removeListener('updateUserChatAction', this.onUpdate);
    }

    onUpdate(update) {
        if (!this.props.chatId) return;
        if (this.props.chatId !== update.chat_id) return;

        this.forceUpdate();
    }

    render() {
        const chat = ChatStore.get(this.props.chatId);

        let contentControl = null;
        const typingString = getChatTypingString(chat);
        if (typingString){
            contentControl = (<span className='dialog-content-accent'>{typingString}...</span>);
        }

        if (!contentControl){
            const draft = getChatDraft(chat);
            if (draft){
                contentControl = (
                    <React.Fragment>
                        <span className='dialog-content-draft'>Draft: </span>
                        <span>{draft.text}</span>
                    </React.Fragment>
                );
            }
        }

        if (!contentControl){
            const content = getLastMessageContent(chat);
            const senderName = getLastMessageSenderName(chat);
            contentControl = (
                <React.Fragment>
                    {senderName && <span className='dialog-content-accent'>{senderName}: </span>}
                    <span>{content}</span>
                </React.Fragment>
            );
        }

        return (
            <div className='dialog-content'>
                {contentControl}
            </div>
        );
    }
}

export default DialogContentControl;