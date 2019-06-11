/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import * as ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import StickerSet from './StickerSet';
import { loadStickerContent, loadStickerSetContent } from '../../Utils/File';
import { debounce } from '../../Utils/Common';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './StickersPicker.css';

class StickersPicker extends React.Component {
    constructor(props) {
        super(props);

        this.scrollRef = React.createRef();
        this.itemsMap = new Map();
        this.loadedSets = new Map();

        this.state = {
            stickerSets: null,
            sets: [],
            position: 0
        };

        this.loadInViewContent = debounce(this.loadInViewContent, 100);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { stickerSets, sets, showPreview } = this.state;

        if (nextState.stickerSets !== stickerSets) {
            return true;
        }

        if (nextState.sets !== sets) {
            return true;
        }

        if (nextState.showPreview !== showPreview) {
            return true;
        }

        return false;
    }

    loadContent = async (stickerSets, sets) => {
        if (this.state.stickerSets) return;

        if (!sets) {
            const result = await TdLibController.send({
                '@type': 'getInstalledStickerSets',
                is_masks: false
            });

            const promises = [];
            result.sets.forEach(x => {
                promises.push(
                    TdLibController.send({
                        '@type': 'getStickerSet',
                        set_id: x.id
                    })
                );
            });

            sets = await Promise.all(promises);
        }

        const slicedSets = sets.slice(0, 5);
        this.setState({ stickerSets, sets: slicedSets });
        this.setsLength = slicedSets.length;
    };

    loadRemainingContent = () => {
        return;
        const { stickerSets } = this.state;
        if (!stickerSets) return;

        const remainingItems = [];
        stickerSets.sets.forEach(x => {
            if (!this.loadedSets.has(x.id)) {
                remainingItems.push(x);
            }
        });

        console.log('Stickers.loadRemainingContent', remainingItems);
        remainingItems.slice(0, 10).forEach(x => {
            this.loadedSets.set(x.id, x.id);

            const store = FileStore.getStore();
            loadStickerSetContent(store, x);
        });
    };

    loadInViewContent = () => {
        const scroll = this.scrollRef.current;

        const { sets } = this.state;

        const inViewItems = [];
        sets.forEach(x => {
            const item = this.itemsMap.get(x.id);
            const node = ReactDOM.findDOMNode(item);
            if (node) {
                const padding = 800;
                const topBorder = scroll.scrollTop - padding;
                const bottomBorder = scroll.scrollTop + scroll.offsetHeight + padding;

                const nodeTop = node.offsetTop;
                const nodeBottom = node.offsetTop + node.clientHeight;

                if (nodeTop >= topBorder && node.offsetTop <= bottomBorder) {
                    inViewItems.push(x);
                } else if (nodeBottom >= topBorder && nodeBottom <= bottomBorder) {
                    inViewItems.push(x);
                } else if (nodeTop <= topBorder && nodeBottom >= bottomBorder) {
                    inViewItems.push(x);
                }
            }
        });

        console.log('Stickers.inViewItems', inViewItems);
        inViewItems.forEach(x => {
            const store = FileStore.getStore();
            if (!this.loadedSets.has(x.id)) {
                this.loadedSets.set(x.id, x.id);
                console.log('Stickers.loadStickerSetContent', x.id);
                loadStickerSetContent(store, x);
            }
        });
    };

    handleScroll = async () => {
        this.loadInViewContent();

        const scroll = this.scrollRef.current;

        if (this.loadingChunk) return;

        let loadChunk = false;
        if (scroll.scrollTop + scroll.offsetHeight >= scroll.scrollHeight - 400) {
            loadChunk = true;
        }

        if (!loadChunk) {
            return false;
        }

        const { sets, stickerSets } = this.state;
        if (stickerSets.sets.length === sets.length) return;

        this.loadingChunk = true;
        const date = Date.now();
        const promises = [];
        stickerSets.sets.slice(this.setsLength, this.setsLength + 5).forEach(x => {
            promises.push(
                TdLibController.send({
                    '@type': 'getStickerSet',
                    set_id: x.id
                })
            );
        });

        const result = await Promise.all(promises).finally(() => (this.loadingChunk = false));

        this.setsLength += result.length;
        console.log('StickersPicker.handleScroll', Date.now() - date, sets.concat(result), stickerSets);
        let concatSets = sets.concat(result);
        // if (concatSets.length > 10) {
        //     concatSets = concatSets.slice(5);
        // }
        this.setState({ sets: concatSets });
    };

