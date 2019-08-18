/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import pako from 'pako';
import { isBlurredThumbnail } from '../../../Utils/Media';
import { getFitSize } from '../../../Utils/Common';
import { getBlob, getSrc } from '../../../Utils/File';
import { STICKER_DISPLAY_SIZE } from '../../../Constants';
import FileStore from '../../../Stores/FileStore';
import './Sticker.css';
import Lottie from '../../Viewer/Lottie';

class Sticker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            animationDate: null
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, messageId, sticker, blur, displaySize } = this.props;
        const { animationData } = this.state;

        if (animationData !== nextState.animationData) {
            return true;
        }

        if (chatId !== nextProps.chatId) {
            return true;
        }

        if (messageId !== nextProps.messageId) {
            return true;
        }

        if (sticker !== nextProps.sticker) {
            return true;
        }

        if (blur !== nextProps.blur) {
            return true;
        }

        if (displaySize !== nextProps.displaySize) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        this.loadContent();

        FileStore.on('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.on('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.removeListener('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
    }

    onClientUpdateStickerBlob = update => {
        const { sticker, is_animated } = this.props.sticker;
        const { fileId } = update;

        if (!sticker) return;

        if (sticker.id === fileId) {
            if (is_animated) {
                this.loadContent();
            } else {
                this.forceUpdate();
            }
        }
    };

    onClientUpdateStickerThumbnailBlob = update => {
        const { thumbnail } = this.props.sticker;
        if (!thumbnail) return;

        const { fileId } = update;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    loadContent = async () => {
        const { blur, sticker: source, preview } = this.props;
        const { is_animated, thumbnail, sticker } = source;

        if (preview) return;
        if (!is_animated) return;

        const blob = getBlob(sticker);
        if (!blob) return;

        let animationData = null;
        try {
            const result = pako.inflate(await new Response(blob).arrayBuffer(), { to: 'string' });
            if (!result) return;

            animationData = JSON.parse(result);
        } catch (err) {
            console.log(err);
        }
        if (!animationData) return;

        this.setState({ animationData });
    };

    handleMouseOver = event => {};

    render() {
        const { className, displaySize, blur, sticker: source, style, openMedia, preview } = this.props;
        const { is_animated, thumbnail, sticker, width, height } = source;
        const { animationData } = this.state;

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const src = getSrc(sticker);
        const isBlurred = isBlurredThumbnail(thumbnail);

        const fitSize = getFitSize({ width: width, height: height }, displaySize);
        if (!fitSize) return null;

        const stickerStyle = {
            width: fitSize.width,
            height: fitSize.height,
            ...style
        };

        const content = is_animated ? (
            <>
                {animationData && !preview ? (
                    <Lottie
                        isClickToPauseDisabled={true}
                        options={{
                            autoplay: true,
                            loop: true,
                            animationData: animationData,
                            renderer: 'svg',
                            rendererSettings: {
                                preserveAspectRatio: 'xMinYMin slice', // Supports the same options as the svg element's preserveAspectRatio property
                                clearCanvas: false,
                                progressiveLoad: true, // Boolean, only svg renderer, loads dom elements when needed. Might speed up initialization for large number of elements.
                                hideOnTransparent: true //Boolean, only svg renderer, hides elements when opacity reaches 0 (defaults to true)
                            }
                        }}
                        onMouseOver={this.handleMouseOver}
                    />
                ) : (
                    <img
                        className={classNames('sticker-image', { 'media-blurred': isBlurred && blur })}
                        draggable={false}
                        src={thumbnailSrc}
                        alt=''
                    />
                )}
            </>
        ) : (
            <>
                {src && !preview ? (
                    <img className='sticker-image' draggable={false} src={src} alt='' />
                ) : (
                    <img
                        className={classNames('sticker-image', { 'media-blurred': isBlurred && blur })}
                        draggable={false}
                        src={thumbnailSrc}
                        alt=''
                    />
                )}
            </>
        );

        return (
            <div className={classNames('sticker', className)} style={stickerStyle} onClick={openMedia}>
                {content}
            </div>
        );
    }
}

Sticker.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    sticker: PropTypes.object.isRequired,
    openMedia: PropTypes.func,
    blur: PropTypes.bool,
    displaySize: PropTypes.number
};

Sticker.defaultProps = {
    chatId: 0,
    messageId: 0,
    openMedia: () => {},
    blur: true,
    displaySize: STICKER_DISPLAY_SIZE
};

export default Sticker;
