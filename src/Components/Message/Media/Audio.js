/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import DocumentTile from '../../Tile/DocumentTile';
import DocumentAction from './DocumentAction';
import FileProgress from '../../Viewer/FileProgress';
import { getExtension, getSrc } from '../../../Utils/File';
import { getAudioTitle } from '../../../Utils/Media';
import PlayerStore from '../../../Stores/PlayerStore';
import ApplicationStore from '../../../Stores/ApplicationStore';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import './Audio.css';

class Audio extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, messageId } = props;
        const { audio } = props.audio;

        const { time, message, playing } = PlayerStore;
        const active = message && message.chat_id === chatId && message.id === messageId;

        this.state = {
            active: active,
            playing: active ? playing : false,
            currentTime: active && time ? time.currentTime : 0.0,
            duration: active && time ? time.duration : 0.0
        };

        this.openMediaViewer = Boolean(ApplicationStore.mediaViewerContent);
        this.openProfileMediaViewer = Boolean(ApplicationStore.profileMediaViewerContent);
    }

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaPlay', this.onClientUpdateMediaPlay);
        PlayerStore.on('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaPlay', this.onClientUpdateMediaPlay);
        PlayerStore.removeListener('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.removeListener('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({
                active: false,
                playing: false,
                currentTime: 0
            });
        }
    };

    onClientUpdateMediaPlay = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({ playing: true });
        } else {
            this.setState({ playing: false });
        }
    };

    onClientUpdateMediaPause = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            this.setState({ playing: false });
        }
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            if (!this.state.active) {
                this.setState({
                    active: true,
                    currentTime: 0,
                    playing: true
                });
            }
        } else if (this.state.active) {
            this.setState({
                active: false,
                currentTime: 0,
                playing: false
            });
        }
    };

    render() {
        const { audio, openMedia } = this.props;
        const { playing } = this.state;
        if (!audio) return null;

        const { album_cover_thumbnail } = audio;
        const file = audio.audio;

        const title = getAudioTitle(audio);

        return (
            <div className='document'>
                <div className='document-tile' onClick={openMedia}>
                    <DocumentTile thumbnail={album_cover_thumbnail} />
                    <FileProgress
                        file={file}
                        download
                        upload
                        cancelButton
                        zIndex={1}
                        icon={<ArrowDownwardIcon />}
                        completeIcon={playing ? <PauseIcon /> : <PlayArrowIcon />}
                    />
                </div>

                <div className='document-content'>
                    <div className='document-title'>
                        <a className='document-name' onClick={openMedia} title={title}>
                            {title}
                        </a>
                    </div>
                    <DocumentAction file={file} openMedia={openMedia} />
                </div>
            </div>
        );
    }
}

Audio.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    audio: PropTypes.object.isRequired,
    openMedia: PropTypes.func.isRequired
};

export default Audio;
