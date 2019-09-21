/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import { getDownloadedSize, getUploadedSize, getFileSize } from '../../../Utils/File';
import { getDurationString } from '../../../Utils/Common';
import FileStore from '../../../Stores/FileStore';
import PlayerStore from '../../../Stores/PlayerStore';
import './AudioAction.css';

const styles = theme => ({
    audioAction: {
        color: theme.palette.text.secondary
    }
});

class AudioAction extends React.Component {
    constructor(props) {
        super(props);

        const { message, time } = PlayerStore;
        const { chatId, messageId, duration, file } = this.props;

        const active = message && message.chat_id === chatId && message.id === messageId;
        const currentTime = active && time ? time.currentTime : 0;
        const audioDuration = active && time && time.duration ? time.duration : duration;
        const currentFile = FileStore.get(file.id) || file;

        this.state = {
            active: active,
            currentTime: currentTime,
            duration: audioDuration,
            timeString: this.getTimeString(currentTime, duration, active, currentFile),

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
    }

    componentWillUnmount() {
        FileStore.removeListener('updateFile', this.onUpdateFile);

        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaTime', this.onClientUpdateMediaTime);
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId, duration } = this.props;
        const { active, file } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                active: false,
                currentTime: 0,
                timeString: this.getTimeString(0, duration, false, file)
            });
        }
    };

    onClientUpdateMediaTime = update => {
        const { chatId, messageId, duration } = this.props;
        const { active, file } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                currentTime: update.currentTime,
                duration: update.duration || duration,
                timeString: this.getTimeString(update.currentTime, update.duration || duration, active, file)
            });
        }
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, duration } = this.props;
        const { active, currentTime, file } = this.state;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                active: true,
                currentTime: active ? currentTime : 0,
                timeString: this.getTimeString(active ? currentTime : 0, duration, true, file)
            });
        } else if (active) {
            this.setState({
                active: false,
                currentTime: 0,
                timeString: this.getTimeString(0, duration, false, file)
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

    getTimeString = (currentTime, duration, active, file) => {
        const isDownloadingCompleted = file.local && file.local.is_downloading_completed;
        const isUploadingCompleted = file.remote && file.remote.is_uploading_completed;

        const durationString = getDurationString(Math.floor(duration || 0));
        const currentTimeString = getDurationString(Math.floor(currentTime || 0));

        return active && isDownloadingCompleted ? `${currentTimeString}/${durationString}` : `${durationString}`;
    };

    render() {
        const { classes, title } = this.props;
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
        const sizeString = progressSize ? `${progressSize}/${size}` : `${size}`;

        return (
            <div className={classNames('audio-action', classes.audioAction)}>
                {!active && <span>{title}</span>}
                {!isDownloadingCompleted && <span>{`${sizeString}, `}</span>}
                <span>{timeString}</span>
            </div>
        );
    }
}

AudioAction.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    duration: PropTypes.number.isRequired,
    file: PropTypes.object.isRequired,

    title: PropTypes.string
};

export default withStyles(styles, { withTheme: true })(AudioAction);
