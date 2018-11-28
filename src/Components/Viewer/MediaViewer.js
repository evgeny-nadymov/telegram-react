/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import MediaViewerControl from '../Tile/MediaViewerControl';
import MediaViewerContent from './MediaViewerContent';
import { getSize } from '../../Utils/Common';
import { getPhotoFile, saveOrDownload } from '../../Utils/File';
import { filterMessages } from '../../Utils/Message';
import { PHOTO_SIZE, PHOTO_BIG_SIZE, MEDIA_SLICE_LIMIT } from '../../Constants';
import MessageStore from '../../Stores/MessageStore';
import FileStore from '../../Stores/FileStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './MediaViewer.css';

class MediaViewer extends React.Component {

    constructor(props){
        super(props);

        this.history = [];

        const { chatId, messageId } = this.props;

        this.state = {
            prevChatId: chatId,
            prevMessageId: messageId,
            currentMessageId: messageId,
            hasNextMedia: false,
            hasPreviousMedia: false,
        };
    }

    shouldComponentUpdate(nextProps, nextState){
        const { chatId, messageId } = this.props;
        const { currentMessageId, hasPreviousMedia, hasNextMedia, firstSliceLoaded, totalCount } = this.state;

        if (nextProps.chatId !== chatId){
            return true;
        }

        if (nextProps.messageId !== messageId){
            return true;
        }

        if (nextState.currentMessageId !== currentMessageId){
            return true;
        }

        if (nextState.hasPrevousMedia !== hasPreviousMedia){
            return true;
        }

        if (nextState.hasNextMedia !== hasNextMedia){
            return true;
        }

        if (nextState.firstSliceLoaded !== firstSliceLoaded){
            return true;
        }

        if (nextState.totalCount !== totalCount){
            return true;
        }

        return false;
    }

