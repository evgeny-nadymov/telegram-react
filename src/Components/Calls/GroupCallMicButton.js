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
import Button from './Button';
import MicIcon from '../../Assets/Icons/Mic';
import MicOffIcon from '../../Assets/Icons/MicOff';
import { MUTE_BUTTON_STATE_CONNECTING, MUTE_BUTTON_STATE_MUTE, MUTE_BUTTON_STATE_MUTED_BY_ADMIN, MUTE_BUTTON_STATE_UNMUTE } from './TopBar';
import CallStore from '../../Stores/CallStore';
import UserStore from '../../Stores/UserStore';
import './GroupCallMicButton.css';

class GroupCallMicButton extends React.Component {
    constructor(props) {
        super(props);

        this.buttonRef = React.createRef();
        const { currentGroupCall: call } = CallStore;
        let connected = false;
        let status = '';
        let state = null;
        if (call) {
            const { groupCallId, connection } = call;
            const groupCall = CallStore.get(groupCallId);
            if (groupCall) {
                if (!groupCall.can_unmute_self) {
                    status = 'forceMuted';
                } else {
                    status = !CallStore.isMuted() ? 'unmuted' : 'muted';
                }
            }
            connected = connection && connection.iceConnectionState !== 'new' && connection.iceConnectionState !== 'connecting';
            state = connection.iceConnectionState;
        }

        this.state = {
            call,
            status,
            connected,
            state,
            animated: true
        };
    }

