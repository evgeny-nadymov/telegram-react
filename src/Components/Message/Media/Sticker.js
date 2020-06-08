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
import { getFitSize } from '../../../Utils/Common';
import { getBlob, getSrc } from '../../../Utils/File';
import { inflateBlob } from '../../../Workers/BlobInflator';
import { STICKER_DISPLAY_SIZE } from '../../../Constants';
import ApplicationStore from '../../../Stores/ApplicationStore';
import FileStore from '../../../Stores/FileStore';
import InstantViewStore from '../../../Stores/InstantViewStore';
import MessageStore from '../../../Stores/MessageStore';
import StickerStore from '../../../Stores/StickerStore';
import './Sticker.css';

const Lottie = React.lazy(() => import('../../Viewer/Lottie'));

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
        this.openMediaViewer = Boolean(ApplicationStore.mediaViewerContent);
        this.openProfileMediaViewer = Boolean(ApplicationStore.profileMediaViewerContent);
        this.openIV = Boolean(InstantViewStore.getCurrent());
        this.dialogChatId = ApplicationStore.dialogChatId;

        this.state = {
            animationDate: null,
            loaded: false,
            hasError: false
        };
    }

    static getDerivedStateFromProps(props, state) {
        const { sticker } = props;

        if (state.prevSticker !== sticker) {
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
        const { animationData, loaded } = this.state;

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
        InstantViewStore.on('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        FileStore.on('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.on('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
        MessageStore.on('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        StickerStore.on('clientUpdateStickerPreview', this.onClientUpdateStickerPreview);
        StickerStore.on('clientUpdateStickerSet', this.onClientUpdateStickerSet);
    }

    componentWillUnmount() {
        ApplicationStore.off('clientUpdateDialogChatId', this.onClientUpdateDialogChatId);
        ApplicationStore.off('clientUpdateFocusWindow', this.onClientUpdateFocusWindow);
        ApplicationStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        ApplicationStore.off('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        InstantViewStore.off('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        FileStore.off('clientUpdateStickerThumbnailBlob', this.onClientUpdateStickerThumbnailBlob);
        FileStore.off('clientUpdateStickerBlob', this.onClientUpdateStickerBlob);
        MessageStore.off('clientUpdateMessagesInView', this.onClientUpdateMessagesInView);
        StickerStore.off('clientUpdateStickerPreview', this.onClientUpdateStickerPreview);
        StickerStore.off('clientUpdateStickerSet', this.onClientUpdateStickerSet);
    }

    onClientUpdateInstantViewContent = update => {
        this.openIV = Boolean(InstantViewStore.getCurrent());

        this.startStopAnimation();
    };

    onClientUpdateDialogChatId = update => {
        this.dialogChatId = ApplicationStore.dialogChatId;

        this.startStopAnimation();
    };

    onClientUpdateMediaViewerContent = update => {
        this.openMediaViewer = Boolean(ApplicationStore.mediaViewerContent);

        this.startStopAnimation();
    };

    onClientUpdateProfileMediaViewerContent = update => {
        this.openProfileMediaViewer = Boolean(ApplicationStore.profileMediaViewerContent);

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

            // console.log('[Sticker] startStopAnimation', this.openedStickerSet);
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
            }
        }

        // console.log('[Sticker] pause');
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

        const { file } = thumbnail;
        if (file && file.id === fileId) {
            this.forceUpdate();
        }
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
        // console.log('[Sticker] handleMouseEnter', animationData);
        if (animationData) {
            this.setState({ animationData }, () => {
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
                this.setState({ animationData: null });
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
        const { animationData, loaded, hasError } = this.state;

        const isAnimated = isValidAnimatedSticker(source, chatId, messageId);

        const thumbnailSrc = getSrc(thumbnail ? thumbnail.file : null);
        const src = getSrc(sticker);
        const isBlurred = isBlurredThumbnail(thumbnail) || !preview;

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
        const fitSize = getFitSize({ width: width, height: height }, displaySize);
        if (fitSize) {
            content = isAnimated ? (
                <>
                    {animationData ? (
                        <React.Suspense fallback={null}>
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
                        </React.Suspense>
                    ) : (
                        <>
                            {thumbnailSrc && (
                                <img
                                    className={classNames('sticker-image', { 'media-blurred': isBlurred })}
                                    draggable={false}
                                    src={thumbnailSrc}
                                    alt=''
                                />
                            )}
                        </>
                    )}
                </>
            ) : (
                <>
                    { thumbnailSrc && !loaded && (
                        <img
                            className={classNames('sticker-image', { 'media-blurred': isBlurred })}
                            draggable={false}
                            src={thumbnailSrc}
                            alt=''
                        />
                    )}
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
