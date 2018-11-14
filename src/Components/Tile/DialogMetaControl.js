/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import {getLastMessageDate} from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import './DialogMetaControl.css';

class DialogMetaControl extends React.Component {
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
    }

    componentWillUnmount(){
        ChatStore.removeListener('updateChatDraftMessage', this.onUpdate);
        ChatStore.removeListener('updateChatLastMessage', this.onUpdate);
    }

    onUpdate(update) {
        if (!this.props.chatId) return;
        if (this.props.chatId !== update.chat_id) return;

        this.forceUpdate();
    }

    render() {
        const chat = ChatStore.get(this.props.chatId);

        const date = getLastMessageDate(chat);

        return (
            <>
                {date && <div className='dialog-meta-date'>{date}</div>}
            </>
        );
    }
}
export default DialogMetaControl;