/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Lottie from '../../Viewer/Lottie';
import { isBlurredThumbnail, isValidAnimatedSticker } from '../../../Utils/Media';
import { getFitSize } from '../../../Utils/Common';
import { getBlob, getSrc } from '../../../Utils/File';
import { inflateBlob } from '../../../Workers/BlobInflator';
import { STICKER_DISPLAY_SIZE } from '../../../Constants';
import ApplicationStore from '../../../Stores/ApplicationStore';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import StickerStore from '../../../Stores/StickerStore';
import './Sticker.css';

export const StickerSourceEnum = Object.freeze({
    HINTS: 'HINTS',
    MESSAGE: 'MESSAGE',
    PICKER_HEADER: 'PICKER_HEADER',
    PICKER: 'PICKER',
    PREVIEW: 'PREVIEW',
    STICKER_SET: 'STICKER_SET',
    UNKNOWN: 'UNKNOWN'
});

class Sticker extends React.Component {
    constructor(props) {
        super(props);

        this.lottieRef = React.createRef();
        this.focused = window.hasFocus;
        this.inView = false;
        this.stickerPreview = StickerStore.stickerPreview;
        this.mediaViewerContent = ApplicationStore.mediaViewerContent;
        this.profileMediaViewerContent = ApplicationStore.profileMediaViewerContent;
        this.dialogChatId = ApplicationStore.dialogChatId;

        this.state = {
            animationDate: null,
            hasError: false
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.log('[Sticker] render error', error, errorInfo);
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

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.sticker !== this.props.sticker) {
            this.loadContent();
        }
    }

