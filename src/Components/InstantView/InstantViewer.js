/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { withTranslation } from 'react-i18next';
import KeyboardManager, { KeyboardHandler } from '../Additional/KeyboardManager';
import CloseIcon from '../../Assets/Icons/Close';
import Article from './Article';
import { articleRefs } from './Article';
import InstantViewMediaViewer from '../Viewer/InstantViewMediaViewer';
import IVContext from './IVContext';
import MediaViewerButton from '../Viewer/MediaViewerButton';
import NavigateBeforeIcon from '../../Assets/Icons/Left';
import { itemsInView, throttle } from '../../Utils/Common';
import { getInnerBlocks } from '../../Utils/InstantView';
import { openInstantView } from '../../Actions/InstantView';
import { setInstantViewContent, setInstantViewViewerContent } from '../../Actions/Client';
import { scrollTop } from '../../Utils/DOM';
import { modalManager } from '../../Utils/Modal';
import { IV_PHOTO_SIZE } from '../../Constants';
import InstantViewStore from '../../Stores/InstantViewStore';
import TdLibController from '../../Controllers/TdLibController';
import './InstantViewer.css';

class InstantViewer extends React.Component {
    constructor(props) {
        super(props);

        this.keyboardHandler = new KeyboardHandler(this.onKeyDown);
        this.articleRef = React.createRef();
        this.instantViewerRef = React.createRef();

        this.state = {};

        this.updateItemsInView = throttle(this.updateItemsInView, 500);
    }

