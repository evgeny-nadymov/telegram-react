/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getDateHint, getSenderUserId } from '../../Utils/Message';
import UserTile from './UserTile';
import ChatTile from './ChatTile';
import MessageAuthor from '../Message/MessageAuthor';
import MessageStore from '../../Stores/MessageStore';
import './MediaInfo.css';

class MediaInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { chatId, messageId } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { date } = message;

        const userId = getSenderUserId(message);
        const dateHint = getDateHint(date);

        const tileControl = userId ? <UserTile userId={userId} /> : <ChatTile chatId={chatId} />;

        return (
            <div className='media-info'>
                <div className='media-info-wrapper'>
                    {tileControl}
                    <div className='media-info-content'>
                        <div className='media-info-row'>
                            <MessageAuthor chatId={chatId} userId={userId} />
                        </div>
                        <div className='media-info-row meta'>
                            <span>{dateHint}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

MediaInfo.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired
};

export default MediaInfo;
