/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import ChatTile from './ChatTile';
import DialogContent from './DialogContent';
import DialogBadge from './DialogBadge';
import DialogTitle from './DialogTitle';
import DialogMeta from './DialogMeta';
import { isChatMuted, isChatSecret, isChatUnread } from '../../Utils/Chat';
import { toggleChatIsMarkedAsUnread, toggleChatIsPinned, toggleChatNotificationSettings } from '../../Actions/Chat';
import { openChat } from '../../Actions/Client';
import { viewMessages } from '../../Actions/Message';
import ApplicationStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import OptionStore from '../../Stores/OptionStore';
import TdLibController from '../../Controllers/TdLibController';
import './Dialog.css';

const styles = theme => ({
    menuListRoot: {
        minWidth: 150
    },
    statusRoot: {
        position: 'absolute',
        right: 1,
        bottom: 1,
        zIndex: 1
    },
    statusIcon: {},
    iconIndicator: {
        background: '#80d066'
    },
    verifiedIcon: {
        color: theme.palette.primary.main
    },
    unreadIcon: {
        background: theme.palette.primary.light
    },
    dialogActive: {
        color: '#fff', //theme.palette.primary.contrastText,
        backgroundColor: theme.palette.primary.main,
        borderRadius: 8,
        cursor: 'pointer',
        margin: '0 12px',
        '& $verifiedIcon': {
            color: '#fff'
        },
        '& $unreadIcon': {
            background: '#ffffff77'
        },
        '& $statusRoot': {
            background: theme.palette.primary.main
        },
        '& $iconIndicator': {
            background: '#ffffff'
        }
    },
    dialog: {
        borderRadius: 8,
        cursor: 'pointer',
        margin: '0 12px',
        '&:hover': {
            backgroundColor: theme.palette.primary.main + '22',
            '& $statusRoot': {
                background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF'
            },
            '& $statusIcon': {
                background: theme.palette.primary.main + '22'
            }
        }
    }
});

class Dialog extends Component {
    constructor(props) {
        super(props);

        this.dialog = React.createRef();

        const chat = ChatStore.get(this.props.chatId);
        this.state = {
            chat: chat,
            contextMenu: false,
            left: 0,
            top: 0
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.chatId !== this.props.chatId) {
            return true;
        }

        if (nextProps.t !== this.props.t) {
            return true;
        }

        if (nextProps.theme !== this.props.theme) {
            return true;
        }

        if (nextProps.hidden !== this.props.hidden) {
            return true;
        }

        if (nextState.contextMenu !== this.state.contextMenu) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        ApplicationStore.on('clientUpdateChatId', this.onClientUpdateChatId);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateChatId', this.onClientUpdateChatId);
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
            const left = event.clientX;
            const top = event.clientY;
            const chat = ChatStore.get(chatId);
            const { is_pinned } = chat;
            const canTogglePin = (await this.canPinChats(chatId)) || is_pinned;

            this.setState({
                contextMenu: true,
                canTogglePin,
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
        const chat = ChatStore.get(chatId);
        if (!chat) return false;

        const pinnedSumMaxOption = OptionStore.get('pinned_chat_count_max');
        if (!pinnedSumMaxOption) return false;

        const isSecret = isChatSecret(chatId);
        const chats = await TdLibController.send({
            '@type': 'getChats',
            offset_order: '9223372036854775807',
            offset_chat_id: 0,
            limit: 15
        });

        const pinnedSum = chats.chat_ids.reduce((x, id) => {
            if (isChatSecret(id) !== isSecret) return x;

            const chat = ChatStore.get(id);
            if (!chat) return x;

            return x + (chat.is_pinned ? 1 : 0);
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
        const { classes, chatId, showSavedMessages, hidden, t } = this.props;
        const { contextMenu, left, top, canTogglePin } = this.state;

        if (hidden) return null;

        const chat = ChatStore.get(chatId);
        const { is_pinned } = chat;
        const currentChatId = ApplicationStore.getChatId();
        const isSelected = currentChatId === chatId;
        const isMuted = isChatMuted(chatId);
        const isUnread = isChatUnread(chatId);
        return (
            <div
                ref={this.dialog}
                className={classNames(
                    isSelected ? classes.dialogActive : classes.dialog,
                    isSelected ? 'dialog-active' : 'dialog'
                )}
                onMouseDown={this.handleSelect}
                onContextMenu={this.handleContextMenu}>
                <div className='dialog-wrapper'>
                    <ChatTile
                        chatId={chatId}
                        showSavedMessages={showSavedMessages}
                        showOnline
                        classes={{
                            statusRoot: classes.statusRoot,
                            statusIcon: classes.statusIcon,
                            iconIndicator: classes.iconIndicator
                        }}
                    />
                    <div className='dialog-inner-wrapper'>
                        <div className='tile-first-row'>
                            <DialogTitle chatId={chatId} classes={{ verifiedIcon: classes.verifiedIcon }} />
                            <DialogMeta chatId={chatId} />
                        </div>
                        <div className='tile-second-row'>
                            <DialogContent chatId={chatId} />
                            <DialogBadge chatId={chatId} classes={{ unreadIcon: classes.unreadIcon }} />
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
                    <MenuList classes={{ root: classes.menuListRoot }} onClick={e => e.stopPropagation()}>
                        {canTogglePin && (
                            <MenuItem onClick={this.handlePin}>
                                {is_pinned ? t('UnpinFromTop') : t('PinToTop')}
                            </MenuItem>
                        )}
                        <MenuItem onClick={this.handleViewInfo}>{this.getViewInfoTitle()}</MenuItem>
                        <MenuItem onClick={this.handleMute}>{isMuted ? t('Unmute') : t('Mute')}</MenuItem>
                        <MenuItem onClick={this.handleRead}>{isUnread ? t('MarkAsRead') : t('MarkAsUnread')}</MenuItem>
                    </MenuList>
                </Popover>
            </div>
        );
    }
}

Dialog.propTypes = {
    chatId: PropTypes.number.isRequired,
    hidden: PropTypes.bool,
    showSavedMessages: PropTypes.bool
};

Dialog.defaultProps = {
    hidden: false,
    showSavedMessages: true
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(Dialog);
