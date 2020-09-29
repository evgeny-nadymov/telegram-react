/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { throttle } from '../../../Utils/Common';
import './SharedMediaContent.css';
import MessageStore from '../../../Stores/MessageStore';
import { openMedia } from '../../../Utils/Message';
import SharedPhoto from '../../Tile/SharedMedia/SharedPhoto';
import SharedDocument from '../../Tile/SharedMedia/SharedDocument';
import SharedLink from '../../Tile/SharedMedia/SharedLink';
import SharedVoiceNote from '../../Tile/SharedMedia/SharedVoiceNote';
import SharedVideo from '../../Tile/SharedMedia/SharedVideo';
import FileStore from '../../../Stores/FileStore';
import { loadMessageContents } from '../../../Utils/File';
import TdLibController from '../../../Controllers/TdLibController';

class SharedMediaContent extends React.Component {
    constructor(props) {
        super(props);

        this.filterRef = new Map();
        this.filtersRef = React.createRef();
        this.filterSelectionRef = React.createRef();

        this.state = { }

        // this.onWindowResize = throttle(this.onWindowResize, 250);
    }

    static isValidPhotoAndVideoContent(content) {
        return content && (content['@type'] === 'messagePhoto' || content['@type'] === 'messageVideo');
    }

    static isValidAudioContent(content) {
        return content && content['@type'] === 'messageAudio';
    }

    static isValidDocumentContent(content) {
        return content && content['@type'] === 'messageDocument';
    }

    static isValidUrlContent(content) {
        if (!content) return false;

        const { web_page, text } = content;
        if (web_page) return true;
        if (!text) return false;

        const { entities } = text;
        if (!entities) return false;

        return entities.find(
            x =>
                x.type['@type'] === 'textEntityTypeUrl' ||
                x.type['@type'] === 'textEntityTypeTextUrl' ||
                x.type['@type'] === 'textEntityTypeEmailAddress'
        );
    }

    static isValidVoiceNoteContent(content) {
        return content && content['@type'] === 'messageVoiceNote';
    }

    static getDerivedStateFromProps(props, state) {
        const { chatId } = props;

        if (chatId !== state.prevChatId) {
            const media = MessageStore.getMedia(props.chatId);

            const photoAndVideo = media ? media.photoAndVideo : [];
            const document = media ? media.document : [];
            const audio = media ? media.audio : [];
            const url = media ? media.url : [];
            const voiceNote = media ? media.voiceNote : [];

            let source = [];
            let selectedIndex = -1;
            if (photoAndVideo.length > 0) {
                source = photoAndVideo.filter(x => SharedMediaContent.isValidPhotoAndVideoContent(x.content));
                selectedIndex = 1;
            } else if (document.length > 0) {
                source = document.filter(x => SharedMediaContent.isValidDocumentContent(x.content));
                selectedIndex = 2;
            } else if (audio.length > 0) {
                source = audio.filter(x => SharedMediaContent.isValidAudioContent(x.content));
                selectedIndex = 3;
            } else if (url.length > 0) {
                source = url.filter(x => SharedMediaContent.isValidUrlContent(x.content));
                selectedIndex = 4;
            } else if (voiceNote.length > 0) {
                source = voiceNote.filter(x => SharedMediaContent.isValidVoiceNoteContent(x.content));
                selectedIndex = 5;
            }

            return {
                prevChatId: props.chatId,
                selectedIndex,
                items: source.slice(0, 40),
                photoAndVideo,
                document,
                audio,
                url,
                voiceNote,
                isSmallWidth: false
            }
        }

        return null;
    }

    componentDidMount() {
        MessageStore.on('clientUpdateMediaTab', this.onClientUpdateMediaTab);
        MessageStore.on('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        // MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageSendSucceeded', this.onUpdateMessageSend);
        MessageStore.on('updateMessageSendFailed', this.onUpdateMessageSend);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.unobserveResize();
        this.observeResize();
    }

    componentWillUnmount() {
        MessageStore.off('clientUpdateMediaTab', this.onClientUpdateMediaTab);
        MessageStore.off('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        // MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateMessageSendSucceeded', this.onUpdateMessageSend);
        MessageStore.off('updateMessageSendFailed', this.onUpdateMessageSend);
    }

    onUpdateMessageSend = update => {
        const { chatId } = this.props;
        const { selectedIndex } = this.state;
        const { message } = update;
        if (chatId !== message.chat_id) {
            return;
        }

        const media = MessageStore.getMedia(chatId);
        this.setMediaState(media, selectedIndex);
    };

    onUpdateNewMessage = update => {
        const { chatId } = this.props;
        const { selectedIndex } = this.state;
        const { message } = update;
        if (chatId !== message.chat_id) {
            return;
        }

        const media = MessageStore.getMedia(chatId);
        this.setMediaState(media, selectedIndex);
    };

    onUpdateDeleteMessages = update => {
        const { chatId } = this.props;
        const { selectedIndex } = this.state;
        const { chat_id } = update;
        if (chatId !== chat_id) {
            return;
        }

        const media = MessageStore.getMedia(chatId);
        this.setMediaState(media, selectedIndex);
    };

