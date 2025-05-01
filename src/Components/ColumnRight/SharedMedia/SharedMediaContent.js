/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import SharedPhoto from '../../Tile/SharedMedia/SharedPhoto';
import SharedDocument from '../../Tile/SharedMedia/SharedDocument';
import SharedLink from '../../Tile/SharedMedia/SharedLink';
import SharedVoiceNote from '../../Tile/SharedMedia/SharedVoiceNote';
import SharedVideo from '../../Tile/SharedMedia/SharedVideo';
import { loadMessageContents } from '../../../Utils/File';
import { openMedia } from '../../../Utils/Message';
import { SHARED_MESSAGE_SLICE_LIMIT } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import TdLibController from '../../../Controllers/TdLibController';
import './SharedMediaContent.css';

const overScanCount = 5;

class SharedMediaContent extends React.Component {
    constructor(props) {
        super(props);

        this.listRef = React.createRef();

        this.state = {
            scrollTop: 0
        }

        // this.onWindowResize = throttle(this.onWindowResize, 250);
    }

    static getItemHeight(message) {
        if (!message) return undefined;

        const { content } = message;
        switch (content['@type']) {
            case 'messagePhoto': {
                return undefined;
            }
            case 'messageVideo': {
                return undefined;
            }
            case 'messageDocument': {
                return 78;
            }
            case 'messageAudio': {
                return 94;
            }
            case 'messageVoiceNote': {
                return 74;
            }
            default: {
                return undefined;
            }
        }
    }

    static getRowHeight(selectedIndex) {
        switch (selectedIndex) {
            case 1: {
                return undefined;
            }
            case 2: {
                return 78;
            }
            case 3: {
                return 94;
            }
            case 4: {
                return undefined;
            }
            case 5: {
                return 74;
            }
        }

        return undefined;
    }

