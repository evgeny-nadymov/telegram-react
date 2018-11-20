/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { getContent, getTitle } from '../../Utils/Message';
import MessageStore from '../../Stores/MessageStore';
import './ReplyControl.css'

class ReplyControl extends React.Component {
    constructor(props){
        super(props);
    }

    componentDidMount(){
        MessageStore.on('getMessageResult', this.onGetMessageResult);
    }

    componentWillUnmount(){
        MessageStore.removeListener('getMessageResult', this.onGetMessageResult);
    }

    onGetMessageResult = (result) => {
        const { chatId, messageId } = this.props;

        if (chatId === result.chat_id
            && messageId === result.id){
            this.forceUpdate();
        }
    };

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

    isDeletedMessage = (message) => {
        return message && message['@type'] === 'deletedMessage';
    };

    render() {
        const { chatId, messageId } = this.props;

        if (!chatId) return null;
        if (!messageId) return null;

        const message = MessageStore.get(chatId, messageId);
        const title = this.isDeletedMessage(message)? null : getTitle(message);
        const subtitle = this.isDeletedMessage(message)? 'Deleted message' : getContent(message);

        return (
            <div className='reply'>
                <div className='reply-border'/>
                <div className='reply-content'>
                    {title && <div className='reply-content-title'>{title}</div>}
                    <div className='reply-content-subtitle'>{subtitle}</div>
                </div>
            </div>
        );
    }

}

export default ReplyControl;