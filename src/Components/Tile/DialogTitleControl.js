/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { getChatTitle } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import './DialogTitleControl.css';

class DialogTitleControl extends React.Component {
    constructor(props){
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextProps.chatId !== this.props.chatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('updateChatTitle', this.onUpdate);
    }

    componentWillUnmount(){
        ChatStore.removeListener('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.removeListener('updateChatTitle', this.onUpdate);
    }

    onFastUpdatingComplete = (update) => {
        this.forceUpdate();
    };

    onUpdate = (update) => {
        const { chatId } = this.props;

        if (update.chat_id !== chatId) return;

        this.forceUpdate();
    };

    render() {
        const { chatId } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const title = getChatTitle(chat);

        return (<div className='dialog-title'>{title}</div>);
    }
}

export default DialogTitleControl;