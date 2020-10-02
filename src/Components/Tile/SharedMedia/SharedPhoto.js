/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ContextMenu from './ContextMenu';
import { getSrc } from '../../../Utils/File';
import { getSize } from '../../../Utils/Common';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { PHOTO_SIZE, PHOTO_THUMBNAIL_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './SharedPhoto.css';

class SharedPhoto extends React.Component {
    constructor(props) {
        super(props);

        const { photo, size, thumbnailSize } = props;

        this.state = {
            contextMenu: false,
            left: 0,
            top: 0,

            photoSize: getSize(photo.sizes, size),
            thumbSize: getSize(photo.sizes, thumbnailSize),
            minithumbnail: photo.minithumbnail
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, messageId, photo, showOpenMessage } = this.props;
        const { contextMenu, left, top } = this.state;

        if (chatId !== nextProps.chatId) {
            return true;
        }

        if (messageId !== nextProps.messageId) {
            return true;
        }

        if (photo !== nextProps.photo) {
            return true;
        }

        if (showOpenMessage !== nextProps.showOpenMessage) {
            return true;
        }

        if (contextMenu !== nextState.contextMenu) {
            return true;
        }

        if (left !== nextState.left) {
            return true;
        }

        if (top !== nextState.top) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        FileStore.on('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdatePhotoBlob', this.onClientUpdatePhotoBlob);
    }

    onClientUpdatePhotoBlob = update => {
        const { photoSize, thumbSize } = this.state;
        const { fileId } = update;

        if (photoSize && photoSize.photo && photoSize.photo.id === fileId) {
            this.forceUpdate();
        } else if (thumbSize && thumbSize.photo && thumbSize.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    handleOpenContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;

            this.setState({
                contextMenu: true,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    render() {
        const { chatId, messageId, openMedia, showOpenMessage, style } = this.props;
        const { minithumbnail, thumbSize, photoSize, contextMenu, left, top } = this.state;

        if (!photoSize) return null;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbSrc = getSrc(thumbSize ? thumbSize.photo : null);
        const src = getSrc(photoSize.photo);
        const isBlurred = miniSrc || isBlurredThumbnail(thumbSize);

        return (
            <>
                <div className='shared-photo' style={style} onClick={openMedia} onContextMenu={this.handleOpenContextMenu}>
                    <div className='shared-photo-content' style={{ backgroundImage: `url(${thumbSrc || miniSrc})`, backgroundSize: 'cover' }}>
                        {src !== thumbSrc && (
                            <div className='shared-photo-main-content' style={{ backgroundImage: `url(${src})` }} />
                        )}
                    </div>
                </div>
                <ContextMenu
                    chatId={chatId}
                    messageId={messageId}
                    anchorPosition={{ top, left }}
                    open={contextMenu}
                    showOpenMessage={showOpenMessage}
                    onClose={this.handleCloseContextMenu}
                />
            </>
        );
    }
}

SharedPhoto.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    photo: PropTypes.object,
    showOpenMessage: PropTypes.bool,
    openMedia: PropTypes.func,

    size: PropTypes.number,
    thumbnailSize: PropTypes.number,
    style: PropTypes.object
};

SharedPhoto.defaultProps = {
    size: PHOTO_SIZE,
    thumbnailSize: PHOTO_THUMBNAIL_SIZE
};

export default SharedPhoto;
