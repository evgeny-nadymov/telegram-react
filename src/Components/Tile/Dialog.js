/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import ChatTile from './ChatTile';
import DialogContent from './DialogContent';
import DialogBadge from './DialogBadge';
import DialogTitle from './DialogTitle';
import DialogMeta from './DialogMeta';
import ArchiveIcon from '../../Assets/Icons/Archive';
import UnarchiveIcon from '../../Assets/Icons/Unarchive';
import PinIcon from '../../Assets/Icons/Pin2';
import UnpinIcon from '../../Assets/Icons/Pin2';
import MuteIcon from '../../Assets/Icons/Mute';
import UnmuteIcon from '../../Assets/Icons/Unmute';
import UserIcon from '../../Assets/Icons/User';
import GroupIcon from '../../Assets/Icons/Group';
import MessageIcon from '../../Assets/Icons/Message';
import UnreadIcon from '../../Assets/Icons/Unread';
import {
    canSetChatChatList,
    isChatArchived,
    isChatMuted,
    isChatSecret,
    isChatUnread,
    isPrivateChat
} from '../../Utils/Chat';
import {
    setChatChatList,
    toggleChatIsMarkedAsUnread,
    toggleChatIsPinned,
    toggleChatNotificationSettings
} from '../../Actions/Chat';
import { openChat } from '../../Actions/Client';
import { viewMessages } from '../../Actions/Message';
import ApplicationStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import OptionStore from '../../Stores/OptionStore';
import TdLibController from '../../Controllers/TdLibController';
import './Dialog.css';

class Dialog extends Component {
    static contextMenuId;

    constructor(props) {
        super(props);

        this.dialog = React.createRef();

        const chat = ChatStore.get(this.props.chatId);
        this.state = {
            chat,
            contextMenu: false,
            left: 0,
            top: 0
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, t, hidden, isLastPinned, style } = this.props;
        const { contextMenu } = this.state;

        if (nextProps.chatId !== chatId) {
            // console.log('[vl] Dialog.shouldUpdate true chatId');
            return true;
        }

        if (nextProps.t !== t) {
            // console.log('[vl] Dialog.shouldUpdate true t');
            return true;
        }

        if (nextProps.hidden !== hidden) {
            // console.log('[vl] Dialog.shouldUpdate true hidden');
            return true;
        }

        if (nextProps.isLastPinned !== isLastPinned) {
            // console.log('[vl] Dialog.shouldUpdate true isLastPinned');
            return true;
        }

        if (nextState.contextMenu !== contextMenu) {
            // console.log('[vl] Dialog.shouldUpdate true contextMenu');
            return true;
        }

        if (nextProps.style && style && style.top !== nextProps.style.top) {
            // console.log('[vl] Dialog.shouldUpdate true style');
            return true;
        }

        // console.log('[vl] Dialog.shouldUpdate false');
        return false;
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        ApplicationStore.off('clientUpdateChatId', this.onClientUpdateChatId);
    }

    onClientUpdateChatId = update => {
        const { chatId } = this.props;

        if (chatId === update.previousChatId || chatId === update.nextChatId) {
            this.forceUpdate();
        }
    };

    handleSelect = event => {
        if (event.button === 0) {
            openChat(this.props.chatId);
        }
    };

    handleContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { chatId } = this.props;
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const contextMenuId = new Date();
            Dialog.contextMenuId = contextMenuId;

            const left = event.clientX;
            const top = event.clientY;
            const chat = ChatStore.get(chatId);
            const { is_pinned } = chat;
            const canTogglePin = (await this.canPinChats(chatId)) || is_pinned;
            const canToggleArchive = canSetChatChatList(chatId);

            if (Dialog.contextMenuId !== contextMenuId) {
                return;
            }

