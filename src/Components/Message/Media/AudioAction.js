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
import { isCurrentSource } from '../../../Utils/Player';

class AudioAction extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, messageId, block, duration, file, streaming } = this.props;
        const { message, block: playerBlock, time } = PlayerStore;

        const active = message && message.chat_id === chatId && message.id === messageId || block === playerBlock;
        const currentTime = active && time ? time.currentTime : 0;
        const audioDuration = active && time && time.duration ? time.duration : duration;
        const currentFile = FileStore.get(file.id) || file;

        this.state = {
            active,
            currentTime,
            seekProgress: 0,
            duration: audioDuration,
            timeString: AudioAction.getTimeString(currentTime, duration, active, currentFile, streaming),

            prevFile: null,
            file: currentFile
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { active, timeString, file, prevFile } = this.state;

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
        const { chatId, messageId, block, duration, streaming } = this.props;
        const { duration: playerDuration, active, file } = this.state;
        const { source, value } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        const d = playerDuration || duration;

        this.setState({
            seekProgress: value,
            seeking: true,
            timeString: AudioAction.getTimeString(d * value, d, active, file, streaming)
        });
    };

    onClientUpdateMediaSeek = update => {
        const { chatId, messageId, block, duration, streaming } = this.props;
        const { duration: playerDuration, active, file } = this.state;
        const { source, value } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        const d = playerDuration || duration;

        this.setState({
            seekProgress: 0,
            seeking: false,
            timeString: AudioAction.getTimeString(d * value, d, active, file, streaming)
        });
    };

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId, block, duration, streaming } = this.props;
        const { active, file } = this.state;
        const { source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        const playerDuration = update.duration >= 0 && update.duration < Infinity ? update.duration : duration;
        this.setState({
            active: false,
            currentTime: 0,
            timeString: AudioAction.getTimeString(0, playerDuration, false, file, streaming)
        });
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId, block, duration, streaming } = this.props;
        const { active, file, seekProgress, seeking } = this.state;
        const { source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        const playerDuration = update.duration >= 0 && update.duration < Infinity ? update.duration : duration;
        const time = seeking ? seekProgress * playerDuration : update.currentTime;

        this.setState({
            currentTime: update.currentTime,
            duration: playerDuration,
            timeString: AudioAction.getTimeString(time, playerDuration, active, file, streaming)
        });
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, block, duration, streaming } = this.props;
        const { active, currentTime, file } = this.state;
        const { source } = update;

        if (isCurrentSource(chatId, messageId, block, source)) {
            this.setState({
                active: true,
                currentTime: active ? currentTime : 0,
                timeString: active ? this.state.timeString : AudioAction.getTimeString(0, duration, true, file, streaming)
            });
        } else if (active) {
            this.setState({
                active: false,
                currentTime: 0,
                timeString: AudioAction.getTimeString(0, duration, false, file, streaming)
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

    static getTimeString(currentTime, duration, active, file, streaming) {
        const isDownloadingCompleted = file.local && file.local.is_downloading_completed || streaming;
        const isUploadingCompleted = file.remote && file.remote.is_uploading_completed;

        const durationString = getDurationString(Math.floor(duration || 0));
        const currentTimeString = getDurationString(Math.floor(currentTime || 0));

        return active && isDownloadingCompleted ? `${currentTimeString} / ${durationString}` : `${durationString}`;
    }

    render() {
        const { date, meta, streaming } = this.props;
        const { active, file, timeString } = this.state;
        if (!file) return null;

        const isDownloadingActive = file.local && file.local.is_downloading_active;
        const isUploadingActive = file.remote && file.remote.is_uploading_active;
        const isDownloadingCompleted = file.local && file.local.is_downloading_completed;
        const isUploadingCompleted = file.remote && file.remote.is_uploading_completed;

        const size = getFileSize(file);
        let progressSize = null;
        if (isDownloadingActive) {
            progressSize = getDownloadedSize(file);
        } else if (isUploadingActive) {
            progressSize = getUploadedSize(file);
        }

        const strings = [];
        if (streaming) {
            const sizeString = `${size}`;
            if (!isDownloadingCompleted && !active) {
                strings.push(sizeString);
            }
            strings.push(timeString);
        } else {
            const sizeString = progressSize ? `${progressSize}` : `${size}`;
            if (!isDownloadingCompleted) {
                strings.push(sizeString);
            }
            if (!isDownloadingActive) {
                strings.push(timeString);
            }
        }

        return (
            <div className='audio-action'>
                <span>
                    {strings.join(', ')}
                    {!active && date && (` · ${date}`)}
                    {meta}
                </span>
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
    block: PropTypes.object,

    duration: PropTypes.number.isRequired,
    file: PropTypes.object.isRequired,

    date: PropTypes.string,
    streaming: PropTypes.bool
};

export default AudioAction;
