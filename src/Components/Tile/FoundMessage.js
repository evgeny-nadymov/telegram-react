/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import ListItem from '@material-ui/core/ListItem';
import ChatTile from './ChatTile';
import UserTile from './UserTile';
import DialogTitle from './DialogTitle';
import { getMessageDate, getMessageSenderFullName, getMessageSenderName } from '../../Utils/Chat';
import { getContent } from '../../Utils/Message';
import MessageStore from '../../Stores/MessageStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import './FoundMessage.css';

const styles = theme => ({
    listItem: {
        padding: 0
    },
    foundMessageSubtitle: {
        color: theme.palette.text.secondary
    },
    verifiedIcon: {
        color: theme.palette.primary.main
    },
    foundMessageActive: {
        color: '#fff',
        backgroundColor: theme.palette.primary.main,
        '& $verifiedIcon': {
            color: '#fff'
        }
    }
});

class FoundMessage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            nextChatId: ApplicationStore.getChatId(),
            nextMessageId: ApplicationStore.getMessageId()
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId, theme } = this.props;

        if (nextState.nextChatId === chatId && nextState.nextMessageId === messageId) {
            return true;
        }

        if (nextState.previousChatId === chatId && nextState.previousMessageId === messageId) {
            return true;
        }

        if (nextProps.theme !== theme) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = update => {
        this.setState({
            ...update
        });
    };

    render() {
        const { chatId, messageId, chatSearch, onClick, classes, t } = this.props;
        const selectedChatId = this.state.nextChatId;
        const selectedMessageId = this.state.nextMessageId;
        const message = MessageStore.get(chatId, messageId);

        const { sender_user_id } = message;

        const date = getMessageDate(message);
        const senderName = getMessageSenderName(message);
        const senderFullName = getMessageSenderFullName(message);
        const content = getContent(message, t) || '\u00A0';
        const selected = chatId === selectedChatId && messageId === selectedMessageId;

        const tile = sender_user_id && chatSearch ? <UserTile userId={sender_user_id} /> : <ChatTile chatId={chatId} />;

        return (
            <ListItem button className={classes.listItem} onClick={onClick}>
                <div
                    className={classNames(
                        'found-message',
                        { [classes.foundMessageActive]: selected },
                        { 'accent-background': selected }
                    )}>
                    {tile}
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            {chatSearch && senderFullName ? (
                                <div className='dialog-title'>{senderFullName}</div>
                            ) : (
                                <DialogTitle chatId={chatId} classes={{ verifiedIcon: classes.verifiedIcon }} />
                            )}
                            <div className={classNames('dialog-meta', classes.foundMessageSubtitle)}>{date}</div>
                        </div>
                        <div className='tile-second-row'>
                            <div className={classNames('dialog-content', classes.foundMessageSubtitle)}>
                                {
                                    <>
                                        {!chatSearch && senderName && (
                                            <span className='dialog-content-accent'>{senderName}: </span>
                                        )}
                                        {content}
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </ListItem>
        );
    }
}

FoundMessage.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    chatSearch: PropTypes.bool,
    onClick: PropTypes.func
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(FoundMessage);