    setMediaState = (media, selectedIndex) => {
        const photoAndVideo = media ? media.photoAndVideo : [];
        const document = media ? media.document : [];
        const audio = media ? media.audio : [];
        const url = media ? media.url : [];
        const voiceNote = media ? media.voiceNote : [];

        const hasPhotoAndVideo = photoAndVideo.length > 0;
        const hasDocument = document.length > 0;
        const hasAudio = audio.length > 0;
        const hasUrl = url.length > 0;
        const hasVoiceNote = voiceNote.length > 0;

        const replaceSelectedIndex =
            selectedIndex === -1
            || selectedIndex === 1 && !hasPhotoAndVideo
            || selectedIndex === 2 && !hasDocument
            || selectedIndex === 3 && !hasAudio
            || selectedIndex === 4 && !hasUrl
            || selectedIndex === 5 && !hasVoiceNote;
        if (replaceSelectedIndex) {
            if (hasPhotoAndVideo) {
                selectedIndex = 1;
            } else if (hasDocument) {
                selectedIndex = 2;
            } else if (hasAudio) {
                selectedIndex = 3;
            } else if (hasUrl) {
                selectedIndex = 4;
            } else if (hasVoiceNote) {
                selectedIndex = 5;
            }
        }

        let source = [];
        if (selectedIndex === 1) {
            source = photoAndVideo.filter(x => SharedMediaContent.isValidPhotoAndVideoContent(x.content));
        } else if (selectedIndex === 2) {
            source = document.filter(x => SharedMediaContent.isValidDocumentContent(x.content));
        } else if (selectedIndex === 3) {
            source = audio.filter(x => SharedMediaContent.isValidAudioContent(x.content));
        } else if (selectedIndex === 4) {
            source = url.filter(x => SharedMediaContent.isValidUrlContent(x.content));
        } else if (selectedIndex === 5) {
            source = voiceNote.filter(x => SharedMediaContent.isValidVoiceNoteContent(x.content));
        }

        this.setState({
            selectedIndex,
            items: source.slice(0, 40),
            photoAndVideo,
            document,
            audio,
            url,
            voiceNote
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.items !== this.props.chatId || prevState.selectedIndex !== this.state.selectedIndex) {
            const { items } = this.state;

            const store = FileStore.getStore();
            loadMessageContents(store, items);
        }
    }

    onClientUpdateMediaTab = update => {
        const { chatId: currentChatId } = this.props;
        const { photoAndVideo, document, audio, url, voiceNote } = this.state;

        const { chatId, index: selectedIndex } = update;
        if (chatId !== currentChatId) return;

        let source = [];
        if (selectedIndex === 1) {
            source = photoAndVideo.filter(x => SharedMediaContent.isValidPhotoAndVideoContent(x.content));
        } else if (selectedIndex === 2) {
            source = document.filter(x => SharedMediaContent.isValidDocumentContent(x.content));
        } else if (selectedIndex === 3) {
            source = audio.filter(x => SharedMediaContent.isValidAudioContent(x.content));
        } else if (selectedIndex === 4) {
            source = url.filter(x => SharedMediaContent.isValidUrlContent(x.content));
        } else if (selectedIndex === 5) {
            source = voiceNote.filter(x => SharedMediaContent.isValidVoiceNoteContent(x.content));
        }

        this.setState({
            selectedIndex,
            items: source.slice(0, 40)
        });
    };

    onClientUpdateChatMedia = update => {
        const { chatId: currentChatId } = this.props;
        const { selectedIndex } = this.state;

        const { chatId } = update;
        if (chatId !== currentChatId) return;

        const media = MessageStore.getMedia(chatId);
        this.setMediaState(media, selectedIndex);
    };

    getItemTemplate = (selectedIndex, message) => {
        const { chat_id, id, content } = message;
        const migratedChatId = -1;

        switch (selectedIndex) {
            case 1: {
                if (content['@type'] === 'messageVideo') {
                    return (
                        <SharedVideo
                            key={`chat_id=${chat_id}_message_id=${id}`}
                            chatId={chat_id}
                            messageId={id}
                            video={content.video}
                            openMedia={() => openMedia(chat_id, id, false)}
                            showOpenMessage={chat_id !== migratedChatId}
                        />
                    );
                }

                return (
                    <SharedPhoto
                        key={`chat_id=${chat_id}_message_id=${id}`}
                        chatId={chat_id}
                        messageId={id}
                        photo={content.photo}
                        openMedia={() => openMedia(chat_id, id, false)}
                        showOpenMessage={chat_id !== migratedChatId}
                    />
                );
            }
            case 2: {
                return (
                    <SharedDocument
                        key={`chat_id=${chat_id}_message_id=${id}`}
                        chatId={chat_id}
                        messageId={id}
                        showOpenMessage={chat_id !== migratedChatId}
                    />
                );
            }
            case 3: {
                return (
                    <SharedDocument
                        key={`chat_id=${chat_id}_message_id=${id}`}
                        chatId={chat_id}
                        messageId={id}
                        showOpenMessage={chat_id !== migratedChatId}
                    />
                );
            }
            case 4: {
                return (
                    <SharedLink
                        key={`chat_id=${chat_id}_message_id=${id}`}
                        chatId={chat_id}
                        messageId={id}
                        webPage={content.web_page}
                        openMedia={() => openMedia(chat_id, id, false)}
                        showOpenMessage={chat_id !== migratedChatId}
                    />
                );
            }
            case 5: {
                return (
                    <SharedVoiceNote
                        key={`chat_id=${chat_id}_message_id=${id}`}
                        chatId={chat_id}
                        messageId={id}
                        voiceNote={content.voice_note}
                        openMedia={() => openMedia(chat_id, id, false)}
                        showOpenMessage={chat_id !== migratedChatId}
                    />
                );
            }
        }

        return null;
    };

    render() {
        const { selectedIndex, items } = this.state;
        if (!items || !items.length) {
            return null;
        }

        return (
            <div className={classNames('shared-media-content', { 'shared-photos-list': selectedIndex === 1 })}>
                {items.map(x => this.getItemTemplate(selectedIndex, x))}
            </div>
        );
    }
}

SharedMediaContent.propTypes = {
    chatId: PropTypes.number
};

export default SharedMediaContent;