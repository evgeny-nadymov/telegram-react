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
import CallIcon from '@material-ui/icons/Call';
import VideocamIcon from '@material-ui/icons/VideocamOutlined';
import VideocamOffIcon from '@material-ui/icons/VideocamOffOutlined';
import CallEndIcon from '../../Assets/Icons/CallEnd';
import CloseIcon from '../../Assets/Icons/Close';
import GroupCallSettings from './GroupCallSettings';
import MenuIcon from '../../Assets/Icons/More';
import MicIcon from '../../Assets/Icons/Mic';
import MicOffIcon from '../../Assets/Icons/MicOff';
import { closeCallPanel } from '../../Actions/Call';
import { isFirefox } from '../../Calls/P2P/P2PSdpBuilder';
import { p2pGetCallStatus, p2pIsCallReady } from '../../Calls/Utils';
import { getUserFullName } from '../../Utils/User';
import { stopPropagation } from '../../Utils/Message';
import CallStore from '../../Stores/CallStore';
import LStore from '../../Stores/LocalizationStore';
import UserStore from '../../Stores/UserStore';
import './CallPanel.css';

const SUPPORTS_ROTATION = true;

class CallPanel extends React.Component {
    constructor(props) {
        super(props);

        this.callPanelRef = React.createRef();

        const { callId } = props;

        this.state = {
            openSettings: false,
            contextMenu: false,
            left: 0,
            top: 0,
            fullScreen: false,

            inputMediaState: CallStore.p2pGetMediaState(callId, 'input'),
            outputMediaState: CallStore.p2pGetMediaState(callId, 'output')
        };
    }

    componentDidMount() {
        const callPanel = this.callPanelRef.current;
        if (callPanel) {
            const prefixes = ['', 'moz', 'webkit', 'ms']
            prefixes.forEach(x => {
                callPanel.addEventListener(x + 'fullscreenchange', this.handleFullScreenChange);
            });
        }

        CallStore.on('updateCall', this.handleUpdateCall);
        CallStore.on('clientUpdateCallMediaState', this.onClientUpdateCallMediaState);
    }

    componentWillUnmount() {
        const callPanel = this.callPanelRef.current;
        if (callPanel) {
            const prefixes = ['', 'moz', 'webkit', 'ms']
            prefixes.forEach(x => {
                callPanel.removeEventListener(x + 'fullscreenchange', this.handleFullScreenChange);
            });
        }

        CallStore.off('updateCall', this.handleUpdateCall);
        CallStore.off('clientUpdateCallMediaState', this.onClientUpdateCallMediaState);
    }

    onClientUpdateCallMediaState = update => {
        const { callId: currentCallId } = this.props;
        const { callId, mediaState, type } = update;
        if (callId !== currentCallId) return;

        if (type === 'input') {
            this.setState({ inputMediaState: mediaState });
        } else {
            this.setState({ outputMediaState: mediaState });
        }
    };

    handleUpdateCall = update => {
        this.forceUpdate();
    };

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
        if (event) {
            event.stopPropagation();
        }

        const { callId } = this.props;
        if (!callId) return;

