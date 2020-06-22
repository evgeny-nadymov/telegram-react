/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import Radio from '@material-ui/core/Radio';
import ChatTile from './ChatTile';
import DeleteIcon from '../../Assets/Icons/Delete';
import { getChatTitle, getChatType } from '../../Utils/Chat';
import './FilterChat.css';

class FilterChat extends React.Component {

    state = {
        contextMenu: false,
        left: 0,
        top: 0,
        checked: false
    };

    handleOpenContextMenu = event => {
        const { onDelete } = this.props;
        if (!onDelete) return;

        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.setState({
            contextMenu: true,
            left: event.clientX,
            top: event.clientY
        });
    };

    handleCloseContextMenu = () => {
        this.setState({
            contextMenu: false,
            left: 0,
            top: 0
        });
    };

    handleDelete = () => {
        this.handleCloseContextMenu();

        const { chatId, onDelete } = this.props;

        onDelete && onDelete(chatId);
    };

    render() {
        const { chatId, t, type, checked, onClick } = this.props;
        const { contextMenu, left, top } = this.state;

        const title = getChatTitle(chatId, true, t);

        return (
            <>
                <ListItem className='settings-list-item2' role={undefined} button onClick={onClick} onContextMenu={this.handleOpenContextMenu}>
                    <div className='filter-chat-tile'>
                        <ChatTile chatId={chatId} small={true} showSavedMessages={true}/>
                    </div>
                    <div className='filter-chat-content'>
                        <div className='filter-chat-title'>
                            {title}
                        </div>
                        { type && (
                            <div className='filter-chat-subtitle'>
                                {getChatType(chatId, t)}
                            </div>
                        )}
                    </div>
                    { checked !== undefined && (
                        <Radio className='filter-chat-checkbox' color='primary' checked={checked} />
                    )}
                </ListItem>
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
                        <MenuItem onClick={this.handleDelete}>
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('Delete')} />
                        </MenuItem>
                    </MenuList>
                </Popover>
            </>
        );
    }
}

FilterChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    type: PropTypes.bool,
    onDelete: PropTypes.func,
    checked: PropTypes.bool,
    onChange: PropTypes.func
};

export default withTranslation()(FilterChat);