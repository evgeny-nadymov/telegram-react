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
import { withNamespaces } from 'react-i18next';
import { withStyles } from '@material-ui/core/styles';
import { getContent, getTitle } from '../../Utils/Message';
import { accentStyles } from '../Theme';
import MessageStore from '../../Stores/MessageStore';
import './Reply.css';

const styles = theme => ({
    ...accentStyles(theme)
});

class Reply extends React.Component {
    componentDidMount() {
        MessageStore.on('getMessageResult', this.onGetMessageResult);
    }

    componentWillUnmount() {
        MessageStore.removeListener('getMessageResult', this.onGetMessageResult);
    }

    onGetMessageResult = result => {
        const { chatId, messageId } = this.props;

        if (chatId === result.chat_id && messageId === result.id) {
            this.forceUpdate();
        }
    };

    getSubtitle(message) {
        if (!message) return 'Loading...';

        const content = message.content;
        if (!content) return '[content undefined]';

        switch (content['@type']) {
            case 'messageText':
                return content.text.text;
            case 'messagePhoto':
                return 'Photo';
            case 'messageDocument':
                return 'Document';
            default:
                return '[' + content['@type'] + ']';
        }
    }

    isDeletedMessage = message => {
        return message && message['@type'] === 'deletedMessage';
    };

    render() {
        const { classes, t, chatId, messageId } = this.props;

        if (!chatId) return null;
        if (!messageId) return null;

        const message = MessageStore.get(chatId, messageId);
        const title = this.isDeletedMessage(message) ? null : getTitle(message);
        const subtitle = this.isDeletedMessage(message) ? 'Deleted message' : getContent(message, t);

        return (
            <div className='reply'>
                <div className={classNames('reply-border', classes.accentBackgroundLight)} />
                <div className='reply-content'>
                    {title && <div className={classNames('reply-content-title', classes.accentColorDark)}>{title}</div>}
                    <div className='reply-content-subtitle'>{subtitle}</div>
                </div>
            </div>
        );
    }
}

Reply.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withNamespaces()
);

export default enhance(Reply);
