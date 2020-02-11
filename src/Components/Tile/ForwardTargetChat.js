/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import ChatTile from './ChatTile';
import { getChatShortTitle } from '../../Utils/Chat';
import './ForwardTargetChat.css';

class ForwardTargetChat extends React.Component {
    render() {
        const { chatId, selected, onSelect, t } = this.props;

        const shortTitle = getChatShortTitle(chatId, true, t);

        return (
            <div
                className={classNames('forward-target-chat', { 'forward-target-chat-selected': selected })}
                onClick={onSelect}>
                <div className='forward-target-chat-tile'>
                    <div className='forward-target-chat-tile-wrapper'>
                        <ChatTile chatId={chatId} />
                    </div>
                    {selected && <div className='forward-target-chat-selection' />}
                    <div
                        className={classNames(
                            'forward-target-chat-mark',
                            selected ? 'forward-target-chat-mark-selected' : 'forward-target-chat-mark-unselected'
                        )}
                    />
                    <div className='forward-target-chat-mark-icon' />
                </div>
                <div className='forward-target-chat-title'>{shortTitle}</div>
            </div>
        );
    }
}

ForwardTargetChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    selected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired
};

export default withTranslation()(ForwardTargetChat);
