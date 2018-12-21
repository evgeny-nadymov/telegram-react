/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import ChatTileControl from './ChatTileControl';
import DialogTitleControl from './DialogTitleControl';
import { getChatUsername, getGroupChatMembersCount } from '../../Utils/Chat';
import ApplicationStore from '../../Stores/ApplicationStore';
import './FoundPublicChat.css';

const styles = {
    listItem: {
        padding: '0px'
    }
};

class FoundPublicChat extends React.PureComponent {

    constructor(props){
        super(props);

        this.state = {
            nextChatId: ApplicationStore.getChatId(),
            previousChatId: null
        };
    }

    shouldComponentUpdate(nextProps, nextState){
        const { chatId } = this.props;

        if (nextState.nextChatId === chatId){
            return true;
        }

        if (nextState.previousChatId === chatId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount(){
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = (update) => {
        const { nextChatId, previousChatId } = update;

        this.setState({
            nextChatId: nextChatId,
            previousChatId: previousChatId
        });
    };

    handleClick = () => {
        const { chatId, onSelect} = this.props;
        if (!onSelect) return;

        onSelect(chatId);
    };

    render() {

        const { chatId, onClick, classes } = this.props;
        const selectedChatId = this.state.nextChatId;

        const username = getChatUsername(chatId);
        const membersCount = getGroupChatMembersCount(chatId);
        let subscribersString = '';
        if (membersCount > 0){
            subscribersString = membersCount === 1 ? ', 1 subscriber' : `, ${membersCount} subscribers`;
        }

        return (
            <ListItem button className={classes.listItem} onClick={onClick}>
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
            </ListItem>
        );
    }
}

FoundPublicChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onClick: PropTypes.func
};

export default withStyles(styles)(FoundPublicChat);