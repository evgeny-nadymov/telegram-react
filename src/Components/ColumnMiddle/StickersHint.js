/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '@material-ui/core/styles/withStyles';
import Sticker from '../Message/Media/Sticker';
import { borderStyle } from '../Theme';
import { loadStickerContent, loadStickersContent } from '../../Utils/File';
import { STICKER_HINT_DISPLAY_SIZE, STICKER_PREVIEW_DISPLAY_SIZE, STICKER_SMALL_DISPLAY_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import StickerStore from '../../Stores/StickerStore';
import TdLibController from '../../Controllers/TdLibController';
import './StickersHint.css';

const styles = theme => ({
    root: {
        background: theme.palette.type === 'dark' ? theme.palette.background.default : '#FFFFFF'
    },
    ...borderStyle(theme)
});

class StickersHint extends React.Component {
    constructor(props) {
        super(props);

        this.hintsRef = React.createRef();

        this.state = {
            hint: null,
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
        StickerStore.removeListener('clientUpdateLocalStickersHint', this.onClientUpdateLocalStickersHint);
        StickerStore.removeListener('clientUpdateRemoteStickersHint', this.onClientUpdateRemoteStickersHint);
    }

    onClientUpdateRemoteStickersHint = update => {
        const { hint } = update;
        const { hint: currentHint } = this.state;

        if (hint && hint.timestamp !== currentHint.timestamp) return;

        this.setState({
            hint: StickerStore.hint
        });

        const store = FileStore.getStore();
        const { stickers } = hint;
        loadStickersContent(store, stickers.stickers);
    };

    onClientUpdateLocalStickersHint = update => {
        const { hint } = update;

        this.setState({
            hint,
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
        const { hint } = this.state;
        const { stickers: result } = hint;
        const { stickers } = result;

        const sticker = stickers.find(x => x.sticker.id === stickerId);
        if (!sticker) return;

        const store = FileStore.getStore();
        loadStickerContent(store, sticker, null);

        let stickersPerRow = 8;
        if (this.hintsRef && this.hintsRef.current) {
            stickersPerRow = Math.floor(this.hintsRef.current.clientWidth / STICKER_HINT_DISPLAY_SIZE);
        }

        const preloadStickers = this.getNeighborStickers(stickerId, stickers, stickersPerRow);
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

    handleMouseOver = event => {
        const stickerId = Number(event.target.dataset.stickerId);
        if (!stickerId) return;

        if (!this.mouseDown) return;

        if (this.mouseDownStickerId !== stickerId) {
            this.mouseDownStickerId = null;
        }
        this.setState({ previewStickerId: stickerId });
        this.loadPreviewContent(stickerId);
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
                this.setState({ showPreview: true, cancelSend: true });
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
        this.mouseDown = false;
        document.removeEventListener('mouseup', this.handleMouseUp);
    };

    getItems = () => {
        const items = [];
        const { hint } = this.state;

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

    render() {
        const { classes } = this.props;
        const { hint, previewStickerId, showPreview } = this.state;
        if (!hint) return null;

        const { stickers } = hint;
        if (!stickers) return null;

        const items = this.getItems();
        if (!items.length) return null;

        const controls = items.map(x => (
            <div
                className='sticker-set-dialog-item'
                key={x.sticker.id}
                data-sticker-id={x.sticker.id}
                style={{ width: STICKER_HINT_DISPLAY_SIZE, height: STICKER_HINT_DISPLAY_SIZE }}
                onClick={() => this.handleSend(x)}>
                <Sticker
                    key={x.sticker.id}
                    className='sticker-set-dialog-item-sticker'
                    sticker={x}
                    displaySize={STICKER_SMALL_DISPLAY_SIZE}
                    blur={false}
                />
                {/*<div className='sticker-set-dialog-item-emoji'>{x.emoji}</div>*/}
            </div>
        ));

        const stickerIndex = items.findIndex(x => x.sticker.id === previewStickerId);
        const sticker = stickerIndex !== -1 ? items[stickerIndex] : null;
        const emoji = stickerIndex !== -1 ? sticker.emoji : null;

        return (
            <div
                ref={this.hintsRef}
                className={classNames('stickers-hint', classes.borderColor, classes.root)}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                onMouseDown={this.handleMouseDown}>
                {controls}
                {Boolean(sticker) && showPreview && (
                    <div className='sticker-set-dialog-preview'>
                        {/*<div className='sticker-set-dialog-preview-emoji'>{emoji}</div>*/}
                        <Sticker sticker={sticker} displaySize={STICKER_PREVIEW_DISPLAY_SIZE} />
                    </div>
                )}
            </div>
        );
    }
}

export default withStyles(styles)(StickersHint);
