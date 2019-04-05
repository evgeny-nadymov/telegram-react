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
        const { chatId, messageId, file } = this.props;

        const active = message && message.chat_id === chatId && message.id === messageId;

        this.state = {
            active: active,
            currentTime: active && time ? time.currentTime : 0,
            duration: active && time ? time.duration : 0,
            prevFile: null,
            file: FileStore.get(file.id) || file
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { active, currentTime, file, prevFile } = this.state;

        if (nextState.active !== active) {
            return true;
        }

        if (nextState.currentTime !== currentTime) {
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
    }

    componentWillUnmount() {
        FileStore.removeListener('updateFile', this.onUpdateFile);

        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                active: false,
                currentTime: 0
            });
        }
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId } = this.props;
        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                currentTime: update.currentTime,
                duration: update.duration
            });
        }
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId } = this.props;
        const { active } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (active) {
            } else {
                this.setState({
                    active: true,
                    currentTime: 0
                });
            }
        } else if (active) {
            this.setState({
                active: false,
                currentTime: 0
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

    render() {
        const { duration } = this.props;
        const { file, active, currentTime } = this.state;
        if (!file) return null;

        const isDownloadingActive = file.local && file.local.is_downloading_active;
        const isUploadingActive = file.remote && file.remote.is_uploading_active;
        const isDownloadingCompleted = file.local && file.local.is_downloading_completed;
        const isUploadingCompleted = file.remote && file.remote.is_uploading_completed;

        const downloaded = isDownloadingCompleted || file.idb_key;

        const size = getFileSize(file);
        let progressSize = null;
        if (isDownloadingActive) {
            progressSize = getDownloadedSize(file);
        } else if (isUploadingActive) {
            progressSize = getUploadedSize(file);
        }
        const sizeString = progressSize ? `${progressSize}/${size}` : `${size}`;

        const durationString = getDurationString(Math.floor(duration || 0));
        const currentTimeString = getDurationString(Math.floor(currentTime || 0));
        const timeString = active && downloaded ? `${currentTimeString}/${durationString}` : `${durationString}`;

        return (
            <div className='audio-action'>
                {!downloaded && <span>{`${sizeString}, `}</span>}
                <span>{timeString}</span>
            </div>
        );
    }
}

AudioAction.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    file: PropTypes.object.isRequired
};

export default AudioAction;
