/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import Message from './../Message/Message';
import UserTile from '../Tile/UserTile';
import { getTitle, getDate, getText, getMedia } from '../../Utils/Message';
import UserStore from '../../Stores/UserStore';
import ChatStore from '../../Stores/ChatStore';
import TdLibController from '../../Controllers/TdLibController';
import './MessageGroup.css';

class MessageGroup extends Component {
    constructor(props) {
        super(props);

        //this.openForward = this.openForward.bind(this);
        //this.handleUpdateMessageEdited = this.handleUpdateMessageEdited.bind(this);
        //this.handleUpdateMessageViews = this.handleUpdateMessageViews.bind(this);
        //this.handleUpdateMessageContent = this.handleUpdateMessageContent.bind(this);
    }

    componentDidMount() {
        //MessageStore.on('updateMessageEdited', this.handleUpdateMessageEdited);
        //MessageStore.on('updateMessageViews', this.handleUpdateMessageViews);
        //MessageStore.on('updateMessageContent', this.handleUpdateMessageContent);
    }

    handleUpdateMessageEdited(payload) {
        //if (this.props.message.chat_id === payload.chat_id
        //    && this.props.message.id === payload.message_id){
        //    this.forceUpdate();
        //}
    }

    handleUpdateMessageViews(payload) {
        //if (this.props.message.chat_id === payload.chat_id
        //    && this.props.message.id === payload.message_id){
        //    this.forceUpdate();
        //}
    }

    handleUpdateMessageContent(payload) {
        //if (this.props.message.chat_id === payload.chat_id
        //    && this.props.message.id === payload.message_id){
        //    this.forceUpdate();
        //}
    }

    componentWillUnmount() {
        //MessageStore.off('updateMessageEdited', this.handleUpdateMessageEdited);
        //MessageStore.off('updateMessageViews', this.handleUpdateMessageViews);
        //MessageStore.off('updateMessageContent', this.handleUpdateMessageContent);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.key !== this.props.key) {
            return true;
        }

        return false;
    }

    openForward() {
        let message = this.props.message;

        if (!message) return;
        if (!message.forward_info) return null;

        switch (message.forward_info['@type']) {
            case 'messageForwardedFromUser': {
                let user = UserStore.get(message.forward_info.sender_user_id);
                if (user) {
                    TdLibController.send({
                        '@type': 'createPrivateChat',
                        user_id: message.forward_info.sender_user_id,
                        force: true
                    }).then(chat => {
                        this.props.onSelectChat(chat);
                    });
                }
                break;
            }
            case 'messageForwardedPost': {
                let chat = ChatStore.get(message.forward_info.chat_id);

                this.props.onSelectChat(chat);
                break;
            }
        }
    }

    render() {
        let messages = this.props.messages;
        if (!messages) return <div>[empty group]</div>;

        let user = UserStore.get(this.props.messages[0].sender_user_id);

        const groupContent = this.props.messages.map(x => (
            <Message
                key={x.id}
                showTitle={x.id === this.props.messages[0].id}
                sendingState={x.sending_state}
                message={x}
            />
        ));

        return (
            <div className='group-wrapper'>
                {user && (
                    <div className='group-sender'>
                        <div className='group-tile'>
                            <UserTile userId={this.props.messages[0].sender_user_id} />
                        </div>
                    </div>
                )}
                <div className='group-content'>{groupContent}</div>
            </div>
        );
    }
}

export default MessageGroup;
