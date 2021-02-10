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
import CloseIcon from '../../Assets/Icons/Close';
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import { modalManager } from '../../Utils/Modal';
import { copy } from '../../Utils/Text';
import { canManageVoiceChats, getChatUsername } from '../../Utils/Chat';
import { showSnackbar } from '../../Actions/Client';
import CallStore from '../../Stores/CallStore';
import OptionStore from '../../Stores/OptionStore';
import './GroupCallSettings.css';
import { getStream } from '../../Calls/Utils';

class GroupCallSettings extends React.Component {
    constructor(props) {
        super(props);

        this.keyboardHandler = new KeyboardHandler(this.onKeyDown);

        this.state = {

        };
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
                const { onClose } = this.props;
                const { openDeviceSelect } = this.state;
                if (openDeviceSelect) {
                    this.handleCloseDeviceSelect();
                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }

                onClose && onClose();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
        }
    };

    static getDerivedStateFromProps(props, state) {
        const { groupCallId } = props;
        const { prevGroupCallId } = state;

        if (prevGroupCallId !== groupCallId) {
            const { devices } = CallStore;

            const outputDeviceId = CallStore.getOutputDeviceId();
            const output = (devices || []).filter(x => x.kind === 'audiooutput');

            const inputAudioDeviceId = CallStore.getInputAudioDeviceId();
            const inputAudio = (devices || []).filter(x => x.kind === 'audioinput');

            const inputVideoDeviceId = CallStore.getInputVideoDeviceId();
            const inputVideo = (devices || []).filter(x => x.kind === 'videoinput');

            return {
                prevGroupCallId: groupCallId,
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
        navigator.mediaDevices.addEventListener('devicechange', this.onDeviceChange);
        KeyboardManager.add(this.keyboardHandler);
    }

    componentWillUnmount() {
        navigator.mediaDevices.removeEventListener('devicechange', this.onDeviceChange);
        KeyboardManager.remove(this.keyboardHandler);
    }

    onDeviceChange = async () => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        CallStore.devices = devices;

        const outputDeviceId = CallStore.getOutputDeviceId();
        const output = (devices || []).filter(x => x.kind === 'audiooutput');

        const inputAudioDeviceId = CallStore.getInputAudioDeviceId();
        const inputAudio = (devices || []).filter(x => x.kind === 'audioinput');

        const inputVideoDeviceId = CallStore.getInputVideoDeviceId();
        const inputVideo = (devices || []).filter(x => x.kind === 'videoinput');

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

    handlePanelClick = event => {
        event.stopPropagation();
    };

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
        this.setState({
            openDeviceSelect: { type }
        });
    };

    handleCloseDeviceSelect = () => {
        this.setState({
            openDeviceSelect: null
        });
    };

    handleSelectDevice = (type, deviceId) => {
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
                // const stream = getStream({
                //     audio: { exact: deviceId },
                //     video: false
                // });
                //
                // this.setState({
                //     inputAudioDeviceId: deviceId,
                //     inputAudioStream: stream
                // });
                break;
            }
            case 'inputVideo': {
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

    render() {
        const { t, onClose } = this.props;
        const {
            inputAudioDeviceId,
            inputAudio,
            inputVideoDeviceId,
            inputVideo,
            outputDeviceId,
            output,
            openDeviceSelect
        } = this.state;

        const outputDeviceInfo = output.find(x => x.deviceId === outputDeviceId || !outputDeviceId && x.deviceId === 'default');
        const outputString = !outputDeviceInfo || outputDeviceInfo.deviceId === 'default' || !outputDeviceInfo.label ? t('Default') : outputDeviceInfo.label;

        const inputAudioDeviceInfo = inputAudio.find(x => x.deviceId === inputAudioDeviceId || !inputAudioDeviceId && x.deviceId === 'default');
        const inputAudioString = !inputAudioDeviceInfo || inputAudioDeviceInfo.deviceId === 'default' || !inputAudioDeviceInfo.label ? t('Default') : inputAudioDeviceInfo.label;

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
                    <div className='group-call-settings-panel' onClick={this.handlePanelClick}>
                        <div className='group-call-settings-panel-header'>
                            <div className='group-call-panel-caption'>
                                <div className='group-call-title'>{type === 'output' ? t('OutputDevice') : t('InputDevice')}</div>
                            </div>
                        </div>
                        <div className='group-call-settings-panel-content'>
                            {items.map(x => (
                                <div key={x.deviceId} className='group-call-settings-panel-item' onClick={() => this.handleSelectDevice(type, x.deviceId)}>
                                    <div className='group-call-settings-panel-item-title'>{x.label}</div>
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

        let d = '';
        const rects = [];
        for (let i = 0; i < 35; i++) {
            const x = i * 8;
            rects.push(<rect key={i} x={x} y={0} height={18} width={3} fill='currentColor' rx={1} ry={1} strokeWidth={0}/>);
        }

        const svg = (
            <svg className='waveform-bars' viewBox='0 0 275 18' style={{ width: 275, height: 18, color: '#91979E', padding: '10px 22px' }}>
                {rects}
            </svg>
        );

        const canManage = canManageVoiceChats(chatId);

        return (
            <>
                <div className='group-call-settings'>
                    <div className='group-call-settings-panel' onClick={this.handlePanelClick}>
                        <div className='group-call-settings-panel-header'>
                            <div className='group-call-panel-caption'>
                                <div className='group-call-title'>{t('Settings')}</div>
                            </div>
                        </div>
                        <div className='group-call-settings-panel-content'>
                            <div className='group-call-settings-panel-item' onClick={() => this.handleOpenDeviceSelect('output')}>
                                <div className='group-call-settings-panel-item-title'>{t('Speaker')}</div>
                                <div className='group-call-settings-panel-item-subtitle'>{outputString}</div>
                            </div>

                            <div className='group-call-settings-panel-item' onClick={() => this.handleOpenDeviceSelect('inputAudio')}>
                                <div className='group-call-settings-panel-item-title'>{t('Microphone')}</div>
                                <div className='group-call-settings-panel-item-subtitle'>{inputAudioString}</div>
                            </div>
                            {svg}

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
                            <div className='group-call-settings-panel-done' onClick={onClose}>
                                {t('Done')}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

GroupCallSettings.propTypes = {
    groupCallId: PropTypes.number,
    onClose: PropTypes.func
};

export default withTranslation()(GroupCallSettings);