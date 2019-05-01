/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ChatTileControl from './ChatTileControl';
import MessageAuthor from '../Message/MessageAuthor';
import './MediaViewerControl.css';

class ProfileMediaViewerControl extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { chatId, date } = this.props;

        return (
            <div className='media-viewer-control'>
                <div className='media-viewer-control-wrapper'>
                    <ChatTileControl chatId={chatId} showSavedMessages={false} />
                    <div className='media-viewer-control-content'>
                        <div className='media-viewer-row'>
                            <MessageAuthor chatId={chatId} />
                        </div>
                        {date && (
                            <div className='media-viewer-row message-meta'>
                                <span className='message-date'>{date}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

ProfileMediaViewerControl.propTypes = {
    chatId: PropTypes.number.isRequired,
    date: PropTypes.string
};

export default ProfileMediaViewerControl;
