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
import AlertDialog from './Popup/AlertDialog';
import BlockSenderDialog from './Popup/BlockSenderDialog';
import ClearHistoryDialog from './Popup/ClearHistoryDialog';
import DeleteMessagesDialog from './Popup/DeleteMessagesDialog';
import InputPasswordDialog from './Popup/InputPasswordDialog';
import LeaveChatDialog from './Popup/LeaveChatDialog';
import LeaveVoiceChatDialog from './Popup/LeaveVoiceChatDialog';
import NotificationTimer from './Additional/NotificationTimer';
import OpenGameDialog from './Popup/OpenGameDialog';
import OpenUrlDialog from './Popup/OpenUrlDialog';
import PinMessageDialog from './Popup/PinMessageDialog';
import ReportChatDialog from './Popup/ReportChatDialog';
import RequestUrlDialog from './Popup/RequestUrlDialog';
import UnpinMessageDialog from './Popup/UnpinMessageDialog';
import { blockSender, pinMessage as pinMessageAction, unpinAllMessages, unpinMessage as unpinMessageAction } from '../Actions/Message';
import { canDeleteChat, canPinMessages, getChatLocation, isChatMember, isCreator, isMeChat } from '../Utils/Chat';
import { clearSelection, closePinned, showSnackbar } from '../Actions/Client';
import { openGameInBrowser } from '../Utils/Game';
import { reportChat } from '../Actions/Chat';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../Constants';
import AppStore from '../Stores/ApplicationStore';
import ChatStore from '../Stores/ChatStore';
import SupergroupStore from '../Stores/SupergroupStore';
import UserStore from '../Stores/UserStore';
import TdLibController from '../Controllers/TdLibController';
import CloseIcon from '../Assets/Icons/Close';

class Actions extends React.PureComponent {
    state = {
        leaveChat: null,
        clearHistory: null,
        deleteMessages: null,
        pinMessage: null,
        unpinMessage: null,
        alert: null,
        openUrlAlert: null,
        openGameAlert: null,
        requestUrlAlert: null,
        inputPasswordAlert: null,
        requestBlockSenderAlert: null,
        leaveVoiceChatAlert: null,
        reportChatAlert: null
    }

    componentDidMount() {
        AppStore.on('clientUpdateRequestBlockSender', this.onClientUpdateBlockSender);
        AppStore.on('clientUpdateRequestLeaveChat', this.onClientUpdateLeaveChat);
        AppStore.on('clientUpdateRequestClearHistory', this.onClientUpdateClearHistory);
        AppStore.on('clientUpdateDeleteMessages', this.onClientUpdateDeleteMessages);
        AppStore.on('clientUpdatePinMessage', this.onClientUpdatePinMessage);
        AppStore.on('clientUpdateUnpinMessage', this.onClientUpdateUnpinMessage);
        AppStore.on('clientUpdateAlert', this.onClientUpdateAlert);
        AppStore.on('clientUpdateInputPasswordAlert', this.onClientUpdateInputPasswordAlert);
        AppStore.on('clientUpdateLeaveVoiceChatAlert', this.onClientUpdateLeaveVoiceChatAlert);
        AppStore.on('clientUpdateSnackbar', this.onClientUpdateSnackbar);
        AppStore.on('clientUpdateOpenUrlAlert', this.onClientUpdateOpenUrlAlert);
        AppStore.on('clientUpdateOpenGameAlert', this.onClientUpdateOpenGameAlert);
        AppStore.on('clientUpdateRequestUrlAlert', this.onClientUpdateRequestUrlAlert);
        AppStore.on('clientUpdateReportChat', this.onClientUpdateReportChat);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateRequestBlockSender', this.onClientUpdateBlockSender);
        AppStore.off('clientUpdateRequestLeaveChat', this.onClientUpdateLeaveChat);
        AppStore.off('clientUpdateRequestClearHistory', this.onClientUpdateClearHistory);
        AppStore.off('clientUpdateDeleteMessages', this.onClientUpdateDeleteMessages);
        AppStore.off('clientUpdatePinMessage', this.onClientUpdatePinMessage);
        AppStore.off('clientUpdateUnpinMessage', this.onClientUpdateUnpinMessage);
        AppStore.off('clientUpdateAlert', this.onClientUpdateAlert);
        AppStore.off('clientUpdateInputPasswordAlert', this.onClientUpdateInputPasswordAlert);
        AppStore.off('clientUpdateLeaveVoiceChatAlert', this.onClientUpdateLeaveVoiceChatAlert);
        AppStore.off('clientUpdateSnackbar', this.onClientUpdateSnackbar);
        AppStore.off('clientUpdateOpenUrlAlert', this.onClientUpdateOpenUrlAlert);
        AppStore.off('clientUpdateOpenGameAlert', this.onClientUpdateOpenGameAlert);
        AppStore.off('clientUpdateRequestUrlAlert', this.onClientUpdateRequestUrlAlert);
        AppStore.off('clientUpdateReportChat', this.onClientUpdateReportChat);
    }

