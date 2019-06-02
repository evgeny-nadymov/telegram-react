/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import withStyles from '@material-ui/core/styles/withStyles';
import ChatTileControl from './ChatTileControl';
import { getChatShortTitle } from '../../Utils/Chat';
import './TopChat.css';

const styles = {
    userStatusRoot: {
        position: 'absolute',
        right: 1,
        bottom: 1,
        zIndex: 1
    }
};

class TopChat extends React.PureComponent {
    render() {
        const { classes, chatId, onSelect, showSavedMessages } = this.props;

        const shortTitle = getChatShortTitle(chatId, showSavedMessages);

        return (
            <div className='top-chat'>
                <ChatTileControl chatId={chatId} onSelect={onSelect} showSavedMessages={showSavedMessages} showOnline />
                <div className='top-chat-title'>{shortTitle}</div>
            </div>
        );
    }
}

TopChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func,
    showSavedMessages: PropTypes.bool
};

TopChat.defaultProps = {
    showSavedMessages: true
};

export default withStyles(styles)(TopChat);
