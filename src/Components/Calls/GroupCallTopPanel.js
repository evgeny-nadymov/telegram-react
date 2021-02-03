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
import { openGroupCallPanel } from '../../Actions/Call';
import { showSnackbar } from '../../Actions/Client';
import CallStore from '../../Stores/CallStore';
import LStore from '../../Stores/LocalizationStore';
import UserStore from '../../Stores/UserStore';
import './GroupCallTopPanel.css';

class GroupCallTopPanel extends React.Component {
    constructor(props) {
        super(props);

        const { currentGroupCall: call } = CallStore;
        let connected = false;
        let status = '';
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
            connected = connection && connection.iceConnectionState === 'connected';
        }

        this.state = {
            call,
            status,
            connected
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { call, status, connected } = this.state;

        if (nextState.call !== call) {
            return true;
        }

        if (nextState.status !== status) {
            return true;
        }

        if (nextState.connected !== connected) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        CallStore.on('clientUpdateGroupCall', this.onClientUpdateGroupCall);
        CallStore.on('clientUpdateGroupCallConnectionState', this.onClientUpdateGroupCallConnectionState);
        CallStore.on('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
        CallStore.on('updateGroupCall', this.onUpdateGroupCall);
    }

    componentWillUnmount() {
        CallStore.off('clientUpdateGroupCall', this.onClientUpdateGroupCall);
        CallStore.off('clientUpdateGroupCallConnectionState', this.onClientUpdateGroupCallConnectionState);
        CallStore.off('updateGroupCallParticipant', this.onUpdateGroupCallParticipant);
        CallStore.off('updateGroupCall', this.onUpdateGroupCall);
    }

    onUpdateGroupCallParticipant = update => {
        const { group_call_id, participant } = update;
        if (!participant) return;

        const { call } = this.state;
        if (!call) return;

        if (group_call_id !== call.groupCallId) return;

        const { user_id } = participant;
        if (user_id !== UserStore.getMyId()) return;

        let connected = false;
        let status = '';
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
            // connected = connection && connection.iceConnectionState !== 'new' && connection.iceConnectionState !== 'connecting';
        }

        this.setState({
            status
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
        }

        this.saveMessagesScrollPosition();
        this.setState({
            call,
            status,
            connected
        }, () => {
            this.restoreMessagesScrollPosition(Boolean(call));
        });
    };

    saveMessagesScrollPosition() {
        const elements = document.getElementsByClassName('messages-list-wrapper');
        if (!elements.length) return;

        [...elements].forEach(x => {
            const list = x;
            if (!list) return;

            const prevOffsetHeight = list.offsetHeight;
            const prevScrollTop = list.scrollTop;

            list.prevOffsetHeight = prevOffsetHeight;
            list.prevScrollTop = prevScrollTop;
        });
    }

    restoreMessagesScrollPosition(openPanel = true) {
        const elements = document.getElementsByClassName('messages-list-wrapper');
        if (!elements.length) return;

        [...elements].forEach(x => {
            const list = x;
            if (!list) return;

            const { prevScrollTop, prevOffsetHeight } = list;
            if (list.scrollTop === prevScrollTop) {
                const offsetHeightDiff = Math.abs(prevOffsetHeight - list.offsetHeight);
                list.scrollTop += openPanel ? offsetHeightDiff : - offsetHeightDiff;
            }
        });
    }

    handleMicrophone = async event => {
        event.stopPropagation();

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
            CallStore.changeMuted(!CallStore.isMuted());
        }
    };

    handleLeave = async event => {
        event.stopPropagation();

        const { call } = this.state;
        if (!call) return;

        const { chatId, groupCallId } = call;

        await CallStore.leaveGroupCall(chatId, groupCallId);
    };

    handleOpenGroupCall = () => {
        const { call } = this.state;
        if (!call) return;

        openGroupCallPanel();
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

                })}
                onClick={this.handleOpenGroupCall}
            >
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