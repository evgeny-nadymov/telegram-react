/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import ChatStore from '../../Stores/ChatStore';
import ChatDetails from './ChatDetails';
import SharedMedia from './SharedMedia';
import TdLibController from '../../Controllers/TdLibController';
import ApplicationStore from '../../Stores/ApplicationStore';
import './DialogInfo.css';

class DialogInfo extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            selectedChatId: ChatStore.getSelectedChatId()
        };
    }

    componentDidMount(){
        ChatStore.on('clientUpdateSelectedChatId', this.onClientUpdateSelectedChatId);
    }

    componentWillUnmount(){
        ChatStore.removeListener('clientUpdateSelectedChatId', this.onClientUpdateSelectedChatId);
    }

    onClientUpdateSelectedChatId = update => {
        this.setState({ selectedChatId: update.nextChatId, userChatId: null, openSharedMedia: false });
    };

    handelOpenSharedMedia = () => {
        this.setState({ openSharedMedia: true });
    };

    handleCloseSharedMedia = () =>{
        this.setState({ openSharedMedia: false });
    };

    handleSelectUser = async (user) => {
        if (!user) return;

        let chat = await TdLibController
            .send({
                '@type': 'createPrivateChat',
                user_id: user.id,
                force: true
            });

        chat = ChatStore.get(chat.id) || chat;
        if (!chat) return;

        this.setState({ userChatId: chat.id });
    };

    handleCloseChatDetails = () => {
        const { userChatId } = this.state;
        if (userChatId){
            this.setState({userChatId: null})
        }
        else{
            ApplicationStore.changeChatDetailsVisibility(false);
        }
    };

    render() {
        const {selectedChatId, userChatId, openSharedMedia} = this.state;

        let content = null;
        if (openSharedMedia){
            const chatId = userChatId || selectedChatId;

            content =
                (<SharedMedia
                    chatId={chatId}
                    close={this.handleCloseSharedMedia}/>);
        }
        else {
            const chatId = userChatId || selectedChatId;
            const backButton = userChatId === chatId;

            content =
                (<ChatDetails
                    chatId={chatId}
                    backButton={backButton}
                    openSharedMedia={this.handelOpenSharedMedia}
                    onClose={this.handleCloseChatDetails}
                    onSelectUser={this.handleSelectUser}/>);
        }

        return (
            <div className='right-column'>
                {content}
            </div>
        );
    }
}

export default DialogInfo;