    componentDidMount(){
        const { chatId, messageId } = this.props;
        const message = MessageStore.get(chatId, messageId);
        this.loadContent([message]);

        this.loadHistory();

        document.addEventListener('keydown', this.onKeyDown, false);
        MessageStore.on('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.on('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    componentWillUnmount(){
        document.removeEventListener('keydown', this.onKeyDown, false);
        MessageStore.removeListener('updateDeleteMessages', this.onUpdateDeleteMessages);
        MessageStore.removeListener('updateNewMessage', this.onUpdateNewMessage);
        MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent);
    }

    onKeyDown = (event) => {
        if (event.keyCode === 27) {
            this.handleClose();
        }
        else if (event.keyCode === 39){
            this.handleNext();
        }
        else if (event.keyCode === 37){
            this.handlePrevious();
        }
    };

    within = (item, first, last) => {
        return item > first && item < last;
    };

    onUpdateMessageContent = (update) => {
        const { chat_id, message_id, new_content, old_content } = update;
        const { chatId } = this.props;
        const { currentMessageId, totalCount } = this.state;

        if (chatId !== chat_id) return;

        const message = MessageStore.get(chat_id, message_id);
        if (!message) return;

        this.loadContent([message]);

        const addMessage = this.isMediaContent(new_content) && !this.isMediaContent(old_content);
        if (addMessage) {
            if (this.history.length >= 2
                && (this.within(message_id, this.history[0].id, this.history[this.history.length - 1].id) || this.firstSliceLoaded)) {
                let inserted = false;
                let history = [];
                for (let i = 0; i < this.history.length; i++) {
                    if (this.history[i].id > message_id){
                        history.push(this.history[i]);
                    }
                    else{
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

        const removeMessage = !this.isMediaContent(new_content) && this.isMediaContent(old_content);
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
            }
            else {
                const index = this.history.findIndex(x => x.id === currentMessageId);
                this.setState({
                    hasNextMedia: this.hasNextMedia(index),
                    hasPreviousMedia: this.hasPreviousMedia(index),
                    totalCount: Math.max(totalCount - 1, 0)
                });
            }
        }
    };

    onUpdateDeleteMessages = (update) => {
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

        if (!this.history.length){
            ApplicationStore.setMediaViewerContent(null);
            return;
        }

        if (filterMap.has(currentMessageId)){
            this.moveToNextMedia(oldHistory, filterMap);
        }
    };

    moveToNextMedia = (oldHistory, filterMap) => {
        const { currentMessageId } = this.state;

        const index = oldHistory.findIndex(x => x.id === currentMessageId);
        let nextId = 0;
        for (let i = index - 1; i >= 0; i--){
            if (filterMap && !filterMap.has(oldHistory[i].id)){
                nextId = oldHistory[i].id;
                break;
            }
        }
        if (!nextId){
            for (let i = index + 1; i < oldHistory.length; i++){
                if (filterMap && !filterMap.has(oldHistory[i].id)){
                    nextId = oldHistory[i].id;
                    break;
                }
            }
        }

        if (!nextId) return;

        const nextIndex = this.history.findIndex(x => x.id === nextId);

        return this.loadMedia(nextIndex, () => {
            if (nextIndex === 0){
                this.loadNext();
            }
            else if (nextIndex === this.history.length - 1){
                this.loadPrevious();
            }
        });
    };

    onUpdateNewMessage = (update) => {
        const { chatId } = this.props;
        const { currentMessageId, totalCount } = this.state;

        const { message } = update;
        if (!message) return;
        if (!this.isMediaContent(message.content)) return;

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

    isMediaContent(content){
        if (!content) return false;

        return content['@type'] === 'messagePhoto';
    }

    loadContent = (messages) => {
        if (!messages) return;
        if (!messages.length) return;

        const store = FileStore.getStore();

        for (let i = 0; i < messages.length; i++){
            let message = messages[i];
            const { content } = message;
            if (content){
                switch (content['@type']) {
                    case 'messagePhoto': {

                        // preview
                        /*let [previewId, previewPid, previewIdbKey] = getPhotoPreviewFile(message);
                        if (previewPid) {
                            let preview = this.getPreviewPhotoSize(message.content.photo.sizes);
                            if (!preview.blob){
                                FileStore.getLocalFile(store, preview, previewIdbKey, null,
                                    () => MessageStore.updateMessagePhoto(message.id),
                                    () => { if (loadRemote)  FileStore.getRemoteFile(previewId, 2, message); },
                                    'load_contents_preview_',
                                    message.id);

                            }
                        }*/

                        const [id, pid, idb_key] = getPhotoFile(message, PHOTO_BIG_SIZE);
                        if (pid) {
                            const photoSize = getSize(content.photo.sizes, PHOTO_BIG_SIZE);
                            if (photoSize) {
                                let file = photoSize.photo;
                                let blob = file.blob || FileStore.getBlob(file.id);
                                if (!blob) {
                                    const localMessage = message;
                                    FileStore.getLocalFile(store, file, idb_key, null,
                                        () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, file.id),
                                        () => FileStore.getRemoteFile(id, 1, localMessage));
                                }
                            }
                        }

                        break;
                    }
                }
            }
        }
    };

    loadHistory = async () => {
        const { chatId, messageId } = this.props;

        let result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: messageId,
            offset: - MEDIA_SLICE_LIMIT,
            limit: 2 * MEDIA_SLICE_LIMIT,
            filter: { '@type': 'searchMessagesFilterPhoto' }
        });

        filterMessages(result, this.history);
        MessageStore.setItems(result.messages);

        this.history = result.messages;
        this.firstSliceLoaded = result.messages.length === 0;

        const { currentMessageId } = this.state;
        const index = this.history.findIndex(x => x.id === currentMessageId);

        this.setState({
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index)
        });

        this.preloadContent(index);

        const maxCount = 1500;
        let count = 0;
        while (!this.firstSliceLoaded && count < maxCount){
            result = await TdLibController.send({
                '@type': 'searchChatMessages',
                chat_id: chatId,
                query: '',
                sender_user_id: 0,
                from_message_id: this.history.length > 0? this.history[0].id : 0,
                offset: - MEDIA_SLICE_LIMIT,
                limit: MEDIA_SLICE_LIMIT + 1,
                filter: { '@type': 'searchMessagesFilterPhoto' }
            });
            count += result.messages.length;

            filterMessages(result, this.history);
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
    };

    preloadContent = (index) => {
        if (!this.history.length) return;

        const messages = [];
        if (index > 0) {
            messages.push(this.history[index - 1]);
        }
        if (index < this.history.length - 1){
            messages.push(this.history[index + 1]);
        }
        if (index >= 0 && index < this.history.length){
            messages.push(this.history[index]);
        }

        this.loadContent(messages);
    };

    handleClose = () => {
        ApplicationStore.setMediaViewerContent(null);
    };

    handleOpenMedia = () => {

    };

    handleSave = () => {
        const { chatId, messageId } = this.props;
        const { currentMessageId } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return;
        if (!message.content) return;

        const { photo } = message.content;
        if (photo){
            const photoSize = getSize(photo.sizes, PHOTO_BIG_SIZE);
            if (photoSize){
                const file = photoSize.photo;
                if (file) {
                    saveOrDownload(file, file.id + '.jpg', message);
                }
            }
        }
    };

    handleForward = () => {

    };

    handleDelete = () => {
        const { chatId, messageId } = this.props;
        const { currentMessageId } = this.state;

        const message = MessageStore.get(chatId, currentMessageId);
        if (!message) return;
        if (!message.content) return;

        const { photo } = message.content;
        if (photo){
            const photoSize = getSize(photo.sizes, PHOTO_BIG_SIZE);
            if (photoSize){
                let file = photoSize.photo;
                file = FileStore.get(file.id) || file;
                if (file) {
                    const store = FileStore.getReadWriteStore();

                    FileStore.deleteLocalFile(store, file);
                }
            }
        }
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
            if (nextIndex === this.history.length - 1){
                this.loadPrevious();
            }
        });
    };

    loadPrevious = async () => {
        const { chatId } = this.props;
        const { currentMessageId } = this.state;

        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: currentMessageId,
            offset: 0,
            limit: MEDIA_SLICE_LIMIT,
            filter: { '@type': 'searchMessagesFilterPhoto' }
        });

        filterMessages(result, this.history);
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
            if (nextIndex === 0){
                this.loadNext();
            }
        });
    };

    loadNext = async () => {
        const { chatId } = this.props;
        const { currentMessageId } = this.state;

        let result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: currentMessageId,
            offset: - MEDIA_SLICE_LIMIT,
            limit: MEDIA_SLICE_LIMIT + 1,
            filter: { '@type': 'searchMessagesFilterPhoto' }
        });

        filterMessages(result, this.history);
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

        this.setState({
            currentMessageId: this.history[index].id,
            hasNextMedia: this.hasNextMedia(index),
            hasPreviousMedia: this.hasPreviousMedia(index)
        }, callback);

        this.preloadContent(index);
        return true;
    };

    render() {
        const { chatId, messageId } = this.props;
        const { currentMessageId, hasNextMedia, hasPreviousMedia, firstSliceLoaded, totalCount } = this.state;

        let index = -1;
        if (totalCount && firstSliceLoaded){
            index = this.history.findIndex(x => x.id === currentMessageId);
        }

        return (
            <div className='media-viewer'>
                <div className='media-viewer-wrapper' onClick={this.handlePrevious}>
                    <div className='media-viewer-left-column'>
                        <div className='media-viewer-button-placeholder'/>
                        <div className={hasPreviousMedia ? 'media-viewer-button' : 'media-viewer-button-disabled'} onClick={this.handlePrevious}>
                            <div className='media-viewer-previous-icon'/>
                        </div>
                    </div>

                    <div className='media-viewer-content-column'>
                        <MediaViewerContent chatId={chatId} messageId={currentMessageId} size={PHOTO_BIG_SIZE} onClick={this.handlePrevious}/>
                        {/*<MediaViewerContent chatId={chatId} messageId={messageId} size={PHOTO_SIZE}/>*/}
                    </div>

                    <div className='media-viewer-right-column'>
                        <div className='media-viewer-button-close' onClick={this.handleClose}>
                            <div className='media-viewer-close-icon'/>
                        </div>
                        <div className={hasNextMedia ? 'media-viewer-button' : 'media-viewer-button-disabled'} onClick={this.handleNext}>
                            <div className='media-viewer-next-icon'/>
                        </div>
                    </div>
                </div>
                <div className='media-viewer-footer'>
                    <MediaViewerControl chatId={chatId} messageId={currentMessageId}/>
                    <div className='media-viewer-footer-middle-column'>
                        <div className='media-viewer-footer-text'>
                            <span>Photo</span>
                            { (totalCount && index >=0) && <span>&nbsp;{totalCount - index} of {totalCount}</span>}
                        </div>
                    </div>
                    <div className='media-viewer-footer-commands'>
                        <div className='media-viewer-button-save' title='Save' onClick={this.handleSave}>
                            <div className='media-viewer-button-save-icon'/>
                        </div>
                        <div className='media-viewer-button-forward' title='Forward' onClick={this.handleForward}>
                            <div className='media-viewer-button-forward-icon'/>
                        </div>
                        <div className='media-viewer-button-delete' title='Delete' onClick={this.handleDelete}>
                            <div className='media-viewer-button-delete-icon'/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

MediaViewer.propTypes = {
    chatId : PropTypes.number.isRequired,
    messageId : PropTypes.number.isRequired
};

export default MediaViewer;