    getItems = sets => {
        const stickers = [];
        sets.forEach(set => {
            set.stickers.forEach(sticker => {
                stickers.push(sticker);
            });
        });

        return stickers;
    };

    loadPreviewContent = stickerId => {
        const { sets } = this.state;
        const items = this.getItems(sets);

        const sticker = items.find(x => x.sticker.id === stickerId);
        if (!sticker) return;

        const store = FileStore.getStore();
        loadStickerContent(store, sticker, null);

        const stickersPerRow = 5;

        TdLibController.send({
            '@type': 'getStickerEmojis',
            sticker: {
                '@type': 'inputFileId',
                id: stickerId
            }
        }).then(result => {
            const { previewStickerId } = this.state;
            if (previewStickerId === stickerId) {
                this.setState({
                    previewStickerEmojis: result.emojis.join(' ')
                });
            }
        });

        // const preloadStickers = this.getNeighborStickers(stickerId, items, stickersPerRow);
        // preloadStickers.forEach(x => {
        //     loadStickerContent(store, x, null);
        // });
    };

    handleMouseOver = event => {
        const stickerId = Number(event.target.dataset.stickerId);
        if (!stickerId) return;

        if (!this.mouseDown) return;

        if (this.mouseDownStickerId !== stickerId) {
            this.mouseDownStickerId = null;
        }
        this.setState({ previewStickerId: stickerId });
        this.loadPreviewContent(stickerId);

        const { onPreview } = this.props;
        const { sets } = this.state;

        const sticker = this.getItems(sets).find(x => x.sticker.id === stickerId);
        onPreview(sticker);
    };

    handleMouseDown = event => {
        const stickerId = Number(event.target.dataset.stickerId);
        if (!stickerId) return;

        this.mouseDownStickerId = stickerId;
        const now = Date.now();

        this.setState({ previewStickerId: stickerId, timestamp: now, showPreview: false, cancelSend: false });
        setTimeout(() => {
            const { timestamp } = this.state;
            if (timestamp === now) {
                this.setState({ showPreview: true, cancelSend: true }, () => {
                    const { onPreview } = this.props;
                    const { sets } = this.state;

                    const sticker = this.getItems(sets).find(x => x.sticker.id === stickerId);
                    onPreview(sticker);
                });
            }
        }, 500);

        this.loadPreviewContent(stickerId);

        this.mouseDown = true;
        document.addEventListener('mouseup', this.handleMouseUp);

        event.preventDefault();
        event.stopPropagation();
        return false;
    };

    handleMouseUp = () => {
        this.setState({ previewStickerId: 0, timestamp: 0, showPreview: false });

        const { onPreview } = this.props;

        onPreview(null);

        this.mouseDown = false;
        document.removeEventListener('mouseup', this.handleMouseUp);
    };

    handleStickerSelect = sticker => {
        const { onSelect } = this.props;
        const { cancelSend } = this.state;

        if (cancelSend) return;

        onSelect(sticker);
    };

    render() {
        const { stickerSets, sets } = this.state;
        if (!stickerSets) return null;

        if (!sets) return null;
        if (!sets.length) return null;

        this.itemsMap.clear();
        const items = sets.map(x => (
            <StickerSet
                key={x.id}
                ref={el => this.itemsMap.set(x.id, el)}
                info={x}
                onSelect={this.handleStickerSelect}
                onMouseDown={this.handleMouseDown}
                onMouseOver={this.handleMouseOver}
            />
        ));

        return (
            <div className='stickers-picker'>
                <div className='stickers-picker-header' />
                <div ref={this.scrollRef} className='stickers-picker-scroll' onScroll={this.handleScroll}>
                    {items}
                </div>
            </div>
        );
    }
}

StickersPicker.propTypes = {
    onSelect: PropTypes.func.isRequired,
    onPreview: PropTypes.func.isRequired
};

export default StickersPicker;
