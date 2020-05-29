/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import { compose, withRestoreRef, withSaveRef } from '../../Utils/HOC';
import Animation from '../Message/Media/Animation';
import { loadAnimationContent, loadAnimationThumbnailContent, loadStickerSetContent } from '../../Utils/File';
import AnimationStore from '../../Stores/AnimationStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './GifsPicker.css'
import * as ReactDOM from 'react-dom';
import { compareMaps, debounce, throttle } from '../../Utils/Common';

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

        const inViewMap = new Map();
        const inViewIndexes = [];
        savedAnimations.animations.forEach((x, index) => {
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

    render() {
        const { t, onSelect } = this.props;
        const { savedAnimations } = AnimationStore;
        if (!savedAnimations) return null;

        this.itemsMap.clear();
        const items = savedAnimations.animations.map((x, index) => (
            // <div
            //     key={`${index}_${x.animation.id}`}
            //     ref={el => this.itemsMap.set(`${index}_${x.animation.id}`, el)}
            //     >
                <Animation
                    key={`${index}_${x.animation.id}`}
                    ref={el => this.itemsMap.set(`${index}_${x.animation.id}`, el)}
                    animation={x}
                    openMedia={() => onSelect(x)}
                    picker={true}
                    style={{ width: 105, height: 105, margin: 2, borderRadius: 0 }}
                />
            // </div>
        ));

        return (
            <div className='gifs-picker'>
                <div ref={this.scrollRef} className='gifs-picker-scroll' onScroll={this.handleScroll}>
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