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
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import CloseIcon from '../../Assets/Icons/Close';
import DeleteIcon from '../../Assets/Icons/Delete';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import NavigateBeforeIcon from '../../Assets/Icons/Left';
import ReplyIcon from '../../Assets/Icons/Share';
import MediaInfo from '../Tile/MediaInfo';
import MediaViewerContent from './MediaViewerContent';
import MediaViewerButton from './MediaViewerButton';
import MediaViewerFooterText from './MediaViewerFooterText';
import MediaViewerFooterButton from './MediaViewerFooterButton';
import MediaViewerDownloadButton from './MediaViewerDownloadButton';
import { forwardMessages, setMediaViewerContent } from '../../Actions/Client';
import {
    cancelPreloadMediaViewerContent,
    getMediaFile,
    loadMediaViewerContent,
    preloadMediaViewerContent,
    saveMedia
} from '../../Utils/File';
import {
    canMessageBeDeleted,
    filterDuplicateMessages,
    isAnimationMessage,
    isEmbedMessage,
    isMediaContent,
    isVideoMessage
} from '../../Utils/Message';
import { between } from '../../Utils/Common';
import { modalManager } from '../../Utils/Modal';
import { PHOTO_BIG_SIZE, MEDIA_SLICE_LIMIT } from '../../Constants';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './MediaViewer.css';

class MediaViewer extends React.Component {
    constructor(props) {
        super(props);

        this.keyboardHandler = new KeyboardHandler(this.onKeyDown);
        this.history = [];

        const { chatId, messageId } = this.props;

        this.state = {
            background: 'media-viewer-default',
            prevChatId: chatId,
            prevMessageId: messageId,
            currentMessageId: messageId,
            hasNextMedia: false,
            hasPreviousMedia: false,
            deleteConfirmationOpened: false,
            deleteForAll: true
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId, messageId } = this.props;
        const {
            background,
            currentMessageId,
            deleteConfirmationOpened,
            firstSliceLoaded,
            hasNextMedia,
            hasPreviousMedia,
            totalCount
        } = this.state;

        if (nextState.background !== background) {
            return true;
        }

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextProps.messageId !== messageId) {
            return true;
        }

        if (nextState.currentMessageId !== currentMessageId) {
            return true;
        }

        if (nextState.hasPrevousMedia !== hasPreviousMedia) {
            return true;
        }

        if (nextState.hasNextMedia !== hasNextMedia) {
            return true;
        }

        if (nextState.firstSliceLoaded !== firstSliceLoaded) {
            return true;
        }

        if (nextState.totalCount !== totalCount) {
            return true;
        }

        if (nextState.deleteConfirmationOpened !== deleteConfirmationOpened) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        this.loadHistory();