    onClientUpdateReportChat = update => {
        const { chatId, messageIds } = update;

        this.setState({ reportChatAlert: { chatId, messageIds }});
    };

    onClientUpdateBlockSender = update => {
        const { sender_id } = update;

        this.setState({ requestBlockSenderAlert: { sender: sender_id }});
    }

    onClientUpdateInputPasswordAlert = update => {
        const { state, onPassword } = update;

        this.setState({ inputPasswordAlert: { state, onPassword } });
    }

    onClientUpdateLeaveVoiceChatAlert = update => {
        const { params } = update;

        this.setState({ leaveVoiceChatAlert: { params }});
    }

    onClientUpdateOpenGameAlert = update => {
        const { game, params } = update;

        if (params && params.isVerified) {
            this.openGameAlert = { game, params };
            this.handleOpenGameContinue(null, true);
        } else {
            this.setState({ openGameAlert: { game, params } });
        }
    }

    onClientUpdateOpenUrlAlert = update => {
        const { url, params } = update;

        if (params && !params.ask) {
            this.openUrlAlert = { url, params };
            this.handleOpenUrlContinue(null, true);
        } else {
            this.setState({ openUrlAlert: { url, params } });
        }
    };

    onClientUpdateRequestUrlAlert = update => {
        const { url, params } = update;

        this.setState({ requestUrlAlert: { url, params } });
    }

    onClientUpdateSnackbar = update => {
        const { enqueueSnackbar, closeSnackbar } = this.props;
        const { message, action } = update;

        enqueueSnackbar(message, {
            autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
            preventDuplicate: true,
            action: action(closeSnackbar)
        });
    };

    onClientUpdateAlert = update => {
        const { params } = update;

        this.setState({ alert: { params } });
    };

    onClientUpdateUnpinMessage = update => {
        const { chatId, messageId } = update;

        if (isMeChat(chatId)) {
            this.unpinMessage = {
                chatId,
                messageId
            };
            this.handleUnpinMessageContinue(true, false);
        } else {
            this.setState({
                unpinMessage: {
                    chatId,
                    messageId
                }
            });
        }
    };

    onClientUpdatePinMessage = update => {
        const { chatId, messageId } = update;

        if (isMeChat(chatId)) {
            this.pinMessage = {
                chatId,
                messageId
            };
            this.handlePinMessageContinue(true, false);
        } else {
            this.setState({
                pinMessage: {
                    chatId,
                    messageId
                }
            });
        }
    };

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

