/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import * as ReactDOM from 'react-dom';
import MediaAudio from '../Message/Media/Audio';
import MediaVoiceNote from '../Message/Media/VoiceNote';
import { openMedia } from '../../Utils/Message';
import { getMedia } from '../../Utils/Media';
import { isCurrentSource, playlistItemEquals } from '../../Utils/Player';
import { openInstantViewMedia } from '../../Utils/InstantView';
import { SCROLL_PRECISION } from '../../Constants';
import PlayerStore from '../../Stores/PlayerStore';
import TdLibController from '../../Controllers/TdLibController';
import './Playlist.css';

class Playlist extends React.Component {
    constructor(props) {
        super(props);

        this.listRef = React.createRef();
        this.itemRefMap = new Map();

        const { message, block, playlist } = PlayerStore;
        this.state = {
            message,
            block,
            playlist,

            open: false,
            titleMouseOver: false,
            playlistMouseOver: false
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { open } = this.state;

        if (!prevState.open && open) {
            this.scrollToActive();
        }
    }

    scrollToActive = () => {
        const list = this.listRef.current;
        if (!list) return;

        const { playlist, message, block } = this.state;
        if (!message && !block) return;
        if (!playlist) return;

        const index = [...playlist.items]
            .reverse()
            .findIndex(x => playlistItemEquals(x, message || block));
        if (index === -1) return;

        const item = this.itemRefMap.get(index);
        if (!item) return;

        const node = ReactDOM.findDOMNode(item);
        if (!node) return;

        list.scrollTop = node.offsetTop - 15;
    };

    componentDidMount() {
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaPlaylist', this.onClientUpdateMediaPlaylist);
        PlayerStore.on('clientUpdateMediaPlaylistLoading', this.onClientUpdateMediaPlaylistLoading);
        PlayerStore.on('clientUpdateMediaTitleMouseOver', this.onClientUpdateMediaTitleMouseOver);
    }

    componentWillUnmount() {
        PlayerStore.off('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.off('clientUpdateMediaPlaylist', this.onClientUpdateMediaPlaylist);
        PlayerStore.off('clientUpdateMediaPlaylistLoading', this.onClientUpdateMediaPlaylistLoading);
        PlayerStore.off('clientUpdateMediaTitleMouseOver', this.onClientUpdateMediaTitleMouseOver);
    }

    onClientUpdateMediaTitleMouseOver = update => {
        const { over } = update;

        if (over) {
            this.setState(
                {
                    playlistMouseOver: over
                },
                () => {
                    this.tryOpen();
                }
            );
        } else {
            this.setState(
                {
                    playlistMouseOver: over
                },
                () => {
                    this.tryClose();
                }
            );
        }
    };

    onClientUpdateMediaActive = update => {
        const { source } = update;

        switch (source['@type']) {
            case 'message': {

                this.setState({
                    message: source,
                    block: null
                })
                break;
            }
            case 'instantViewSource': {

                this.setState({
                    message: null,
                    block: source.block
                });
                break;
            }
        }
    };

    onClientUpdateMediaPlaylistLoading = update => {
        const { message, block } = this.state;
        const { source } = update;

        const chatId = message ? message.chat_id : 0;
        const messageId = message ? message.id : 0;

        if (isCurrentSource(chatId, messageId, block, source)) {
            this.setState({
                playlist: null
            });
        }
    };

    onClientUpdateMediaPlaylist = update => {
        const { message, block } = this.state;
        const { source, playlist } = update;

        const chatId = message ? message.chat_id : 0;
        const messageId = message ? message.id : 0;

        if (isCurrentSource(chatId, messageId, block, source)) {
            this.setState({
                playlist
            });
        }
    };

    tryOpen = () => {
        clearTimeout(this.openTimeout);

        this.openTimeout = setTimeout(() => {
            const { titleMouseOver, playlistMouseOver } = this.state;
            this.setState({
                open: titleMouseOver || playlistMouseOver
            });
        }, 250);
    };

    tryClose = () => {
        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            const { titleMouseOver, playlistMouseOver } = this.state;
            this.setState({
                open: titleMouseOver || playlistMouseOver
            });
        }, 250);
    };

    handleMouseEnter = () => {
        this.setState({
            playlistMouseOver: true,
            open: true
        });
    };

    handleMouseLeave = () => {
        this.setState(
            {
                playlistMouseOver: false
            },
            () => {
                this.tryClose();
            }
        );
    };

    handleScroll = () => {
        const list = this.listRef.current;
        if (!list) return;

        if (list.scrollTop <= SCROLL_PRECISION) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaPlaylistNext'
            });
        } else if (list.scrollTop + list.offsetHeight >= list.scrollHeight - SCROLL_PRECISION) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaPlaylistPrev'
            });
        }
    };

    getPageBlock(block, instantView) {
        if (!block) return null;

        let element = null;
        switch (block['@type']) {
            case 'pageBlockAudio': {
                element = (
                    <MediaAudio
                        block={block}
                        audio={block.audio}
                        openMedia={() => openInstantViewMedia(block.audio, block.caption, block, instantView, true)} />
                );
                break;
            }
            case 'pageBlockVoiceNote': {
                element = (
                    <MediaVoiceNote
                        block={block}
                        voiceNote={block.voice_note}
                        openMedia={() => openInstantViewMedia(block.voice_note, block.caption, block, instantView, true)} />
                );
                break;
            }
        }

        return element;
    }

    render() {
        const { open, playlist } = this.state;

        if (!open) return null;
        if (!playlist) return null;

        const { items } = playlist;
        if (!items) return null;
        if (items.length <= 1) return null;

        this.itemRefMap.clear();

        let iv = null;
        if (items[0]['@type'] === 'instantViewSource') {
            iv = playlist.source.instantView;
        }

        const getMediaFunc = items[0]['@type'] === 'message'
            ? x => getMedia(x, () => openMedia(x.chat_id, x.id))
            : x => this.getPageBlock(x, iv)

        return (
            <div className='playlist'>
                <div className='playlist-wrapper'>
                    <div
                        ref={this.listRef}
                        className='playlist-items'
                        onMouseEnter={this.handleMouseEnter}
                        onMouseLeave={this.handleMouseLeave}
                        onScroll={this.handleScroll}>
                        {[...items]
                            .reverse()
                            .map((x, index) => (
                                <div key={x.id || index} ref={el => this.itemRefMap.set(index, el)} className='playlist-item'>
                                    {getMediaFunc(x)}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        );
    }
}

Playlist.propTypes = {

};

export default Playlist;
