/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import KeyboardRow from './KeyboardRow';
import MessageContext from '../MessageContext';
import './ReplyMarkup.css';

class ReplyMarkup extends React.Component {
    state = { };

    static getDerivedStateFromProps(props, state) {
        const { prevChatId, prevMessageId } = state;
        const { chatId, messageId } = props;


        if (prevChatId !== chatId && prevMessageId !== messageId) {
            return {
                prevChatId: chatId,
                prevMessageId: messageId,
                message: {
                    chatId,
                    messageId
                }
            }
        }

        return null;
    }

    render() {
        const { markup } = this.props;
        const { message } = this.state;

        if (!markup) return null;
        if (markup['@type'] !== 'replyMarkupInlineKeyboard') return null;

        const { rows } = markup;
        if (!rows.length) return null;

        return (
            <div className='reply-markup'>
                <MessageContext.Provider value={message}>
                    {rows.map((x, i) => (<KeyboardRow key={i} row={x}/>))}
                </MessageContext.Provider>
            </div>
        );
    }
}

ReplyMarkup.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    markup: PropTypes.object
};

export default ReplyMarkup;