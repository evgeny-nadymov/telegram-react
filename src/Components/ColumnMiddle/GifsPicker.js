/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import * as ReactDOM from 'react-dom';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import { compose, withRestoreRef, withSaveRef } from '../../Utils/HOC';
import Animation from '../Message/Media/Animation';
import { loadAnimationContent, loadAnimationThumbnailContent } from '../../Utils/File';
import { compareMaps, debounce, throttle } from '../../Utils/Common';
import AnimationStore from '../../Stores/AnimationStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './GifsPicker.css'

class GifsPicker extends React.Component {

    constructor(props) {
        super(props);

        this.scrollRef = React.createRef();

        this.itemsMap = new Map();

        this.loadInViewContentOnScroll = throttle(this.loadInViewContentOnScroll, 250);
        this.loadInViewContentOnScrollEnd = debounce(this.loadInViewContentOnScrollEnd, 250);
    }

    start() {
        this.loadInViewContent();
    }

    stop() {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateAnimationsInView',
            animations: new Map()
        })
    }

    handleScroll = event => {
        const { scrollTop, scrollHeight, offsetHeight } = this.scrollRef.current;

        this.loadInViewContentOnScrollEnd();

        const begin = scrollTop <= 10;
        const end = scrollHeight - (scrollTop + offsetHeight) <= 10;
        const cancel = Math.abs(scrollTop - this.prevScrollTop) > 50 && !begin && !end; // too fast

        // console.log('[gp] handleScroll', Math.abs(scrollTop - this.prevScrollTop), scrollTop, this.prevScrollTop, begin, end);
        this.prevScrollTop = scrollTop;
        if (cancel) {
            // console.log('[gp] cancel handleScroll', scrollTop - this.prevScrollTop);
            return;
        }

        this.loadInViewContent();
    };

    scrollTop = () => {
        this.scrollRef.current.scrollTop = 0;
    };

    async loadContent() {
        // console.log('[gp] loadContent');

        let { savedAnimations } = AnimationStore;
        if (!savedAnimations) {
            const result = await TdLibController.send({
                '@type': 'getSavedAnimations'
            });

            AnimationStore.savedAnimations = result;
            savedAnimations = result;

            this.forceUpdate(() => {
                this.start();
            });
        }

        // load content
        const store = FileStore.getStore();
        const previewAnimations = savedAnimations.animations.slice(0, 1000);

        // console.log('[sp] loadAnimationThumbnailContent', previewAnimations);
        previewAnimations.forEach(x => {
            loadAnimationThumbnailContent(store, x, null);
            loadAnimationContent(store, x, null, false);
        });
    }

    loadInViewContentOnScroll = () => {
        this.loadInViewContent();
    };

    loadInViewContentOnScrollEnd = () => {
        this.loadInViewContent();
    };

    loadInViewContent = (padding = 0) => {
        // console.log('[gp] loadInViewContent');
        const scroll = this.scrollRef.current;

        const { savedAnimations } = AnimationStore;
        if (!savedAnimations) return;

        const { animations } = savedAnimations;

        const inViewMap = new Map();
        const inViewIndexes = [];
        animations.forEach((x, index) => {
            const item = this.itemsMap.get(`${index}_${x.animation.id}`);
            const node = ReactDOM.findDOMNode(item);
            if (node) {
                const topBorder = scroll.scrollTop - padding;
                const bottomBorder = scroll.scrollTop + scroll.offsetHeight + padding;

                const nodeTop = node.offsetTop;
                const nodeBottom = node.offsetTop + node.clientHeight;

                if (nodeTop >= topBorder && node.offsetTop <= bottomBorder) {
                    inViewMap.set(x, x);
                    inViewIndexes.push(index);
                } else if (nodeBottom >= topBorder && nodeBottom <= bottomBorder) {
                    inViewMap.set(x, x);
                    inViewIndexes.push(index);
                } else if (nodeTop <= topBorder && nodeBottom >= bottomBorder) {
                    inViewMap.set(x, x);
                    inViewIndexes.push(index);
                }
            }
        });

        const { animationsInView } = AnimationStore;
        if (compareMaps(animationsInView, inViewMap)) {
            // console.log('[gp] inViewItems equals', inViewIndexes, animationsInView);
            return;
        }


        // console.log('[gp] inViewItems', inViewIndexes);
        TdLibController.clientUpdate({
            '@type': 'clientUpdateAnimationsInView',
            animations: inViewMap
        })

        // inViewItems.forEach(x => {
        //     const store = FileStore.getStore();
        //     if (!this.loadedSets.has(x.id)) {
        //         this.loadedSets.set(x.id, x.id);
        //         loadStickerSetContent(store, x);
        //     }
        // });
    };

    handleMouseDown = event => {
        const stickerId = Number(event.currentTarget.dataset.animationIndex);

        this.mouseDownStickerId = stickerId;
        const now = Date.now();

        this.setState({ previewStickerId: stickerId, timestamp: now, showPreview: false, cancelSend: false });
        setTimeout(() => {
            const { timestamp } = this.state;
            if (timestamp === now) {
                this.setState({ showPreview: true, cancelSend: true }, () => {
                    const { onPreview } = this.props;
                    const { recent, sets } = this.state;

                    const { savedAnimations } = AnimationStore;

                    const sticker = savedAnimations.animations[stickerId];
                    onPreview(sticker);
                });
            }
        }, 500);

        // this.loadPreviewContent(stickerId);

        this.mouseDown = true;
        document.addEventListener('mouseup', this.handleMouseUp);

        event.preventDefault();
        event.stopPropagation();
        return false;
    };

    handleMouseEnter = event => {
        const stickerId = Number(event.currentTarget.dataset.animationIndex);

        if (!this.mouseDown) return;

        if (this.mouseDownStickerId !== stickerId) {
            this.mouseDownStickerId = null;
        }
        this.setState({ previewStickerId: stickerId });
        // this.loadPreviewContent(stickerId);

        const { onPreview } = this.props;
        const { savedAnimations } = AnimationStore;

        const sticker = savedAnimations.animations[stickerId];
        onPreview(sticker);
    };

    handleMouseUp = () => {
        this.setState({ previewStickerId: 0, timestamp: 0, showPreview: false });

        const { onPreview } = this.props;

        onPreview(null);

        this.mouseDown = false;
        document.removeEventListener('mouseup', this.handleMouseUp);
    };

    openAnimation = animation => {
        const { onSelect } = this.props;
        const { cancelSend } = this.state;

        if (cancelSend) return;

        onSelect(animation);
    };

    render() {
        const { t, style } = this.props;
        const { savedAnimations } = AnimationStore;
        if (!savedAnimations) return null;

        this.itemsMap.clear();
        const items = savedAnimations.animations.map((x, index) => (
            <div
                data-animation-index={index}
                key={`${index}_${x.animation.id}`}
                ref={el => this.itemsMap.set(`${index}_${x.animation.id}`, el)}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={this.handleMouseEnter}
                >
                <Animation
                    type='picker'
                    animation={x}
                    openMedia={() => this.openAnimation(x)}
                    style={{ width: 104, height: 104, margin: 2, borderRadius: 0 }}
                />
            </div>
        ));

        return (
            <div className='gifs-picker' style={style}>
                <div ref={this.scrollRef} className={classNames('gifs-picker-scroll', 'scrollbars-hidden')} onScroll={this.handleScroll}>
                    {items}
                </div>
            </div>
        );
    }

}

GifsPicker.propTypes = {
    onSelect: PropTypes.func.isRequired,
    onPreview: PropTypes.func.isRequired
};

const enhance = compose(
    withSaveRef(),
    withTranslation(),
    withRestoreRef()
);

export default enhance(GifsPicker);