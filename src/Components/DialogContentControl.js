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

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        return false;
    }

    componentWillMount(){
        ChatStore.on('updateChatDraftMessage', this.onUpdate);
        ChatStore.on('updateChatLastMessage', this.onUpdate);
        ChatStore.on('updateUserChatAction', this.onUpdate);
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate);
        ChatStore.removeListener('updateChatLastMessage', this.onUpdate);
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
            contentControl = (<span className='dialog-content-accent'>{typingString}</span>);
        }

        if (!contentControl){
            const draft = getChatDraft(chat);
            if (draft){
                const text = draft.text || '\u00A0';

                contentControl = (
                    <>
                        <span className='dialog-content-draft'>Draft: </span>
                        {text}
                    </>
                );
            }
        }

        if (!contentControl){
            const content = getLastMessageContent(chat) || '\u00A0';
            const senderName = getLastMessageSenderName(chat);
            contentControl = (
                <>
                    {senderName && <span className='dialog-content-accent'>{senderName}: </span>}
                    {content}
                </>
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