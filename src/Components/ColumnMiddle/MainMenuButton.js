/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';
import { withSnackbar } from 'notistack';
import { compose } from 'recompose';
import { canClearHistory, canDeleteChat, isPrivateChat } from '../../Utils/Chat';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import SupergroupStore from '../../Stores/SupergroupStore';

const styles = {
    menuIconButton: {
        margin: '8px 12px 8px 0'
    }
};

const menuAnchorOrigin = {
    vertical: 'bottom',
    horizontal: 'right'
};

const menuTransformOrigin = {
    vertical: 'top',
    horizontal: 'right'
};

class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            anchorEl: null
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

        const chatId = ApplicationStore.getChatId();

        const key = `${chatId}_clear_history`;
        const message = 'Messages deleted';
        const action = {
            '@type': 'deleteChatHistory',
            chat_id: chatId,
            remove_from_chat_list: false
        };

        this.handleScheduledAction(key, message, action);
    };

    handleLeave = () => {
        this.handleMenuClose();

        const chatId = ApplicationStore.getChatId();

        const key = `${chatId}_leave_chat`;
        const message = 'Left';
        const action = isPrivateChat(chatId)
            ? { '@type': 'deleteChatHistory', chat_id: chatId, remove_from_chat_list: true }
            : { '@type': 'leaveChat', chat_id: chatId };

        this.handleScheduledAction(key, message, action);
    };

    handleScheduledAction = (key, message, action) => {
        if (!key) return;
        if (!action) return;

        const { enqueueSnackbar } = this.props;
        if (!enqueueSnackbar) return;

        const TRANSITION_DELAY = 150;
        if (ApplicationStore.addScheduledAction(key, NOTIFICATION_AUTO_HIDE_DURATION_MS, action)) {
            enqueueSnackbar(message, {
                autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS - 2 * TRANSITION_DELAY,
                action: [
                    <CircularProgress key='progress' size={12} />,
                    <Button
                        key='undo'
                        color='primary'
                        size='small'
                        onClick={() => ApplicationStore.removeScheduledAction(key)}>
                        UNDO
                    </Button>
                ]
            });
        }
    };

    getLeaveChatTitle = chatId => {
        const chat = ChatStore.get(chatId);
        if (!chat) return null;
        if (!chat.type) return null;

        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                return 'Delete and exit';
            }
            case 'chatTypeSupergroup': {
                const supergroup = SupergroupStore.get(chat.type.supergroup_id);
                if (supergroup) {
                    return supergroup.is_channel ? 'Leave channel' : 'Leave group';
                }

                return null;
            }
            case 'chatTypePrivate':
            case 'chatTypeSecret': {
                return 'Delete conversation';
            }
        }

        return null;
    };

    render() {
        const { classes } = this.props;
        const { anchorEl } = this.state;

        const clearHistory = canClearHistory(ApplicationStore.getChatId());
        const deleteChat = canDeleteChat(ApplicationStore.getChatId());
        const leaveChatTitle = this.getLeaveChatTitle(ApplicationStore.getChatId());

        return (
            <>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className={classes.menuIconButton}
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
                    anchorOrigin={menuAnchorOrigin}
                    transformOrigin={menuTransformOrigin}>
                    <MenuItem onClick={this.handleChatInfo}>Chat info</MenuItem>
                    {clearHistory && <MenuItem onClick={this.handleClearHistory}>Clear history</MenuItem>}
                    {deleteChat && leaveChatTitle && <MenuItem onClick={this.handleLeave}>{leaveChatTitle}</MenuItem>}
                </Menu>
            </>
        );
    }
}

const enhance = compose(
    withStyles(styles),
    withSnackbar
);

export default enhance(MainMenuButton);
