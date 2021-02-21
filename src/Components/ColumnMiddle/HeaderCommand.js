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
import { clearSelection, deleteMessages, forwardMessages } from '../../Actions/Client';
import MessageStore from '../../Stores/MessageStore';
import './HeaderCommand.css';
import AnimatedCounter from './AnimatedCounter';
import { canBeReported } from '../../Utils/Chat';
import { openReportChat } from '../../Actions/Chat';

class HeaderCommand extends React.Component {
    handleCancel = () => {
        clearSelection();
    };

    handleDelete = () => {
        let id = 0;
        let messageIds = [];
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            id = chatId;
            messageIds.push(messageId);
        }

        clearSelection();
        deleteMessages(id, messageIds);
    };

    handleForward = () => {
        let id;
        const messageIds = [];
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            id = chatId;
            messageIds.push(messageId);
        }

        clearSelection();
        forwardMessages(id, messageIds);
    };

    handleReport = () => {
        let id;
        const messageIds = [];
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            id = chatId;
            messageIds.push(messageId);
        }

        clearSelection();
        openReportChat(id, messageIds);
    };

    render() {
        const { t, count } = this.props;

        let canBeDeleted = true;
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            const message = MessageStore.get(chatId, messageId);
            if (!message) {
                canBeDeleted = false;
                break;
            }
            if (!message.can_be_deleted_only_for_self && !message.can_be_deleted_for_all_users) {
                canBeDeleted = false;
                break;
            }
        }

        let canBeForwarded = true;
        for (let { chatId, messageId } of MessageStore.selectedItems.values()) {
            const message = MessageStore.get(chatId, messageId);
            if (!message) {
                canBeForwarded = false;
                break;
            }
            if (!message.can_be_forwarded) {
                canBeForwarded = false;
                break;
            }
        }

        const items = Array.from(MessageStore.selectedItems.values());
        const canReport = canBeReported(items.length > 0 ? items[0].chatId : 0);

        return (
            <div className='header-command'>
                {canBeForwarded && (
                    <Button color='primary' className='header-command-button' onClick={this.handleForward}>
                        {t('Forward')}
                        <span>&nbsp;</span>
                        <AnimatedCounter counter={count}/>
                    </Button>
                )}
                {canBeDeleted && (
                    <Button color='primary' className='header-command-button' onClick={this.handleDelete}>
                        {t('Delete')}
                        <span>&nbsp;</span>
                        <AnimatedCounter counter={count}/>
                    </Button>
                )}
                {canReport && (
                    <Button color='primary' className='header-command-button' onClick={this.handleReport}>
                        {t('ReportChat')}
                        <span>&nbsp;</span>
                        <AnimatedCounter counter={count}/>
                    </Button>
                )}
                <div className='header-command-space' />
                <Button color='primary' className='header-command-button' onClick={this.handleCancel}>
                    {t('Cancel')}
                </Button>
            </div>
        );
    }
}

HeaderCommand.propTypes = {
    count: PropTypes.number
};

export default withTranslation()(HeaderCommand);
