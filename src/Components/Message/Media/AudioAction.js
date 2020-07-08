/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getDownloadedSize, getUploadedSize, getFileSize } from '../../../Utils/File';
import { getDurationString } from '../../../Utils/Common';
import FileStore from '../../../Stores/FileStore';
import PlayerStore from '../../../Stores/PlayerStore';
import './AudioAction.css';

class AudioAction extends React.Component {
    constructor(props) {
        super(props);

        const { message, time } = PlayerStore;
        const { chatId, messageId, duration, file, streaming } = this.props;

        const active = message && message.chat_id === chatId && message.id === messageId;
        const currentTime = active && time ? time.currentTime : 0;
        const audioDuration = active && time && time.duration ? time.duration : duration;
        const currentFile = FileStore.get(file.id) || file;

        this.state = {
            active: active,
            currentTime: currentTime,
            seekProgress: 0,
            duration: audioDuration,
            timeString: this.getTimeString(currentTime, duration, active, currentFile, streaming),

            prevFile: null,
            file: currentFile
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { theme } = this.props;
        const { active, timeString, file, prevFile } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextState.timeString !== timeString) {
            return true;
        }

        if (nextState.active !== active) {
            return true;
        }

        if (nextState.file !== file) {
            return true;
        }

        if (nextState.prevFile !== prevFile) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        FileStore.on('updateFile', this.onUpdateFile);

        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
        PlayerStore.on('clientUpdateMediaSeeking', this.onClientUpdateMediaSeeking);
        PlayerStore.on('clientUpdateMediaSeek', this.onClientUpdateMediaSeek);
    }

    componentWillUnmount() {
        FileStore.off('updateFile', this.onUpdateFile);

        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.off('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
        PlayerStore.off('clientUpdateMediaSeeking', this.onClientUpdateMediaSeeking);
        PlayerStore.off('clientUpdateMediaSeek', this.onClientUpdateMediaSeek);
    }

    onClientUpdateMediaSeeking = update => {
        const { chatId, messageId, duration, streaming } = this.props;
        const { duration: playerDuration, active, file } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            const d = playerDuration || duration;

            this.setState({
                seekProgress: update.value,
                seeking: true,
                timeString: this.getTimeString(d * update.value, d, active, file, streaming)
            });
        }
    };

    onClientUpdateMediaSeek = update => {
        const { chatId, messageId, duration, streaming } = this.props;
        const { duration: playerDuration, active, file } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            const d = playerDuration || duration;

            this.setState({
                seekProgress: 0,
                seeking: false,
                timeString: this.getTimeString(d * update.value, d, active, file, streaming)
            });
        }
    };

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId, duration, streaming } = this.props;
        const { active, file } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            const playerDuration = update.duration >= 0 && update.duration < Infinity ? update.duration : duration;
            this.setState({
                active: false,
                currentTime: 0,
                timeString: this.getTimeString(0, playerDuration, false, file, streaming)
            });
        }
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId, duration, streaming } = this.props;
        const { active, file, seekProgress, seeking } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            const playerDuration = update.duration >= 0 && update.duration < Infinity ? update.duration : duration;
            const time = seeking ? seekProgress * playerDuration : update.currentTime;

            this.setState({
                currentTime: update.currentTime,
                duration: playerDuration,
                timeString: this.getTimeString(time, playerDuration, active, file, streaming)
            });
        }
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, duration, streaming } = this.props;
        const { active, currentTime, file } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                active: true,
                currentTime: active ? currentTime : 0,
                timeString: active ? this.state.timeString : this.getTimeString(0, duration, true, file, streaming)
            });
        } else if (active) {
            this.setState({
                active: false,
                currentTime: 0,
                timeString: this.getTimeString(0, duration, false, file, streaming)
            });
        }
    };

    onUpdateFile = update => {
        const currentFile = this.state.file;
        const nextFile = update.file;

        if (currentFile && currentFile.id === nextFile.id) {
            this.setState({ file: nextFile, prevFile: currentFile });
        }
    };

    getTimeString = (currentTime, duration, active, file, streaming) => {
        const isDownloadingCompleted = file.local && file.local.is_downloading_completed || streaming;
        const isUploadingCompleted = file.remote && file.remote.is_uploading_completed;

        const durationString = getDurationString(Math.floor(duration || 0));
        const currentTimeString = getDurationString(Math.floor(currentTime || 0));

        return active && isDownloadingCompleted ? `${currentTimeString} / ${durationString}` : `${durationString}`;
    };

    render() {
        const { title, meta, streaming } = this.props;
        const { active, file, timeString } = this.state;
        if (!file) return null;

        const isDownloadingActive = file.local && file.local.is_downloading_active && !streaming;
        const isUploadingActive = file.remote && file.remote.is_uploading_active;
        const isDownloadingCompleted = file.local && file.local.is_downloading_completed || streaming;
        const isUploadingCompleted = file.remote && file.remote.is_uploading_completed;

        const size = getFileSize(file);
        let progressSize = null;
        if (isDownloadingActive) {
            progressSize = getDownloadedSize(file);
        } else if (isUploadingActive) {
            progressSize = getUploadedSize(file);
        }
        // const sizeString = progressSize ? `${progressSize} / ${size}` : `${size}`;
        const sizeString = progressSize ? `${progressSize}` : `${size}`;
        const strings = [];
        if (!isDownloadingCompleted) {
            strings.push(sizeString);
        } else if (streaming && !active) {
            strings.push(sizeString);
        }
        if (!isDownloadingActive) {
            strings.push(timeString);
        }

        return (
            <div className='audio-action'>
                {!active && <span>{title}</span>}
                {<span>{strings.join(', ')}</span>}
                {meta}
            </div>
        );
    }
}

AudioAction.defaultProps = {
    streaming: false
}

AudioAction.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    duration: PropTypes.number.isRequired,
    file: PropTypes.object.isRequired,

    title: PropTypes.string,
    streaming: PropTypes.bool
};

export default AudioAction;
