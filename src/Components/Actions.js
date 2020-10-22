/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { compose } from '../Utils/HOC';
import { withSnackbar } from 'notistack';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ClearHistoryDialog from './Popup/ClearHistoryDialog';
import DeleteMessagesDialog from './Popup/DeleteMessagesDialog';
import LeaveChatDialog from './Popup/LeaveChatDialog';
import NotificationTimer from './Additional/NotificationTimer';
import { isChatMember, isCreator } from '../Utils/Chat';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../Constants';
import AppStore from '../Stores/ApplicationStore';
import ChatStore from '../Stores/ChatStore';
import SupergroupStore from '../Stores/SupergroupStore';
import UserStore from '../Stores/UserStore';
import TdLibController from '../Controllers/TdLibController';
import MessageStore from '../Stores/MessageStore';
import { clearSelection } from '../Actions/Client';

class Actions extends React.PureComponent {
    state = {
        leaveChat: null,
        clearHistory: null,
        deleteMessages: null
    }

    componentDidMount() {
        AppStore.on('clientUpdateRequestLeaveChat', this.onClientUpdateLeaveChat);
        AppStore.on('clientUpdateRequestClearHistory', this.onClientUpdateClearHistory);
        AppStore.on('clientUpdateDeleteMessages', this.onClientUpdateDeleteMessages);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateRequestLeaveChat', this.onClientUpdateLeaveChat);
        AppStore.off('clientUpdateRequestClearHistory', this.onClientUpdateClearHistory);
        AppStore.off('clientUpdateDeleteMessages', this.onClientUpdateDeleteMessages);
    }

    onClientUpdateDeleteMessages = update => {
        const { chatId, messageIds } = update;

        this.setState({
            deleteMessages: {
                chatId,
                messageIds
            }
        });
    };

    onClientUpdateLeaveChat = update => {
        const { chatId } = update;

        this.setState({ leaveChat : { chatId } });
    };

    onClientUpdateClearHistory = update => {
        const { chatId } = update;

        this.setState({ clearHistory : { chatId } });
    };

    handleClearHistoryContinue = (result, revoke) => {
        const { t } = this.props;

        const { clearHistory } = this.state;
        if (!clearHistory) return;

        this.setState({ clearHistory: null });

        if (!result) return;

        const chatId = AppStore.getChatId();
        const message = t('HistoryClearedUndo');
        const request = {
            '@type': 'deleteChatHistory',
            chat_id: chatId,
            remove_from_chat_list: false,
            revoke
        };

        this.handleScheduledAction(chatId, 'clientUpdateClearHistory', message, [request]);
    };

    handleLeaveContinue = result => {
        const { leaveChat } = this.state;
        if (!leaveChat) return;

        const { chatId } = leaveChat;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        this.setState({ leaveChat: null });

        if (!result) return;

        const message = this.getLeaveChatNotification(chatId);
        const requests = [];
        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                if (isChatMember(chatId)) {
                    requests.push({ '@type': 'leaveChat', chat_id: chatId });
                }
                requests.push({ '@type': 'deleteChatHistory', chat_id: chatId, remove_from_chat_list: true });
            }
            case 'chatTypeSupergroup': {
                if (isCreator(chatId)) {
                    requests.push({
                        '@type': 'setChatMemberStatus',
                        chat_id: chatId,
                        user_id: UserStore.getMyId(),
                        status: {
                            '@type': 'chatMemberStatusCreator',
                            is_member: false
                        }
                    });
                } else if (isChatMember(chatId)) {
                    requests.push({ '@type': 'leaveChat', chat_id: chatId });
                }
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                requests.push({ '@type': 'deleteChatHistory', chat_id: chatId, remove_from_chat_list: true });
            }
        }

        this.handleScheduledAction(chatId, 'clientUpdateLeaveChat', message, requests);
    };

    handleDeleteMessagesContinue = (result, revoke) => {
        const { deleteMessages } = this.state;
        if (!deleteMessages) return;

        const { chatId, messageIds } = deleteMessages;

        clearSelection();
        this.setState({ deleteMessages: null });

        if (!result) return;

        TdLibController.send({
            '@type': 'deleteMessages',
            chat_id: chatId,
            message_ids: messageIds,
            revoke
        });
    };

    getLeaveChatNotification = chatId => {
        const { t } = this.props;

        const chat = ChatStore.get(chatId);
        if (!chat) return t('ChatDeletedUndo');
        if (!chat.type) return t('ChatDeletedUndo');

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                return t('ChatDeletedUndo');
            }
            case 'chatTypeSupergroup': {
                const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                if (supergroup) {
                    return supergroup.is_channel ? 'Left channel' : 'Left group';
                }

                return t('ChatDeletedUndo');
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                return t('ChatDeletedUndo');
            }
        }

        return t('ChatDeletedUndo');
    };

    handleScheduledAction = (chatId, clientUpdateType, message, requests) => {
        const { t } = this.props;
        if (!clientUpdateType) return;

        const key = `${clientUpdateType} chatId=${chatId}`;
        const action = async () => {
            try {
                for (let i = 0; i < requests.length; i++) {
                    await TdLibController.send(requests[i]);
                }
            } finally {
                TdLibController.clientUpdate({ '@type': clientUpdateType, chatId, inProgress: false });
            }
        };
        const cancel = () => {
            TdLibController.clientUpdate({ '@type': clientUpdateType, chatId, inProgress: false });
        };

        const { enqueueSnackbar, closeSnackbar } = this.props;

        TdLibController.clientUpdate({ '@type': clientUpdateType, chatId, inProgress: true });
        const snackKey = enqueueSnackbar(message, {
            persist: true,
            key,
            preventDuplicate: true,
            action: [
                <IconButton
                    key='progress'
                    color='inherit'
                    className='progress-button'>
                    <NotificationTimer
                        timeout={NOTIFICATION_AUTO_HIDE_DURATION_MS}
                        onTimeout={() => {
                            action();
                            closeSnackbar(snackKey);
                        }}/>
                </IconButton>,
                <Button
                    key='undo'
                    color='primary'
                    size='small'
                    onClick={() => {
                        cancel();
                        closeSnackbar(snackKey);
                    }}>
                    {t('Undo')}
                </Button>
            ]
        });
    };

    render() {
        const { leaveChat, clearHistory, deleteMessages } = this.state;
        if (leaveChat) {
            const { chatId } = leaveChat;

            return (
                <LeaveChatDialog
                    chatId={chatId}
                    onClose={this.handleLeaveContinue} />
                );
        } else if (clearHistory) {
            const { chatId } = clearHistory;

            return (
                <ClearHistoryDialog
                    chatId={chatId}
                    onClose={this.handleClearHistoryContinue} />
                );
        } else if (deleteMessages) {
            const { chatId, messageIds } = deleteMessages;

            return (
                <DeleteMessagesDialog
                    chatId={chatId}
                    messageIds={messageIds}
                    onClose={this.handleDeleteMessagesContinue} />
                );
        }

        return null;
    }
}

const enhance = compose(
    withSnackbar,
    withTranslation()
);

export default enhance(Actions);