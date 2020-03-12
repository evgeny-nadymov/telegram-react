/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { ListItem } from '@material-ui/core';
import ChatTile from './ChatTile';
import { getChatShortTitle } from '../../Utils/Chat';
import './TopChat.css';

class TopChat extends React.PureComponent {
    render() {
        const { chatId, onSelect, showSavedMessages, t } = this.props;

        const shortTitle = getChatShortTitle(chatId, showSavedMessages, t);

        return (
            <ListItem button className='top-chat' onClick={onSelect}>
                <ChatTile dialog chatId={chatId} showSavedMessages={showSavedMessages} showOnline />
                <div className='top-chat-title'>{shortTitle}</div>
            </ListItem>
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

export default withTranslation()(TopChat);
