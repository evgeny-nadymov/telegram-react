/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ChatTile from './ChatTile';
import MessageAuthor from '../Message/MessageAuthor';
import './MediaInfo.css';

class ProfileMediaInfo extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { chatId, date } = this.props;

        return (
            <div className='media-info'>
                <div className='media-info-wrapper'>
                    <ChatTile chatId={chatId} showSavedMessages={false} />
                    <div className='media-info-content'>
                        <div className='media-info-row'>
                            <MessageAuthor chatId={chatId} />
                        </div>
                        {date && (
                            <div className='media-info-row meta'>
                                <span>{date}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

ProfileMediaInfo.propTypes = {
    chatId: PropTypes.number.isRequired,
    date: PropTypes.string
};

export default ProfileMediaInfo;
