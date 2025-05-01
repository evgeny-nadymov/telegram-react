/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation, withTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Popover from '@mui/material/Popover';
import ArrowBackIcon from '../../../Assets/Icons/Back';
import SectionHeader from '../SectionHeader';
import User from '../../Tile/User';
import UnblockIcon from '../../../Assets/Icons/Unblock';
import { loadUsersContent } from '../../../Utils/File';
import { openUser } from '../../../Actions/Client';
import FileStore from '../../../Stores/FileStore';
import TdLibController from '../../../Controllers/TdLibController';
import './BlockedUsers.css';

const BlockedUser = React.memo(({ userId, onClick, onUnblock }) => {
    const [contextMenu, setContextMenu] = React.useState(false);
    const [top, setTop] = React.useState(0);
    const [left, setLeft] = React.useState(0);
    const { t } = useTranslation();

    const handleContextMenu = event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        if (contextMenu) {
            setContextMenu(false);
        } else {
            const { clientX, clientY } = event;

            setContextMenu(true);
            setLeft(clientX);
            setTop(clientY);
        }
    };

    const handleCloseContextMenu = () => {
        setContextMenu(false);
        setLeft(0);
        setTop(0);
    };

    const handleClick = () => {
        onClick(userId);
    };

    const handleUnblock = () => {
        handleCloseContextMenu();
        onUnblock(userId);
    };

    return (
        <>
            <ListItem className='settings-list-item' button onClick={handleClick} onContextMenu={handleContextMenu}>
                <User userId={userId} />
            </ListItem>
            <Popover
                open={contextMenu}
                onClose={handleCloseContextMenu}
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
                    <MenuItem onClick={handleUnblock}>
                        <ListItemIcon>
                            <UnblockIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('Unblock')} />
                    </MenuItem>
                </MenuList>
            </Popover>
        </>
    );
});

BlockedUser.propTypes = {
    userId: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    onUnblock: PropTypes.func.isRequired
};

class BlockedUsers extends React.Component {

    componentDidMount() {
        this.loadContent();
    }

    loadContent() {
        const { users } = this.props;

        const store = FileStore.getStore();

        loadUsersContent(store, users.user_ids);
    }

    handleUnblock = async userId => {
        await TdLibController.send({
           '@type': 'unblockUser',
            user_id: userId
        });
    };

    render() {
        const { onClose, users, t } = this.props;

        return (
            <>
                <div className='header-master'>
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                    <div className='header-status grow cursor-pointer'>
                        <span className='header-status-content'>{t('BlockedUsers')}</span>
                    </div>
                </div>
                <div className='sidebar-page-content'>
                    <div className='sidebar-page-section'>
                        { users.user_ids.length > 0 ? (
                            <>
                                <SectionHeader multiline>{t('BlockedUsersInfo')}</SectionHeader>
                                {
                                    users.user_ids.map(x => <BlockedUser key={x} userId={x} onClick={openUser} onUnblock={this.handleUnblock}/>)
                                }
                            </>
                        ) : (
                            <SectionHeader>{t('NoBlocked')}</SectionHeader>
                        )}
                    </div>
                </div>
            </>
        );
    }
}

BlockedUsers.propTypes = {
    users: PropTypes.object.isRequired
};

export default withTranslation()(BlockedUsers);