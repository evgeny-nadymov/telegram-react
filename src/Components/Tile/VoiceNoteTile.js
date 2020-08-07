/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import DownloadIcon from '../../Assets/Icons/Download';
import PlayArrowIcon from '../../Assets/Icons/PlayArrow';
import PauseIcon from '../../Assets/Icons/Pause';
import DocumentTile from './DocumentTile';
import PlayerStore from '../../Stores/PlayerStore';
import './VoiceNoteTile.css';
import { isCurrentSource } from '../../Utils/Player';

class VoiceNoteTile extends React.Component {
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

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaPlay', this.onClientUpdateMediaPlay);
        PlayerStore.on('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.on('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaPlay', this.onClientUpdateMediaPlay);
        PlayerStore.off('clientUpdateMediaPause', this.onClientUpdateMediaPause);
        PlayerStore.off('clientUpdateMediaEnd', this.onClientUpdateMediaEnd);
    }

    onClientUpdateMediaEnd = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.setState({
            active: false,
            playing: false,
            currentTime: 0
        });
    };

    onClientUpdateMediaPlay = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        this.setState({ playing: isCurrentSource(chatId, messageId, block, source) });
    };

    onClientUpdateMediaPause = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        if (!isCurrentSource(chatId, messageId, block, source)) return;

        this.setState({ playing: false });
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId, block } = this.props;
        const { source } = update;

        if (isCurrentSource(chatId, messageId, block, source)) {
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
        const { file, openMedia } = this.props;
        const { playing } = this.state;

        return (
            <DocumentTile
                thumbnail={null}
                file={file}
                openMedia={openMedia}
                icon={<DownloadIcon />}
                completeIcon={playing ? <PauseIcon /> : <PlayArrowIcon />}
            />
        );
    }
}

VoiceNoteTile.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    block: PropTypes.object,

    file: PropTypes.object.isRequired,
    openMedia: PropTypes.func
};

export default VoiceNoteTile;
