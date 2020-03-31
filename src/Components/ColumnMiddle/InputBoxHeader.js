/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import CloseIcon from '../../Assets/Icons/Close';
import IconButton from '@material-ui/core/IconButton';
import Reply from '../Message/Reply';
import { editMessage, replyMessage } from '../../Actions/Client';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './InputBoxHeader.css';

class InputBoxHeader extends React.Component {
    componentDidMount() {
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    componentWillUnmount() {
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
    }

    onUpdateMessageContent = update => {
        const { chatId, messageId, editMessageId } = this.props;
        const { chat_id, message_id } = update;

        if (chatId !== chat_id) return;
        if (messageId !== message_id && editMessageId !== message_id) return;

        this.forceUpdate();
    };

    handleClose = () => {
        const { chatId, editMessageId } = this.props;

        if (editMessageId) {
            editMessage(chatId, 0);
        } else {
            replyMessage(chatId, 0);
        }
    };

    render() {
        const { chatId, messageId, editMessageId, t, onClick } = this.props;
        if (!chatId) return null;
        if (!messageId && !editMessageId) return null;

        return (
            <div className='inputbox-header'>
                <div className='inputbox-header-left-column'>
                    <IconButton className='inputbox-icon-button' aria-label='Close' onClick={this.handleClose}>
                        <CloseIcon />
                    </IconButton>
                </div>
                <div className='inputbox-header-middle-column'>
                    <Reply
                        chatId={chatId}
                        messageId={editMessageId || messageId}
                        title={editMessageId ? t('EditMessage') : null}
                        onClick={onClick}
                    />
                </div>
                <div className='inputbox-header-right-column' />
            </div>
        );
    }
}

InputBoxHeader.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    editMessageId: PropTypes.number,
    onClick: PropTypes.func
};

export default withTranslation()(InputBoxHeader);
