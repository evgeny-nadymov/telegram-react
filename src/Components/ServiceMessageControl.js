import React from 'react';
import MessageStore from '../Stores/MessageStore';
import { getServiceMessageContent } from '../Utils/ServiceMessage';
import './ServiceMessageControl.css';
import UserStore from '../Stores/UserStore';
import TdLibController from '../Controllers/TdLibController';

class ServiceMessageControl extends React.Component {
    constructor(props){
        super(props);

        this.handleSelectUser = this.handleSelectUser.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId
            || nextProps.messageId !== this.props.messageId){
            return true;
        }

        if (nextProps.sendingState !== this.props.sendingState){
            return true;
        }

        return false;
    }
    
    handleSelectUser(user){
        if (!user) return;
        
        TdLibController
            .send({
                '@type': 'createPrivateChat',
                user_id: user.id,
                force: true
            })
            .then(chat => {
                this.props.onSelectChat(chat);
            });
    }

    render() {
        let message = MessageStore.get(this.props.chatId, this.props.messageId);
        if (!message) return (<div>[empty service message]</div>);

        let serviceMessageContent = getServiceMessageContent(message, this.handleSelectUser);

        return (
            <div className='service-message'>
                {this.props.showUnreadSeparator &&
                    <div className='message-unread-separator'>
                        Unread messages
                    </div>
                }
                <div className='service-message-wrapper'>
                    <div className='service-message-content'>
                    {serviceMessageContent}
                    </div>
                </div>
            </div>
        );
    }
}

export default ServiceMessageControl;