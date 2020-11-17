/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import ContextMenu from './ContextMenu';
import { getSrc } from '../../../Utils/File';
import { getDurationString } from '../../../Utils/Common';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { PHOTO_SIZE, PHOTO_THUMBNAIL_SIZE, THUMBNAIL_BLURRED_SIZE_90 } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './SharedVideo.css';

class SharedVideo extends React.Component {
    state = {
        contextMenu: false,
        left: 0,
        top: 0
    };

    componentDidMount() {
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.off('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, messageId, video, showOpenMessage } = this.props;
        const { contextMenu, left, top } = this.state;

        if (chatId !== nextProps.chatId) {
            return true;
        }

        if (messageId !== nextProps.messageId) {
            return true;
        }

        if (video !== nextProps.video) {
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

    onClientUpdateVideoThumbnailBlob = update => {
        const { thumbnail } = this.props.video;
        const { fileId } = update;

        if (!thumbnail) return;

        const { file } = thumbnail;
        if (file && file.id === fileId) {
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
        const { chatId, messageId, openMedia, style, showOpenMessage } = this.props;
        const { minithumbnail, thumbnail, duration } = this.props.video;
        const { contextMenu, left, top } = this.state;

        const miniSrc = minithumbnail ? 'data:image/jpeg;base64, ' + minithumbnail.data : null;
        const thumbSrc = getSrc(thumbnail ? thumbnail.file : null);
        const isBlurred = thumbSrc ? isBlurredThumbnail(thumbnail) : Boolean(miniSrc);

        return (
            <>
                <div className='shared-photo' style={style} onClick={openMedia} onContextMenu={this.handleOpenContextMenu}>
                    <div className='shared-video-wrapper'>
                        <div
                            className={classNames('shared-video-content', {
                                'media-blurred': isBlurred,
                                'media-mini-blurred': !thumbSrc && isBlurred
                            })}
                            style={{ backgroundImage: `url(${thumbSrc || miniSrc})` }}
                        />
                        <div className='shared-video-meta'>{getDurationString(duration)}</div>
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

SharedVideo.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    video: PropTypes.object,
    showOpenMessage: PropTypes.bool,
    openMedia: PropTypes.func,

    size: PropTypes.number,
    thumbnailSize: PropTypes.number,
    style: PropTypes.object
};

SharedVideo.defaultProps = {
    size: PHOTO_SIZE,
    thumbnailSize: PHOTO_THUMBNAIL_SIZE
};

export default SharedVideo;