        closeCallPanel();
        setTimeout(() => {
            CallStore.p2pHangUp(callId, true);
        }, 100);
    };

    handleOpenSettings = async event => {
        this.handleCloseContextMenu();

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
        if (this.isFullScreen()) {
            this.exitFullscreen();
            return;
        }

        this.handleDiscard(null);
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

    handleAudio = () => {
        const { inputMediaState } = this.state;
        if (!inputMediaState) return;

        const { muted } = inputMediaState;

        CallStore.p2pAudioEnabled(muted);
    };

    handleVideo = () => {
        const { inputMediaState } = this.state;
        if (!inputMediaState) return;

        const muted = inputMediaState.videoState === 'inactive';

        CallStore.p2pVideoEnabled(muted)
    };

    render() {
        const { callId, t } = this.props;
        const { openSettings, anchorEl, fullScreen, inputMediaState, outputMediaState } = this.state;
        const { currentCall } = CallStore;

        const call = CallStore.p2pGet(callId);
        if (!call) return null;

        const { user_id: userId, is_outgoing, state } = call;

        let screenSharing = currentCall && Boolean(currentCall.screenStream);

        let outputVideoStyle = null;
        if (SUPPORTS_ROTATION && outputMediaState && isFirefox() && !is_outgoing) {
            outputVideoStyle = {
                transform: `rotate(${outputMediaState.videoRotation}deg)`
            };
        }

        return (
            <div className={classNames('group-call-panel', { 'full-screen': fullScreen })} ref={this.callPanelRef}>
                <div className='group-call-panel-header'>
                    <div className='group-call-panel-caption-button' onMouseDown={stopPropagation} onClick={this.handleClose}>
                        <CloseIcon />
                    </div>
                    <div className='group-call-panel-caption' onMouseDown={stopPropagation} onClick={stopPropagation}>
                        <div className='group-call-title'>{getUserFullName(userId, null)}</div>
                        <div className='group-call-join-panel-subtitle'>
                            {p2pGetCallStatus(callId)}
                        </div>
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
                                onClick={this.handleOpenSettings}>
                                <ListItemText primary={t('Settings')} />
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
                        </MenuList>
                    </Popover>
                </div>
                <div className='call-panel-content scrollbars-hidden' onDoubleClick={this.handleFullScreen}>
                    <video id='call-output-video' style={outputVideoStyle} className={outputMediaState && outputMediaState.videoState === 'active' ? 'call-video-active' : 'call-video-inactive'} autoPlay={true} muted={false}/>
                    <video id='call-input-video' className={inputMediaState && inputMediaState.videoState === 'active' ? 'call-video-active' : 'call-video-inactive'} autoPlay={true} muted={true}/>
                </div>
                { outputMediaState && outputMediaState.muted && (
                    <div className='call-panel-microphone-hint'>
                        <div className='call-panel-microphone-hint-wrapper'>
                            <MicOffIcon/>
                            <div className='call-panel-microphone-hint-text'>
                                {LStore.formatString('VoipUserMicrophoneIsOff', getUserFullName(userId, null))}
                            </div>
                        </div>
                    </div>
                )}
                <div className='group-call-panel-buttons'>
                    <div className='group-call-panel-button'>
                        <div className='group-call-settings-button' onMouseDown={stopPropagation} onClick={this.handleVideo}>
                            {inputMediaState && inputMediaState.videoState === 'active' ? <VideocamIcon/> : <VideocamOffIcon/>}
                        </div>
                        <div className='group-call-panel-button-text'>
                            {inputMediaState && inputMediaState.videoState === 'active' ? t('VoipStopVideo') : t('VoipStartVideo')}
                        </div>
                    </div>
                    <div className='group-call-panel-button'>
                        <div className='group-call-panel-button-leave' onMouseDown={stopPropagation} onClick={this.handleDiscard}>
                            <CallEndIcon />
                        </div>
                        <div className='group-call-panel-button-text'>
                            {(p2pIsCallReady(callId) || is_outgoing) ? t('VoipEndCall') : t('VoipDeclineCall')}
                        </div>
                    </div>
                    {!is_outgoing && state['@type'] === 'callStatePending' && (
                        <div className='group-call-panel-button'>
                            <div className='group-call-panel-button-answer' onMouseDown={stopPropagation} onClick={this.handleAccept}>
                                <CallIcon />
                            </div>
                            <div className='group-call-panel-button-text'>
                                {t('VoipAnswerCall')}
                            </div>
                        </div>
                    )}
                    <div className='group-call-panel-button'>
                        <div className='group-call-settings-button' onMouseDown={stopPropagation} onClick={this.handleAudio}>
                            {inputMediaState && !inputMediaState.muted ? <MicIcon/> : <MicOffIcon/>}
                        </div>
                        <div className='group-call-panel-button-text'>
                            {inputMediaState && !inputMediaState.muted ? t('Mute') : t('Unmute')}
                        </div>
                    </div>
                </div>
                {openSettings && <GroupCallSettings callId={callId} onClose={this.handleCloseSettings}/>}
            </div>
        );
    }
}

CallPanel.propTypes = {
    callId: PropTypes.number
};

export default withTranslation()(CallPanel);