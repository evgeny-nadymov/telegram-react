/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {getTitle} from '../../Utils/Message';
import MessageStore from '../../Stores/MessageStore';
import './ReplyControl.css'

class ReplyControl extends React.Component {
    constructor(props){
        super(props);

        this.handleMessageLoaded = this.handleMessageLoaded.bind(this);
    }

    componentDidMount(){
        MessageStore.on('messageLoaded', this.handleMessageLoaded);
    }

    handleMessageLoaded(payload) {
        if (this.props.chatId === payload.chat_id
            && this.props.messageId === payload.id){
            this.forceUpdate();
        }
    }

    componentWillUnmount(){
        MessageStore.removeListener('messageLoaded', this.handleMessageLoaded);
    }

    getSubtitle(message){
        if (!message) return 'Loading...';

        const content = message.content;
        if (!content) return '[content undefined]';

        switch (content['@type']) {
            case 'messageText':
                return content.text.text;
            case 'messagePhoto':
                return 'Photo';
            case 'messageDocument':
                return 'Document';
            default:
                return '[' + content['@type'] + ']';
        }
    }

    render() {
        if (!this.props.chatId) return null;
        if (!this.props.messageId) return null;

        let message = MessageStore.get(this.props.chatId, this.props.messageId);
        let title = getTitle(message);
        let subtitle = this.getSubtitle(message);

        return (
            <div className='reply-wrapper'>
                <div className='reply-border'/>
                <div className='reply-content-wrapper'>
                    {title && <div className='reply-content-title'>{title}</div>}
                    <div className='reply-content-subtitle'>{subtitle}</div>
                </div>
            </div>
        );
    }

}

export default ReplyControl;