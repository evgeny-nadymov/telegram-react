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
import BroomIcon from '../../Assets/Icons/Broom';
import DeleteIcon from '../../Assets/Icons/Delete';
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
    canAddChatToList, canClearHistory,
    canDeleteChat,
    getDeleteChatTitle,
    getViewInfoTitle,
    isChatArchived,
    isChatMuted,
    isChatPinned,
    isChatSecret,
    isChatUnread,
    isMeChat,
    isPrivateChat
} from '../../Utils/Chat';
import {
    addChatToList,
    leaveChat,
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
        const { chatId, t, hidden, isLastPinned, chatList, style } = this.props;
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

        if (nextState.chatList !== chatList) {
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
        const { chatId, chatList } = this.props;
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const contextMenuId = new Date();
            Dialog.contextMenuId = contextMenuId;

            const left = event.clientX;
            const top = event.clientY;
            const isPinned = isChatPinned(chatId, chatList);
            const canTogglePin = (await this.canPinChats(chatId)) || isPinned;
            const canToggleArchive = canAddChatToList(chatId);
            const canMute = !isMeChat(chatId);

            if (Dialog.contextMenuId !== contextMenuId) {
                return;
            }

            this.setState({
                contextMenu: true,
                canTogglePin,
                canToggleArchive,
                canMute,
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
        const { chatList } = this.props;

        const pinnedSumMaxOption = isChatArchived(chatId)
            ? OptionStore.get('pinned_archived_chat_count_max')
            : OptionStore.get('pinned_chat_count_max');
        if (!pinnedSumMaxOption) return false;

        const isSecret = isChatSecret(chatId);
        const chats = await TdLibController.send({
            '@type': 'getChats',
            chat_list: chatList,
            offset_order: '9223372036854775807',
            offset_chat_id: 0,
            limit: pinnedSumMaxOption.value + 10
        });

        const pinnedSum = chats.chat_ids.reduce((x, id) => {
            if (isChatSecret(id) !== isSecret) return x;

            const chat = ChatStore.get(id);

            return x + (chat && isChatPinned(chat.id, chatList) ? 1 : 0);
        }, 0);

        return pinnedSum < pinnedSumMaxOption.value;
    };

    handlePin = async event => {
        this.handleCloseContextMenu(event);

        const { chatId, chatList } = this.props;
        const isPinned = isChatPinned(chatId, chatList);

        if (!isPinned && !this.canPinChats(chatId)) return;

        toggleChatIsPinned(chatId, chatList, !isPinned);
    };

    handleArchive = async event => {
        this.handleCloseContextMenu(event);

        const { chatId } = this.props;
        if (!canAddChatToList(chatId)) return;

        addChatToList(chatId, { '@type': isChatArchived(chatId) ? 'chatListMain' : 'chatListArchive' });
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

    handleDeleteChat = event => {
        this.handleCloseContextMenu(event);

        const { chatId } = this.props;

        leaveChat(chatId)
    };

    render() {
        const { chatId, chatList, showSavedMessages, hidden, t, isLastPinned, style } = this.props;
        const { contextMenu, left, top, canToggleArchive, canTogglePin, canMute } = this.state;

        const clearHistory = canClearHistory(chatId);
        const deleteChat = canDeleteChat(chatId);
        const deleteChatTitle = getDeleteChatTitle(chatId, t);

        const isPinned = isChatPinned(chatId, chatList);
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
                            <DialogBadge chatId={chatId} chatList={chatList} />
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
                                {isPinned ? (
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
                            <ListItemIcon>
                                {isPrivateChat(chatId) ? <UserIcon /> : <GroupIcon />}
                            </ListItemIcon>
                            <ListItemText primary={getViewInfoTitle(chatId, t)} />
                        </MenuItem>
                        { canMute && (
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
                        )}
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
                        {/*{clearHistory && (*/}
                        {/*    <MenuItem onClick={this.handleClearHistory}>*/}
                        {/*        <ListItemIcon>*/}
                        {/*            <BroomIcon />*/}
                        {/*        </ListItemIcon>*/}
                        {/*        <ListItemText primary={t('ClearHistory')} />*/}
                        {/*    </MenuItem>*/}
                        {/*)}*/}
                        {deleteChat && deleteChatTitle && (
                            <MenuItem onClick={this.handleDeleteChat}>
                                <ListItemIcon>
                                    <DeleteIcon />
                                </ListItemIcon>
                                <ListItemText primary={deleteChatTitle} />
                            </MenuItem>
                        )}
                    </MenuList>
                </Popover>
            </div>
        );
    }
}

Dialog.propTypes = {
    chatId: PropTypes.number.isRequired,
    chatList: PropTypes.object.isRequired,
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
