/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import FileDownloadProgress from './FileDownloadProgress';
import MediaCaption from './MediaCaption';
import { getMediaFile } from '../../Utils/File';
import { getText } from '../../Utils/Message';
import { PHOTO_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import MessageStore from '../../Stores/MessageStore';
import './MediaViewerContent.css';

class MediaViewerContent extends React.Component {

    constructor(props){
        super(props);

        const { chatId, messageId, size } = this.props;
        let [width, height, file] = getMediaFile(chatId, messageId, size);
        file = FileStore.get(file.id) || file;

        let [previewWidth, previewHeight, previewFile] = getMediaFile(chatId, messageId, PHOTO_SIZE);
        previewFile = FileStore.get(previewFile.id) || previewFile;

        const message = MessageStore.get(chatId, messageId);
        const text = getText(message);

        this.state = {
            prevChatId: chatId,
            prevMessageId: messageId,
            width: width,
            height: height,
            file: file,
            text: text,
            previewWidth: previewWidth,
            previewHeight: previewHeight,
            previewFile: previewFile
        }
    }

    static getDerivedStateFromProps(props, state){
        const { chatId, messageId, size } = props;

        if (chatId !== state.prevChatId
            || messageId !== state.prevMessageId) {

            let [width, height, file] = getMediaFile(chatId, messageId, size);
            file = FileStore.get(file.id) || file;

            const message = MessageStore.get(chatId, messageId);
            const text = getText(message);

            let [previewWidth, previewHeight, previewFile] = getMediaFile(chatId, messageId, PHOTO_SIZE);
            previewFile = FileStore.get(previewFile.id) || previewFile;

            return {
                prevChatId: chatId,
                prevMessageId: messageId,
                width: width,
                height: height,
                file: file,
                text: text,
                previewWidth: previewWidth,
                previewHeight: previewHeight,
                previewFile: previewFile
            }
        }

        return null;
    }

    componentDidMount(){
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        MessageStore.on('updateMessageContent', this.onUpdateMessageContent);
    }

    componentWillUnmount(){
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
        MessageStore.removeListener('updateMessageContent', this.onUpdateMessageContent);
    }

    onClientUpdatePhotoBlob = (update) => {
        const { chatId, messageId, size } = this.props;

        if (chatId === update.chatId && messageId === update.messageId) {
            const [width, height, file] = getMediaFile(chatId, messageId, size);
            this.setState({
                width: width,
                height: height,
                file: file
            });
        }
    };

    onUpdateMessageContent = (update) => {
        const { chatId, messageId, size } = this.props;
        const { chat_id, message_id } = update;

        if (chatId === chat_id && messageId === message_id) {
            const [width, height, file] = getMediaFile(chatId, messageId, size);
            const message = MessageStore.get(chatId, messageId);
            const text = getText(message);
            this.setState({
                width: width,
                height: height,
                file: file,
                text: text
            });
        }
    };

    handleContentClick = event => {
        event.stopPropagation();

        this.props.onClick(event);
    };

    render() {
        const { width, height, file, text, previewFile } = this.state;
        if (!file) return null;

        const latestFile = FileStore.get(file.id) || file;
        const blob = FileStore.getBlob(file.id) || file.blob;
        const src = FileStore.getBlobUrl(blob);

        const previewBlob = FileStore.getBlob(previewFile.id) || previewFile.blob;
        const previewSrc = FileStore.getBlobUrl(previewBlob);

        return (
            <div className='media-viewer-content'>
                <img className='media-viewer-content-image' src={src} alt='' onClick={this.handleContentClick}/>
                {/*<img className='media-viewer-content-image-preview' src={previewSrc} alt='' />*/}
                {/*<div className='media-viewer-content-wrapper'/>*/}
                <FileDownloadProgress file={latestFile}/>
                { (text && text.length > 0) && <MediaCaption text={text}/> }
            </div>
        );
    }
}

MediaViewerContent.propTypes = {
    chatId : PropTypes.number.isRequired,
    messageId : PropTypes.number.isRequired,
    size : PropTypes.number.isRequired
};

export default MediaViewerContent;