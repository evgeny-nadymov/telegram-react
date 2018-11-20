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
import PhotoControl from '../Message/Media/PhotoControl';
import { getSize } from '../../Utils/Common';
import { getPhotoFile, saveOrDownload } from '../../Utils/File';
import { PHOTO_BIG_SIZE } from '../../Constants';
import ApplicationStore from '../../Stores/ApplicationStore';
import MessageStore from '../../Stores/MessageStore';
import FileStore from '../../Stores/FileStore';
import FileController from '../../Controllers/FileController';
import './MediaViewer.css';

class MediaViewer extends React.Component {

    constructor(props){
        super(props);

        const { chatId, messageId } = this.props;

        this.state = {
            prevChatId: chatId,
            prevMessageId: messageId
        };
    }

    shouldComponentUpdate(nextProps, nextState){
        const { chatId, messageId } = this.props;

        if (nextProps.chatId !== chatId){
            return true;
        }

        if (nextProps.messageId !== messageId){
            return true;
        }

        return false;
    }

    componentDidMount(){
        this.loadContent();

        document.addEventListener('keydown', this.onKeyDown, false);
    }

    componentWillUnmount(){
        document.removeEventListener('keydown', this.onKeyDown, false);
    }

    loadContent = () => {
        const { chatId, messageId } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (message){
            const { content } = message;
            if (content){

                const store = FileController.getStore();

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

                        const size = PHOTO_BIG_SIZE;
                        const [id, pid, idb_key] = getPhotoFile(message, size);
                        if (pid) {
                            const photoSize = getSize(content.photo.sizes, size);
                            if (photoSize) {
                                const file = photoSize.photo;
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

    onKeyDown = (event) => {
        if (event.keyCode === 27) {
            this.handleClose();
        }
    };

    handleClose = () => {
        ApplicationStore.setMediaViewerContent(null);
    };

    handleOpenMedia = () => {

    };

    handleSave = () => {
        const { chatId, messageId } = this.props;

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

    };

    render() {
        const { chatId, messageId } = this.props;

        const message = MessageStore.get(chatId, messageId);

        return (
            <div className='media-viewer'>
                <div className='media-viewer-wrapper'>
                    <div className='media-viewer-left-column'>
                        <div className='media-viewer-button-placeholder'/>
                        <div className='media-viewer-button'>
                            <div className='media-viewer-previous-icon'/>
                        </div>
                    </div>

                    <div className='media-viewer-content-column'>
                        {/*<PhotoControl message={message} openMedia={this.handleOpenMedia} size={1280} displaySize={1280}/>*/}
                        <MediaViewerContent chatId={chatId} messageId={messageId} size={1280}/>
                    </div>

                    <div className='media-viewer-right-column'>
                        <div className='media-viewer-button-close' onClick={this.handleClose}>
                            <div className='media-viewer-close-icon'/>
                        </div>
                        <div className='media-viewer-button'>
                            <div className='media-viewer-next-icon'/>
                        </div>
                    </div>
                </div>
                <div className='media-viewer-footer'>
                    <MediaViewerControl chatId={chatId} messageId={messageId}/>
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