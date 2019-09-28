/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import DocumentTile from '../../Tile/DocumentTile';
import AudioAction from './AudioAction';
import FileProgress from '../../Viewer/FileProgress';
import { getAudioTitle } from '../../../Utils/Media';
import PlayerStore from '../../../Stores/PlayerStore';
import './Audio.css';
import InsertDriveFileIcon from './Document';

class Audio extends React.Component {
    constructor(props) {
        super(props);

        const { chatId, messageId } = props;

        const { time, message, playing } = PlayerStore;
        const active = message && message.chat_id === chatId && message.id === messageId;

        this.state = {
            active: active,
            playing: active ? playing : false,
            currentTime: active && time ? time.currentTime : 0,
            duration: active && time ? time.duration : 0
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { active, playing, currentTime, duration } = this.state;

        if (nextState.active !== active) {
            return true;
        }

        if (nextState.playing !== playing) {
            return true;
        }

        if (nextState.currentTime !== currentTime) {
            return true;
        }

        if (nextState.duration !== duration) {
            return true;
        }

        return false;
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
        const { chatId, messageId, playing } = this.props;

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
        const { chatId, messageId, audio, openMedia } = this.props;
        const { playing } = this.state;
        if (!audio) return null;

        const { album_cover_thumbnail, duration, audio: file } = audio;

        const title = getAudioTitle(audio);

        return (
            <div className='document'>
                <DocumentTile
                    thumbnail={album_cover_thumbnail}
                    file={file}
                    openMedia={openMedia}
                    icon={<ArrowDownwardIcon />}
                    completeIcon={playing ? <PauseIcon /> : <PlayArrowIcon />}
                />
                <div className='document-content'>
                    <div className='document-title'>
                        <a className='document-name' onClick={openMedia} title={title}>
                            {title}
                        </a>
                    </div>
                    <AudioAction chatId={chatId} messageId={messageId} duration={duration} file={file} />
                </div>
            </div>
        );
    }
}

Audio.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    audio: PropTypes.object,
    openMedia: PropTypes.func
};

export default Audio;