    static getDerivedStateFromProps(props, state) {
        if (props.instantView !== state.prevInstantView) {
            return {
                prevInstantView: props.instantView,
                hasPrev: InstantViewStore.hasPrev(),
                hasScroll: false,
                media: null,
                caption: null,
                url: null
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { instantView } = this.props;
        const { hasScroll, hasPrev, media, caption, url } = this.state;

        if (instantView !== nextProps.instantView) {
            return true;
        }

        if (hasScroll !== nextState.hasScroll) {
            return true;
        }

        if (hasPrev !== nextState.hasPrev) {
            return true;
        }

        if (media !== nextState.media) {
            return true;
        }

        if (caption !== nextState.caption) {
            return true;
        }

        if (url !== nextState.url) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        this.mounted = true;
        this.handleScroll();
        this.scrollToBlock(this.props.block, 'smooth');

        KeyboardManager.add(this.keyboardHandler);
        InstantViewStore.on('clientUpdateInstantViewUrl', this.onClientUpdateInstantViewUrl);
        InstantViewStore.on('clientUpdateInstantViewViewerContent', this.onClientUpdateInstantViewViewerContent);
    }

    componentWillUnmount() {
        this.mounted = false;
        KeyboardManager.remove(this.keyboardHandler);
        InstantViewStore.off('clientUpdateInstantViewUrl', this.onClientUpdateInstantViewUrl);
        InstantViewStore.off('clientUpdateInstantViewViewerContent', this.onClientUpdateInstantViewViewerContent);
    }

    onClientUpdateInstantViewViewerContent = update => {
        const { content } = update;
        if (!content) {
            this.setState({ media: null, caption: null, url: null });
            return;
        }

        const { media, caption, url, instantView } = content;

        if (this.props.instantView !== instantView) return;

        this.setState({ media, caption, url });
    };

    onClientUpdateInstantViewUrl = async update => {
        const { url } = update;
        const active = InstantViewStore.getCurrent();
        const { instantView, url: oldUrl } = this.props;

        if (active !== instantView) return;

        if (instantView && url.startsWith(oldUrl)) {
            const hash = new URL(url).hash;
            if (url.indexOf('#') === url.length - 1) {
                this.scrollTop('smooth');

                return;
            } else if (hash && this.scrollToHash(hash, 'smooth')) {

                return;
            }
        }

        openInstantView(url);
    };

    scrollToBlock(block, behavior) {
        if (!block) return false;

        if (!articleRefs) return false;

        const ref = articleRefs.get(block);
        if (!ref) return false;

        const element = ReactDOM.findDOMNode(ref);
        return this.scrollToElement(element, behavior);
    }

    scrollToElement(element, behavior) {
        if (!element) return false;

        const details = [];
        let finished = false;
        let currentElement = element;
        do {
            currentElement = currentElement.parentNode;
            if (currentElement) {
                if (currentElement.nodeName === 'DETAILS') {
                    details.push(currentElement);
                } else if (currentElement.nodeName === 'ARTICLE') {
                    finished = true;
                }
            } else {
                finished = true;
            }
        } while (!finished);

        details.forEach(x => (x.open = true));

        element.scrollIntoView({
            block: 'center',
            behavior
        });

        return true;
    }

    scrollToHash(hash, behavior) {
        if (!hash) return false;

        const element = document.getElementById(hash.substr(1));

        return this.scrollToElement(element, behavior);
    }

    scrollTop(behavior) {
        const element = this.instantViewerRef.current;

        switch (behavior) {
            case 'smooth': {
                scrollTop(element);
                break;
            }
            default: {
                element.scrollTo({
                    top: 0,
                    behavior
                });
            }
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { instantView, block, url } = this.props;

        const hash = new URL(url).hash;
        if (prevProps.instantView !== instantView) {
            if (prevProps.url !== url) {
                if (url.indexOf('#') === url.length - 1) {
                    this.scrollTop('auto');
                } else if (hash) {
                    this.scrollToHash(hash, 'auto');
                } else {
                    this.scrollTop('auto');
                }
            } else {
                if (hash) {
                    this.scrollToHash(hash, 'auto');
                } else {
                    this.scrollTop('smooth');
                }
            }

            this.handleScroll();
        }
    }

    onKeyDown = event => {
        if (modalManager.modals.length > 0) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        switch (event.key) {
            case 'Escape': {
                event.stopPropagation();
                event.preventDefault();

                const { media } = this.state;

                if (media) {
                    setInstantViewViewerContent(null);
                    return;
                }

                this.handleClose();
                break;
            }
        }
    };

    handleClose() {
        setInstantViewContent(null);
    }

    handleBack = () => {
        const { hasPrev, hasScroll } = this.state;
        if (hasScroll) {
            this.scrollTop('smooth');
            return;
        }

        if (hasPrev) {
            TdLibController.clientUpdate({
                '@type': 'clientUpdatePrevInstantView'
            });
            return;
        }

        this.handleClose();
    };

    handleScroll = () => {
        const element = this.instantViewerRef.current;
        this.setState({
            hasScroll: element.scrollTop > 50
        });

        this.updateItemsInView();
    };

    updateItemsInView() {
        if (!this.mounted) return;

        const { instantView } = this.props;
        if (!instantView) return;

        const { page_blocks } = instantView;

        const blocks = new Map();
        const items = itemsInView(this.instantViewerRef, this.articleRef);

        for (let i = 0; i < items.length; i++) {
            const block = page_blocks[items[i]];
            blocks.set(block, block);

            const innerBlocks = getInnerBlocks(block);
            innerBlocks.forEach(x => blocks.set(x, x));
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateBlocksInView',
            blocks
        });
    }

    render() {
        const { instantView } = this.props;
        const { hasPrev, hasScroll, media, caption, url } = this.state;
        if (!instantView) return null;

        return (
            <IVContext.Provider value={instantView}>
                <div ref={this.instantViewerRef} className='instant-viewer' onScroll={this.handleScroll}>
                    <div className='instant-viewer-left-column' onClick={this.handleBack}>
                        <MediaViewerButton
                            className='instant-viewer-left-button'
                            style={{ alignItems: 'flex-start' }}
                            onClick={this.handleBack}>
                            <NavigateBeforeIcon
                                style={{
                                    transition: 'transform 0.25s ease-out',
                                    transform: hasScroll ? 'rotate(90deg)' : 'rotate(0deg)'
                                }}
                            />
                        </MediaViewerButton>
                    </div>
                    <div className='instant-viewer-content-column'>
                        <div>
                            <Article ref={this.articleRef} />
                        </div>
                    </div>
                    <div className='instant-viewer-right-column'>
                        <MediaViewerButton className='instant-viewer-right-button' onClick={this.handleClose}>
                            <CloseIcon />
                        </MediaViewerButton>
                    </div>
                </div>
                {media && <InstantViewMediaViewer media={media} size={IV_PHOTO_SIZE} caption={caption} url={url} />}
            </IVContext.Provider>
        );
    }
}

InstantViewer.propTypes = {
    instantView: PropTypes.object.isRequired
};

export default withTranslation()(InstantViewer);
