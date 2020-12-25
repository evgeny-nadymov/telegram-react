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
import IconButton from '@material-ui/core/IconButton';
import CallEndIcon from '../../Assets/Icons/CallEnd';
import CloseIcon from '../../Assets/Icons/Close';
import MicIcon from '../../Assets/Icons/Mic';
import MicOffIcon from '../../Assets/Icons/MicOff';
import { getChatTitle } from '../../Utils/Chat';
import { showSnackbar } from '../../Actions/Client';
import CallStore from '../../Stores/CallStore';
import LStore from '../../Stores/LocalizationStore';
import './GroupCallTopPanel.css';

class GroupCallTopPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            call: CallStore.currentGroupCall,
            status: 'muted',
            connected: false
        }
    }

    componentDidMount() {
        CallStore.on('clientUpdateGroupCall', this.handleClientUpdateGroupCall);
        CallStore.on('clientUpdateGroupCallConnectionState', this.handleClientUpdateGroupCallConnectionState);
        CallStore.on('updateGroupCall', this.handleClientUpdateGroupCall);
    }

    componentWillUnmount() {
        CallStore.off('clientUpdateGroupCall', this.handleClientUpdateGroupCall);
        CallStore.off('clientUpdateGroupCallConnectionState', this.handleClientUpdateGroupCallConnectionState);
        CallStore.off('updateGroupCall', this.handleClientUpdateGroupCall);
    }

    handleUpdateGroupCall = update => {
        const { group_call } = update;
        const { call } = this.state;
        if (!call) return;

        if (group_call.id !== call.groupCallId) return;

        this.handleClientUpdateGroupCall(update);
    };

    handleClientUpdateGroupCallConnectionState = update => {
        const { groupCallId } = update;
        const { call } = this.state;
        if (!call) return;

        if (groupCallId !== call.groupCallId) return;

        this.handleClientUpdateGroupCall(update);
    };

    handleClientUpdateGroupCall = update => {
        const { currentGroupCall: call } = CallStore;

        let connected = false;
        let status = '';
        if (call) {
            const { groupCallId, stream, connection } = call;
            const groupCall = CallStore.get(groupCallId);
            if (groupCall) {
                if (!groupCall.can_unmute_self) {
                    status = 'forceMuted';
                } else {
                    const audioTracks = stream.getAudioTracks();
                    status = audioTracks.length > 0 && audioTracks[0].enabled ? 'unmuted' : 'muted';
                }
            }
            connected = connection && connection.iceConnectionState === 'connected';
        }

        this.setState({
            call,
            status,
            connected
        });
    };

    handleMicrophone = async () => {
        const { call, status } = this.state;
        if (!call) return;

        const { chatId, groupCallId, stream } = call;

        const groupCall = CallStore.get(groupCallId);
        if (!groupCall) return;

        if (!groupCall.can_unmute_self) {
            showSnackbar(LStore.getString('VoipMutedByAdminInfo'), closeSnackbar => snackKey => {
                return (
                    <IconButton
                        key='close'
                        aria-label='Close'
                        color='inherit'
                        className='notification-close-button'
                        onClick={() => { closeSnackbar(snackKey); }}>
                        <CloseIcon />
                    </IconButton>
                )
            });
        } else {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks[0].enabled = !audioTracks[0].enabled;
                this.setState({
                    status: audioTracks[0].enabled ? 'unmuted' : 'muted'
                });
            }
        }
    };

    handleLeave = async () => {
        const { call } = this.state;
        if (!call) return;

        const { chatId, groupCallId } = call;

        await CallStore.leaveGroupCall(chatId, groupCallId);
    };

    render() {
        const { t } = this.props;
        const { call, status, connected } = this.state;
        if (!call) return null;

        const { chatId } = call;
        const title = connected ? getChatTitle(chatId).toUpperCase() : t('Connecting');

        return (
            <div className={classNames('group-call-top-panel',
                {
                    'group-call-top-panel-muted-by-admin ': connected && status === 'forceMuted',
                    'group-call-top-panel-unmuted': connected && status === 'unmuted',
                    'group-call-top-panel-connecting': !connected,

                })}>
                <IconButton className='header-player-button' style={{ color: 'white' }} onClick={this.handleMicrophone}>
                    {status === 'unmuted' ? <MicIcon fontSize='small'/> : <MicOffIcon fontSize='small' />}
                </IconButton>
                <div className='group-call-top-panel-title'>
                    {title}
                </div>
                <IconButton className='header-player-button' style={{ color: 'white' }} onClick={this.handleLeave}>
                    <CallEndIcon fontSize='small' />
                </IconButton>
            </div>
        )
    }

}

GroupCallTopPanel.propTypes = {};

export default withTranslation()(GroupCallTopPanel);