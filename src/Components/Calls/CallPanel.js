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
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import CallEndIcon from '../../Assets/Icons/CallEnd';
import CloseIcon from '../../Assets/Icons/Close';
import GroupCallPanelButtons from './GroupCallPanelButtons';
import GroupCallSettings from './GroupCallSettings';
import GroupCallSettingsButton from './GroupCallSettingsButton';
import MenuIcon from '../../Assets/Icons/More';
import { closeGroupCallPanel } from '../../Actions/Call';
import { getUserFullName } from '../../Utils/User';
import { stopPropagation } from '../../Utils/Message';
import CallStore from '../../Stores/CallStore';
import UserStore from '../../Stores/UserStore';
import './GroupCallPanel.css';

class CallPanel extends React.Component {
    constructor(props) {
        super(props);

        this.callPanelRef = React.createRef();

        this.state = {
            openSettings: false,
            contextMenu: false,
            left: 0,
            top: 0,
            fullScreen: false
        };
    }

    componentDidMount() {
        const callPanel = this.callPanelRef.current;
        if (callPanel) {
            callPanel.addEventListener('fullscreenchange', this.handleFullScreenChange);
        }
    }

    componentWillUnmount() {
        const callPanel = this.callPanelRef.current;
        if (callPanel) {
            callPanel.removeEventListener('fullscreenchange', this.handleFullScreenChange);
        }
    }

    handleFullScreenChange = () => {
        this.setState({
            fullScreen: this.isFullScreen()
        });
    };

    handleClick = () => {
        this.handleClose();
    }

    handleAccept = async event => {
        event.stopPropagation();

        const { callId } = this.props;
        if (!callId) return;

        await CallStore.p2pAcceptCall(callId);
    };

    handleDiscard = async event => {
        event.stopPropagation();

        const { callId } = this.props;
        if (!callId) return;

        await CallStore.p2pDiscardCall(callId, false, 0, false, 0);
    };

    handleOpenSettings = async event => {
        CallStore.devices = await navigator.mediaDevices.enumerateDevices();

        this.setState({
            openSettings: true
        });
    };

    handleCloseSettings = () => {
        this.setState({
            openSettings: false
        });
    };

    handleClose = () => {
        closeGroupCallPanel();
    };

    handleShareScreen = () => {
        this.handleCloseContextMenu();

        const { currentCall } = CallStore;
        if (!currentCall) return;

        const { screenStream } = currentCall;
        if (screenStream) {
            CallStore.p2pStopScreenSharing();
        } else {
            CallStore.p2pStartScreenSharing();
        }
    };

    handleFullScreen = () => {
        this.handleCloseContextMenu();

        setTimeout(() => {
            if (this.isFullScreen()) {
                this.exitFullscreen();
                return;
            }

            this.requestFullscreen();
        }, 250);
    }

    isFullScreen() {
        const callPanel = this.callPanelRef.current;
        if (!callPanel) return false;

        const fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;
        return fullscreenElement === callPanel;
    }

    requestFullscreen() {
        const callPanel = this.callPanelRef.current;
        if (!callPanel) return false;

        const method = callPanel.requestFullscreen || callPanel.mozRequestFullScreen || callPanel.webkitRequestFullscreen;

        method && method.call(callPanel);
    }

    exitFullscreen() {
        const method = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen;

        method && method.call(document);
    }

    handleOpenContextMenu = event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { currentTarget } = event;

        const { userId } = this.props;
        if (userId === UserStore.getMyId()) return;

        const { anchorEl } = this.state;

        if (anchorEl) {
            this.setState({ anchorEl: null });
        } else {
            this.setState({
                anchorEl: currentTarget
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ anchorEl: null });
    };

    render() {
        const { callId, t } = this.props;
        const { openSettings, anchorEl, fullScreen } = this.state;
        const { currentCall } = CallStore;
        // if (!currentGroupCall) return null;

        const call = CallStore.p2pGet(callId);
        if (!call) return null;

        const { user_id: userId } = call;

        let screenSharing = currentCall && Boolean(currentCall.screenStream);

        return (
            <div className={classNames('group-call-panel', { 'full-screen': fullScreen })} ref={this.callPanelRef}>
                <div className='group-call-panel-header'>
                    <div className='group-call-panel-caption-button' onMouseDown={stopPropagation} onClick={this.handleClose}>
                        <CloseIcon />
                    </div>
                    <div className='group-call-panel-caption'>
                        <div className='group-call-title'>{getUserFullName(userId, null)}</div>
                        {/*<GroupCallSubtitle groupCallId={groupCallId} participantsOnly={true}/>*/}
                    </div>
                    <div className='group-call-panel-caption-button' onMouseDown={stopPropagation} onClick={this.handleOpenContextMenu}>
                        <MenuIcon />
                    </div>
                    <Popover
                        container={this.callPanelRef.current}
                        classes={{
                            paper: 'group-call-participant-menu-root'
                        }}
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={this.handleCloseContextMenu}
                        getContentAnchorEl={null}
                        disableRestoreFocus={true}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right'
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right'
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
                                onClick={this.handleShareScreen}>
                                <ListItemText primary={screenSharing ? t('StopScreenSharing') : t('StartScreenSharing')} />
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
                                onClick={this.handleFullScreen}>
                                <ListItemText primary={fullScreen ? t('ExitFullScreen') : t('EnterFullScreen')} />
                            </MenuItem>
                        </MenuList>
                    </Popover>
                </div>
                <div className='call-panel-content scrollbars-hidden'>
                    <video id='call-output-video' autoPlay={true} muted={true}/>
                    <video id='call-input-video' autoPlay={true} muted={true}/>
                </div>
                <GroupCallPanelButtons>
                    {/*<GroupCallMicButton/>*/}
                    <div className='group-call-panel-button'>
                        <GroupCallSettingsButton onClick={this.handleOpenSettings}/>
                        <div className='group-call-panel-button-text'>
                            {t('Settings')}
                        </div>
                    </div>
                    <div className='group-call-panel-button'>
                        <div className='group-call-panel-button-answer' onMouseDown={stopPropagation} onClick={this.handleAccept}>
                            <CallEndIcon />
                        </div>
                        <div className='group-call-panel-button-text'>
                            {t('VoipAnswerCall')}
                        </div>
                    </div>
                    <div className='group-call-panel-button'>
                        <div className='group-call-panel-button-leave' onMouseDown={stopPropagation} onClick={this.handleDiscard}>
                            <CallEndIcon />
                        </div>
                        <div className='group-call-panel-button-text'>
                            {t('VoipDeclineCall')}
                        </div>
                    </div>
                </GroupCallPanelButtons>
                {openSettings && <GroupCallSettings callId={callId} onClose={this.handleCloseSettings}/>}
            </div>
        );
    }
}

CallPanel.propTypes = {
    callId: PropTypes.number
};

export default withTranslation()(CallPanel);