        KeyboardManager.add(this.keyboardHandler);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    componentWillUnmount() {
        KeyboardManager.remove(this.keyboardHandler);
        MessageStore.off('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.off('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.off('updateMessageContent', this.onUpdateMessageContent);
    }

    onKeyDown = event => {
        const { chatId } = this.props;
        const { currentMessageId } = this.state;

        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        const fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement;

        const { key } = event;
        switch (key) {
            case 'Escape': {

                this.handleClose();
                event.stopPropagation();
                event.preventDefault();
                return;
            }
            case 'ArrowLeft': {
                if (!fullscreenElement) {
                    this.handlePrevious();
                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }
                break;
            }
            case 'ArrowRight': {
                if (!fullscreenElement) {
                    this.handleNext();
                    event.stopPropagation();
                    event.preventDefault();
                    return;
                }
                break;
            }
        }

        const isVideo = isVideoMessage(chatId, currentMessageId);
        if (isVideo) {
            TdLibController.clientUpdate({ '@type': 'clientUpdateMediaShortcut', event });
        }
    };

    onUpdateMessageContent = update => {
        const { chat_id, message_id, new_content, old_content } = update;
        const { chatId } = this.props;
        const { currentMessageId, totalCount } = this.state;

        if (chatId !== chat_id) return;

        const message = MessageStore.get(chat_id, message_id);
        if (!message) return;

        loadMediaViewerContent([message]);

        const addMessage = isMediaContent(new_content) && !isMediaContent(old_content);
        if (addMessage) {
            if (
                this.history.length >= 2 &&
                (this.firstSliceLoaded ||
                    between(message_id, this.history[0].id, this.history[this.history.length - 1].id))
            ) {
                let inserted = false;
                let history = [];
                for (let i = 0; i < this.history.length; i++) {
                    if (this.history[i].id > message_id) {
                        history.push(this.history[i]);
                    } else {
                        if (!inserted) {
                            inserted = true;
                            history.push(message);
                        }
                        history.push(this.history[i]);
                    }
                }
                this.history = history;
            }

            const index = this.history.findIndex(x => x.id === currentMessageId);
            this.setState({
                hasNextMedia: this.hasNextMedia(index),
                hasPreviousMedia: this.hasPreviousMedia(index),
                totalCount: totalCount + 1
            });
        }

        const removeMessage = !isMediaContent(new_content) && isMediaContent(old_content);
        if (removeMessage) {
            let oldHistory = this.history;
            this.history = this.history.filter(x => x.id !== message_id);

            if (currentMessageId === message_id) {
                const filterMap = new Map();
                filterMap.set(message_id, message_id);

                this.moveToNextMedia(oldHistory, filterMap);
                this.setState({
                    totalCount: Math.max(totalCount - 1, 0)
                });
            } else {
                const index = this.history.findIndex(x => x.id === currentMessageId);
                this.setState({
                    hasNextMedia: this.hasNextMedia(index),
                    hasPreviousMedia: this.hasPreviousMedia(index),
                    totalCount: Math.max(totalCount - 1, 0)
                });
            }
        }
    };

    onUpdateDeleteMessages = update => {
        const { chat_id, message_ids, is_permanent } = update;
        const { chatId } = this.props;
        const { currentMessageId, totalCount } = this.state;

        if (!is_permanent) return;
        if (chatId !== chat_id) return;

        const filterMap = message_ids.reduce((accumulator, currentId) => {
            accumulator.set(currentId, currentId);
            return accumulator;
        }, new Map());

        const oldHistory = this.history;
        let deletedCount = oldHistory.length;

        this.history = this.history.filter(x => !filterMap.has(x.id));
        deletedCount -= this.history.length;

        this.setState({ totalCount: Math.max(totalCount - deletedCount, 0) });

        if (!this.history.length) {
            setMediaViewerContent(null);
            return;
        }

        if (filterMap.has(currentMessageId)) {
            this.moveToNextMedia(oldHistory, filterMap);
        }
    };

    onUpdateNewMessage = update => {
        const { chatId } = this.props;
        const { currentMessageId, totalCount } = this.state;

        const { message } = update;
        if (!message) return;
        if (!isMediaContent(message.content)) return;

        if (message.chat_id !== chatId) return;
        if (!this.firstSliceLoaded) return;

        this.history = [message].concat(this.history);
        const index = this.history.findIndex(x => x.id === currentMessageId);

        this.setState({
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index),
            totalCount: totalCount + 1
        });
    };

    getFilter = (chatId, messageId) => {
        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { content } = message;
        if (!content) return null;

        switch (content['@type']) {
            case 'messageChatChangePhoto': {
                return {
                    '@type': 'searchMessagesFilterChatPhoto'
                };
            }
            case 'messagePhoto': {
                return {
                    '@type': 'searchMessagesFilterPhotoAndVideo'
                };
            }
            case 'messageVideo': {
                return {
                    '@type': 'searchMessagesFilterPhotoAndVideo'
                };
            }
            default: {
                return null;
            }
        }
    };

