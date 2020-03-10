/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ListItem from '@material-ui/core/ListItem';
import Chat from './Chat';
import { getChatUsername } from '../../Utils/Chat';
import AppStore from '../../Stores/ApplicationStore';
import './FoundPublicChat.css';

class FoundPublicChat extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nextChatId: AppStore.getChatId(),
            previousChatId: null
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId } = this.props;

        if (nextState.nextChatId === chatId) {
            return true;
        }

        if (nextState.previousChatId === chatId) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = update => {
        const { nextChatId, previousChatId } = update;

        this.setState({
            nextChatId: nextChatId,
            previousChatId: previousChatId
        });
    };

    render() {
        const { chatId, onClick } = this.props;
        const { nextChatId: selectedChatId } = this.state;

        const username = getChatUsername(chatId);

        return (
            <ListItem
                button
                className={classNames('found-public-chat', { 'item-selected': chatId === selectedChatId })}
                onClick={onClick}>
                <div className='found-public-chat-wrapper'>
                    <Chat chatId={chatId} subtitle={username ? '@' + username : null} />
                </div>
            </ListItem>
        );
    }
}

FoundPublicChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onClick: PropTypes.func
};

export default FoundPublicChat;
