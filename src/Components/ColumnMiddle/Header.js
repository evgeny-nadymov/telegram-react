/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import SearchIcon from '@material-ui/icons/Search';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import { compose } from 'recompose';
import MainMenuButton from './MainMenuButton';
import HeaderCommand from './HeaderCommand';
import HeaderProgress from './HeaderProgress';
import {
    getChatShortTitle,
    getChatSubtitle,
    getChatTitle,
    isAccentChatSubtitle,
    isPrivateChat
} from '../../Utils/Chat';
import { clearSelection, searchChat } from '../../Actions/Client';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import MessageStore from '../../Stores/MessageStore';
import AppStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './Header.css';

const styles = theme => ({
    button: {
        margin: '14px'
    },
    menuIconButton: {
        margin: '8px -2px 8px 12px'
    },
    searchIconButton: {
        margin: '8px 12px 8px 0'
    },
    messageSearchIconButton: {
        margin: '8px 0 8px 12px'
    },
    moreIconButton: {
        margin: '8px 12px 8px 0'
    },
    headerStatusTitle: {
        color: theme.palette.text.secondary
    },
    headerStatusAccentTitle: {
        color: theme.palette.primary.dark + '!important'
    }
});

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = {
            authorizationState: AppStore.getAuthorizationState(),
            connectionState: AppStore.getConnectionState(),
            openDeleteDialog: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState !== this.state) {
            return true;
        }

        if (nextProps.theme !== this.props.theme) {
            return true;
        }

        if (nextProps.t !== this.props.t) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        AppStore.on('clientUpdateDeleteMessages', this.onClientUpdateDeleteMessages);
        AppStore.on('updateConnectionState', this.onUpdateConnectionState);
        AppStore.on('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);

        MessageStore.on('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.on('clientUpdateClearSelection', this.onClientUpdateMessageSelected);

        ChatStore.on('updateChatOnlineMemberCount', this.onUpdateChatOnlineMemberCount);
        ChatStore.on('updateChatTitle', this.onUpdateChatTitle);
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.on('updateUserChatAction', this.onUpdateUserChatAction);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
    }

    componentWillUnmount() {
        AppStore.off('clientUpdateDeleteMessages', this.onClientUpdateDeleteMessages);
        AppStore.off('updateConnectionState', this.onUpdateConnectionState);
        AppStore.off('updateAuthorizationState', this.onUpdateAuthorizationState);
        AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);

        MessageStore.off('clientUpdateMessageSelected', this.onClientUpdateMessageSelected);
        MessageStore.off('clientUpdateClearSelection', this.onClientUpdateMessageSelected);

        ChatStore.off('updateChatOnlineMemberCount', this.onUpdateChatOnlineMemberCount);
        ChatStore.off('updateChatTitle', this.onUpdateChatTitle);
        UserStore.off('updateUserStatus', this.onUpdateUserStatus);
        ChatStore.off('updateUserChatAction', this.onUpdateUserChatAction);
        UserStore.off('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.off('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.off('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        BasicGroupStore.off('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.off('updateSupergroup', this.onUpdateSupergroup);
    }

    onClientUpdateDeleteMessages = update => {
        const { chatId, messageIds } = update;

        let canBeDeletedForAllUsers = true;
        for (let messageId of messageIds) {
            const message = MessageStore.get(chatId, messageId);
            if (!message) {
                canBeDeletedForAllUsers = false;
                break;
            }
            if (!message.can_be_deleted_for_all_users) {
                canBeDeletedForAllUsers = false;
                break;
            }
        }

        this.setState({
            openDeleteDialog: true,
            chatId,
            messageIds,
            canBeDeletedForAllUsers: canBeDeletedForAllUsers,
            revoke: canBeDeletedForAllUsers
        });
    };

    handleRevokeChange = () => {
        this.setState({ revoke: !this.state.revoke });
    };

    handleCloseDelete = () => {
        this.setState({ openDeleteDialog: false });
    };

    handleDeleteContinue = () => {
        const { revoke, chatId, messageIds } = this.state;

        clearSelection();
        this.handleCloseDelete();

        TdLibController.send({
            '@type': 'deleteMessages',
            chat_id: chatId,
            message_ids: messageIds,
            revoke: revoke
        });
    };

    onUpdateChatOnlineMemberCount = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;
        if (chat.id !== update.chat_id) return;

        this.forceUpdate();
    };

    onClientUpdateMessageSelected = update => {
        this.setState({ selectionCount: MessageStore.selectedItems.size });
    };

    onClientUpdateChatId = update => {
        this.forceUpdate();
    };

    onUpdateConnectionState = update => {
        this.setState({ connectionState: update.state });
    };

    onUpdateAuthorizationState = update => {
        this.setState({ authorizationState: update.authorization_state });
    };

    onUpdateChatTitle = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;
        if (chat.id !== update.chat_id) return;

        this.forceUpdate();
    };

    onUpdateUserStatus = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;
        if (!chat.type) return;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
                if (fullInfo && fullInfo.members) {
                    const member = fullInfo.members.find(x => x.user_id === update.user_id);
                    if (member) {
                        this.forceUpdate();
                    }
                }
                break;
            }
            case 'chatTypePrivate': {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate();
                }
                break;
            }
            case 'chatTypeSecret': {
                if (chat.type.user_id === update.user_id) {
                    this.forceUpdate();
                }
                break;
            }
            case 'chatTypeSupergroup': {
                break;
            }
        }
    };

    onUpdateUserChatAction = update => {
        const currentChatId = AppStore.getChatId();

        if (currentChatId === update.chat_id) {
            this.forceUpdate();
        }
    };

    onUpdateBasicGroup = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group.id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateSupergroup = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup.id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateBasicGroupFullInfo = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeBasicGroup' &&
            chat.type.basic_group_id === update.basic_group_id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateSupergroupFullInfo = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            chat.type['@type'] === 'chatTypeSupergroup' &&
            chat.type.supergroup_id === update.supergroup_id
        ) {
            this.forceUpdate();
        }
    };

    onUpdateUserFullInfo = update => {
        const chat = ChatStore.get(AppStore.getChatId());
        if (!chat) return;

        if (
            chat.type &&
            (chat.type['@type'] === 'chatTypePrivate' || chat.type['@type'] === 'chatTypeSecret') &&
            chat.type.user_id === update.user_id
        ) {
            this.forceUpdate();
        }
    };

    openChatDetails = () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        AppStore.changeChatDetailsVisibility(true);
    };

    handleSearchChat = () => {
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        searchChat(chatId);
    };

    localize = str => {
        const { t } = this.props;

        return t(str)
            .replace('...', '')
            .replace('…', '');
    };

    render() {
        const { classes, t } = this.props;
        const {
            authorizationState,
            connectionState,
            selectionCount,
            openDeleteDialog,
            canBeDeletedForAllUsers,
            revoke,
            messageIds
        } = this.state;

        const count = messageIds ? messageIds.length : 0;

        let control = null;
        if (selectionCount) {
            control = <HeaderCommand count={selectionCount} />;
        }

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);

        const isAccentSubtitle = isAccentChatSubtitle(chatId);
        let title = getChatTitle(chatId, true, t);
        let subtitle = getChatSubtitle(chatId, true);
        let showProgressAnimation = false;

        if (connectionState) {
            switch (connectionState['@type']) {
                case 'connectionStateConnecting':
                    title = this.localize('Connecting');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'connectionStateConnectingToProxy':
                    title = this.localize('Connecting to proxy');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'connectionStateReady':
                    break;
                case 'connectionStateUpdating':
                    title = this.localize('Updating');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'connectionStateWaitingForNetwork':
                    title = this.localize('Waiting for network');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
            }
        } else if (authorizationState) {
            switch (authorizationState['@type']) {
                case 'authorizationStateClosed':
                    break;
                case ' authorizationStateClosing':
                    break;
                case 'authorizationStateLoggingOut':
                    title = this.localize('Logging out');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'authorizationStateReady':
                    break;
                case 'authorizationStateWaitCode':
                    break;
                case 'authorizationStateWaitEncryptionKey':
                    title = this.localize('Loading');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
                case 'authorizationStateWaitPassword':
                    break;
                case 'authorizationStateWaitPhoneNumber':
                    break;
                case 'authorizationStateWaitTdlibParameters':
                    title = this.localize('Loading');
                    subtitle = '';
                    showProgressAnimation = true;
                    break;
            }
        } else {
            title = this.localize('Loading');
            subtitle = '';
            showProgressAnimation = true;
        }

        control = control || (
            <div className='header-details'>
                <div
                    className={classNames('header-status', 'grow', chat ? 'cursor-pointer' : 'cursor-default')}
                    onClick={this.openChatDetails}>
                    <span className='header-status-content'>{title}</span>
                    {showProgressAnimation && <HeaderProgress />}
                    <span
                        className={classNames('header-status-title', classes.headerStatusTitle, {
                            [classes.headerStatusAccentTitle]: isAccentSubtitle
                        })}>
                        {subtitle}
                    </span>
                    <span className='header-status-tail' />
                </div>
                {chat && (
                    <>
                        <IconButton
                            className={classes.messageSearchIconButton}
                            aria-label='Search'
                            onClick={this.handleSearchChat}>
                            <SearchIcon />
                        </IconButton>
                        <MainMenuButton openChatDetails={this.openChatDetails} />
                    </>
                )}
            </div>
        );

        return (
            <>
                {control}
                <Dialog
                    transitionDuration={0}
                    open={openDeleteDialog}
                    onClose={this.handleCloseDelete}
                    aria-labelledby='delete-dialog-title'>
                    <DialogTitle id='delete-dialog-title'>Confirm</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {count === 1
                                ? 'Are you sure you want to delete 1 message?'
                                : `Are you sure you want to delete ${count} messages?`}
                        </DialogContentText>
                        {canBeDeletedForAllUsers && (
                            <FormControlLabel
                                control={
                                    <Checkbox checked={revoke} onChange={this.handleRevokeChange} color='primary' />
                                }
                                label={
                                    isPrivateChat(chatId) ? `Delete for ${getChatShortTitle(chatId)}` : 'Delete for all'
                                }
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseDelete} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handleDeleteContinue} color='primary'>
                            {t('Ok')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(Header);
