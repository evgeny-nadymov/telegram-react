/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import CloseIcon from '../../Assets/Icons/Close';
import IconButton from '@material-ui/core/IconButton';
import { getChatUserId } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import TdLibController from '../../Controllers/TdLibController';
import './ActionBar.css';

class ActionBar extends React.Component {
    componentDidMount() {
        ChatStore.on('updateChatActionBar', this.onUpdateChatActionBar);
    }

    componentWillUnmount() {
        ChatStore.off('updateChatActionBar', this.onUpdateChatActionBar);
    }

    onUpdateChatActionBar = update => {
        const { chatId } = this.props;
        const { chat_id } = update;

        if (chat_id !== chatId) return;

        this.forceUpdate();
    };

    handleClose = () => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        TdLibController.send({
            '@type': 'removeChatActionBar',
            chat_id: chatId
        });
    };

    handleReportSpam = () => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        TdLibController.send({
            '@type': 'reportChat',
            chat_id: chatId,
            reason: {
                '@type': 'chatReportReasonSpam'
            },
            message_ids: []
        });
    };

    handleReportUnrelatedLocation = () => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        TdLibController.send({
            '@type': 'reportChat',
            chat_id: chatId,
            reason: {
                '@type': 'chatReportReasonUnrelatedLocation'
            },
            message_ids: []
        });
    };

    handleSharePhoneNumber = () => {
        const { chatId } = this.props;
        const userId = getChatUserId(chatId);
        if (!userId) return;

        TdLibController.send({
            '@type': 'sharePhoneNumber',
            user_id: userId
        });
    };

    handleAddContact = () => {
        const { chatId } = this.props;
        const userId = getChatUserId(chatId);
        if (!userId) return;

        const user = UserStore.get(userId);
        if (!user) return;

        const { user_id, phone_number, first_name, last_name } = user;

        TdLibController.send({
            '@type': 'addContact',
            contact: {
                '@type': 'contact',
                phone_number,
                first_name,
                last_name,
                vcard: '',
                user_id
            },
            share_phone_number: false
        });
    };

    handleBlockUser = () => {
        const { chatId } = this.props;
        const userId = getChatUserId(chatId);
        if (!userId) return;

        TdLibController.send({
            '@type': 'blockUser',
            user_id: userId
        });
    };

    render() {
        const { chatId, t } = this.props;
        if (!chatId) return null;

        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { action_bar } = chat;
        if (!action_bar) return null;

        let content = null;
        switch (action_bar['@type']) {
            case 'chatActionBarSharePhoneNumber': {
                content = (
                    <Button color='primary' className='header-command-button' onClick={this.handleSharePhoneNumber}>
                        {t('ShareMyPhone')}
                    </Button>
                );
                break;
            }
            case 'chatActionBarAddContact': {
                content = (
                    <Button color='primary' className='header-command-button' onClick={this.handleAddContact}>
                        {t('AddContactChat')}
                    </Button>
                );
                break;
            }
            case 'chatActionBarReportAddBlock': {
                content = (
                    <>
                        <Button color='primary' className='header-command-button' onClick={this.handleAddContact}>
                            {t('AddContactChat')}
                        </Button>
                        <Button color='secondary' className='header-command-button' onClick={this.handleBlockUser}>
                            {t('ReportSpamUser')}
                        </Button>
                    </>
                );
                break;
            }
            case 'chatActionBarUnrelatedLocation': {
                content = (
                    <Button
                        color='secondary'
                        className='header-command-button'
                        onClick={this.handleReportUnrelatedLocation}>
                        {t('ReportSpamLocation')}
                    </Button>
                );
                break;
            }
            case 'chatActionBarReportSpam': {
                content = (
                    <Button color='secondary' className='header-command-button' onClick={this.handleReportSpam}>
                        {t('ReportSpam')}
                    </Button>
                );
                break;
            }
        }

        return (
            <div className='action-bar' onMouseDown={this.handleClick}>
                <div className='action-bar-content'>{content}</div>
                <div className='action-bar-close-button'>
                    <IconButton onClick={this.handleClose}>
                        <CloseIcon />
                    </IconButton>
                </div>
            </div>
        );
    }
}

ActionBar.propTypes = {
    chatId: PropTypes.number
};

export default withTranslation()(ActionBar);
