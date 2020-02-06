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
import ChatTile from './ChatTile';
import DialogTitle from './DialogTitle';
import { getChatUsername, getGroupChatMembersCount } from '../../Utils/Chat';
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
        const { chatId, theme } = this.props;

        if (nextState.nextChatId === chatId) {
            return true;
        }

        if (nextState.previousChatId === chatId) {
            return true;
        }

        if (nextProps.theme !== theme) {
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
        const selectedChatId = this.state.nextChatId;

        const username = getChatUsername(chatId);
        const membersCount = getGroupChatMembersCount(chatId);
        let subscribersString = '';
        if (membersCount > 0) {
            subscribersString = membersCount === 1 ? ', 1 subscriber' : `, ${membersCount} subscribers`;
        }

        return (
            <ListItem
                button
                classes={classNames('found-public-chat', {
                    'item-selected': chatId === selectedChatId
                })}
                onClick={onClick}>
                <div className='dialog-wrapper'>
                    <ChatTile chatId={chatId} />
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <DialogTitle chatId={chatId} />
                        </div>
                        <div className='tile-second-row'>
                            <div className='dialog-content'>
                                @{username}
                                {subscribersString}
                            </div>
                        </div>
                    </div>
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