            this.setState({
                contextMenu: true,
                canTogglePin,
                canToggleArchive,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    handleMute = event => {
        this.handleCloseContextMenu(event);

        const { chatId } = this.props;

        toggleChatNotificationSettings(chatId, !isChatMuted(chatId));
    };

    canPinChats = async chatId => {
        const pinnedSumMaxOption = isChatArchived(chatId)
            ? OptionStore.get('pinned_archived_chat_count_max')
            : OptionStore.get('pinned_chat_count_max');
        if (!pinnedSumMaxOption) return false;

        const isSecret = isChatSecret(chatId);
        const chats = await TdLibController.send({
            '@type': 'getChats',
            chat_list: isChatArchived(chatId) ? { '@type': 'chatListArchive' } : { '@type': 'chatListMain' },
            offset_order: '9223372036854775807',
            offset_chat_id: 0,
            limit: pinnedSumMaxOption.value + 10
        });

        const pinnedSum = chats.chat_ids.reduce((x, id) => {
            if (isChatSecret(id) !== isSecret) return x;

            const chat = ChatStore.get(id);

            return x + (chat && chat.is_pinned ? 1 : 0);
        }, 0);

        return pinnedSum < pinnedSumMaxOption.value;
    };

    handlePin = async event => {
        this.handleCloseContextMenu(event);

        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        const { is_pinned } = chat;

        if (!is_pinned && !this.canPinChats(chatId)) return;

        toggleChatIsPinned(chatId, !is_pinned);
    };

    handleArchive = async event => {
        this.handleCloseContextMenu(event);

        const { chatId } = this.props;
        if (!canSetChatChatList(chatId)) return;

        setChatChatList(chatId, { '@type': isChatArchived(chatId) ? 'chatListMain' : 'chatListArchive' });
    };

    getViewInfoTitle = () => {
        const { chatId, t } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const { type } = chat;
        switch (type['@type']) {
            case 'chatTypeBasicGroup': {
                return t('ViewGroupInfo');
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                return t('ViewProfile');
            }
            case 'chatTypeSupergroup': {
                if (type.is_channel) {
                    return t('ViewChannelInfo');
                }

                return t('ViewGroupInfo');
            }
        }
    };

    handleViewInfo = event => {
        this.handleCloseContextMenu(event);

        const { chatId } = this.props;

        openChat(chatId, null, true);
    };

    handleRead = event => {
        this.handleCloseContextMenu(event);

        const { chatId } = this.props;

        const isUnread = isChatUnread(chatId);
        if (isUnread) {
            const chat = ChatStore.get(chatId);
            if (!chat) return;

            const { is_marked_as_unread, last_message, unread_count } = chat;
            if (unread_count > 0 && last_message) {
                viewMessages(chatId, [last_message.id], true);
            } else if (is_marked_as_unread) {
                toggleChatIsMarkedAsUnread(chatId, false);
            }
        } else {
            toggleChatIsMarkedAsUnread(chatId, true);
        }
    };

    render() {
        const { chatId, showSavedMessages, hidden, t, isLastPinned, style } = this.props;
        const { contextMenu, left, top, canToggleArchive, canTogglePin } = this.state;

        const chat = ChatStore.get(chatId);
        const { is_pinned } = chat;
        const currentChatId = ApplicationStore.getChatId();
        const isSelected = currentChatId === chatId;
        const isMuted = isChatMuted(chatId);
        const isUnread = isChatUnread(chatId);
        const isArchived = isChatArchived(chatId);
        return (
            <div
                ref={this.dialog}
                className={classNames('dialog', { 'item-selected': isSelected }, { 'dialog-hidden': hidden })}
                onMouseDown={this.handleSelect}
                onContextMenu={this.handleContextMenu}
                style={style}>
                <div className='dialog-wrapper'>
                    <ChatTile chatId={chatId} dialog showSavedMessages={showSavedMessages} showOnline />
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <DialogTitle chatId={chatId} />
                            <DialogMeta chatId={chatId} />
                        </div>
                        <div className='tile-second-row'>
                            <DialogContent chatId={chatId} />
                            <DialogBadge chatId={chatId} />
                        </div>
                    </div>
                </div>
                <Popover
                    open={contextMenu}
                    onClose={this.handleCloseContextMenu}
                    anchorReference='anchorPosition'
                    anchorPosition={{ top, left }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    onMouseDown={e => e.stopPropagation()}>
                    <MenuList onClick={e => e.stopPropagation()}>
                        {canToggleArchive && (
                            <MenuItem onClick={this.handleArchive}>
                                {isArchived ? (
                                    <>
                                        <ListItemIcon>
                                            <UnarchiveIcon />
                                        </ListItemIcon>
                                        <ListItemText primary={t('Unarchive')} />
                                    </>
                                ) : (
                                    <>
                                        <ListItemIcon>
                                            <ArchiveIcon />
                                        </ListItemIcon>
                                        <ListItemText primary={t('Archive')} />
                                    </>
                                )}
                            </MenuItem>
                        )}
                        {canTogglePin && (
                            <MenuItem onClick={this.handlePin}>
                                {is_pinned ? (
                                    <>
                                        <ListItemIcon>
                                            <UnpinIcon />
                                        </ListItemIcon>
                                        <ListItemText primary={t('UnpinFromTop')} />
                                    </>
                                ) : (
                                    <>
                                        <ListItemIcon>
                                            <PinIcon />
                                        </ListItemIcon>
                                        <ListItemText primary={t('PinToTop')} />
                                    </>
                                )}
                            </MenuItem>
                        )}
                        <MenuItem onClick={this.handleViewInfo}>
                            {isPrivateChat(chatId) ? (
                                <>
                                    <ListItemIcon>
                                        <UserIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={this.getViewInfoTitle()} />
                                </>
                            ) : (
                                <>
                                    <ListItemIcon>
                                        <GroupIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={this.getViewInfoTitle()} />
                                </>
                            )}
                        </MenuItem>
                        <MenuItem onClick={this.handleMute}>
                            {isMuted ? (
                                <>
                                    <ListItemIcon>
                                        <UnmuteIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={t('ChatsUnmute')} />
                                </>
                            ) : (
                                <>
                                    <ListItemIcon>
                                        <MuteIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={t('ChatsMute')} />
                                </>
                            )}
                        </MenuItem>
                        <MenuItem onClick={this.handleRead}>
                            {isUnread ? (
                                <>
                                    <ListItemIcon>
                                        <MessageIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={t('MarkAsRead')} />
                                </>
                            ) : (
                                <>
                                    <ListItemIcon>
                                        <UnreadIcon />
                                    </ListItemIcon>
                                    <ListItemText primary={t('MarkAsUnread')} />
                                </>
                            )}
                        </MenuItem>
                    </MenuList>
                </Popover>
            </div>
        );
    }
}

Dialog.propTypes = {
    chatId: PropTypes.number.isRequired,
    hidden: PropTypes.bool,
    showSavedMessages: PropTypes.bool,
    isLastPinned: PropTypes.bool,
    style: PropTypes.object
};

Dialog.defaultProps = {
    hidden: false,
    showSavedMessages: true
};

export default withTranslation()(Dialog);
