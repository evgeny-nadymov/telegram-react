import React from 'react';
import ChatStore from '../Stores/ChatStore';
import UserStore from '../Stores/UserStore';

class DialogContentControl extends React.Component {
    constructor(props){
        super(props);

        this.onChatTypingChanged = this.onChatTypingChanged.bind(this);
    }

    componentWillMount(){
        ChatStore.on("chat_typing_changed", this.onChatTypingChanged)
    }

    onChatTypingChanged(payload) {
        if (this.props.chat && this.props.chat.id === payload.chatId){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        ChatStore.removeListener("chat_typing_changed", this.onChatTypingChanged);
    }

    getGroupChatTypingString(inputTypingManager){
        if (!inputTypingManager) return null;

        let size = inputTypingManager.actions.size;
        if (size > 2){
            return `${size} people are typing`;
        }
        else if (size > 1){
            let firstUser;
            let secondUser;
            for (let userId of inputTypingManager.actions.keys())
            {
                if (!firstUser) {
                    firstUser = UserStore.get(userId);
                }
                if (!secondUser) {
                    secondUser = UserStore.get(userId);
                    break;
                }
            }

            if (!firstUser || !secondUser){
                return `${size} people are typing`;
            }

            firstUser = firstUser.first_name ? firstUser.first_name : firstUser.second_name;
            secondUser = secondUser.first_name ? secondUser.first_name : secondUser.second_name;

            if (!firstUser || !secondUser){
                return `${size} people are typing`;
            }

            return `${firstUser} and ${secondUser} are typing`;
        }
        else{
            let firstUser;
            if (inputTypingManager.actions.size >= 1){

                for (let userId of inputTypingManager.actions.keys())
                {
                    if (!firstUser) {
                        firstUser = UserStore.get(userId);
                        break;
                    }
                }

                if (!firstUser){
                    return `1 person is typing`;
                }

                firstUser = firstUser.first_name ? firstUser.first_name : firstUser.second_name;

                if (!firstUser){
                    return `1 person is typing`;
                }

                let action = inputTypingManager.actions.values().next().value.action;
                switch (action['@type']){
                    case 'chatActionRecordingVideo':
                        return `${firstUser} is recording a video`;
                    case 'chatActionRecordingVideoNote':
                        return `${firstUser} is recording a video message`;
                    case 'chatActionRecordingVoiceNote':
                        return `${firstUser} is recording a voice message`;
                    case 'chatActionStartPlayingGame':
                        return `${firstUser} is playing a game`;
                    case 'chatActionUploadingDocument':
                        return `${firstUser} is sending a file`;
                    case 'chatActionUploadingPhoto':
                        return `${firstUser} is sending a photo`;
                    case 'chatActionUploadingVideo':
                        return `${firstUser} is sending a video`;
                    case 'chatActionUploadingVideoNote':
                        return `${firstUser} is sending a video message`;
                    case 'chatActionUploadingVoiceNote':
                        return `${firstUser} is sending a voice message`;
                    case 'chatActionChoosingContact':
                    case 'chatActionChoosingLocation':
                    case 'chatActionTyping':
                    default:
                        return `${firstUser} is typing`;
                }
            }
        }

        return null;
    }

    getPrivateChatTypingString(inputTypingManager){
        if (!inputTypingManager) return null;

        if (inputTypingManager.actions.size >= 1){
            let action = inputTypingManager.actions.values().next().value.action;
            switch (action['@type']){
                case 'chatActionRecordingVideo':
                    return 'recording a video';
                case 'chatActionRecordingVideoNote':
                    return 'recording a video message';
                case 'chatActionRecordingVoiceNote':
                    return 'recording a voice message';
                case 'chatActionStartPlayingGame':
                    return 'playing a game';
                case 'chatActionUploadingDocument':
                    return 'sending a file';
                case 'chatActionUploadingPhoto':
                    return 'sending a photo';
                case 'chatActionUploadingVideo':
                    return 'sending a video';
                case 'chatActionUploadingVideoNote':
                    return 'sending a video message';
                case 'chatActionUploadingVoiceNote':
                    return 'sending a voice message';
                case 'chatActionChoosingContact':
                case 'chatActionChoosingLocation':
                case 'chatActionTyping':
                default:
                    return 'typing';
            }
        }

        return null;
    }

    getTypingString(chat){
        if (!chat) return null;
        if (!chat.type) return null;

        switch (chat.type['@type']){
            case 'chatTypePrivate':
            case 'chatTypeSecret':
                return this.getPrivateChatTypingString(chat.inputTypingManager);
            case 'chatTypeBasicGroup':
            case 'chatTypeSupergroup':
                return this.getGroupChatTypingString(chat.inputTypingManager);
        }

        return null;
    }

    render() {
        let typingString = this.getTypingString(this.props.chat);
        let content = typingString ? typingString : this.props.content;

        return (
            <div className='dialog-content'><span>{content}</span></div>
        );
    }
}

export default DialogContentControl;