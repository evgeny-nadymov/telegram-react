/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { compose } from '../../Utils/HOC';
import { withTranslation } from 'react-i18next';
import { withSnackbar } from 'notistack';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import DeleteIcon from '../../Assets/Icons/Delete';
import MoreVertIcon from '../../Assets/Icons/More';
import UnpinIcon from '../../Assets/Icons/Pin2';
import ChatTile from '../Tile/ChatTile';
import NotificationTimer from '../Additional/NotificationTimer';
import { canClearHistory, canDeleteChat, canUnpinMessage, getChatShortTitle, getViewInfoTitle, isCreator, isPrivateChat, isSupergroup } from '../../Utils/Chat';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../Constants';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import TdLibController from '../../Controllers/TdLibController';
import './MainMenuButton.css';
import LogOutIcon from '../../Assets/Icons/LogOut';
import UserIcon from '../../Assets/Icons/User';
import GroupIcon from '../../Assets/Icons/Group';

class LeaveChatDialog extends React.Component {
    getDeleteDialogText = (chatId, t) => {
        const chat = ChatStore.get(chatId);
        if (!chat) return null;
        if (!chat.type) return null;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                return `Are you sure you want to leave group ${chat.title}?`;
            }
            case 'chatTypeSupergroup': {
                const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                if (supergroup) {
                    return supergroup.is_channel
                        ? `Are you sure you want to leave channel ${chat.title}?`
                        : `Are you sure you want to leave group ${chat.title}?`;
                }

                return null;
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                return `Are you sure you want to delete chat with ${getChatShortTitle(chatId, false, t)}?`;
            }
        }

        return null;
    };

    render() {
        const { onClose, chatId, t, open } = this.props;

        return (
            <Dialog
                transitionDuration={0}
                onClose={() => onClose(false)}
                aria-labelledby='delete-dialog-title'
                open={open}>
                <DialogTitle id='delete-dialog-title'>{getChatShortTitle(chatId, false, t)}</DialogTitle>
                <DialogContent>
                    <div className='delete-dialog-content'>
                        <ChatTile chatId={chatId} />
                        <DialogContentText id='delete-dialog-description'>
                            {this.getDeleteDialogText(chatId, t)}
                        </DialogContentText>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose(false)} color='primary'>
                        Cancel
                    </Button>
                    <Button onClick={() => onClose(true)} color='primary' autoFocus>
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

const EnhancedLeaveChatDialog = withTranslation()(LeaveChatDialog);

class ClearHistoryDialog extends React.Component {
    render() {
        const { onClose, chatId, t, open } = this.props;

        return (
            <Dialog
                transitionDuration={0}
                onClose={() => onClose(false)}
                aria-labelledby='delete-dialog-title'
                open={open}>
                <DialogTitle id='delete-dialog-title'>{getChatShortTitle(chatId, false, t)}</DialogTitle>
                <DialogContent>
                    <div className='delete-dialog-content'>
                        <ChatTile chatId={chatId} />
                        <DialogContentText id='delete-dialog-description'>
                            Are you sure you want clear history?
                        </DialogContentText>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onClose(false)} color='primary'>
                        Cancel
                    </Button>
                    <Button onClick={() => onClose(true)} color='primary' autoFocus>
                        Ok
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

const EnhancedClearHistoryDialog = withTranslation()(ClearHistoryDialog);

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null,
            openDelete: false,
            openClearHistory: false
        };
    }

    handleButtonClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleChatInfo = () => {
        this.handleMenuClose();
        setTimeout(() => this.props.openChatDetails(), 150);
    };

    handleClearHistory = () => {
        this.handleMenuClose();

        this.setState({ openClearHistory: true });
    };

    handleClearHistoryContinue = result => {
        const { t } = this.props;

        this.setState({ openClearHistory: false });

        if (!result) return;

        const chatId = AppStore.getChatId();
        const message = t('HistoryClearedUndo');
        const request = {
            '@type': 'deleteChatHistory',
            chat_id: chatId,
            remove_from_chat_list: false
        };

        this.handleScheduledAction(chatId, 'clientUpdateClearHistory', message, request);
    };

    handleLeave = () => {
        this.handleMenuClose();

        this.setState({ openDelete: true });
    };

    handleLeaveContinue = result => {
        this.setState({ openDelete: false });

        if (!result) return;

        const chatId = AppStore.getChatId();
        const message = this.getLeaveChatNotification(chatId);
        let request = isPrivateChat(chatId)
            ? { '@type': 'deleteChatHistory', chat_id: chatId, remove_from_chat_list: true }
            : { '@type': 'leaveChat', chat_id: chatId };

        if (isSupergroup(chatId) && isCreator(chatId)) {
            request = {
                '@type': 'setChatMemberStatus',
                chat_id: chatId,
                user_id: UserStore.getMyId(),
                status: {
                    '@type': 'chatMemberStatusCreator',
                    is_member: false
                }
            };
        }

        this.handleScheduledAction(chatId, 'clientUpdateLeaveChat', message, request);
    };

    handleScheduledAction = (chatId, clientUpdateType, message, request) => {
        const { t } = this.props;
        if (!clientUpdateType) return;

        const key = `${clientUpdateType} chatId=${chatId}`;
        const action = async () => {
            try {
                await TdLibController.send(request);
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

    getLeaveChatTitle = (chatId, t) => {
        const chat = ChatStore.get(chatId);
        if (!chat) return null;
        if (!chat.type) return null;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                return t('DeleteChat');
            }
            case 'chatTypeSupergroup': {
                const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                if (supergroup) {
                    return supergroup.is_channel ? t('LeaveChannel') : t('LeaveMegaMenu');
                }

                return null;
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                return t('DeleteChatUser');
            }
        }

        return null;
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

    handleUnpin = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();
        TdLibController.clientUpdate({
            '@type': 'clientUpdateUnpin',
            chatId
        });
    };

    render() {
        const { t } = this.props;
        const { anchorEl, openDelete, openClearHistory } = this.state;

        const chatId = AppStore.getChatId();
        const clearHistory = canClearHistory(chatId);
        const deleteChat = canDeleteChat(chatId);
        const leaveChatTitle = this.getLeaveChatTitle(chatId, t);
        const unpinMessage = canUnpinMessage(chatId);

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className='main-menu-button'
                    aria-label='Menu'
                    onClick={this.handleButtonClick}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}>
                    <MenuItem onClick={this.handleChatInfo}>
                        <ListItemIcon>
                            {isPrivateChat(chatId) ? <UserIcon /> : <GroupIcon />}
                        </ListItemIcon>
                        <ListItemText primary={getViewInfoTitle(chatId, t)} />
                    </MenuItem>
                    {clearHistory && (
                        <MenuItem onClick={this.handleClearHistory}>
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('ClearHistory')} />
                        </MenuItem>
                    )}
                    {deleteChat && leaveChatTitle && (
                        <MenuItem onClick={this.handleLeave}>
                            <ListItemIcon>
                                <LogOutIcon />
                            </ListItemIcon>
                            <ListItemText primary={leaveChatTitle} />
                        </MenuItem>
                    )}
                    {unpinMessage && (
                        <MenuItem onClick={this.handleUnpin}>
                            <ListItemIcon>
                                <UnpinIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('UnpinMessageAlertTitle')} />
                        </MenuItem>
                    )}
                </Menu>
                <EnhancedLeaveChatDialog chatId={chatId} open={openDelete} onClose={this.handleLeaveContinue} />
                <EnhancedClearHistoryDialog
                    chatId={chatId}
                    open={openClearHistory}
                    onClose={this.handleClearHistoryContinue}
                />
            </>
        );
    }
}

const enhance = compose(
    withSnackbar,
    withTranslation()
);

export default enhance(MainMenuButton);
