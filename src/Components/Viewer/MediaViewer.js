/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import MediaViewerControl from '../Tile/MediaViewerControl';
import MediaViewerContent from './MediaViewerContent';
import PhotoControl from '../Message/Media/PhotoControl';
import { getSize } from '../../Utils/Common';
import { getPhotoFile, saveOrDownload } from '../../Utils/File';
import { PHOTO_SIZE, PHOTO_BIG_SIZE } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import MessageStore from '../../Stores/MessageStore';
import FileStore from '../../Stores/FileStore';
import FileController from '../../Controllers/FileController';
import './MediaViewer.css';
import TdLibController from '../../Controllers/TdLibController';

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
        const { currentMessageId, hasPreviousMedia, hasNextMedia } = this.state;

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

        return false;
    }

    componentDidMount(){
        const { chatId, messageId } = this.props;
        const message = MessageStore.get(chatId, messageId);
        this.loadContent([message]);

        this.loadHistory(messageId);

        document.addEventListener('keydown', this.onKeyDown, false);
    }

    componentWillUnmount(){
        document.removeEventListener('keydown', this.onKeyDown, false);
    }

    loadContent = (messages) => {
        if (!messages) return;
        if (!messages.length) return;

        const store = FileController.getStore();

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
                                FileController.getLocalFile(store, preview, previewIdbKey, null,
                                    () => MessageStore.updateMessagePhoto(message.id),
                                    () => { if (loadRemote)  FileController.getRemoteFile(previewId, 2, message); },
                                    'load_contents_preview_',
                                    message.id);

                            }
                        }*/

                        const [id, pid, idb_key] = getPhotoFile(message, PHOTO_BIG_SIZE);
                        if (pid) {
                            const photoSize = getSize(content.photo.sizes, PHOTO_BIG_SIZE);
                            if (photoSize) {
                                let file = photoSize.photo;
                                if (!file.blob) {
                                    const localMessage = message;
                                    FileController.getLocalFile(store, file, idb_key, null,
                                        () => FileStore.updatePhotoBlob(localMessage.chat_id, localMessage.id, file.id),
                                        () => FileController.getRemoteFile(id, 1, localMessage));
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

        const result = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: messageId,
            offset: -50,
            limit: 100,
            filter: {
                '@type': 'searchMessagesFilterPhoto'
            }
        });

        MessageStore.setItems(result.messages);

        this.history = result.messages;

        const { currentMessageId } = this.state;
        const index = this.history.findIndex(x => x.id === currentMessageId);

        this.setState({ hasNextMedia: this.hasNextMedia(index), hasPreviousMedia: this.hasPreviousMedia(index) });
        //alert(`total_count=${result.total_count} count=${result.messages.length}`);
    };

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
                    const store = FileController.getReadWriteStore();

                    FileController.deleteLocalFile(store, file);
                }
            }
        }
    };

    handlePrevious = event => {
        if (event) {
            event.stopPropagation();
        }

        const { currentMessageId } = this.state;
        const index = this.history.findIndex(x => x.id === currentMessageId);
        const nextIndex = index + 1;

        this.loadNextMedia(nextIndex);
    };

    handleNext = event => {
        if (event) {
            event.stopPropagation();
        }

        const { currentMessageId } = this.state;
        const index = this.history.findIndex(x => x.id === currentMessageId);
        const nextIndex = index - 1;

        this.loadNextMedia(nextIndex);
    };

    loadNextMedia = nextIndex => {
        if (nextIndex < 0) return;
        if (nextIndex >= this.history.length) return;

        this.setState({
            currentMessageId: this.history[nextIndex].id,
            hasNextMedia: this.hasNextMedia(nextIndex),
            hasPreviousMedia: this.hasPreviousMedia(nextIndex)
        });
        this.loadContent([this.history[nextIndex]]);
    };

    hasNextMedia = index => {
        if (index === -1) return false;

        const nextIndex = index - 1;
        return nextIndex >= 0;
    };

    hasPreviousMedia = index => {
        if (index === -1) return false;

        const nextIndex = index + 1;
        return nextIndex < this.history.length;
    };

    render() {
        const { chatId, messageId } = this.props;
        const { currentMessageId, hasNextMedia, hasPreviousMedia } = this.state;

        return (
            <div className='media-viewer'>
                <div className='media-viewer-wrapper' onClick={this.handleClose}>
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
                    <div className='media-viewer-footer-middle-column'/>
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