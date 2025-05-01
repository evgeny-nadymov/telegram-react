/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Radio from '@mui/material/Radio';
import DeleteIcon from '../../Assets/Icons/Delete';
import './FilterText.css';
import Checkbox from '@mui/material/Checkbox';

class FilterText extends React.Component {

    state = {
        contextMenu: false,
        left: 0,
        top: 0
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

        const { onDelete } = this.props;

        onDelete && onDelete();
    };

    render() {
        const { t, className, icon, text, checked, onClick } = this.props;
        const { contextMenu, left, top } = this.state;

        return (
            <>
                <ListItem className={classNames(className, 'settings-list-item2', 'filter-chat-text')} role={undefined} button onMouseDown={onClick} onContextMenu={this.handleOpenContextMenu}>
                    <div className='filter-chat-tile'>
                        {icon}
                    </div>
                    <div className='filter-chat-content'>
                        {text}
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

FilterText.propTypes = {
    icon: PropTypes.object,
    text: PropTypes.string,
    checked: PropTypes.bool,
    onClick: PropTypes.func,
    onChange: PropTypes.func,
    onDelete: PropTypes.func
};

export default withTranslation()(FilterText);