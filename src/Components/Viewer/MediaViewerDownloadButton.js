/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import SaveIcon from '../../Assets/Icons/Download';
import MediaViewerFooterButton from './MediaViewerFooterButton';
import FileStore from '../../Stores/FileStore';
import './MediaViewerFooterButton.css';

class MediaViewerDownloadButton extends React.Component {
    state = {  };

    static getDerivedStateFromProps(props, state) {
        const { fileId } = props;
        const { prevPropsFileId } = state;

        if (fileId !== prevPropsFileId) {
            return {
                prevPropsFileId: fileId,
                fileId,
                disabled: MediaViewerDownloadButton.saveDisabled(fileId)
            };
        }

        return null;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.fileId !== this.props.chatId) {
            this.checkFileLoaded();
        }
    }

    checkFileLoaded() {
        // console.log('[down] checkLoaded');
        const { fileId } = this.props;
        const blob = FileStore.getBlob(fileId);
        if (blob) {
            // console.log('[down] checkLoaded blob');
            return;
        }

        const file = FileStore.get(fileId);
        if (!file) {
            // console.log('[down] checkLoaded file');
            return;
        }

        const { local } = file;
        if (!local) return;
        if (!local.is_downloading_completed) return;

        // console.log('[down] checkLoaded getLocal');
        const store = FileStore.getStore();
        FileStore.getLocalFile(store, file, null, () => {
            // console.log('[down] checkLoaded getLocal complete');
            this.setState({
                disabled: MediaViewerDownloadButton.saveDisabled(fileId)
            });
        });
    }

    componentDidMount() {
        this.checkFileLoaded();

        FileStore.on('updateFile', this.onUpdateFile);

        FileStore.on('clientUpdateAnimationBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateChatBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateDocumentBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateUserBlob', this.onClientUpdateMediaBlob);
        FileStore.on('clientUpdateVideoBlob', this.onClientUpdateMediaBlob);
    }

    componentWillUnmount() {
        FileStore.off('updateFile', this.onUpdateFile);

        FileStore.off('clientUpdateAnimationBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateChatBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateDocumentBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdatePhotoBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateUserBlob', this.onClientUpdateMediaBlob);
        FileStore.off('clientUpdateVideoBlob', this.onClientUpdateMediaBlob);
    }

    onUpdateFile = update => {
        const { fileId } = this.props;
        const { file } = update;

        if (file.id !== fileId) return;

        if (file.local.is_downloading_completed) {
            this.checkFileLoaded();
        }
    };

    onClientUpdateMediaBlob = update => {
        const { fileId } = this.state;

        if (fileId === update.fileId) {
            this.setState({
                disabled: MediaViewerDownloadButton.saveDisabled(fileId)
            });
        }
    };

    static saveDisabled = fileId => {
        return !Boolean(FileStore.getBlob(fileId));
    };

    handleClick = event => {
        event.stopPropagation();

        const { onClick } = this.props;
        const { disabled } = this.state;
        if (disabled) return;

        onClick(event);
    };

    render() {
        const { title, children, disabled: propsDisabled } = this.props;
        const { disabled } = this.state;

        return (
            <MediaViewerFooterButton disabled={disabled || propsDisabled} title={title} onClick={this.handleClick}>
                {children || <SaveIcon />}
            </MediaViewerFooterButton>
        );
    }
}

MediaViewerDownloadButton.propTypes = {
    fileId: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    title: PropTypes.string,
    disabled: PropTypes.bool
};

export default MediaViewerDownloadButton;