    static getItemTemplate = (selectedIndex, message) => {
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
                        caption={content.caption}
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

    static isValidMessage(selectedIndex, message) {
        if (!message) return false;

        return SharedMediaContent.isValidContent(selectedIndex, message.content);
    };

    static isValidContent(selectedIndex, content) {
        switch (selectedIndex) {
            case 1: {
                return SharedMediaContent.isValidPhotoAndVideoContent(content);
            }
            case 2: {
                return SharedMediaContent.isValidDocumentContent(content);
            }
            case 3: {
                return SharedMediaContent.isValidAudioContent(content);
            }
            case 4: {
                return SharedMediaContent.isValidUrlContent(content);
            }
            case 5: {
                return SharedMediaContent.isValidVoiceNoteContent(content);
            }
        }

        return false;
    }

    static isValidPhotoAndVideoContent(content) {
        return content && (content['@type'] === 'messagePhoto' || content['@type'] === 'messageVideo');
    }

    static isValidAudioContent(content) {
        return content && content['@type'] === 'messageAudio';
    }

    static isValidDocumentContent(content) {
        return content && (content['@type'] === 'messageDocument' || content['@type'] === 'messageAudio');
    }

    static isValidUrlContent(content) {
        if (!content) return false;

        const { web_page, text, caption } = content;
        if (web_page) return true;
        if (!text && !caption) return false;

        const { entities } = text || caption;
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

    static getFilter(selectedIndex) {
        switch (selectedIndex) {
            case 1: {
                return { '@type': 'searchMessagesFilterPhotoAndVideo' };
            }
            case 2: {
                return { '@type': 'searchMessagesFilterDocument' };
            }
            case 3: {
                return { '@type': 'searchMessagesFilterAudio' };
            }
            case 4: {
                return { '@type': 'searchMessagesFilterUrl' };
            }
            case 5: {
                return { '@type': 'searchMessagesFilterVoiceNote' };
            }
        }

        return null;
    }

    static getSource(selectedIndex, media) {
        if (!media) {
            return [];
        }

        switch (selectedIndex) {
            case 1: {
                return media.photoAndVideo || [];
            }
            case 2: {
                return media.document || [];
            }
            case 3: {
                return media.audio || [];
            }
            case 4: {
                return media.url || [];
            }
            case 5: {
                return media.voiceNote || [];
            }
        }

        return [];
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

            let selectedIndex = -1;
            if (photoAndVideo.length > 0) {
                selectedIndex = 1;
            } else if (document.length > 0) {
                selectedIndex = 2;
            } else if (audio.length > 0) {
                selectedIndex = 3;
            } else if (url.length > 0) {
                selectedIndex = 4;
            } else if (voiceNote.length > 0) {
                selectedIndex = 5;
            }
            const source = SharedMediaContent.getSource(selectedIndex, media).filter(x => SharedMediaContent.isValidContent(selectedIndex, x.content));

            return {
                prevChatId: props.chatId,
                selectedIndex,
                renderIds: new Map(),
                rowHeight: SharedMediaContent.getRowHeight(selectedIndex),
                items: source.slice(0, SHARED_MESSAGE_SLICE_LIMIT),
                photoAndVideo,
                document,
                audio,
                url,
                voiceNote,
                isSmallWidth: false,
                params: {
                    loading: false,
                    completed: false,
                    migrateCompleted: false,
                    filter: SharedMediaContent.getFilter(selectedIndex)
                }
            }
        }

        return null;
    }

    componentDidMount() {
        window.addEventListener('resize', this.onWindowResize);

        MessageStore.on('clientUpdateMediaTab', this.onClientUpdateMediaTab);
        MessageStore.on('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        // MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.on('updateMessageSendSucceeded', this.onUpdateMessageSend);
        MessageStore.on('updateMessageSendFailed', this.onUpdateMessageSend);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onWindowResize);

        MessageStore.off('clientUpdateMediaTab', this.onClientUpdateMediaTab);
        MessageStore.off('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        // MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
        MessageStore.off('updateMessageSendSucceeded', this.onUpdateMessageSend);
        MessageStore.off('updateMessageSendFailed', this.onUpdateMessageSend);
    }

    onWindowResize = event => {
        const { items, scrollTop } = this.state;

        const { current: list } = this.listRef;
        if (!list) return;

        const offsetTop = list.offsetTop;
        const viewportHeight = list.offsetParent.offsetHeight;

        const renderIds = this.getRenderIds(items, viewportHeight, scrollTop - offsetTop);

        this.setState({ ...renderIds });
    };

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
        const { scrollTop } = this.state;

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

        const source = SharedMediaContent.getSource(selectedIndex, media).filter(x => SharedMediaContent.isValidContent(selectedIndex, x.content));
        const items = source.slice(0, SHARED_MESSAGE_SLICE_LIMIT);

        const { current: list } = this.listRef;
        if (!list) return;

        const offsetTop = list.offsetTop;
        const viewportHeight = list.offsetParent.offsetHeight;

        this.setState({
            selectedIndex,
            renderIds: this.getRenderIds(items, viewportHeight, scrollTop - offsetTop),
            rowHeight: SharedMediaContent.getRowHeight(selectedIndex),
            items,
            params: {
                loading: false,
                completed: false,
                migrateCompleted: false,
                filter: SharedMediaContent.getFilter(selectedIndex)
            },
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

        // this.unobserveResize();
        // this.observeResize();
    }

    onClientUpdateMediaTab = update => {
        const { chatId: currentChatId } = this.props;
        const { chatId, index: selectedIndex } = update;
        if (chatId !== currentChatId) return;

        const media = MessageStore.getMedia(currentChatId);

        const photoAndVideo = media ? media.photoAndVideo : [];
        const document = media ? media.document : [];
        const audio = media ? media.audio : [];
        const url = media ? media.url : [];
        const voiceNote = media ? media.voiceNote : [];

        let source = [];
        if (selectedIndex === 1) {
            source = photoAndVideo;
        } else if (selectedIndex === 2) {
            source = document;
        } else if (selectedIndex === 3) {
            source = audio;
        } else if (selectedIndex === 4) {
            source = url;
        } else if (selectedIndex === 5) {
            source = voiceNote;
        }
        source = source.filter(x => SharedMediaContent.isValidContent(selectedIndex, x.content));

        this.setState({
            selectedIndex,
            renderIds: new Map(),
            rowHeight: SharedMediaContent.getRowHeight(selectedIndex),
            items: source.slice(0, SHARED_MESSAGE_SLICE_LIMIT),
            photoAndVideo,
            document,
            audio,
            url,
            voiceNote,
            params: {
                loading: false,
                completed: false,
                migrateCompleted: false,
                filter: SharedMediaContent.getFilter(selectedIndex)
            }
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

    handleScroll = (event, container) => {
        const { params } = this.state;

        if (params && !params.completed) {
            this.onLoadNext(params);
        } else {
            // this.onLoadMigratedNext(params);
        }
    };

    handleVirtScroll = (event, container) => {
        const { current: list } = this.listRef;
        if (!list) return;

        this.setScrollPosition(container.scrollTop);
    };

    isVisibleItem = (index, viewportHeight, scrollTop) => {
        const { rowHeight } = this.state;

        const itemTop = index * rowHeight;
        const itemBottom = (index + 1) * rowHeight;

        return (
            itemTop > scrollTop - overScanCount * rowHeight &&
            itemBottom < scrollTop + viewportHeight + overScanCount * rowHeight
        );
    };

    getRenderIds(source, viewportHeight, scrollTop) {
        const renderIds = new Map();
        const renderIdsList = [];
        source.forEach((item, index) => {
            if (this.isVisibleItem(index, viewportHeight, scrollTop)) {
                renderIds.set(index, index);
                renderIdsList.push(index);
            }
        });

        return { renderIds, renderIdsList };
    }

    setScrollPosition = scrollTop => {
        const { items, scrollTop: prevScrollTop, rowHeight } = this.state;

        const { current: list } = this.listRef;
        if (!list) return;

        const offsetTop = list.offsetTop;
        const viewportHeight = list.offsetParent.offsetHeight;

        if (Math.abs(scrollTop - prevScrollTop) >= rowHeight) {
            const renderIds = this.getRenderIds(items, viewportHeight, scrollTop - offsetTop);

            this.setState({
                scrollTop,
                ...renderIds
            });
        }
    };

    onLoadNext = async (params, loadIncomplete = true) => {
        const { chatId } = this.props;
        const { items, selectedIndex } = this.state;
        const { completed, filter, loading, messages: lastMessages } = params;

        if (!filter) return;
        if (loading) return;
        if (completed) return;

        let fromMessageId = items.length > 0 ? items[items.length - 1].id : 0;
        if (lastMessages) {
            fromMessageId = lastMessages.length > 0 ? lastMessages[lastMessages.length - 1].id : 0;
        }
        params.loading = true;
        params.requestId = new Date();

        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT,
            filter
        }).finally(() => {
            params.loading = false;
        });

        TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: fromMessageId,
            offset: 0,
            limit: SHARED_MESSAGE_SLICE_LIMIT * 2,
            filter
        });

        const { params: currentParams } = this.state;
        if (!currentParams || currentParams.requestId !== params.requestId) {
            return;
        }

        const { messages } = result;
        params.messages = messages;
        params.completed = messages.length === 0 || messages.total_count === 0;
        params.items = items.concat(messages.filter(x => SharedMediaContent.isValidMessage(selectedIndex, x)));
        const incompleteResults = loadIncomplete && messages.length > 0 && messages.length < SHARED_MESSAGE_SLICE_LIMIT;

        MessageStore.setItems(result.messages);
        const store = FileStore.getStore();
        loadMessageContents(store, result.messages);

        this.setState({ items: params.items });

        if (params.completed) {
            this.onLoadMigratedNext(params, true);
        } else if (incompleteResults) {
            this.onLoadNext(params, false);
        }
    };

    onLoadMigratedNext(params, loadIncomplete) {

    }

    render() {
        const {
            selectedIndex,
            items = [],
            renderIds,
            photoAndVideo,
            document,
            audio,
            url,
            voiceNote
        } = this.state;

        console.log('[vlist] render', [selectedIndex, items, renderIds]);

        const hasItems = photoAndVideo && photoAndVideo.length > 0
            || document && document.length > 0
            || audio && audio.length > 0
            || url && url.length > 0
            || voiceNote && voiceNote.length > 0;
        if (!hasItems) {
            return null;
        }

        if (selectedIndex === 2 || selectedIndex === 3 || selectedIndex === 5) {
            let contentHeight = 0;
            const controls = items.map((x, index) => {
                const { chat_id, id } = x;
                const itemHeight = SharedMediaContent.getItemHeight(x);
                if (!itemHeight) {
                    return null;
                }
                contentHeight += itemHeight;

                return ((!renderIds.size || renderIds.has(index)) && (
                    <div key={`chat_id=${chat_id}_message_id=${id}`} className='shared-media-virt-item' style={{ top: contentHeight - itemHeight }}>
                        {SharedMediaContent.getItemTemplate(selectedIndex, x)}
                    </div>
                ));
            });

            return (
                <div ref={this.listRef} className='shared-media-virt-content' style={{ height: contentHeight }}>
                    {controls}
                </div>
            );
        }

        return (
            <div ref={this.listRef} className={classNames('shared-media-content', { 'shared-photos-list': selectedIndex === 1 })}>
                {items.map(x => SharedMediaContent.getItemTemplate(selectedIndex, x))}
            </div>
        );
    }
}

SharedMediaContent.propTypes = {
    chatId: PropTypes.number
};

export default SharedMediaContent;