/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import StickerSet from './StickerSet';
import TdLibController from '../../Controllers/TdLibController';
import './StickersPicker.css';
import Sticker from './StickersHint';
import { STICKER_PREVIEW_DISPLAY_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import { loadStickerContent } from '../../Utils/File';

class StickersPicker extends React.Component {
    state = {
        stickerSets: null
    };

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return nextState.stickerSets !== this.state.stickerSets || nextState.sets !== this.state.sets;
    }

    loadContent = async () => {
        if (this.loaded) return;

        const stickerSets = await TdLibController.send({
            '@type': 'getInstalledStickerSets',
            is_masks: false
        });

        let promises = [];
        stickerSets.sets.slice(0, 5).forEach(x => {
            promises.push(
                TdLibController.send({
                    '@type': 'getStickerSet',
                    set_id: x.id
                })
            );
        });

        let result = await Promise.all(promises);

        this.loaded = true;
        this.setState({ stickerSets, sets: result }, () => {
            setTimeout(async () => {
                promises = [];
                stickerSets.sets.forEach(x => {
                    promises.push(
                        TdLibController.send({
                            '@type': 'getStickerSet',
                            set_id: x.id
                        })
                    );
                });

                result = await Promise.all(promises);

                this.setState({ stickerSets, sets: result });
            }, 250);
        });
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

    handleMouseOver = event => {};

    handleMouseOut = event => {};

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

    render() {
        const { onSelect } = this.props;
        const { stickerSets, sets, previewStickerId, showPreview, previewStickerEmojis } = this.state;
        if (!stickerSets) return null;

        if (!sets) return null;
        if (!sets.length) return null;

        const items = sets.map(x => <StickerSet key={x.id} info={x} onSelect={onSelect} />);
        const sticker = this.getItems(sets).find(x => x.sticker.id === previewStickerId);

        return (
            <div className='stickers-picker'>
                <div className='stickers-picker-header' />
                <div className='stickers-picker-scroll'>{items}</div>
                {Boolean(sticker) && showPreview && (
                    <div className='sticker-set-dialog-preview'>
                        <div className='sticker-set-dialog-preview-emoji'>{previewStickerEmojis}</div>
                        <Sticker sticker={sticker} displaySize={STICKER_PREVIEW_DISPLAY_SIZE} />
                    </div>
                )}
            </div>
        );
    }
}

StickersPicker.propTypes = {
    onSelect: PropTypes.func.isRequired
};

export default StickersPicker;
