/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import Animator from '../../../Utils/Animatior';
import { clamp, throttle } from '../../../Utils/Common';
import MessageStore from '../../../Stores/MessageStore';
import TdLibController from '../../../Controllers/TdLibController';
import './SharedMediaTabs.css';

class SharedMediaTabs extends React.Component {
    constructor(props) {
        super(props);

        this.filterRef = new Map();
        this.filtersRef = React.createRef();
        this.filterSelectionRef = React.createRef();

        this.state = { }

        this.onWindowResize = throttle(this.onWindowResize, 250);
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

            return {
                prevChatId: props.chatId,
                selectedIndex,
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
        this.observeResize();
        this.setSelection();

        MessageStore.on('clientUpdateMediaTab', this.onClientUpdateMediaTab);
        MessageStore.on('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.unobserveResize();
        this.observeResize();
    }

    componentWillUnmount() {
        this.unobserveResize();
        MessageStore.off('clientUpdateMediaTab', this.onClientUpdateMediaTab);
        MessageStore.off('clientUpdateChatMedia', this.onClientUpdateChatMedia);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
    }

    onUpdateMessageContent = update => {
        const { chatId } = this.props;
        const { selectedIndex } = this.state;
        const { chat_id } = update;
        if (chatId !== chat_id) {
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

    hasObserver = () => {
        return 'ResizeObserver' in window;
    };

    observeResize() {
        if (!this.hasObserver()) return;
        const filters = this.filtersRef.current;
        if (!filters) return;

        const observer = new ResizeObserver(this.onWindowResize);
        observer.observe(filters);

        this.resizeObserver = { observer, filters }
    }

    unobserveResize() {
        if (!this.hasObserver()) return;
        if (!this.resizeObserver) return;

        const { observer, filters } = this.resizeObserver;
        if (!observer) return;
        if (!filters) return;

        observer.unobserve(filters);
    }

    onWindowResize = () => {
        this.setSelection(true);
    };

    setMediaState = (media, selectedIndex) => {
        const { chatId } = this.props;

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

            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaTab',
                chatId,
                index: selectedIndex
            });
        }

        this.setState({
            selectedIndex,
            photoAndVideo,
            document,
            audio,
            url,
            voiceNote
        }, () => {
            if (!this.hasObserver()) this.setSelection();
        });
    }

    onClientUpdateChatMedia = update => {
        const { chatId: currentChatId } = this.props;
        const { selectedIndex } = this.state;
        const { chatId, media } = update;
        if (chatId !== currentChatId) return;

        this.setMediaState(media, selectedIndex);
    };

    onClientUpdateMediaTab = update => {
        const { chatId, index } = update;
        if (chatId !== this.props.chatId) return;

        this.setState({
            selectedIndex: index
        }, () => {
            if (!this.hasObserver()) this.setSelection();
        });
    };

    setSelection = (transition = true) => {
        const { selectedIndex, isSmallWidth } = this.state;
        if (selectedIndex === -1) return;

        const padding = 3;

        const scroll = this.filtersRef.current;

        let item = null;
        let left = 0;
        const photoAndVideoFilter = this.filterRef.get('photoAndVideo');
        if (selectedIndex === 1 && photoAndVideoFilter) {
            item = photoAndVideoFilter.firstChild;
            left = item.offsetLeft;
        }

        const documentFilter = this.filterRef.get('document');
        if (selectedIndex === 2 && documentFilter) {
            item = documentFilter.firstChild;
            left = item.offsetLeft;
        }

        const audioFilter = this.filterRef.get('audio');
        if (selectedIndex === 3 && audioFilter) {
            item = audioFilter.firstChild;
            left = item.offsetLeft;
        }

        const urlFilter = this.filterRef.get('url');
        if (selectedIndex === 4 && urlFilter) {
            item = urlFilter.firstChild;
            left = item.offsetLeft;
        }

        const voiceNoteFilter = this.filterRef.get('voiceNote');
        if (selectedIndex === 5 && voiceNoteFilter) {
            item = voiceNoteFilter.firstChild;
            left = item.offsetLeft;
        }

        if (!item) return;

        const filterSelection = this.filterSelectionRef.current;
        if (filterSelection) {
            const transitionStyle = transition ? 'transition: left 0.25s ease, width 0.25s ease' : null;
            filterSelection.style.cssText = `left: ${left - padding}px; width: ${item.scrollWidth + 2 * padding}px; ${transitionStyle}`;
        }

        if (item && transition){
            const { animator } = this;

            if (animator) {
                animator.stop();
            }

            this.animator = new Animator(250, [
                {
                    from: scroll.scrollLeft,
                    to: clamp(left - scroll.offsetWidth / 2 + item.offsetWidth / 2, 0, scroll.scrollWidth - scroll.offsetWidth),
                    func: left => (scroll.scrollLeft = left)
                }
            ]);

            setTimeout(() => {
                if (!this.animator) return;

                this.animator.start();
            }, 0);


            // item.scrollIntoView();
        }
    };

    handleFilterClick = (event, id) => {
        if (event && event.button !== 0) return;
        const { chatId, onClick } = this.props;

        onClick && onClick(event);

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaTab',
            chatId,
            index: id
        });
    };

    render() {
        const { t } = this.props;
        const { selectedIndex, photoAndVideo, document, audio, url, voiceNote } = this.state;

        const tabsCount =
            (photoAndVideo.length > 0 ? 1 : 0) +
            (document.length > 0 ? 1 : 0) +
            (audio.length > 0 ? 1 : 0) +
            (url.length > 0 ? 1 : 0) +
            (voiceNote.length > 0 ? 1 : 0);

        const hasSharedMedia = photoAndVideo.length > 0
            || document.length > 0
            || audio.length > 0
            || url.length > 0
            || voiceNote.length > 0;

        if (!hasSharedMedia) {
            return null;
        }

        this.filterRef = new Map();
        return (
            <div className='shared-media-tabs'>
                <div className='shared-media-tabs-bottom-border'/>
                <div ref={this.filtersRef} className={classNames('filters', {'shared-media-tabs-container': tabsCount > 1})}>
                    {photoAndVideo.length > 0 && (
                        <div
                            ref={r => this.filterRef.set('photoAndVideo', r)}
                            className={classNames('filter', {'shared-media-tab': tabsCount > 1}, { 'item-selected': selectedIndex === 1})}
                            onMouseDown={e => this.handleFilterClick(e, 1)}>
                            <span>{t('SharedMediaTab2')}</span>
                        </div>
                    )}
                    {document.length > 0 && (
                        <div
                            ref={r => this.filterRef.set('document', r)}
                            className={classNames('filter', {'shared-media-tab': tabsCount > 1}, { 'item-selected': selectedIndex === 2})}
                            onMouseDown={e => this.handleFilterClick(e, 2)}>
                            <span>{t('SharedFilesTab2')}</span>
                        </div>
                    )}
                    {audio.length > 0 && (
                        <div
                            ref={r => this.filterRef.set('audio', r)}
                            className={classNames('filter', {'shared-media-tab': tabsCount > 1}, { 'item-selected': selectedIndex === 3})}
                            onMouseDown={e => this.handleFilterClick(e, 3)}>
                            <span>{t('SharedMusicTab2')}</span>
                        </div>
                    )}
                    {url.length > 0 && (
                        <div
                            ref={r => this.filterRef.set('url', r)}
                            className={classNames('filter', {'shared-media-tab': tabsCount > 1}, { 'item-selected': selectedIndex === 4})}
                            onMouseDown={e => this.handleFilterClick(e, 4)}>
                            <span>{t('SharedLinksTab2')}</span>
                        </div>
                    )}
                    {voiceNote.length > 0 && (
                        <div
                            ref={r => this.filterRef.set('voiceNote', r)}
                            className={classNames('filter', {'shared-media-tab': tabsCount > 1}, { 'item-selected': selectedIndex === 5})}
                            onMouseDown={e => this.handleFilterClick(e, 5)}>
                            <span>{t('SharedVoiceTab2')}</span>
                        </div>
                    )}
                    <div ref={this.filterSelectionRef} className='filter-selection'/>
                </div>
            </div>
        );
    }

}

SharedMediaTabs.propTypes = {
    chatId: PropTypes.number,
    onClick: PropTypes.func
};

export default withTranslation()(SharedMediaTabs);