    loadHistory = async () => {
        const { chatId, messageId } = this.props;

        const filter = this.getFilter(chatId, messageId);

        let result = {
            '@type': 'messages',
            messages: [],
            total_count: 0
        };
        if (filter) {
            result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: '',
                sender_user_id: 0,
                from_message_id: messageId,
                offset: -MEDIA_SLICE_LIMIT,
                limit: 2 * MEDIA_SLICE_LIMIT,
                filter: filter
            });
        }

        filterDuplicateMessages(result, this.history);
        MessageStore.setItems(result.messages);

        this.history = result.messages;
        this.firstSliceLoaded = result.messages.length === 0;

        const { currentMessageId } = this.state;
        const index = this.history.findIndex(x => x.id === currentMessageId);

        this.setState({
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index)
        });

        if (index === -1) {
            this.history = [MessageStore.get(chatId, currentMessageId)];
            preloadMediaViewerContent(0, this.history);
        } else {
            preloadMediaViewerContent(index, this.history);

            const filter = this.getFilter(chatId, messageId);
            if (!filter) return;

            const maxCount = 1500;
            let count = 0;
            while (!this.firstSliceLoaded && count < maxCount) {
                const result = await TdLibController.send({
                    '@type': 'searchChatMessages',
                    chat_id: chatId,
                    query: '',
                    sender_user_id: 0,
                    from_message_id: this.history.length > 0 ? this.history[0].id : 0,
                    offset: -99,
                    limit: 99 + 1,
                    filter: filter
                });
                count += result.messages.length;

                filterDuplicateMessages(result, this.history);
                MessageStore.setItems(result.messages);

                this.history = result.messages.concat(this.history);
                this.firstSliceLoaded = result.messages.length === 0;

                const { currentMessageId } = this.state;
                const index = this.history.findIndex(x => x.id === currentMessageId);

                this.setState({
                    hasNextMedia: this.hasNextMedia(index),
                    hasPreviousMedia: this.hasPreviousMedia(index),
                    firstSliceLoaded: this.firstSliceLoaded,
                    totalCount: result.total_count
                });
            }
        }
    };

    handleClose = () => {
        setMediaViewerContent(null);

        const { currentMessageId } = this.state;
        const index = this.history.findIndex(x => x.id === currentMessageId);
        if (index !== -1) {
            cancelPreloadMediaViewerContent(index, this.history);
        }
    };

    handleSave = () => {
        const { chatId } = this.props;
        const { currentMessageId } = this.state;

        const message = MessageStore.get(chatId, currentMessageId);
        if (!message) return;

        const { content } = message;
        if (!content) return;

        let media = null;
        switch (content['@type']) {
            case 'messageAnimation': {
                const { animation } = content;

                media = animation;
                break;
            }
            case 'messageChatChangePhoto': {
                const { photo } = content;

                media = photo;
                break;
            }
            case 'messageDocument': {
                const { document } = content;

                media = document;
                break;
            }
            case 'messagePhoto': {
                const { photo } = content;

                media = photo;
                break;
            }
            case 'messageText': {
                const { web_page } = content;
                if (!web_page) return;

                const { animation, document, photo, video } = web_page;

                if (animation) {
                    media = animation;
                    break;
                }

                if (document) {
                    media = document;
                    break;
                }

                if (photo) {
                    media = photo;
                    break;
                }

                if (video) {
                    media = video;
                    break;
                }
                break;
            }
            case 'messageVideo': {
                const { video } = content;

                media = video;
                break;
            }
        }

        saveMedia(media, message);
    };

    handleForward = () => {
        const { chatId } = this.props;
        const { currentMessageId } = this.state;

        forwardMessages(chatId, [currentMessageId]);
    };

    handleDelete = () => {
        this.handleDialogOpen();
    };

    hasPreviousMedia = index => {
        if (index === -1) return false;

        const nextIndex = index + 1;
        return nextIndex < this.history.length;
    };

    handlePrevious = event => {
        if (event) {
            event.stopPropagation();
        }

        const { currentMessageId } = this.state;
        const index = this.history.findIndex(x => x.id === currentMessageId);
        const nextIndex = index + 1;

        return this.loadMedia(nextIndex, () => {
            if (nextIndex === this.history.length - 1) {
                this.loadPrevious();
            }
        });
    };

    loadPrevious = async () => {
        const { chatId, messageId } = this.props;
        const { currentMessageId } = this.state;

        const filter = this.getFilter(chatId, messageId);

        let result = {
            '@type': 'messages',
            messages: [],
            total_count: 0
        };
        if (filter) {
            result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: '',
                sender_user_id: 0,
                from_message_id: currentMessageId,
                offset: 0,
                limit: MEDIA_SLICE_LIMIT,
                filter: filter
            });
        }

        filterDuplicateMessages(result, this.history);
        MessageStore.setItems(result.messages);

        this.history = this.history.concat(result.messages);

        const index = this.history.findIndex(x => x.id === currentMessageId);

        this.setState({
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index),
            totalCount: result.total_count
        });
    };

    hasNextMedia = index => {
        if (index === -1) return false;

        const nextIndex = index - 1;
        return nextIndex >= 0;
    };

    handleNext = event => {
        if (event) {
            event.stopPropagation();
        }

        const { currentMessageId } = this.state;
        const index = this.history.findIndex(x => x.id === currentMessageId);
        const nextIndex = index - 1;

        return this.loadMedia(nextIndex, () => {
            if (nextIndex === 0) {
                this.loadNext();
            }
        });
    };

    loadNext = async () => {
        const { chatId, messageId } = this.props;
        const { currentMessageId } = this.state;

        const filter = this.getFilter(chatId, messageId);

        let result = {
            '@type': 'messages',
            messages: [],
            total_count: 0
        };
        if (filter) {
            result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: '',
                sender_user_id: 0,
                from_message_id: currentMessageId,
                offset: -MEDIA_SLICE_LIMIT,
                limit: MEDIA_SLICE_LIMIT + 1,
                filter: filter
            });
        }

        filterDuplicateMessages(result, this.history);
        MessageStore.setItems(result.messages);

        this.firstSliceLoaded = result.messages.length === 0;
        this.history = result.messages.concat(this.history);

        const index = this.history.findIndex(x => x.id === currentMessageId);

        this.setState({
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index),
            firstSliceLoaded: this.firstSliceLoaded,
            totalCount: result.total_count
        });
    };

    loadMedia = (index, callback) => {
        if (index < 0) return false;
        if (index >= this.history.length) return false;

        this.setState(
            {
                currentMessageId: this.history[index].id,
                hasNextMedia: this.hasNextMedia(index),
                hasPreviousMedia: this.hasPreviousMedia(index)
            },
            callback
        );

        preloadMediaViewerContent(index, this.history);
        return true;
    };

    moveToNextMedia = (oldHistory, filterMap) => {
        const { currentMessageId } = this.state;

        const index = oldHistory.findIndex(x => x.id === currentMessageId);
        let nextId = 0;
        for (let i = index - 1; i >= 0; i--) {
            if (filterMap && !filterMap.has(oldHistory[i].id)) {
                nextId = oldHistory[i].id;
                break;
            }
        }
        if (!nextId) {
            for (let i = index + 1; i < oldHistory.length; i++) {
                if (filterMap && !filterMap.has(oldHistory[i].id)) {
                    nextId = oldHistory[i].id;
                    break;
                }
            }
        }

        if (!nextId) return;

        const nextIndex = this.history.findIndex(x => x.id === nextId);

        return this.loadMedia(nextIndex, () => {
            if (nextIndex === 0) {
                this.loadNext();
            } else if (nextIndex === this.history.length - 1) {
                this.loadPrevious();
            }
        });
    };

    handleDialogOpen = () => {
        this.setState({ deleteConfirmationOpened: true });
    };

    handleDialogClose = () => {
        this.setState({ deleteConfirmationOpened: false });
    };

    handleDone = () => {
        this.setState({ deleteConfirmationOpened: false });

        const { chatId } = this.props;
        const { currentMessageId, deleteForAll } = this.state;

        const message = MessageStore.get(chatId, currentMessageId);
        if (!message) return;

        const { can_be_deleted_only_for_self, can_be_deleted_for_all_users } = message;
        const canBeDeleted = can_be_deleted_only_for_self || can_be_deleted_for_all_users;
        if (!canBeDeleted) return;

        TdLibController.send({
            '@type': 'deleteMessages',
            chat_id: chatId,
            message_ids: [currentMessageId],
            revoke: can_be_deleted_for_all_users && deleteForAll
        });
    };

    handleChangeDeleteForAll = event => {
        this.setState({ deleteForAll: event.target.checked });
    };

    handleInvertColors = () => {
        const { background } = this.state;

        let nextBackground = 'media-viewer-default';
        switch (background) {
            case 'media-viewer-default': {
                nextBackground = 'media-viewer-dark';
                break;
            }
            case 'media-viewer-dark': {
                nextBackground = 'media-viewer-light';
                break;
            }
            case 'media-viewer-light': {
                nextBackground = 'media-viewer-default';
                break;
            }
        }

        this.setState({
            background: nextBackground
        });
    };

    canBeForwarded = (chatId, messageId) => {
        const message = MessageStore.get(chatId, messageId);
        if (!message) return false;

        const { can_be_forwarded, content } = message;
        if (!content) return false;

        switch (content['@type']) {
            case 'messageChatChangePhoto': {
                return true;
            }
            default: {
                return can_be_forwarded;
            }
        }
    };

    handleWrapperMouseDown = event => {
        this.mouseDownTarget = event.currentTarget;
    }

    handleWrapperClick = event => {
        const { mouseDownTarget } = this;
        this.mouseDownTarget = null;

        if (event.currentTarget !== mouseDownTarget) return;

        this.handleClose();
    };

    render() {
        const { chatId, t } = this.props;
        const {
            background,
            currentMessageId,
            deleteConfirmationOpened,
            deleteForAll,
            firstSliceLoaded,
            hasNextMedia,
            hasPreviousMedia,
            totalCount
        } = this.state;

        let index = -1;
        if (totalCount && firstSliceLoaded) {
            index = this.history.findIndex(x => x.id === currentMessageId);
        }
        const maxCount = Math.max(this.history.length, totalCount);

        const message = MessageStore.get(chatId, currentMessageId);
        const { can_be_deleted_for_all_users } = message;

        const canBeDeleted = canMessageBeDeleted(chatId, currentMessageId);
        const canBeForwarded = this.canBeForwarded(chatId, currentMessageId);

        let deleteConfirmationContent = '';
        if (isVideoMessage(chatId, currentMessageId)) {
            deleteConfirmationContent = t('AreYouSureDeleteVideo');
        } else if (isAnimationMessage(chatId, currentMessageId)) {
            deleteConfirmationContent = t('AreYouSureDeleteGIF');
        } else {
            deleteConfirmationContent = t('AreYouSureDeletePhoto');
        }
        const deleteConfirmation = deleteConfirmationOpened ? (
            <Dialog
                manager={modalManager}
                transitionDuration={0}
                open={deleteConfirmationOpened}
                onClose={this.handleDialogClose}
                aria-labelledby='form-dialog-title'>
                <DialogTitle id='form-dialog-title'>{t('Confirm')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{deleteConfirmationContent}</DialogContentText>
                    {can_be_deleted_for_all_users && (
                        <FormControlLabel
                            label={t('DeleteForAll')}
                            control={
                                <Checkbox color='primary' value='deleteAll' onChange={this.handleChangeDeleteForAll} />
                            }
                            checked={deleteForAll}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleDialogClose} color='primary'>
                        {t('Cancel')}
                    </Button>
                    <Button onClick={this.handleDone} color='primary'>
                        {t('Ok')}
                    </Button>
                </DialogActions>
            </Dialog>
        ) : null;

        const [width, height, file, mimeType] = getMediaFile(chatId, currentMessageId, PHOTO_BIG_SIZE);

        const fileId = file ? file.id : 0;
        let title = t('AttachPhoto');
        if (isEmbedMessage(chatId, currentMessageId)) {
            title = '';
        } else if (isVideoMessage(chatId, currentMessageId)) {
            title = t('AttachVideo');
        } else if (isAnimationMessage(chatId, currentMessageId)) {
            title = t('AttachGif');
        }

        return (
            <div className={classNames('media-viewer', background)}>
                <div className='media-viewer-footer'>
                    <MediaInfo chatId={chatId} messageId={currentMessageId} />
                    <MediaViewerFooterText
                        title={title}
                        subtitle={maxCount && index >= 0 ? `${maxCount - index} of ${maxCount}` : null}
                    />
                    <MediaViewerDownloadButton title={t('Save')} fileId={fileId} disabled={isEmbedMessage(chatId, currentMessageId)} onClick={this.handleSave} />
                    <MediaViewerFooterButton
                        title={t('Forward')}
                        disabled={!canBeForwarded}
                        onClick={this.handleForward}>
                        <ReplyIcon />
                    </MediaViewerFooterButton>
                    <MediaViewerFooterButton title={t('Delete')} disabled={!canBeDeleted} onClick={this.handleDelete}>
                        <DeleteIcon />
                    </MediaViewerFooterButton>
                    <MediaViewerFooterButton title={t('Close')} onClick={this.handleClose}>
                        <CloseIcon />
                    </MediaViewerFooterButton>
                </div>
                <div className='media-viewer-wrapper' onMouseDown={this.handleWrapperMouseDown} onClick={this.handleWrapperClick}>
                    <div className='media-viewer-left-column'>
                        <MediaViewerButton disabled={!hasPreviousMedia} grow onClick={this.handlePrevious}>
                            <NavigateBeforeIcon />
                        </MediaViewerButton>
                    </div>

                    <div className='media-viewer-content-column'>
                        <MediaViewerContent
                            chatId={chatId}
                            messageId={currentMessageId}
                            size={PHOTO_BIG_SIZE}
                            onClick={this.handlePrevious}
                        />
                    </div>

                    <div className='media-viewer-right-column'>
                        <MediaViewerButton disabled={!hasNextMedia} grow onClick={this.handleNext}>
                            <NavigateBeforeIcon style={{ transform: 'rotate(180deg)' }} />
                        </MediaViewerButton>
                    </div>
                </div>
                {deleteConfirmation}
            </div>
        );
    }
}

MediaViewer.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired
};

export default withTranslation()(MediaViewer);