    componentDidMount() {
        this.switchButtonState(false);

        CallStore.on('clientUpdateOutputAmplitudeChange', this.onClientUpdateOutputAmplitudeChange);
        CallStore.on('clientUpdateGroupCall', this.onClientUpdateGroupCall);
        CallStore.on('clientUpdateGroupCallConnectionState', this.onClientUpdateGroupCallConnectionState);
        CallStore.on('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
        CallStore.on('updateGroupCall', this.onUpdateGroupCall);
    }

    componentWillUnmount() {
        CallStore.off('clientUpdateOutputAmplitudeChange', this.onClientUpdateOutputAmplitudeChange);
        CallStore.off('clientUpdateGroupCall', this.onClientUpdateGroupCall);
        CallStore.off('clientUpdateGroupCallConnectionState', this.onClientUpdateGroupCallConnectionState);
        CallStore.off('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
        CallStore.off('updateGroupCall', this.onUpdateGroupCall);
    }

    onClientUpdateOutputAmplitudeChange = update => {
        const { value } = update;

        this.buttonRef.current && this.buttonRef.current.setAmplitude(value);
    };

    switchButtonState(animated = true) {
        const { connected, status } = this.state;

        let stateId = MUTE_BUTTON_STATE_MUTE;
        if (!connected) {
            stateId = MUTE_BUTTON_STATE_CONNECTING;
        } else {
            if (status === 'forceMuted') {
                stateId = MUTE_BUTTON_STATE_MUTED_BY_ADMIN;
            } else if (status === 'unmuted') {
                stateId = MUTE_BUTTON_STATE_UNMUTE;
            } else if (status === 'muted') {
                stateId = MUTE_BUTTON_STATE_MUTE;
            }
        }


        this.buttonRef.current && this.buttonRef.current.updateMuteButton(stateId, true);
    }

    onUpdateGroupCallParticipant = update => {
        const { group_call_id, participant } = update;
        if (!participant) return;

        const { call } = this.state;
        if (!call) return;

        if (group_call_id !== call.groupCallId) return;

        const { user_id, is_muted } = participant
        if (user_id !== UserStore.getMyId()) return;

        let connected = false;
        let status = '';
        let state = null;
        if (call) {
            const { groupCallId, connection } = call;
            const groupCall = CallStore.get(groupCallId);
            if (groupCall) {
                if (!groupCall.can_unmute_self) {
                    status = 'forceMuted';
                } else {
                    status = !CallStore.isMuted() ? 'unmuted' : 'muted';
                }
            }
            connected = connection && connection.iceConnectionState !== 'new' && connection.iceConnectionState !== 'connecting';
            state = connection.iceConnectionState;
        }

        this.setState({
            status,
            connected,
            state
        }, () => {
            this.switchButtonState();
        });
    }

    onUpdateGroupCall = update => {
        const { group_call } = update;
        const { call } = this.state;
        if (!call) return;

        if (group_call.id !== call.groupCallId) return;

        this.onClientUpdateGroupCall(update);
    };

    onClientUpdateGroupCallConnectionState = update => {
        const { groupCallId } = update;
        const { call } = this.state;
        if (!call) return;

        if (groupCallId !== call.groupCallId) return;

        this.onClientUpdateGroupCall(update);
    };

    onClientUpdateGroupCall = update => {
        const { currentGroupCall: call } = CallStore;

        let connected = false;
        let status = '';
        let state = null;
        if (call) {
            const { groupCallId, connection } = call;
            const groupCall = CallStore.get(groupCallId);
            if (groupCall) {
                if (!groupCall.can_unmute_self) {
                    status = 'forceMuted';
                } else {
                    status = !CallStore.isMuted() ? 'unmuted' : 'muted';
                }
            }
            connected = connection && connection.iceConnectionState !== 'new' && connection.iceConnectionState !== 'connecting';
            state = connection.iceConnectionState;
        }

        this.setState({
            call,
            status,
            connected,
            state
        }, () => {
            this.switchButtonState();
        });
    };

    handleClick = () => {
        const { call, status } = this.state;
        if (!call) return;

        const { chatId, groupCallId, stream } = call;

        const groupCall = CallStore.get(groupCallId);
        if (!groupCall) return;

        if (!groupCall.can_unmute_self) {
            const { shook } = this.state;
            if (shook) {
                this.setState({
                    shook: false
                }, () => {
                    requestAnimationFrame(() => {
                        this.setState({ shook: true });
                    })
                });
            } else {
                this.setState({
                    shook: true
                });
            }
        } else {
            CallStore.changeMuted(!CallStore.isMuted());
        }
    };

    render() {
        const { t } = this.props;
        const { status, connected, animated, shook } = this.state;

        let title = '';
        let subtitle = '';
        if (connected) {
            switch (status) {
                case 'muted': {
                    title = t('VoipGroupUnmute');
                    // subtitle = t('VoipHoldAndTalk');
                    break;
                }
                case 'unmuted': {
                    title = t('VoipTapToMute');
                    break;
                }
                case 'forceMuted': {
                    title = t('VoipMutedByAdmin');
                    subtitle = t('VoipMutedByAdminInfo');
                    break;
                }
            }
        } else {
            title = t('Connecting');
        }

        return (
            <div className='group-call-mic-button-wrapper' >
                {animated ? (
                    <Button ref={this.buttonRef} onClick={this.handleClick}>
                        {connected && status === 'unmuted' ? <MicIcon style={{ fontSize: 36 }}/> : <MicOffIcon style={{ fontSize: 36 }}/>}
                    </Button>
                ) : (
                    <div className={classNames('group-call-mic-button',
                        {
                            'group-call-muted-by-admin ': connected && status === 'forceMuted',
                            'group-call-unmuted': connected && status === 'unmuted',
                            'group-call-connecting': !connected,
                        })}
                         onClick={this.handleClick}
                    >
                        {connected && status === 'unmuted' ? <MicIcon style={{ fontSize: 36 }}/> : <MicOffIcon style={{ fontSize: 36 }}/>}
                    </div>
                )}
                <div className={classNames('group-call-mic-button-description', { 'shook-horizontal': shook })}>
                    <div className='group-call-mic-button-description-title'>{title}</div>
                    {subtitle && <div className='group-call-mic-button-description-subtitle'>{subtitle}</div>}
                </div>
            </div>
        )
    }
}

GroupCallMicButton.propTypes = {
    groupCallId: PropTypes.number,
    onClick: PropTypes.func
};

export default withTranslation()(GroupCallMicButton);