    componentDidMount() {
        this.loadContent();

        ApplicationStore.on('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        ApplicationStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        FileStore.on('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.on('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        StickerStore.on('clientUpdateStickerPreview', this.onClientUpdateStickerPreview);
        StickerStore.on('clientUpdateStickerSet', this.onClientUpdateStickerSet);
    }

    componentWillUnmount() {
        ApplicationStore.removeListener('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        ApplicationStore.removeListener('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.removeListener('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.removeListener(
            'clientUpdateProfileMediaViewerContent',
            this.onClientUpdateProfileMediaViewerContent
        );
        FileStore.removeListener('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.removeListener('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
        MessageStore.removeListener('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        StickerStore.removeListener('clientUpdateStickerPreview', this.onClientUpdateStickerPreview);
        StickerStore.removeListener('clientUpdateStickerSet', this.onClientUpdateStickerSet);
    }

    onClientUpdateDialogChatId = update => {
        this.dialogChatId = ApplicationStore.dialogChatId;

        this.startStopAnimation();
    };

    onClientUpdateMediaViewerContent = update => {
        this.mediaViewerContent = ApplicationStore.mediaViewerContent;

        this.startStopAnimation();
    };

    onClientUpdateProfileMediaViewerContent = update => {
        this.profileMediaViewerContent = ApplicationStore.profileMediaViewerContent;

        this.startStopAnimation();
    };

    onClientUpdateStickerPreview = update => {
        this.stickerPreview = update.sticker;

        this.startStopAnimation();
    };

    onClientUpdateMessagesInView = update => {
        const { chatId, messageId } = this.props;
        const key = `${chatId}_${messageId}`;

        this.inView = update.messages.has(key);

        this.startStopAnimation();
    };

    onClientUpdateStickerSet = update => {
        const { stickerSet } = update;

        this.openedStickerSet = stickerSet;

        this.startStopAnimation();
    };

    onClientUpdateFocusWindow = update => {
        const { focused } = update;
        const { chatId, messageId, sticker } = this.props;

        const isAnimated = isValidAnimatedSticker(sticker, chatId, messageId);
        if (!isAnimated) return;

        this.focused = focused;
        this.startStopAnimation();
    };

    startStopAnimation() {
        const { autoplay } = this.props;

        const player = this.lottieRef.current;
        if (!player) return;

        if (
            this.focused &&
            !this.stickerPreview &&
            !this.mediaViewerContent &&
            !this.profileMediaViewerContent &&
            !this.dialogChatId
        ) {
            if (this.entered) {
                console.log('[Sticker] play 1');
                player.play();
                this.pause = false;
                return;
            }

            console.log('[Sticker] startStopAnimation', this.openedStickerSet);
            if (!this.openedStickerSet) {
                if (this.paused) {
                    console.log('[Sticker] play 2');
                    player.play();
                    this.paused = false;
                    return;
                }

                if (autoplay && this.inView) {
                    console.log('[Sticker] play 3');
                    player.play();
                    this.paused = false;
                    return;
                }
            }
        }

        console.log('[Sticker] pause');
        this.paused = player.pause();
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
        const { chatId, messageId, sticker: source, autoplay } = this.props;
        const { is_animated, sticker } = source;
        const isAnimated = isValidAnimatedSticker(source, chatId, messageId);

        if (!is_animated) return;
        if (!isAnimated) return;

        const blob = getBlob(sticker);
        if (!blob) return;

        let animationData = null;
        try {
            // animationData = StickerStore.getAnimationData(blob);
            // if (animationData) {
            //     this.setState({ animationData });
            //     return;
            // }
            const result = await inflateBlob(blob);
            if (!result) return;

            animationData = JSON.parse(result);
            // StickerStore.setAnimationData(blob, animationData);
        } catch (err) {
            console.log('[Sticker] loadContent error', err);
        }
        if (!animationData) return;

        if (autoplay) {
            this.setState({ animationData });
        } else {
            this.animationData = animationData;
        }
    };

    handleMouseEnter = event => {
        const { animationData } = this;
        console.log('[Sticker] handleMouseEnter', animationData);
        if (animationData) {
            this.setState({ animationData }, () => {
                this.handleAnimationMouseEnter();
            });
        }
    };

    handleAnimationMouseEnter = () => {
        console.log('[Sticker] handleAnimationMouseEnter 1');
        if (this.props.autoplay) return;

        this.entered = true;

        const player = this.lottieRef.current;
        if (!player) return;

        console.log('[Sticker] handleAnimationMouseEnter 2');
        this.loopCount = 0;
        this.startStopAnimation();
    };

    handleAnimationLoopComplete = () => {
        if (this.props.autoplay) return;

        const player = this.lottieRef.current;
        if (!player) return;

        if (!this.entered) this.loopCount += 1;
        if (this.loopCount > 2) {
            const { animationData } = this.state;
            if (animationData) {
                this.setState({ animationData: null });
            }
        }
    };

    handleAnimationMouseOut = () => {
        this.entered = false;
    };

    render() {
        const {
            chatId,
            messageId,
            autoplay,
            className,
            displaySize,
            blur,
            sticker: source,
            style,
            openMedia,
            preview
        } = this.props;
        const { thumbnail, sticker, width, height } = source;
        const { animationData, hasError } = this.state;

        const isAnimated = isValidAnimatedSticker(source, chatId, messageId);

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const src = getSrc(sticker);
        const isBlurred = isBlurredThumbnail(thumbnail);

        if (hasError) {
            const style = {
                width: displaySize,
                height: displaySize
            };

            if (process.env.NODE_ENV !== 'production') {
                style.background = '#ff000066';
            }

            return (
                <div className={classNames('sticker', className)} style={style} onClick={openMedia}>
                    <img
                        className={classNames('sticker-image', { 'media-blurred': isBlurred && blur })}
                        draggable={false}
                        src={thumbnailSrc}
                        alt=''
                    />
                </div>
            );
        }

        const fitSize = getFitSize({ width: width, height: height }, displaySize);
        if (!fitSize) return null;

        const stickerStyle = {
            width: fitSize.width,
            height: fitSize.height,
            ...style
        };

        const content = isAnimated ? (
            <>
                {animationData ? (
                    <Lottie
                        ref={this.lottieRef}
                        options={{
                            autoplay: autoplay,
                            loop: true,
                            animationData,
                            renderer: 'svg',
                            rendererSettings: {
                                preserveAspectRatio: 'xMinYMin slice', // Supports the same options as the svg element's preserveAspectRatio property
                                clearCanvas: false,
                                progressiveLoad: true, // Boolean, only svg renderer, loads dom elements when needed. Might speed up initialization for large number of elements.
                                hideOnTransparent: true, //Boolean, only svg renderer, hides elements when opacity reaches 0 (defaults to true)
                                className: 'lottie-svg'
                            }
                        }}
                        eventListeners={[
                            {
                                eventName: 'loopComplete',
                                callback: this.handleAnimationLoopComplete
                            }
                        ]}
                        onMouseOut={this.handleAnimationMouseOut}
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
            <div
                className={classNames('sticker', className)}
                style={stickerStyle}
                onClick={openMedia}
                onMouseEnter={this.handleMouseEnter}>
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

    autoplay: PropTypes.bool,
    blur: PropTypes.bool,
    displaySize: PropTypes.number,
    preview: PropTypes.bool,
    source: PropTypes.string
};

Sticker.defaultProps = {
    chatId: 0,
    messageId: 0,
    openMedia: () => {},

    autoplay: true,
    blur: true,
    displaySize: STICKER_DISPLAY_SIZE,
    preview: false,
    source: StickerSourceEnum.UNKNOWN
};

export default Sticker;
