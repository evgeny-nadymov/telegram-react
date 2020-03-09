/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ListItem from '@material-ui/core/ListItem';
import Chat from './Chat';
import './RecentlyFoundChat.css';

const RecentlyFoundChat = React.memo(({ chatId, onClick }) => {
    return (
        <ListItem button className='recently-found-chat' onClick={onClick}>
            <Chat chatId={chatId} />
        </ListItem>
    );
});

RecentlyFoundChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func
};

export default RecentlyFoundChat;
