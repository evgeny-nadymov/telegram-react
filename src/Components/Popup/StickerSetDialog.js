/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import ShareStickerSetButton from './ShareStickerSetButton';
import Sticker, { StickerSourceEnum } from '../Message/Media/Sticker';
import StickerPreview from '../ColumnMiddle/StickerPreview';
import { loadStickerContent, loadStickerSetContent } from '../../Utils/File';
import { STICKER_SMALL_DISPLAY_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import StickerStore from '../../Stores/StickerStore';
import TdLibController from '../../Controllers/TdLibController';
import './StickerSetDialog.css';

class StickerSetDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            stickerSet: StickerStore.stickerSet,
            stickerId: 0
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { stickerSet, sticker } = this.state;

        return stickerSet !== nextState.stickerSet || sticker !== nextState.sticker;
    }

    componentDidMount() {
        StickerStore.on('clientUpdateStickerSet', this.handleClientUpdateStickerSet);
        StickerStore.on('updateInstalledStickerSets', this.handleUpdateInstalledStickerSets);
    }

    componentWillUnmount() {
        StickerStore.off('clientUpdateStickerSet', this.handleClientUpdateStickerSet);
        StickerStore.off('updateInstalledStickerSets', this.handleUpdateInstalledStickerSets);
    }

    handleUpdateInstalledStickerSets = update => {
        const { stickerSet } = StickerStore;

        this.setState({ stickerSet });
    };

    handleClientUpdateStickerSet = update => {
        const { stickerSet } = update;

        this.setState({ stickerSet });

        if (stickerSet) {
            const store = FileStore.getStore();
            loadStickerSetContent(store, stickerSet);
        }
    };

    handleClose = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSet',
            stickerSet: null
        });
    };

    handleDone = () => {
        const { stickerSet } = this.state;
        if (!stickerSet) return;

        const { is_installed } = stickerSet;

        TdLibController.send({
            '@type': 'changeStickerSet',
            set_id: stickerSet.id,
            is_installed: !is_installed
        });

        this.handleClose();
    };

    loadPreviewContent = stickerId => {
        const { stickerSet } = this.state;
        const { stickers } = stickerSet;
        const sticker = stickers.find(x => x.sticker.id === stickerId);
        if (!sticker) return;

        const store = FileStore.getStore();
        loadStickerContent(store, sticker, null);

        const preloadStickers = this.getNeighborStickers(stickerId);
        preloadStickers.forEach(x => {
            loadStickerContent(store, x, null);
        });
    };

    getNeighborStickers = stickerId => {
        const { stickerSet } = this.state;
        if (!stickerSet) return [];

        const { stickers } = stickerSet;
        if (!stickers) return [];

        const indexes = [];
        const index = stickers.findIndex(x => x.sticker.id === stickerId);
        if (index === -1) return [];

        const STICKERS_PER_ROW = 4;
        const row = Math.floor(index / STICKERS_PER_ROW);
        const column = index % STICKERS_PER_ROW;

        const prevRow = row - 1;
        const nextRow = row + 1;
        const prevColumn = column - 1;
        const nextColumn = column + 1;

        if (prevRow >= 0) {
            if (prevColumn >= 0) {
                indexes.push(STICKERS_PER_ROW * prevRow + prevColumn);
            }
            indexes.push(STICKERS_PER_ROW * prevRow + column);
            if (nextColumn < STICKERS_PER_ROW) {
                indexes.push(STICKERS_PER_ROW * prevRow + nextColumn);
            }
        }

        if (prevColumn >= 0) {
            indexes.push(STICKERS_PER_ROW * row + prevColumn);
        }
        if (nextColumn < STICKERS_PER_ROW) {
            indexes.push(STICKERS_PER_ROW * row + nextColumn);
        }

        if (nextRow < Math.ceil(stickers.length / STICKERS_PER_ROW)) {
            if (prevColumn >= 0) {
                indexes.push(STICKERS_PER_ROW * nextRow + prevColumn);
            }
            indexes.push(STICKERS_PER_ROW * nextRow + column);
            if (nextColumn < STICKERS_PER_ROW) {
                indexes.push(STICKERS_PER_ROW * nextRow + nextColumn);
            }
        }

        return indexes.map(i => stickers[i]);
    };

    // handleMouseOver = event => {
    //     const stickerId = Number(event.target.dataset.stickerId);
    //     if (!stickerId) return;
    //
    //     if (!this.mouseDown) return;
    //
    //     this.setState({ stickerId });
    //     this.loadPreviewContent(stickerId);
    // };

    // handleMouseDown = event => {
    //     const stickerId = Number(event.target.dataset.stickerId);
    //     if (!stickerId) return;
    //
    //     this.setState({ stickerId });
    //     this.loadPreviewContent(stickerId);
    //
    //     this.mouseDown = true;
    //     document.addEventListener('mouseup', this.handleMouseUp);
    //
    //     event.preventDefault();
    //     event.stopPropagation();
    //     return false;
    // };

    getSticker(stickerId) {
        const { stickerSet } = this.state;
        if (!stickerSet) return null;

        const { stickers } = stickerSet;

        const stickerIndex = stickers.findIndex(x => x.sticker.id === stickerId);
        return stickerIndex !== -1 ? stickers[stickerIndex] : null;
    }

    handleMouseUp = () => {
        const sticker = null;
        this.setState({ sticker });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerPreview',
            sticker
        });
        this.mouseDown = false;
        document.removeEventListener('mouseup', this.handleMouseUp);
    };

    handleMouseEnter = event => {
        const stickerId = Number(event.currentTarget.dataset.stickerId);
        const sticker = this.getSticker(stickerId);
        if (!sticker) return;

        if (!this.mouseDown) return;

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

        this.setState({ sticker });
        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerPreview',
            sticker
        });
        this.loadPreviewContent(stickerId);

        this.mouseDown = true;
        document.addEventListener('mouseup', this.handleMouseUp);

        event.preventDefault();
        event.stopPropagation();
        return false;
    };

    render() {
        const { t } = this.props;
        const { stickerSet, sticker } = this.state;
        if (!stickerSet) return null;

        const { title, stickers, is_installed } = stickerSet;

        const items = stickers.map(x => (
            <div
                className='sticker-set-dialog-item'
                key={x.sticker.id}
                data-sticker-id={x.sticker.id}
                style={{ width: 76, height: 76 }}
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
                    source={StickerSourceEnum.STICKER_SET}
                />
                <div className='sticker-set-dialog-item-emoji'>{x.emoji}</div>
            </div>
        ));

        return (
            <Dialog
                className='sticker-set-dialog'
                open
                transitionDuration={0}
                onClose={this.handleClose}
                aria-labelledby='sticker-set-dialog-title-text'
                classes={{ paper: 'sticker-set-dialog-paper' }}>
                <DialogTitle
                    id='sticker-set-dialog-title-text'
                    className={classNames({ 'sticker-set-dialog-disabled': Boolean(sticker) })}
                    disableTypography>
                    <Typography variant='h6' className='sticker-set-dialog-title-typography' noWrap>
                        {title}
                    </Typography>
                    <ShareStickerSetButton className='sticker-set-dialog-share-button' />
                </DialogTitle>
                <DialogContent
                    classes={{ root: 'sticker-set-dialog-content-root' }}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}>
                    {items}
                </DialogContent>
                <DialogActions className={classNames({ 'sticker-set-dialog-disabled': Boolean(sticker) })}>
                    <Button color='primary' onClick={this.handleClose}>
                        {t('Cancel')}
                    </Button>
                    <Button color='primary' onClick={this.handleDone}>
                        {is_installed ? t('StickersRemove') : t('Add')}
                    </Button>
                </DialogActions>
                {<StickerPreview sticker={sticker} />}
            </Dialog>
        );
    }
}

StickerSetDialog.propTypes = {};

export default withTranslation()(StickerSetDialog);
