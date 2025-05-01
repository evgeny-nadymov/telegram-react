/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import AudioAction from '../../Message/Media/AudioAction';
import ContextMenu from './ContextMenu';
import MediaStatus from '../../Message/Media/MediaStatus';
import MessageAuthor from '../../Message/MessageAuthor';
import VoiceNoteTile from '../VoiceNoteTile';
import MessageStore from '../../../Stores/MessageStore';
import './SharedVoiceNote.css';

class SharedVoiceNote extends React.Component {
    state = {
        contextMenu: false,
        left: 0,
        top: 0
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, messageId, voiceNote, showOpenMessage } = this.props;
        const { contextMenu, left, top } = this.state;

        if (chatId !== nextProps.chatId) {
            return true;
        }

        if (messageId !== nextProps.messageId) {
            return true;
        }

        if (voiceNote !== nextProps.voiceNote) {
            return true;
        }

        if (showOpenMessage !== nextProps.showOpenMessage) {
            return true;
        }

        if (contextMenu !== nextState.contextMenu) {
            return true;
        }

        if (left !== nextState.left) {
            return true;
        }

        if (top !== nextState.top) {
            return true;
        }

        return false;
    }

    handleOpenContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;

            this.setState({
                contextMenu: true,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    render() {
        const { chatId, i18n, messageId, voiceNote, openMedia, showOpenMessage } = this.props;
        const { contextMenu, left, top } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        if (!voiceNote) return null;

        const { date, sender_user_id } = message;
        const dateString = new Date(date * 1000).toLocaleDateString([i18n.language], {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        });

        const { duration, voice: file } = voiceNote;

        return (
            <>
                <div className='shared-voice-note' onContextMenu={this.handleOpenContextMenu}>
                    <VoiceNoteTile chatId={chatId} messageId={messageId} file={file} openMedia={openMedia} />
                    <div className='voice-note-content'>
                        <div className='document-title'><MessageAuthor chatId={chatId} messageId={messageId} userId={sender_user_id} /></div>
                        <div className='voice-note-meta'>
                            <AudioAction
                                chatId={chatId}
                                messageId={messageId}
                                duration={duration}
                                file={file}
                                date={dateString}
                            />
                            <MediaStatus chatId={chatId} messageId={messageId} icon={'\u00A0•'} />
                        </div>
                    </div>
                </div>
                <ContextMenu
                    chatId={chatId}
                    messageId={messageId}
                    anchorPosition={{ top, left }}
                    open={contextMenu}
                    showOpenMessage={showOpenMessage}
                    onClose={this.handleCloseContextMenu}
                />
            </>

        );
    }
}

SharedVoiceNote.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    voiceNote: PropTypes.object,
    showOpenMessage: PropTypes.bool,
    openMedia: PropTypes.func
};

export default withTranslation()(SharedVoiceNote);
