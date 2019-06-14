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
import StickersPickerHeader from './StickersPickerHeader';
import { debounce, throttle } from '../../Utils/Common';
import { loadStickerContent, loadStickerSetContent } from '../../Utils/File';
import { getNeighborStickersFromSets, getStickers } from '../../Utils/Media';
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
            headerStickers: [],
            position: 0
        };

        this.loadInViewContentOnScrollEnd = debounce(this.loadInViewContentOnScrollEnd, 100);
        this.loadInViewContentOnScroll = throttle(this.loadInViewContentOnScroll, 2000);
        this.updatePosition = throttle(this.updatePosition, 250);
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { position, stickerSets, sets, showPreview } = this.state;

        if (nextState.stickerSets !== stickerSets) {
            return true;
        }

        if (nextState.sets !== sets) {
            return true;
        }

        if (nextState.showPreview !== showPreview) {
            return true;
        }

        if (nextState.position !== position) {
            return true;
        }

        return false;
    }

    scrollTop = () => {
        this.scrollRef.current.scrollTop = 0;
    };

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
        const headerStickers = sets.reduce((preview, set) => {
            if (set.stickers.length > 0) {
                preview.push(set.stickers[0]);
            }
            return preview;
        }, []);
        this.setState({
            stickerSets,
            sets: slicedSets,
            headerStickers
        });
        this.setsLength = slicedSets.length;
    };

    loadInViewContentOnScroll = () => {
        this.loadInViewContent();
    };

    loadInViewContentOnScrollEnd = () => {
        this.loadInViewContent(400);
    };

    loadInViewContent = (padding = 0) => {
        const scroll = this.scrollRef.current;

        const { sets } = this.state;

        const inViewItems = [];
        sets.forEach(x => {
            const item = this.itemsMap.get(x.id);
            const node = ReactDOM.findDOMNode(item);
            if (node) {
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

        inViewItems.forEach(x => {
            const store = FileStore.getStore();
            if (!this.loadedSets.has(x.id)) {
                this.loadedSets.set(x.id, x.id);
                loadStickerSetContent(store, x);
            }
        });
    };

    updatePosition = () => {
        const scroll = this.scrollRef.current;

        const { sets } = this.state;
        let minDiff = scroll.scrollHeight;
        let position = 0;
        let firstOffsetTop = 0;
        sets.forEach((x, pos) => {
            const element = this.itemsMap.get(x.id);
            if (element) {
                const node = ReactDOM.findDOMNode(element);
                if (node) {
                    firstOffsetTop = pos === 0 ? node.offsetTop : firstOffsetTop;

                    const offsetTop = node.offsetTop - firstOffsetTop;
                    if (node && offsetTop <= scroll.scrollTop) {
                        const diff = Math.abs(scroll.scrollTop - offsetTop);
                        if (diff <= minDiff) {
                            minDiff = diff;
                            position = pos;
                        }
                    }
                }
            }
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSetPosition',
            position
        });
        this.setState({ position });
    };

    handleScroll = async () => {
        //this.loadInViewContentOnScroll();
        this.loadInViewContentOnScrollEnd();
        this.updatePosition();

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
        let concatSets = sets.concat(result);
        this.setState({ sets: concatSets });
    };

    loadPreviewContent = stickerId => {
        const { sets } = this.state;

        const sticker = getStickers(sets).find(x => x.sticker.id === stickerId);
        if (!sticker) return;

        const store = FileStore.getStore();
        loadStickerContent(store, sticker, null);

        const stickersPerRow = 5;
        const preloadStickers = getNeighborStickersFromSets(sticker, sets, stickersPerRow);
        preloadStickers.forEach(x => {
            loadStickerContent(store, x, null);
        });
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

        const sticker = getStickers(sets).find(x => x.sticker.id === stickerId);
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

                    const sticker = getStickers(sets).find(x => x.sticker.id === stickerId);
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

    handleSelectSet = async position => {
        const { sets, stickerSets } = this.state;
        const { scrollRef } = this;

        if (position < sets.length) {
            const element = this.itemsMap.get(sets[position].id);
            if (element) {
                const node = ReactDOM.findDOMNode(element);
                if (node) {
                    const scroll = scrollRef.current;
                    scroll.scrollTop = node.offsetTop;
                }
            }
        } else if (position < stickerSets.sets.length) {
            if (this.loadingChunk) return;
            if (stickerSets.sets.length === sets.length) return;

            this.loadingChunk = true;
            const promises = [];
            stickerSets.sets.slice(this.setsLength, position + 1).forEach(x => {
                promises.push(
                    TdLibController.send({
                        '@type': 'getStickerSet',
                        set_id: x.id
                    })
                );
            });

            const result = await Promise.all(promises).finally(() => (this.loadingChunk = false));

            this.setsLength += result.length;
            let concatSets = sets.concat(result);
            this.setState({ sets: concatSets }, () => {
                if (position < concatSets.length) {
                    this.handleSelectSet(position);
                }
            });
        }
    };

    render() {
        const { position, stickerSets, sets, headerStickers } = this.state;
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
                <StickersPickerHeader onSelect={this.handleSelectSet} stickers={headerStickers} />
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
