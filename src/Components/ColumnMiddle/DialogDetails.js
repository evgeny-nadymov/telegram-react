/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {Component} from 'react';
import classNames from 'classnames';
import Footer from './Footer';
import Header from './Header';
import MessagesList from './MessagesList';
import ChatStore from '../../Stores/ChatStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import './DialogDetails.css';

class DialogDetails extends Component{

    constructor(props){
        super(props);

        this.messagesList = React.createRef();

        this.state = {
            currentChatId : ApplicationStore.getChatId()
        };
    }

    shouldComponentUpdate(nextProps, nextState){
        if (nextState.currentChatId !== this.state.currentChatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateChatDetailsVisibility', this.onUpdateChatDetailsVisibility);
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('clientUpdateChatDetailsVisibility', this.onUpdateChatDetailsVisibility);
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onUpdateChatDetailsVisibility = (update) => {
        this.forceUpdate();
    };

    onClientUpdateChatId = (update) => {
        this.setState({ currentChatId : update.nextChatId })
    };

    scrollToBottom = () => {
        this.messagesList.current.scrollToBottom();
    };

    showDialogFooter = () => {
        const chat = ChatStore.get(this.state.currentChatId);
        if (!chat) return false;

        const {type} = chat;

        if (type && type['@type'] === 'chatTypeSupergroup'){
            if (type.is_channel){
                return true;
            }
        }

        return false;
    };

    render(){

        /*let groups = [];
        if (this.props.history.length > 0){
            let currentGroup = {
                key: this.props.history[0].id,
                date: this.props.history[0].date,
                senderUserId: this.props.history[0].sender_user_id,
                messages: [this.props.history[0]]
            };

            for (let i = 1; i < this.props.history.length; i++){
                if (this.props.history[i].sender_user_id === currentGroup.senderUserId
                    && Math.abs(this.props.history[i].date - currentGroup.date) <= 10 * 60
                    && i % 20 !== 0){
                    currentGroup.key += '_' + this.props.history[i].id;
                    currentGroup.messages.push(this.props.history[i]);
                }
                else {
                    groups.push(currentGroup);
                    currentGroup = {
                        key: this.props.history[i].id,
                        date: this.props.history[i].date,
                        senderUserId: this.props.history[i].sender_user_id,
                        messages: [this.props.history[i]]
                    };
                }
            }
            groups.push(currentGroup);
        }

        this.groups = groups.map(x => {
            return (<MessageGroupControl key={x.key} senderUserId={x.senderUserId} messages={x.messages} onSelectChat={this.props.onSelectChat}/>);
        });*/
        const { onSelectChat, onSelectUser } = this.props;
        const { currentChatId } = this.state;
        const { isChatDetailsVisible } = ApplicationStore;

        return (
            <div className={classNames('dialog-details', { 'dialog-details-third-column': isChatDetailsVisible })}>
                <Header chatId={currentChatId}/>
                <MessagesList
                    ref={this.messagesList}
                    chatId={currentChatId}
                    onSelectChat={onSelectChat}
                    onSelectUser={onSelectUser}/>
                <Footer chatId={currentChatId}/>
            </div>
        );
    }
}

export default DialogDetails;