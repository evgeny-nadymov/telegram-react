/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import CheckDecagramIcon from '../../Assets/Icons/Verified';
import { getChatTitle, isChatVerified } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import './DialogTitle.css';

class DialogTitle extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, t } = this.props;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.t !== t) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ChatStore.on('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
    }

    componentWillUnmount() {
        ChatStore.off('clientUpdateFastUpdatingComplete', this.onFastUpdatingComplete);
        ChatStore.off('updateChatTitle', this.onUpdateChatTitle);
    }

    onFastUpdatingComplete = update => {
        this.forceUpdate();
    };

    onUpdateChatTitle = update => {
        const { chatId } = this.props;

        if (update.chat_id !== chatId) return;

        this.forceUpdate();
    };

    render() {
        const { t, chatId, showSavedMessages } = this.props;

        const isVerified = isChatVerified(chatId);
        const title = getChatTitle(chatId, showSavedMessages, t);

        return (
            <div className='dialog-title'>
                <span className='dialog-title-span'>{title}</span>
                {isVerified && <CheckDecagramIcon className='dialog-title-icon' />}
            </div>
        );
    }
}

DialogTitle.propTypes = {
    chatId: PropTypes.number.isRequired,
    showSavedMessages: PropTypes.bool
};

DialogTitle.defaultProps = {
    showSavedMessages: true
};

export default withTranslation()(DialogTitle);