    handleLeaveContinue = async (result, undo = true) => {
        const { leaveChat } = this.state || this;
        if (!leaveChat) return;

        const { chatId } = leaveChat;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        this.leaveChat = null;
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

        if (undo) {
            this.handleScheduledAction(chatId, 'clientUpdateLeaveChat', message, requests);
        } else {
            try {
                for (let i = 0; i < requests.length; i++) {
                    await TdLibController.send(requests[i]);
                }
            } finally {

            }
        }
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
        const { t, enqueueSnackbar, closeSnackbar } = this.props;
        if (!clientUpdateType) return;

        const key = `${clientUpdateType} chatId=${chatId}`;
        const action = async () => {
            try {
                for (let i = 0; i < requests.length; i++) {
                    await TdLibController.send(requests[i]);
                }
            } finally {
                closeSnackbar(snackKey);
                TdLibController.clientUpdate({ '@type': clientUpdateType, chatId, inProgress: false });
            }
        };
        const cancel = () => {
            closeSnackbar(snackKey);
            TdLibController.clientUpdate({ '@type': clientUpdateType, chatId, inProgress: false });
        };

        AppStore.addScheduledAction(key, Number.MAX_VALUE, action, cancel);

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
                            AppStore.removeScheduledAction(key);
                        }}/>
                </IconButton>,
                <Button
                    key='undo'
                    color='primary'
                    size='small'
                    onClick={() => {
                        cancel();
                        AppStore.removeScheduledAction(key);
                    }}>
                    {t('Undo')}
                </Button>
            ]
        });
    };

    handlePinMessageContinue = (result, revoke) => {
        let { pinMessage } = this.state;
        pinMessage = pinMessage || this.pinMessage;
        if (!pinMessage) return;

        const { chatId, messageId } = pinMessage;

        clearSelection();
        this.setState({ pinMessage: null });
        this.pinMessage = null;

        if (!result) return;

        pinMessageAction(chatId, messageId, false, !revoke);
    };

    handleUnpinMessageContinue = async result => {
        let { unpinMessage } = this.state;
        unpinMessage = unpinMessage || this.unpinMessage;
        if (!unpinMessage) return;

        const { chatId, messageId } = unpinMessage;

        clearSelection();
        this.setState({ unpinMessage: null });
        this.unpinMessage = null;

        if (!result) return;

        if (canPinMessages(chatId)) {
            if (messageId) {
                await unpinMessageAction(chatId, messageId);
            } else {
                closePinned();

                await unpinAllMessages(chatId);
            }
        } else {
            closePinned();

            const data = ChatStore.getClientData(chatId);
            await TdLibController.clientUpdate({
                '@type': 'clientUpdateSetChatClientData',
                chatId,
                clientData: { ...data, ...{ unpinned: true } }
            });
        }
    };

    handleAlertContinue = result => {
        const { alert } = this.state;
        if (!alert) return;

        const { params } = alert;
        this.setState({ alert: null });

        const { onResult } = params;
        onResult && onResult(result);
    };

    handleOpenUrlContinue = (event, result) => {
        const openUrlAlert = this.state.openUrlAlert || this.openUrlAlert;

        this.setState({ openUrlAlert: null });
        this.openUrlAlert = null;

        if (!result) return;

        const { url, onClick } = openUrlAlert;
        if (!url) return;

        if (onClick) {
            onClick(event);
        } else {
            event && event.preventDefault();

            const newWindow = window.open();
            newWindow.opener = null;
            newWindow.location = url;
        }
    };

    handleOpenGameContinue = (event, result) => {
        const openGameAlert = this.state.openGameAlert || this.openGameAlert;

        this.setState({ openGameAlert: null });
        this.openGameAlert = null;

        if (!result) return;

        const { game, params } = openGameAlert;
        if (!game) return;
        if (!params) return;

        const { url, message } = params;
        if (!url) return;
        if (!message) return;

        openGameInBrowser(url, message);
    };

    handleRequestUrlContinue = async (event, open, values) => {
        const { requestUrlAlert } = this.state;
        this.setState({ requestUrlAlert: null });

        if (!open) return;

        const { params } = requestUrlAlert;
        if (!params) return;

        const { result, chatId, messageId, buttonId } = params;
        if (!result) return;

        if (!values.value1) {
            this.openUrlAlert = { url: result.url };
            this.handleOpenUrlContinue(event, open);
        } else {
            const httpUrl = await TdLibController.send({
                '@type': 'getLoginUrl',
                chat_id: chatId,
                message_id: messageId,
                button_id: buttonId,
                allow_write_access: result.request_write_access && values.value2
            });

            this.openUrlAlert = { url: httpUrl.url };
            this.handleOpenUrlContinue(event, open);
        }
    };

    handleInputPasswordContinue = (result, password) => {
        const { inputPasswordAlert } = this.state;
        const onCloseDialog = () => this.setState({ inputPasswordAlert: null });
        const onError = error => this.setState({ inputPasswordAlert: { ...inputPasswordAlert, error } })

        if (!result) {
            onCloseDialog();
            return;
        }

        const { onPassword } = inputPasswordAlert;
        onPassword && onPassword(password, onCloseDialog, onError);
    };

    handleBlockSenderContinue = async (result, params) => {
        const { requestBlockSenderAlert } = this.state;

        this.setState({ requestBlockSenderAlert: null });

        if (!result) {
            return;
        }

        const { sender } = requestBlockSenderAlert;
        if (!sender) return;

        let chatId = null;
        switch (sender['@type']) {
            case 'messageSenderUser': {
                blockSender(sender);
                chatId = await TdLibController.send({ '@type': 'createPrivateChat', user_id: sender.user_id });
                break;
            }
            case 'messageSenderChat': {
                chatId = sender.chat_id;
                break;
            }
        }

        if (!params || params.reportSpam) {
            const reason = getChatLocation(chatId)
                ? { '@type': 'chatReportReasonUnrelatedLocation' }
                : { '@type': 'chatReportReasonSpam' };

            reportChat(chatId, reason);
        }

        if (!params || params.deleteChat) {
            const deleteChat = canDeleteChat(chatId);
            if (!deleteChat) return;

            this.leaveChat = { chatId };
            this.handleLeaveContinue(true, false);
        }
    };

    handleLeaveVoiceChatContinue = (result, resultParams) => {
        const { leaveVoiceChatAlert } = this.state;

        this.setState({ leaveVoiceChatAlert: null });

        const { params } = leaveVoiceChatAlert;
        if (!params) return;

        const { onResult } = params;

        onResult && onResult(resultParams);
    };

    handleReportChatContinue = (result, params) => {
        const { t } = this.props;
        const { reportChatAlert } = this.state;

        this.setState({ reportChatAlert: null });
        if (!result) return;

        const { chatId, messageIds } = reportChatAlert;

        showSnackbar(t('ReportChatSent'), closeSnackbar => snackKey => {
            return (
                <IconButton
                    key='close'
                    aria-label='Close'
                    color='inherit'
                    className='notification-close-button'
                    onClick={() => { closeSnackbar(snackKey); }}>
                    <CloseIcon />
                </IconButton>
            )
        });
    };

    render() {
        const {
            leaveChat,
            clearHistory,
            deleteMessages,
            pinMessage,
            unpinMessage,
            alert,
            openUrlAlert,
            openGameAlert,
            requestUrlAlert,
            inputPasswordAlert,
            requestBlockSenderAlert,
            leaveVoiceChatAlert,
            reportChatAlert
        } = this.state;
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
        } else if (pinMessage) {
            const { chatId, messageId } = pinMessage;

            return (
                <PinMessageDialog
                    chatId={chatId}
                    messageId={messageId}
                    onClose={this.handlePinMessageContinue} />
            );
        } else if (unpinMessage) {
            const { chatId, messageId } = unpinMessage;

            return (
                <UnpinMessageDialog
                    chatId={chatId}
                    messageId={messageId}
                    onClose={this.handleUnpinMessageContinue} />
            );
        } else if (alert) {
            const { params } = alert;

            return (
                <AlertDialog
                    params={params}
                    onClose={this.handleAlertContinue} />
            );
        } else if (openUrlAlert) {
            const { url, params } = openUrlAlert;

            return (
                <OpenUrlDialog
                    url={url}
                    params={params}
                    onClose={this.handleOpenUrlContinue}/>
            );
        } else if (openGameAlert) {
            const { game, params } = openGameAlert;

            return (
                <OpenGameDialog
                    game={game}
                    params={params}
                    onClose={this.handleOpenGameContinue}/>
            );
        } else if (requestUrlAlert) {
            const { url, params } = requestUrlAlert;

            return (
                <RequestUrlDialog
                    url={url}
                    params={params}
                    onClose={this.handleRequestUrlContinue}/>
            );
        } else if (inputPasswordAlert) {
            const { state, error } = inputPasswordAlert;

            return (
                <InputPasswordDialog
                    state={state}
                    error={error}
                    onClose={this.handleInputPasswordContinue}/>
            );
        } else if (requestBlockSenderAlert) {
            const { sender } = requestBlockSenderAlert;

            return (
                <BlockSenderDialog
                    sender={sender}
                    onClose={this.handleBlockSenderContinue}/>
            );
        } else if (leaveVoiceChatAlert) {
            const { params } = leaveVoiceChatAlert;

            return (
                <LeaveVoiceChatDialog
                    params={params}
                    onClose={this.handleLeaveVoiceChatContinue}/>
            );
        } else if (reportChatAlert) {
            const { chatId, messageIds } = reportChatAlert;

            return (
                <ReportChatDialog
                    chatId={chatId}
                    messageIds={messageIds}
                    onClose={this.handleReportChatContinue}/>
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