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
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import MicIcon from '../../Assets/Icons/MicOutlined';
import MicOffIcon from '../../Assets/Icons/MicOffOutlined';
import UserTile from '../Tile/UserTile';
import { closeGroupCallPanel } from '../../Actions/Call';
import { getUserFullName } from '../../Utils/User';
import { openUser } from '../../Actions/Client';
import CallStore from '../../Stores/CallStore';
import UserStore from '../../Stores/UserStore';
import './GroupCallParticipant.css';

class GroupCallParticipant extends React.Component {

    state = {
        contextMenu: false,
        left: 0,
        top: 0,
        participant: null
    };

    static getDerivedStateFromProps(props, state) {
        const { userId, groupCallId } = props;
        const { prevUserId, prevGroupCallId } = state;

        if (prevUserId !== userId || prevGroupCallId !== groupCallId) {
            const participants = CallStore.participants.get(groupCallId) || new Map();
            const participant = participants.get(userId);

            return {
                prevUserId: userId,
                prevGroupCallId: groupCallId,
                participant
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { participant, left, top, contextMenu } = this.state;

        if (participant !== nextState.participant) {
            return true;
        }

        if (left !== nextState.left) {
            return true;
        }

        if (top !== nextState.top) {
            return true;
        }

        if (contextMenu !== nextState.contextMenu) {
            return true;
        }

        return false;
    }

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

        this.setState({
            participant
        });
    };

    handleOpenContextMenu = event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { userId } = this.props;
        if (userId === UserStore.getMyId()) return;

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
        closeGroupCallPanel();
    };

    handleSendMessage = event => {
        this.handleCloseContextMenu(event);

        const { userId } = this.props;

        openUser(userId, false);
        closeGroupCallPanel();
    };

    handleMute = event => {
        this.handleCloseContextMenu(event);

        const { userId } = this.props;
        CallStore.changeUserMuted(userId, true);
    };

    handleUnmute = event => {
        this.handleCloseContextMenu(event);

        const { userId } = this.props;
        CallStore.changeUserMuted(userId, false);
    };

    render() {
        const { userId, t } = this.props;
        const { contextMenu, left, top, participant } = this.state;
        // console.log('[call][GroupCallParticipant] render', participant);
        if (!participant) return null;

        const { is_speaking, is_muted_for_all_users, is_muted_for_current_user, can_unmute_self, can_be_muted_for_all_users, can_be_unmuted_for_all_users } = participant;
        const isMuted = is_muted_for_all_users || is_muted_for_current_user;

        return (
            <div className='group-call-participant' onClick={this.handleOpenContextMenu} onContextMenu={this.handleOpenContextMenu}>
                <UserTile userId={userId}/>
                <div className='group-call-participant-content'>
                    <div className='group-call-participant-content-title'>
                        {/*{userId}*/}
                        {getUserFullName(userId)}
                    </div>
                    <div className={classNames('group-call-participant-content-subtitle', 'participant-listening', { 'participant-speaking': is_speaking })}>
                        {/*{order}*/}
                        {is_speaking ? t('Speaking') : t('Listening')}
                    </div>
                </div>
                <div className={classNames('group-call-participant-mic', { 'participant-muted-by-admin': isMuted && !can_unmute_self, 'participant-speaking': is_speaking })}>
                    {!isMuted || is_speaking ? <MicIcon /> : <MicOffIcon />}
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
                        { can_be_unmuted_for_all_users && (
                            <MenuItem
                                classes={{ root: 'group-call-participant-menu-item' }}
                                ListItemClasses={{ focusVisible: 'group-call-participant-menu-item-focus-visible' }}
                                TouchRippleProps={{
                                    classes : {
                                        child : 'group-call-participant-menu-item-ripple-child',
                                        rippleVisible : 'group-call-participant-menu-item-ripple-visible'
                                    }
                                }}
                                onClick={this.handleUnmute}>
                                <ListItemText primary={t('VoipGroupUnmute')} />
                            </MenuItem>
                        )}
                        { can_be_muted_for_all_users && (
                            <MenuItem
                                classes={{ root: 'group-call-participant-menu-item' }}
                                ListItemClasses={{ focusVisible: 'group-call-participant-menu-item-focus-visible' }}
                                TouchRippleProps={{
                                    classes : {
                                        child : 'group-call-participant-menu-item-ripple-child',
                                        rippleVisible : 'group-call-participant-menu-item-ripple-visible'
                                    }
                                }}
                                onClick={this.handleMute}>
                                <ListItemText primary={t('VoipGroupMute')} />
                            </MenuItem>
                        )}
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