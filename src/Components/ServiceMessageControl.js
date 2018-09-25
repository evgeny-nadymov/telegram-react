import React from 'react';
import MessageStore from '../Stores/MessageStore';
import { getServiceMessageContent } from '../Utils/ServiceMessage';
import './ServiceMessageControl.css';

class ServiceMessageControl extends React.Component {
    constructor(props){
        super(props);
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

    render() {
        let message = MessageStore.get(this.props.chatId, this.props.messageId);
        if (!message) return (<div>[empty service message]</div>);

        let serviceMessageContent = getServiceMessageContent(message, this.props.onSelectChat);

        return (
            <div className='service-message-wrapper'>
                <div className='service-message-content'>
                {serviceMessageContent}
                </div>
            </div>
        );
    }
}

export default ServiceMessageControl;