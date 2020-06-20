/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import DeleteIcon from '../../Assets/Icons/Delete';
import { getFilterSubtitle } from '../../Utils/Filter';
import { modalManager } from '../../Utils/Modal';
import TdLibController from '../../Controllers/TdLibController';
import './Filter.css';

class Filter extends React.Component {

    state = {
        dialog: false,
        contextMenu: false,
        left: 0,
        top: 0
    };

    handleDelete = () => {
        this.handleCloseContextMenu();
        this.handleOpenDialog();
    };

    handleOpenDialog = () => {
        this.setState({
            dialog: true
        })
    };

    handleCloseDialog = () => {
        this.setState({
            dialog: false
        })
    };

    handleDeleteCancel = () => {
        this.handleCloseDialog();
    };

    handleDeleteConfirm = () => {
        const { info } = this.props;
        if (!info) return;

        this.handleCloseDialog();

        TdLibController.send({
            '@type': 'deleteChatFilter',
            chat_filter_id: info.id
        });
    };

    handleOpenContextMenu = event => {
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

    render() {
        const { t, info, onEdit, chats } = this.props;
        if (!info) return null;

        const { dialog, contextMenu, top, left } = this.state;

        const { title } = info;
        const subtitle = getFilterSubtitle(t, info.id, chats);

        return (
            <>
                <ListItem className='settings-list-item2' role={undefined} button onClick={onEdit} onContextMenu={this.handleOpenContextMenu}>
                    <ListItemText
                        className='settings-list-item-text2'
                        primary={title}
                        secondary={subtitle}
                    />
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
                <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={dialog}
                    onClose={this.handleCancel}
                    aria-labelledby='delete-dialog-title'>
                    <DialogTitle id='delete-dialog-title'>{t('Confirm')}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {t('FilterDeleteAlert')}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleDeleteCancel} color='primary'>
                            {t('Cancel')}
                        </Button>
                        <Button onClick={this.handleDeleteConfirm} color='primary'>
                            {t('Ok')}
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}

Filter.propTypes = {
    info: PropTypes.object.isRequired,
    chats: PropTypes.object,
    onEdit: PropTypes.func.isRequired
};

export default withTranslation()(Filter);