/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import MenuList from '@material-ui/core/MenuList';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ChatBubbleOutlineOutlinedIcon from '@material-ui/icons/ChatBubbleOutlineOutlined';
import DeleteIcon from '../../../Assets/Icons/Delete';
import ShareIcon from '../../../Assets/Icons/Share';
import { deleteMessages, forwardMessages, openChat } from '../../../Actions/Client';
import MessageStore from '../../../Stores/MessageStore';
import './ContextMenu.css';

class ContextMenu extends React.Component {
    handleOpenMessage = event => {
        const { chatId, messageId, onClose } = this.props;

        onClose(event);

        openChat(chatId, messageId);
    };

    handleForward = event => {
        const { chatId, messageId, onClose } = this.props;

        onClose(event);

        forwardMessages(chatId, [messageId]);
    };

    handleDelete = event => {
        const { chatId, messageId, onClose } = this.props;

        onClose(event);

        deleteMessages(chatId, [messageId]);
    };

    render() {
        const { t, chatId, messageId, open, onClose, anchorPosition, showOpenMessage } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { can_be_forwarded, can_be_deleted_only_for_self, can_be_deleted_for_all_users } = message;

        return (
            <Popover
                open={open}
                onClose={onClose}
                anchorReference='anchorPosition'
                anchorPosition={anchorPosition}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                }}
                onMouseDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}>
                <MenuList>
                    {showOpenMessage && (
                        <MenuItem onClick={this.handleOpenMessage}>
                            <ListItemIcon>
                                <ChatBubbleOutlineOutlinedIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('GoToMessage')} />
                        </MenuItem>
                    )}
                    {can_be_forwarded && (
                        <MenuItem onClick={this.handleForward}>
                            <ListItemIcon>
                                <ShareIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('Forward')} />
                        </MenuItem>
                    )}
                    {(can_be_deleted_only_for_self || can_be_deleted_for_all_users) && (
                        <MenuItem color='secondary' onClick={this.handleDelete}>
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('Delete')} />
                        </MenuItem>
                    )}
                </MenuList>
            </Popover>
        );
    }

}

ContextMenu.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    anchorPosition: PropTypes.object.isRequired,
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    showOpenMessage: PropTypes.bool
};

export default withTranslation()(ContextMenu);