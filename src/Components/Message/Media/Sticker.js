/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
// import Lottie from '../../Viewer/Lottie';
import { isBlurredThumbnail, isValidAnimatedSticker } from '../../../Utils/Media';
import { getFitSize, isWebpSupported } from '../../../Utils/Common';
import { getBlob, getPngSrc, getSrc } from '../../../Utils/File';
import { inflateBlob } from '../../../Workers/BlobInflator';
import { STICKER_DISPLAY_SIZE } from '../../../Constants';
import WebpManager from '../../../Stores/WebpManager';
import AppStore from '../../../Stores/ApplicationStore';
import FileStore from '../../../Stores/FileStore';
import InstantViewStore from '../../../Stores/InstantViewStore';
import MessageStore from '../../../Stores/MessageStore';
import StickerStore from '../../../Stores/StickerStore';
import './Sticker.css';

const Lottie = React.lazy(() => import('../../Viewer/Lottie'));
const RLottie = React.lazy(() => import('../../Viewer/RLottie'));

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
        this.windowFocused = window.hasFocus;
        this.inView = false;
        this.stickerPreview = StickerStore.stickerPreview;
        this.openMediaViewer = Boolean(AppStore.mediaViewerContent);
        this.openProfileMediaViewer = Boolean(AppStore.profileMediaViewerContent);
        this.openIV = Boolean(InstantViewStore.getCurrent());
        this.dialogChatId = AppStore.dialogChatId;
        this.openedStickerSet = StickerStore.stickerSet;

        this.state = {
            animationData: null,
            loaded: false,
            hasError: false
        };
    }

    static getDerivedStateFromProps(props, state) {
        const { sticker } = props;
        const { prevSticker } = state;

        if (prevSticker && sticker && prevSticker !== sticker && prevSticker.sticker.id !== sticker.sticker.id) {
            return {
                prevSticker: sticker,
                loaded: false,
            };
        }

        return null;
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.log('[Sticker] render error', error, errorInfo);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { chatId, messageId, sticker, blur, displaySize } = this.props;
        const { animationData, loaded, pngUrl } = this.state;

        if (animationData !== nextState.animationData) {
            return true;
        }

        if (loaded !== nextState.loaded) {
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

        if (pngUrl !== nextState.pngUrl) {
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

        AppStore.on('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        AppStore.on('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        InstantViewStore.on('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        FileStore.on('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.on('clientUpdateStickerThumbnailPngBlob', this.onClientUpdateStickerThumbnailPngBlob);
        FileStore.on('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
        FileStore.on('clientUpdateStickerPngBlob', this.onClientUpdateStickerPngBlob);
        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        StickerStore.on('clientUpdateStickerPreview', this.onClientUpdateStickerPreview);
        StickerStore.on('clientUpdateStickerSet', this.onClientUpdateStickerSet);
    }

    componentWillUnmount() {
        this.removeContent();

        AppStore.off('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        AppStore.off('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        AppStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.off('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        InstantViewStore.off('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        FileStore.off('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.off('clientUpdateStickerThumbnailPngBlob', this.onClientUpdateStickerThumbnailPngBlob);
        FileStore.off('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
        FileStore.off('clientUpdateStickerPngBlob', this.onClientUpdateStickerPngBlob);
        MessageStore.off('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        StickerStore.off('clientUpdateStickerPreview', this.onClientUpdateStickerPreview);
        StickerStore.off('clientUpdateStickerSet', this.onClientUpdateStickerSet);
    }

    onClientUpdateInstantViewContent = update => {
        this.openIV = Boolean(InstantViewStore.getCurrent());

        this.startStopAnimation();
    };

    onClientUpdateDialogChatId = update => {
        this.dialogChatId = AppStore.dialogChatId;

        this.startStopAnimation();
    };

    onClientUpdateMediaViewerContent = update => {
        this.openMediaViewer = Boolean(AppStore.mediaViewerContent);

        this.startStopAnimation();
    };

    onClientUpdateProfileMediaViewerContent = update => {
        this.openProfileMediaViewer = Boolean(AppStore.profileMediaViewerContent);

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

        this.windowFocused = focused;
        this.startStopAnimation();
    };

    startStopAnimation() {
        const { autoplay } = this.props;

        const player = this.lottieRef.current;
        if (!player) return;

        if (
            this.windowFocused &&
            !this.stickerPreview &&
            !this.openMediaViewer &&
            !this.openProfileMediaViewer &&
            !this.openIV &&
            !this.dialogChatId
        ) {
            if (this.entered) {
                // console.log('[Sticker] play 1');
                player.play();
                this.pause = false;
                return;
            }

            if (!this.openedStickerSet) {
                if (this.paused) {
                    // console.log('[Sticker] play 2');
                    player.play();
                    this.paused = false;
                    return;
                }

                if (autoplay && this.inView) {
                    // console.log('[Sticker] play 3');
                    player.play();
                    this.paused = false;
                    return;
                }
            } else {
                if (this.props.source === StickerSourceEnum.STICKER_SET) {
                    if (autoplay) {
                        player.play();
                        this.paused = false;
                        return;
                    }
                }
            }
        }

        this.paused = player.pause();
    }

    onClientUpdateStickerBlob = async update => {
        const { sticker, is_animated } = this.props.sticker;
        const { fileId } = update;

        if (!sticker) return;
        if (sticker.id !== fileId) return;

        if (is_animated) {
            this.loadContent();
        } else {
            if (!await isWebpSupported()) return;

            this.forceUpdate();
            // FileStore.convertWebpToPng(fileId);
        }
    };

    onClientUpdateStickerPngBlob = update => {
        const { sticker, is_animated } = this.props.sticker;
        const { fileId } = update;

        if (!sticker) return;
        if (sticker.id !== fileId) return;
        if (is_animated) return;

        this.forceUpdate();
    }

    onClientUpdateStickerThumbnailBlob = async update => {
        const { thumbnail } = this.props.sticker;
        if (!thumbnail) return;

        const { fileId } = update;

        const { file } = thumbnail;
        if (!file) return;
        if (file.id !== fileId) return;
        if (!await isWebpSupported()) return;

        this.forceUpdate();
    };

    onClientUpdateStickerThumbnailPngBlob = update => {
        const { thumbnail } = this.props.sticker;
        if (!thumbnail) return;

        const { fileId } = update;

        const { file } = thumbnail;
        if (!file) return;
        if (file.id !== fileId) return;

        this.forceUpdate();
    };

    loadContent = async () => {
        const { chatId, messageId, sticker: source, autoplay, play } = this.props;
        const { is_animated, sticker } = source;
        const isAnimated = isValidAnimatedSticker(source, chatId, messageId);

        if (!is_animated) return;
        if (!isAnimated) return;
        if (!play) return;

        const blob = getBlob(sticker);
        if (!blob) return;

        const animationData = blob;
        // let animationData = null;
        // try {
        //     const result = await inflateBlob(blob);
        //     if (!result) return;
        //
        //     animationData = JSON.parse(result);
        //     // StickerStore.setAnimationData(blob, animationData);
        // } catch (err) {
        //     console.log('[Sticker] loadContent error', err);
        // }
        if (!animationData) return;

        if (autoplay) {
            this.setState({ fileId: sticker.id, animationData });
        } else {
            this.fileId = sticker.id;
            this.animationData = animationData;
        }
    };

    removeContent = () => {
        const { animationData } = this.state;
        if (!animationData) return;

        this.setState({
            animationData: null
        });
    };

    handleMouseEnter = () => {
        const { animationData, fileId } = this;

        if (animationData) {
            this.setState({ animationData, fileId }, () => {
                this.handleAnimationMouseEnter();
            });
        }
    };

    handleAnimationMouseEnter = () => {
        // console.log('[Sticker] handleAnimationMouseEnter 1');
        if (this.props.autoplay) return;

        this.entered = true;

        const player = this.lottieRef.current;
        if (!player) return;

        // console.log('[Sticker] handleAnimationMouseEnter 2');
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
                this.setState({ loaded: false, animationData: null });
            }
        }
    };

    handleAnimationMouseOut = () => {
        this.entered = false;
    };

    handleLoad = () => {
        this.setState({
            loaded: true
        });
    };

    render() {
        const {
            chatId,
            messageId,
            autoplay,
            className,
            displaySize,
            sticker: source,
            style,
            openMedia,
            preview
        } = this.props;
        const { thumbnail, sticker, width, height } = source;
        const { fileId, animationData, loaded, hasError } = this.state;

        const isAnimated = isValidAnimatedSticker(source, chatId, messageId);

        const thumbnailSrc =
            WebpManager.isWebpSupported()
                ? getSrc(thumbnail ? thumbnail.file : null)
                : getPngSrc(thumbnail ? thumbnail.file : null);
        const src =
            WebpManager.isWebpSupported() || isAnimated
                ? getSrc(sticker)
                : getPngSrc(sticker);
        const isBlurred = isBlurredThumbnail(thumbnail, displaySize) || !preview;

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
                    { thumbnailSrc && (
                        <img
                            className={classNames('sticker-image', { 'media-blurred': isBlurred })}
                            draggable={false}
                            src={thumbnailSrc}
                            alt=''
                        />
                    )}
                </div>
            );
        }

        let content = null;
        const fitSize = getFitSize({ width, height }, displaySize);
        if (fitSize) {
            // console.log('[Sticker] render', [animationData, fitSize]);
            content = isAnimated ? (
                <>
                    {animationData && (
                        <React.Suspense fallback={null}>
                            <RLottie
                                ref={this.lottieRef}
                                options={{
                                    width: displaySize,
                                    height: displaySize,
                                    autoplay,
                                    loop: true,
                                    fileId,
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
                                    },
                                    {
                                        eventName: 'firstFrame',
                                        callback: this.handleLoad
                                    }
                                ]}
                                onMouseOut={this.handleAnimationMouseOut}
                            />
                        </React.Suspense>
                    )}
                </>
            ) : (
                <>
                    { src && !preview && <img key={sticker.id} className='sticker-image' src={src} draggable={false} alt='' onLoad={this.handleLoad} /> }
                </>
            );
        }

        const stickerStyle = {
            width: fitSize ? fitSize.width : 0,
            height: fitSize ? fitSize.height : 0,
            ...style
        };

        return (
            <div
                className={classNames('sticker', className)}
                style={stickerStyle}
                onClick={openMedia}
                onMouseEnter={this.handleMouseEnter}>
                { thumbnailSrc && (
                    <img
                        className={classNames('sticker-image', { 'media-blurred': isBlurred, 'media-loaded': loaded })}
                        draggable={false}
                        src={thumbnailSrc}
                        alt=''
                    />
                )}
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
    play: PropTypes.bool,
    displaySize: PropTypes.number,
    preview: PropTypes.bool,
    source: PropTypes.string
};

Sticker.defaultProps = {
    chatId: 0,
    messageId: 0,
    openMedia: () => {},

    autoplay: true,
    play: true,
    displaySize: STICKER_DISPLAY_SIZE,
    preview: false,
    source: StickerSourceEnum.UNKNOWN
};

export default Sticker;
