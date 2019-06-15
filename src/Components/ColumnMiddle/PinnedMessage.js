/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import ReplyTile from '../Tile/ReplyTile';
import { accentStyles, borderStyle } from '../Theme';
import { getContent, getReplyPhotoSize, isDeletedMessage } from '../../Utils/Message';
import { openChat } from '../../Actions/Client';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './PinnedMessage.css';

const styles = theme => ({
    ...accentStyles(theme),
    ...borderStyle(theme),
    iconButton: {
        // padding: 4
    },
    pinnedMessage: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF',
        color: theme.palette.text.primary
    }
});

class PinnedMessage extends React.Component {
    constructor(props) {
        super(props);

        const chat = ChatStore.get(props.chatId);
        this.state = {
            prevPropsChatId: props.chatId,
            messageId: chat && chat.pinned_message_id ? chat.pinned_message_id : 0
        };
    }

    static getDerivedStateFromProps(props, state) {
        const { prevPropsChatId } = state;
        const { chatId } = props;

        if (prevPropsChatId !== chatId) {
            const chat = ChatStore.get(chatId);
            //console.log('PinnedMessage.getDerivedStateFromProps', chat, chat.pinned_message_id);
            return {
                prevPropsChatId: chatId,
                messageId: chat && chat.pinned_message_id ? chat.pinned_message_id : 0
            };
        }

        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { messageId } = this.state;

        if (messageId && prevState.messageId !== messageId) {
            this.loadContent();
        }
    }

    componentDidMount() {
        this.loadContent();

        ChatStore.on('updateChatPinnedMessage', this.onUpdateChatPinnedMessage);
    }

    componentWillUnmount() {
        ChatStore.removeListener('updateChatPinnedMessage', this.onUpdateChatPinnedMessage);
    }

    onUpdateChatPinnedMessage = update => {
        const { chat_id, pinned_message_id } = update;
        const { chatId } = this.props;

        if (chatId !== chat_id) return;

        this.setState({ messageId: pinned_message_id });
    };

    loadContent = () => {
        const { chatId } = this.props;
        const { messageId } = this.state;

        if (!chatId) return;
        if (!messageId) return;

        const message = MessageStore.get(chatId, messageId);
        if (message) return;

        TdLibController.send({
            '@type': 'getMessage',
            chat_id: chatId,
            message_id: messageId
        })
            .then(result => {
                MessageStore.set(result);
                this.forceUpdate();
            })
            .catch(error => {
                const deletedMessage = {
                    '@type': 'deletedMessage',
                    chat_id: chatId,
                    id: messageId,
                    content: null
                };
                MessageStore.set(deletedMessage);
                this.forceUpdate();
            });
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, t, theme } = this.props;
        const { messageId } = this.state;

        if (nextProps.t !== t) {
            return true;
        }

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextState.messageId !== messageId) {
            return true;
        }

        return false;
    }

    handleClick = event => {
        const { chatId } = this.props;
        const { messageId } = this.state;

        if (!messageId) return;

        openChat(chatId, messageId);
    };

    handleDelete = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    render() {
        const { chatId, classes, t } = this.props;
        const { messageId } = this.state;

        const message = MessageStore.get(chatId, messageId);
        //console.log('PinnedMessage.message', chatId, messageId, message);
        if (!message) return null;

        let content = !message ? t('Loading') : getContent(message, t);
        const photoSize = getReplyPhotoSize(chatId, messageId);

        if (isDeletedMessage(message)) {
            content = t('DeletedMessage');
        }

        return (
            <div
                className={classNames('pinned-message', classes.pinnedMessage, classes.borderColor)}
                onClick={this.handleClick}>
                <div className='pinned-message-wrapper'>
                    <div className={classNames('reply-border', classes.accentBackgroundLight)} />
                    {photoSize && <ReplyTile chatId={chatId} messageId={messageId} photoSize={photoSize} />}
                    <div className='pinned-message-content'>
                        <div className={classNames('reply-content-title', classes.accentColorMain)}>
                            {t('PinnedMessage')}
                        </div>
                        <div className='reply-content-subtitle'>{content}</div>
                    </div>
                    <div className='pinned-message-delete-button'>
                        <IconButton className={classes.iconButton} onClick={this.handleDelete}>
                            <CloseIcon />
                        </IconButton>
                    </div>
                </div>
            </div>
        );
    }
}

PinnedMessage.propTypes = {
    chatId: PropTypes.number.isRequired
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(PinnedMessage);
