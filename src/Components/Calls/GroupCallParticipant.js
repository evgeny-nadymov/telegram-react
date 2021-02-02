/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import MicIcon from '../../Assets/Icons/Mic';
import MicOffIcon from '../../Assets/Icons/MicOff';
import UserTile from '../Tile/UserTile';
import { getUserFullName } from '../../Utils/User';
import CallStore from '../../Stores/CallStore';
import './GroupCallParticipant.css';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import LinkIcon from '@material-ui/icons/Link';
import ListItemText from '@material-ui/core/ListItemText';
import ShareIcon from '@material-ui/icons/Share';
import Menu from '@material-ui/core/Menu';
import MenuList from '@material-ui/core/MenuList';
import UnarchiveIcon from '../../Assets/Icons/Unarchive';
import ArchiveIcon from '../../Assets/Icons/Archive';
import UnpinIcon from '../../Assets/Icons/PinOff';
import PinIcon from '../../Assets/Icons/Pin2';
import { canAddChatToList, getViewInfoTitle, isChatPinned, isMeChat, isPrivateChat } from '../../Utils/Chat';
import UserIcon from '../../Assets/Icons/User';
import GroupIcon from '../../Assets/Icons/Group';
import UnmuteIcon from '../../Assets/Icons/Unmute';
import MuteIcon from '../../Assets/Icons/Mute';
import MessageIcon from '../../Assets/Icons/Message';
import UnreadIcon from '../../Assets/Icons/Unread';
import DeleteIcon from '../../Assets/Icons/Delete';
import Popover from '@material-ui/core/Popover';
import { openUser } from '../../Actions/Client';

class GroupCallParticipant extends React.Component {

    state = {
        contextMenu: false,
        left: 0,
        top: 0
    };

    componentDidMount() {
        CallStore.on('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
    }

    componentWillUnmount() {
        CallStore.off('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
    }

    onUpdateGroupCallParticipant = update => {
        const { groupCallId, userId } = this.props;
        const { group_call_id, participant } = update;
        if (groupCallId !== group_call_id) return;
        if (!participant) return;

        const { user_id } = participant;
        if (userId !== user_id) return;

        this.forceUpdate();
    };

    handleOpenContextMenu = event => {
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

    handleOpenProfile = event => {
        this.handleCloseContextMenu(event);

        const { userId } = this.props;

        openUser(userId, true);
    };

    handleSendMessage = event => {
        this.handleCloseContextMenu(event);

        const { userId } = this.props;

        openUser(userId, false);
    };

    render() {
        const { groupCallId, userId, t } = this.props;
        const { contextMenu, left, top } = this.state;
        const participants = CallStore.participants.get(groupCallId) || new Map();
        const participant = participants.get(userId);
        if (!participant) return null;

        const { is_speaking, is_muted, can_unmute_self } = participant;

        return (
            <div className='group-call-participant' onClick={this.handleOpenContextMenu}>
                <UserTile userId={userId}/>
                <div className='group-call-participant-content'>
                    <div className='group-call-participant-content-title'>{getUserFullName(userId)}</div>
                    <div className={classNames('group-call-participant-content-subtitle', 'participant-listening', { 'participant-speaking': is_speaking })}>
                        {is_speaking ? t('Speaking') : t('Listening')}
                    </div>
                </div>
                <div className={classNames('group-call-participant-mic', { 'participant-muted-by-admin': is_muted && !can_unmute_self, 'participant-speaking': is_speaking })}>
                    {!is_muted ? <MicIcon /> : <MicOffIcon />}
                </div>

                <Popover
                    classes={{
                        paper: 'group-call-participant-menu-root'
                    }}
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
                        <MenuItem
                            classes={{ root: 'group-call-participant-menu-item' }}
                            ListItemClasses={{ focusVisible: 'group-call-participant-menu-item-focus-visible' }}
                            TouchRippleProps={{
                                classes : {
                                    child : 'group-call-participant-menu-item-ripple-child',
                                    rippleVisible : 'group-call-participant-menu-item-ripple-visible'
                                }
                            }}
                            onClick={this.handleOpenProfile}>
                            <ListItemText primary={t('VoipGroupOpenProfile')} />
                        </MenuItem>
                        <MenuItem
                            classes={{ root: 'group-call-participant-menu-item' }}
                            ListItemClasses={{ focusVisible: 'group-call-participant-menu-item-focus-visible' }}
                            TouchRippleProps={{
                                classes : {
                                    child : 'group-call-participant-menu-item-ripple-child',
                                    rippleVisible : 'group-call-participant-menu-item-ripple-visible'
                                }
                            }}
                            onClick={this.handleSendMessage}>
                            <ListItemText primary={t('SendMessage')} />
                        </MenuItem>
                    </MenuList>
                </Popover>
            </div>
        );
    }

}

GroupCallParticipant.propTypes = {
    userId: PropTypes.number,
    groupCallId: PropTypes.number
};

export default withTranslation()(GroupCallParticipant);