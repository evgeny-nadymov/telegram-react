/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import Switch from '@material-ui/core/Switch';
import CloseIcon from '../../Assets/Icons/Close';
import CallSettingsVideoPreview from './CallSettingsVideoPreview';
import GroupCallMicAmplitude from './GroupCallMicAmplitude';
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import { modalManager } from '../../Utils/Modal';
import { copy } from '../../Utils/Text';
import { canManageVoiceChats, getChatUsername } from '../../Utils/Chat';
import { getStream } from '../../Calls/Utils';
import { showSnackbar } from '../../Actions/Client';
import { stopPropagation } from '../../Utils/Message';
import CallStore from '../../Stores/CallStore';
import OptionStore from '../../Stores/OptionStore';
import './GroupCallSettings.css';

class GroupCallSettings extends React.Component {
    constructor(props) {
        super(props);

        this.keyboardHandler = new KeyboardHandler(this.onKeyDown);

        this.state = { };
    }

    onKeyDown = event => {
        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        const { key } = event;
        switch (key) {
            case 'Escape': {
                const { openDeviceSelect } = this.state;
                if (openDeviceSelect) {
                    this.handleCloseDeviceSelect();
                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }

                this.handleCancel();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }
    };

    static getDerivedStateFromProps(props, state) {
        const { groupCallId, callId } = props;
        const { prevGroupCallId, prevCallId } = state;

        if (prevGroupCallId !== groupCallId) {
            const { devices } = CallStore;

            const outputDeviceId = CallStore.getOutputDeviceId();
            const output = (devices || []).filter(x => x.kind === 'audiooutput' && x.deviceId);

            const inputAudioDeviceId = CallStore.getInputAudioDeviceId();
            const inputAudio = (devices || []).filter(x => x.kind === 'audioinput' && x.deviceId);

            const inputVideoDeviceId = CallStore.getInputVideoDeviceId();
            const inputVideo = (devices || []).filter(x => x.kind === 'videoinput' && x.deviceId);

            let muteSettings = { };
            const groupCall = CallStore.get(groupCallId);
            if (groupCall) {
                const {
                    mute_new_participants: muteNewParticipants,
                    allowed_change_mute_new_participants: allowedChangeMuteNewParticipants
                } = groupCall;

                muteSettings = {
                    muteNewParticipants,
                    allowedChangeMuteNewParticipants
                }
            }

            return {
                prevGroupCallId: groupCallId,
                devices,
                outputDeviceId,
                output,
                inputAudioDeviceId,
                inputAudio,
                inputVideoDeviceId,
                inputVideo,
                ...muteSettings
            };
        } else if (prevCallId !== callId) {
            const { devices } = CallStore;

            const outputDeviceId = CallStore.getOutputDeviceId();
            const output = (devices || []).filter(x => x.kind === 'audiooutput' && x.deviceId);

            const inputAudioDeviceId = CallStore.getInputAudioDeviceId();
            const inputAudio = (devices || []).filter(x => x.kind === 'audioinput' && x.deviceId);

            const inputVideoDeviceId = CallStore.getInputVideoDeviceId();
            const inputVideo = (devices || []).filter(x => x.kind === 'videoinput' && x.deviceId);

            return {
                prevCallId: callId,
                devices,
                outputDeviceId,
                output,
                inputAudioDeviceId,
                inputAudio,
                inputVideoDeviceId,
                inputVideo
            };
        }

        return null;
    }

    componentDidMount() {
        this.handleSelectDevice('inputAudio', CallStore.getInputAudioDeviceId());
        this.handleSelectDevice('inputVideo', CallStore.getInputVideoDeviceId());
        navigator.mediaDevices.addEventListener('devicechange', this.onDeviceChange);
        // navigator.permissions.addEventListener('onchange', this.onDeviceChange);
        KeyboardManager.add(this.keyboardHandler);
        CallStore.on('updateGroupCall', this.onUpdateGroupCall);
    }

    componentWillUnmount() {
        navigator.mediaDevices.removeEventListener('devicechange', this.onDeviceChange);
        // navigator.permissions.removeEventListener('onchange', this.onDeviceChange);
        KeyboardManager.remove(this.keyboardHandler);
        CallStore.off('updateGroupCall', this.onUpdateGroupCall);

        this.closeStreams();
    }

    closeStreams() {
        const { inputAudioStream, inputAudioDeviceId, inputVideoStream, inputVideoDeviceId } = this.state;
        if (inputAudioStream) {
            if (!CallStore.currentGroupCall && !CallStore.currentCall || inputAudioDeviceId === CallStore.getInputAudioDeviceId()) {
                inputAudioStream.getAudioTracks().forEach(x => {
                    x.stop();
                });
            }
        }

        if (inputVideoStream) {
            if (!CallStore.currentGroupCall && !CallStore.currentCall || inputVideoDeviceId === CallStore.getInputVideoDeviceId()) {
                inputVideoStream.getVideoTracks().forEach(x => {
                    x.stop();
                });
            }
        }
    }

    onUpdateGroupCall = update => {
        const { groupCallId } = this.props;
        const { group_call } = update;
        if (!group_call) return;

        const {
            id,
            mute_new_participants: muteNewParticipants,
            allowed_change_mute_new_participants: allowedChangeMuteNewParticipants
        } = group_call;
        if (id !== groupCallId) return;

        this.setState({
            muteNewParticipants,
            allowedChangeMuteNewParticipants
        });
    };

    onDeviceChange = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        CallStore.devices = devices;

        const outputDeviceId = CallStore.getOutputDeviceId();
        const output = (devices || []).filter(x => x.kind === 'audiooutput' && x.deviceId);

        const inputAudioDeviceId = CallStore.getInputAudioDeviceId();
        const inputAudio = (devices || []).filter(x => x.kind === 'audioinput' && x.deviceId);

        const inputVideoDeviceId = CallStore.getInputVideoDeviceId();
        const inputVideo = (devices || []).filter(x => x.kind === 'videoinput' && x.deviceId);

        this.setState({
            devices,
            outputDeviceId,
            output,
            inputAudioDeviceId,
            inputAudio,
            inputVideoDeviceId,
            inputVideo
        });
    };

