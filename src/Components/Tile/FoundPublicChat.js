/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ChatTileControl from './ChatTileControl';
import DialogTitleControl from './DialogTitleControl';
import { getChatUsername, getGroupChatMembersCount } from '../../Utils/Chat';
import ApplicationStore from '../../Stores/ApplicationStore';
import './FoundPublicChat.css';

class FoundPublicChat extends React.PureComponent {

    constructor(props){
        super(props);

        this.state = {
            chatId: ApplicationStore.getChatId()
        };
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = (update) => {
        const { nextChatId } = update;

        this.setState({ chatId: nextChatId });
    };

    handleClick = () => {
        const { chatId, onSelect} = this.props;
        if (!onSelect) return;

        onSelect(chatId);
    };

    render() {

        const { chatId } = this.props;
        const selectedChatId = this.state.chatId;

        const username = getChatUsername(chatId);
        const membersCount = getGroupChatMembersCount(chatId);
        let subscribersString = '';
        if (membersCount > 0){
            subscribersString = membersCount === 1 ? ', 1 subscriber' : `, ${membersCount} subscribers`;
        }

        return (
            <div className={classNames('found-public-chat', { 'accent-background': chatId === selectedChatId })} onClick={this.handleClick}>
                <ChatTileControl chatId={chatId} />
                <div className='dialog-inner-wrapper'>
                    <div className='tile-first-row'>
                        <DialogTitleControl chatId={chatId} />
                    </div>
                    <div className='tile-second-row'>
                        <div className='dialog-content'>
                            @{username}
                            {subscribersString}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

FoundPublicChat.propTypes = {
    chatId: PropTypes.number.isRequired
};

export default FoundPublicChat;