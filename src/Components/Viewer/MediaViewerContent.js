/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getMediaFile } from '../../Utils/File';
import FileStore from '../../Stores/FileStore';
import './MediaViewerContent.css';

class MediaViewerContent extends React.Component {

    constructor(props){
        super(props);

        const { chatId, messageId, size } = this.props;
        const [width, height, file] = getMediaFile(chatId, messageId, size);
        this.state = {
            width: width,
            height: height,
            file: file
        }
    }

    // shouldComponentUpdate(nextProps, nextState){
    //     if (nextState.file !== this.state.file){
    //         return true;
    //     }
    //
    //     return false;
    // }

    componentDidMount(){
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob)
        //FileStore.on('updateFile', this.onUpdateFile);
    }

    componentWillUnmount(){
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob)
        //FileStore.removeListener('updateFile', this.onUpdateFile);
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

    onUpdateFile = (update) => {
        const { file } = update;

        if (this.state.file
            && this.state.file.id === update.file.id){
            this.setState({ file: file });
        }
    };

    render() {
        const { width, height, file } = this.state;
        if (!file) return null;

        const blob = FileStore.getBlob(file.id) || file.blob;
        const src = blob ? URL.createObjectURL(blob) : null;

        return (
            <div className='media-viewer-content'>
                <img className='media-viewer-content-image' src={src} alt=''/>
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