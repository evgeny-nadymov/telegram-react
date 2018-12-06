import React from 'react';
import PropTypes from 'prop-types';
import FileStore from '../../Stores/FileStore';
import MediaViewerFooterButton from './MediaViewerFooterButton';
import './MediaViewerFooterButton.css';

class MediaViewerDownloadButton extends React.Component {
    constructor(props) {
        super(props);

        const { fileId } = props;

        this.state = {
            prevPropsFileId: fileId,
            fileId: fileId,
            disabled: MediaViewerDownloadButton.saveDisabled(fileId)
        };
    }

    static getDerivedStateFromProps(props, state) {
        const { fileId } = props;
        const { prevPropsFileId } = state;

        if (fileId !== prevPropsFileId) {
            return {
                prevPropsFileId: fileId,
                fileId: fileId,
                disabled: MediaViewerDownloadButton.saveDisabled(fileId)
            };
        }

        return null;
    }

    componentDidMount() {
        FileStore.on('clientUpdateUserBlob', this.onClientUpdateUserBlob);
        FileStore.on('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateUserBlob', this.onClientUpdateUserBlob);
        FileStore.removeListener('clientUpdateChatBlob', this.onClientUpdateChatBlob);
        FileStore.removeListener('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
    }

    onClientUpdateUserBlob = (update) => {
        const { fileId } = this.state;

        if (fileId === update.fileId) {
            this.setState({
                disabled: MediaViewerDownloadButton.saveDisabled(fileId)
            });
        }
    };

    onClientUpdateChatBlob = (update) => {
        const { fileId } = this.state;

        if (fileId === update.fileId) {
            this.setState({
                disabled: MediaViewerDownloadButton.saveDisabled(fileId)
            });
        }
    };

    onClientUpdatePhotoBlob = (update) => {
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
        const { disabled } = this.state;

        return (
            <MediaViewerFooterButton
                disabled={disabled}
                title='Save'
                onClick={this.handleClick}>
                <div className='media-viewer-save-icon' />
            </MediaViewerFooterButton>
        );
    }
}

MediaViewerDownloadButton.propTypes = {
    fileId: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired
};

export default MediaViewerDownloadButton;
