/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import DeleteIcon from '../../Assets/Icons/Delete';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import Chat from './Chat';
import './RecentlyFoundChat.css';

class RecentlyFoundChat extends React.PureComponent {
    state = {
        contextMenu: false,
        top: 0,
        left: 0
    };

    handleContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;

            this.setState({
                contextMenu: true,
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

    handleDelete = event => {
        this.handleCloseContextMenu();

        const { onDelete } = this.props;

        onDelete();
    };

    render() {
        const { t, chatId, onClick } = this.props;
        const { contextMenu, top, left } = this.state;

        return (
            <>
                <ListItem
                    button
                    className='recently-found-chat'
                    onClick={onClick}
                    onContextMenu={this.handleContextMenu}>
                    <Chat chatId={chatId} />
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

RecentlyFoundChat.propTypes = {
    chatId: PropTypes.number.isRequired,
    onSelect: PropTypes.func,
    onDelete: PropTypes.func
};

export default withTranslation()(RecentlyFoundChat);
