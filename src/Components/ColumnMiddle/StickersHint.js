/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Sticker, { StickerSourceEnum } from '../Message/Media/Sticker';
import StickerPreview from './StickerPreview';
import { loadStickerContent, loadStickersContent } from '../../Utils/File';
import { STICKER_HINT_DISPLAY_SIZE, STICKER_SMALL_DISPLAY_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import StickerStore from '../../Stores/StickerStore';
import TdLibController from '../../Controllers/TdLibController';
import './StickersHint.css';

class StickersHint extends React.Component {
    constructor(props) {
        super(props);

        this.hintsRef = React.createRef();

        this.state = {
            hint: null,
            items: [],
            previewStickerId: 0,
            showPreview: false,
            cancelSend: false
        };
    }

    componentDidMount() {
        StickerStore.on('clientUpdateLocalStickersHint', this.onClientUpdateLocalStickersHint);
        StickerStore.on('clientUpdateRemoteStickersHint', this.onClientUpdateRemoteStickersHint);
    }

    componentWillUnmount() {
        StickerStore.off('clientUpdateLocalStickersHint', this.onClientUpdateLocalStickersHint);
        StickerStore.off('clientUpdateRemoteStickersHint', this.onClientUpdateRemoteStickersHint);
    }

    onClientUpdateRemoteStickersHint = update => {
        const { hint } = update;
        const { hint: currentHint } = this.state;

        if (currentHint && hint.timestamp !== currentHint.timestamp) return;

        this.setState({
            hint: StickerStore.hint,
            items: this.getItems(StickerStore.hint)
        });

        const store = FileStore.getStore();
        const { stickers } = hint;
        loadStickersContent(store, stickers.stickers);
    };

    onClientUpdateLocalStickersHint = update => {
        const { hint } = update;

        this.setState({
            hint,
            items: this.getItems(hint),
            previewStickerId: 0,
            showPreview: false,
            cancelSend: false
        });

        if (!hint) return;

        const store = FileStore.getStore();
        const { stickers } = hint;
        loadStickersContent(store, stickers.stickers);
    };

    handleSend = sticker => {
        const { cancelSend } = this.state;
        if (cancelSend) return;
        if (!sticker) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSend',
            sticker
        });
    };

    loadPreviewContent = stickerId => {
        const { items } = this.state;

        const sticker = items.find(x => x.sticker.id === stickerId);
        if (!sticker) return;

        const store = FileStore.getStore();
        loadStickerContent(store, sticker, null);

        let stickersPerRow = 8;
        if (this.hintsRef && this.hintsRef.current) {
            stickersPerRow = Math.floor(this.hintsRef.current.clientWidth / STICKER_HINT_DISPLAY_SIZE);
        }

        const preloadStickers = this.getNeighborStickers(stickerId, items, stickersPerRow);
        preloadStickers.forEach(x => {
            loadStickerContent(store, x, null);
        });
    };

    getNeighborStickers = (stickerId, stickers, stickersPerRow) => {
        if (!stickers) return [];

        const indexes = [];
        const index = stickers.findIndex(x => x.sticker.id === stickerId);
        if (index === -1) return [];

        const row = Math.floor(index / stickersPerRow);
        const column = index % stickersPerRow;

        const prevRow = row - 1;
        const nextRow = row + 1;
        const prevColumn = column - 1;
        const nextColumn = column + 1;

        if (prevRow >= 0) {
            if (prevColumn >= 0) {
                indexes.push(stickersPerRow * prevRow + prevColumn);
            }
            indexes.push(stickersPerRow * prevRow + column);
            if (nextColumn < stickersPerRow) {
                indexes.push(stickersPerRow * prevRow + nextColumn);
            }
        }

        if (prevColumn >= 0) {
            indexes.push(stickersPerRow * row + prevColumn);
        }
        if (nextColumn < stickersPerRow) {
            indexes.push(stickersPerRow * row + nextColumn);
        }

        if (nextRow < Math.ceil(stickers.length / stickersPerRow)) {
            if (prevColumn >= 0) {
                indexes.push(stickersPerRow * nextRow + prevColumn);
            }
            indexes.push(stickersPerRow * nextRow + column);
            if (nextColumn < stickersPerRow) {
                indexes.push(stickersPerRow * nextRow + nextColumn);
            }
        }

        return indexes.map(i => stickers[i]);
    };

    handleMouseEnter = event => {
        const stickerId = Number(event.currentTarget.dataset.stickerId);
        const sticker = this.getSticker(stickerId);
        if (!sticker) return;

        if (!this.mouseDown) return;

        if (this.mouseDownStickerId !== stickerId) {
            this.mouseDownStickerId = null;
        }
        this.setState({ sticker });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerPreview',
            sticker
        });
        this.loadPreviewContent(stickerId);
    };

    handleMouseDown = event => {
        const stickerId = Number(event.currentTarget.dataset.stickerId);
        const sticker = this.getSticker(stickerId);
        if (!sticker) return;

        this.mouseDownStickerId = stickerId;
        const now = Date.now();

        this.setState({ sticker, timestamp: now, showPreview: false, cancelSend: false });
        setTimeout(() => {
            const { timestamp } = this.state;
            if (timestamp === now) {
                this.setState({ showPreview: true, cancelSend: true });
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateStickerPreview',
                    sticker
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
        const sticker = null;
        this.setState({ sticker, timestamp: 0, showPreview: false });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerPreview',
            sticker
        });
        this.mouseDown = false;
        document.removeEventListener('mouseup', this.handleMouseUp);
    };

    getItems = hint => {
        const items = [];
        if (!hint) return items;

        const dict = new Map();
        const { stickers, foundStickers } = hint;
        if (stickers) {
            stickers.stickers.forEach(x => {
                items.push(x);
                dict.set(x.sticker.id, x.sticker.id);
            });
        }
        if (foundStickers) {
            foundStickers.stickers.forEach(x => {
                if (!dict.has(x.sticker.id)) {
                    items.push(x);
                    dict.set(x.sticker.id, x.sticker.id);
                }
            });
        }

        return items;
    };

    getSticker(stickerId) {
        const { items } = this.state;

        const stickerIndex = items.findIndex(x => x.sticker.id === stickerId);
        return stickerIndex !== -1 ? items[stickerIndex] : null;
    }

    render() {
        const { hint, items, sticker, showPreview } = this.state;
        if (!hint) return null;
        if (!items) return null;
        if (!items.length) return null;

        const controls = items.map(x => (
            <div
                className='sticker-set-dialog-item'
                key={x.sticker.id}
                data-sticker-id={x.sticker.id}
                style={{ width: STICKER_HINT_DISPLAY_SIZE, height: STICKER_HINT_DISPLAY_SIZE }}
                onClick={() => this.handleSend(x)}
                onMouseEnter={this.handleMouseEnter}
                onMouseDown={this.handleMouseDown}>
                <Sticker
                    key={x.sticker.id}
                    className='sticker-set-dialog-item-sticker'
                    sticker={x}
                    autoplay={false}
                    blur={false}
                    displaySize={STICKER_SMALL_DISPLAY_SIZE}
                    preview
                    source={StickerSourceEnum.HINTS}
                />
            </div>
        ));

        return (
            <div ref={this.hintsRef} className='stickers-hint scrollbars-hidden'>
                {controls}
                {Boolean(sticker) && showPreview && <StickerPreview sticker={sticker} />}
            </div>
        );
    }
}

export default StickersHint;
