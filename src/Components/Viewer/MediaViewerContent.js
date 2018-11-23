/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getMediaFile } from '../../Utils/File';
import FileDownloadProgress from './FileDownloadProgress';
import FileStore from '../../Stores/FileStore';
import './MediaViewerContent.css';

class MediaViewerContent extends React.Component {

    constructor(props){
        super(props);

        const { chatId, messageId, size } = this.props;
        const [width, height, file] = getMediaFile(chatId, messageId, size);
        this.state = {
            prevChatId: chatId,
            prevMessageId: messageId,
            width: width,
            height: height,
            file: file
        }
    }

    static getDerivedStateFromProps(props, state){
        const { chatId, messageId, size } = props;

        if (chatId !== state.prevChatId
            || messageId !== state.prevMessageId) {

            const [width, height, file] = getMediaFile(chatId, messageId, size);
            return {
                prevChatId: chatId,
                prevMessageId: messageId,
                width: width,
                height: height,
                file: file
            }
        }
    }

    componentDidMount(){
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
    }

    componentWillUnmount(){
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
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

    handleContentClick = event => {
        event.stopPropagation();

        this.props.onClick(event);
    };

    getFile = () => {
        const { file } = this.state;
        if (!file) return null;

        return FileStore.get(file.id) || file;
    };

    render() {
        const { width, height, file } = this.state;
        if (!file) return null;

        const blob = FileStore.getBlob(file.id) || file.blob;
        const src = blob ? URL.createObjectURL(blob) : null;

        const latestFile = this.getFile();

        return (
            <div className='media-viewer-content'>
                <img className='media-viewer-content-image' src={src} alt='' onClick={this.handleContentClick}/>
                <FileDownloadProgress file={latestFile}/>
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