    handleOutputChange = event => {
        const outputDeviceId = event.target.value;

        this.setState({ outputDeviceId });
    }

    handleCopyLink = () => {
        const { t } = this.props;
        const { currentGroupCall } = CallStore;

        const username = getChatUsername(currentGroupCall ? currentGroupCall.chatId : 0);
        if (!username) return;

        const telegramUrlOption = OptionStore.get('t_me_url');
        const usernameLink = telegramUrlOption ? telegramUrlOption.value : 'https://telegram.org/';

        copy(usernameLink + username);
        showSnackbar(t('LinkCopied'), closeSnackbar => snackKey => {
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
    };

    handleOpenDeviceSelect = async type => {
        switch (type) {
            case 'inputAudio': {
                const { inputAudio } = this.state;
                if (!inputAudio.length) {
                    return;
                }
                break;
            }
            case 'output': {
                const { output } = this.state;
                if (!output.length) {
                    return;
                }
                break;
            }
        }

        this.setState({
            openDeviceSelect: { type }
        });
    };

    handleCloseDeviceSelect = () => {
        this.setState({
            openDeviceSelect: null
        });
    };

    handleSelectDevice = async (type, deviceId) => {
        this.handleCloseDeviceSelect();

        switch (type) {
            case 'output': {
                CallStore.setOutputDeviceId(deviceId);
                this.setState({
                    outputDeviceId: deviceId
                });
                break;
            }
            case 'inputAudio': {
                const { currentGroupCall, currentCall } = CallStore;
                if (currentGroupCall) {
                    const { streamManager } = currentGroupCall;
                    if (!streamManager) return;

                    const { inputAudioStream, inputAudioDeviceId } = this.state;
                    if (inputAudioDeviceId === deviceId && inputAudioStream) return;

                    if (inputAudioStream) {
                        inputAudioStream.getAudioTracks().forEach(t => {
                            t.stop()
                        });
                    }

                    const stream = await getStream({
                        audio: { deviceId: { exact: deviceId } },
                        video: false
                    });

                    this.setState({
                        inputAudioDeviceId: deviceId,
                        inputAudioStream: stream
                    });
                } else if (currentCall) {
                    const { inputAudioStream, inputAudioDeviceId } = this.state;
                    if (inputAudioDeviceId === deviceId && inputAudioStream) return;

                    if (inputAudioStream) {
                        inputAudioStream.getAudioTracks().forEach(t => {
                            t.stop()
                        });
                    }

                    const stream = await getStream({
                        audio: { deviceId: { exact: deviceId } },
                        video: false
                    });

                    this.setState({
                        inputAudioDeviceId: deviceId,
                        inputAudioStream: stream
                    });
                }
                break;
            }
            case 'inputVideo': {
                const { currentCall } = CallStore;
                if (!currentCall) return;

                const { inputVideoStream, inputVideoDeviceId } = this.state;

                if (inputVideoDeviceId === deviceId && inputVideoStream) return;

                if (inputVideoStream) {
                    inputVideoStream.getVideoTracks().forEach(t => {
                        t.stop()
                    });
                }

                const stream = await getStream({
                    audio: false,
                    video: { deviceId: { exact: deviceId } }
                });

                this.setState({
                    inputVideoDeviceId: deviceId,
                    inputVideoStream: stream
                });
                break;
            }
        }
    };

    handleEnd = () => {
        const { currentGroupCall: call } = CallStore;
        if (!call) return;

        const { chatId, groupCallId } = call;

        CallStore.leaveGroupCall(chatId, groupCallId, true);
    };

    handleMuteNewParticipants = () => {
        const { groupCallId } = this.props;
        const { muteNewParticipants } = this.state;

        this.setState({
            muteNewParticipants: !muteNewParticipants
        });

        CallStore.toggleMuteNewParticipants(groupCallId, !muteNewParticipants);
    };

    handleDone = async () => {
        const { onClose } = this.props;
        const { inputAudioDeviceId, inputAudioStream, inputVideoDeviceId, inputVideoStream } = this.state;

        if (inputAudioStream && inputAudioDeviceId !== CallStore.getInputAudioDeviceId()) {
            await CallStore.setInputAudioDeviceId(inputAudioDeviceId, inputAudioStream);
        }

        if (inputVideoStream && inputVideoDeviceId !== CallStore.getInputVideoDeviceId()) {
            await CallStore.setInputVideoDeviceId(inputVideoDeviceId, inputVideoStream);
        }

        onClose && onClose();
    };

    handleCancel = () => {
        const { onClose } = this.props;

        onClose && onClose();
    };

    render() {
        const { callId, t } = this.props;
        const {
            inputAudioDeviceId,
            inputAudioStream,
            inputAudio,
            inputVideoDeviceId,
            inputVideoStream,
            inputVideo,
            outputDeviceId,
            output,
            openDeviceSelect,
            muteNewParticipants,
            allowedChangeMuteNewParticipants
        } = this.state;


        const outputDeviceInfo = output.find(x => x.deviceId === outputDeviceId || !outputDeviceId && x.deviceId === 'default');
        const outputString = !outputDeviceInfo || outputDeviceInfo.deviceId === 'default' || !outputDeviceInfo.deviceId || !outputDeviceInfo.label ? t('Default') : outputDeviceInfo.label;

        const inputAudioDeviceInfo = inputAudio.find(x => x.deviceId === inputAudioDeviceId || !inputAudioDeviceId && x.deviceId === 'default');
        const inputAudioString = !inputAudioDeviceInfo || inputAudioDeviceInfo.deviceId === 'default' || !inputAudioDeviceInfo.deviceId || !inputAudioDeviceInfo.label ? t('Default') : inputAudioDeviceInfo.label;

        const inputVideoDeviceInfo = inputVideo.find(x => x.deviceId === inputVideoDeviceId || !inputVideoDeviceId && x.deviceId === 'default');
        const inputVideoString = !inputVideoDeviceInfo || inputVideoDeviceInfo.deviceId === 'default' || !inputVideoDeviceInfo.deviceId || !inputVideoDeviceInfo.label ? t('Default') : inputVideoDeviceInfo.label;

        const { currentGroupCall } = CallStore;
        const chatId = currentGroupCall ? currentGroupCall.chatId : 0;

        const username = getChatUsername(chatId);

        if (openDeviceSelect) {
            const { type } = openDeviceSelect;
            let items = [];
            let deviceId = null;
            switch (type) {
                case 'output': {
                    items = output;
                    deviceId = outputDeviceId;
                    break;
                }
                case 'inputAudio': {
                    items = inputAudio;
                    deviceId = inputAudioDeviceId;
                    break;
                }
                case 'inputVideo': {
                    items = inputVideo;
                    deviceId = inputVideoDeviceId;
                    break;
                }
            }

            return (
                <div className='group-call-settings-device-select'>
                    <div className='group-call-settings-panel'>
                        <div className='group-call-settings-panel-header'>
                            <div className='group-call-panel-caption'>
                                <div className='group-call-title'>{type === 'output' ? t('OutputDevice') : t('InputDevice')}</div>
                            </div>
                        </div>
                        <div className='group-call-settings-panel-content'>
                            {items.map(x => (
                                <div key={x.deviceId} className='group-call-settings-panel-item' onClick={() => this.handleSelectDevice(type, x.deviceId)}>
                                    <div className='group-call-settings-panel-item-title'>{x.label || t('Default')}</div>
                                </div>
                            ))}
                        </div>
                        <div className='group-call-settings-panel-buttons'>
                            <div className='group-call-settings-panel-done' onClick={this.handleCloseDeviceSelect}>
                                {t('OK')}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }



        const canManage = canManageVoiceChats(chatId);
        // console.log('[call][GroupCallSettings] render', muteNewParticipants, allowedChangeMuteNewParticipants);

        return (
            <div className='group-call-settings' onMouseDown={stopPropagation} onClick={this.handleCancel}>
                <div className='group-call-settings-panel' onClick={stopPropagation}>
                    <div className='group-call-settings-panel-header'>
                        <div className='group-call-panel-caption'>
                            <div className='group-call-title'>{t('Settings')}</div>
                        </div>
                    </div>
                    <div className='group-call-settings-panel-content'>
                        { canManage && allowedChangeMuteNewParticipants && (
                            <div className='group-call-settings-panel-item' onClick={this.handleMuteNewParticipants}>
                                <div className='group-call-settings-panel-item-title'>{t('VoipGroupOnlyAdminsCanSpeak')}</div>
                                <Switch
                                    disableRipple
                                    classes={{
                                        root: 'group-call-settings-panel-switch-root',
                                        switchBase: 'group-call-settings-panel-switch-base',
                                        colorSecondary: 'group-call-settings-panel-switch-color-secondary',
                                        checked: 'group-call-settings-panel-switch-checked',
                                        track: 'group-call-settings-panel-switch-track'
                                    }}
                                    checked={muteNewParticipants}
                                    onChange={this.handleMuteNewParticipants}/>
                            </div>
                        )}

                        <div className='group-call-settings-panel-item' onClick={() => this.handleOpenDeviceSelect('output')}>
                            <div className='group-call-settings-panel-item-title'>{t('Speaker')}</div>
                            <div className='group-call-settings-panel-item-subtitle'>{outputString}</div>
                        </div>

                        <div className='group-call-settings-panel-item' onClick={() => this.handleOpenDeviceSelect('inputAudio')}>
                            <div className='group-call-settings-panel-item-title'>{t('Microphone')}</div>
                            <div className='group-call-settings-panel-item-subtitle'>{inputAudioString}</div>
                        </div>

                        <GroupCallMicAmplitude stream={inputAudioStream}/>

                        { callId && (
                            <>
                                <div className='group-call-settings-panel-item' onClick={() => this.handleOpenDeviceSelect('inputVideo')}>
                                    <div className='group-call-settings-panel-item-title'>{t('Camera')}</div>
                                    <div className='group-call-settings-panel-item-subtitle'>{inputVideoString}</div>
                                </div>
                                <CallSettingsVideoPreview stream={inputVideoStream}/>
                                {/*<div>*/}
                                {/*    <video id='call-settings-video' autoPlay={true} muted={true}/>*/}
                                {/*</div>*/}
                            </>
                        )}
                        { username && (
                            <div className='group-call-settings-panel-item' onClick={this.handleCopyLink}>
                                {t('VoipGroupCopyInviteLink')}
                            </div>
                        )}
                        { canManage && (
                            <div className='group-call-settings-panel-item group-call-settings-panel-item-secondary' onClick={this.handleEnd}>
                                {t('VoipGroupEndChat')}
                            </div>
                        )}
                    </div>
                    <div className='group-call-settings-panel-buttons'>
                        <div className='group-call-settings-panel-done' onClick={this.handleDone}>
                            {t('Done')}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

GroupCallSettings.propTypes = {
    callId: PropTypes.number,
    groupCallId: PropTypes.number,
    onClose: PropTypes.func
};

export default withTranslation()(GroupCallSettings);