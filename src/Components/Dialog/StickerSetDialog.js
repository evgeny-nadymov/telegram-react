/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import ShareStickerSetButton from './ShareStickerSetButton';
import Sticker from '../Message/Media/Sticker';
import StickerPreview from '../ColumnMiddle/StickerPreview';
import { loadStickerContent, loadStickerSetContent } from '../../Utils/File';
import { STICKER_SMALL_DISPLAY_SIZE } from '../../Constants';
import FileStore from '../../Stores/FileStore';
import StickerStore from '../../Stores/StickerStore';
import TdLibController from '../../Controllers/TdLibController';
import './StickerSetDialog.css';

const styles = theme => ({
    contentRoot: {
        display: 'flex',
        flexWrap: 'wrap',
        maxHeight: 480,
        padding: '0 12px 24px',
        background: 'transparent'
    },
    paperRoot: {
        width: 344
    },
    dialogTitleRoot: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },
    dialogRoot: {
        color: theme.palette.text.primary
    },
    shareButtonRoot: {
        margin: '-24px -12px -24px 0'
    },
    typographyRoot: {
        flexGrow: 1,
        flexShrink: 1
    },
    disablePointerEvents: {
        pointerEvents: 'none'
    }
});

class StickerSetDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            stickerSet: StickerStore.stickerSet,
            stickerId: 0
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { stickerSet, stickerId } = this.state;

        return stickerSet !== nextState.stickerSet || stickerId !== nextState.stickerId;
    }

    componentDidMount() {
        StickerStore.on('clientUpdateStickerSet', this.handleClientUpdateStickerSet);
        StickerStore.on('updateInstalledStickerSets', this.handleUpdateInstalledStickerSets);
    }

    componentWillUnmount() {
        StickerStore.removeListener('clientUpdateStickerSet', this.handleClientUpdateStickerSet);
        StickerStore.removeListener('updateInstalledStickerSets', this.handleUpdateInstalledStickerSets);
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

    handleMouseOver = event => {
        const stickerId = Number(event.target.dataset.stickerId);
        if (!stickerId) return;

        if (!this.mouseDown) return;

        this.setState({ stickerId });
        this.loadPreviewContent(stickerId);
    };

    handleMouseDown = event => {
        const stickerId = Number(event.target.dataset.stickerId);
        if (!stickerId) return;

        this.setState({ stickerId });
        this.loadPreviewContent(stickerId);

        this.mouseDown = true;
        document.addEventListener('mouseup', this.handleMouseUp);

        event.preventDefault();
        event.stopPropagation();
        return false;
    };

    handleMouseUp = () => {
        this.setState({ stickerId: 0 });
        this.mouseDown = false;
        document.removeEventListener('mouseup', this.handleMouseUp);
    };

    render() {
        const { t, classes } = this.props;
        const { stickerSet, stickerId } = this.state;
        if (!stickerSet) return null;

        const { title, stickers, is_installed } = stickerSet;

        const items = stickers.map(x => (
            <div
                className='sticker-set-dialog-item'
                key={x.sticker.id}
                data-sticker-id={x.sticker.id}
                style={{ width: 76, height: 76 }}>
                <Sticker
                    key={x.sticker.id}
                    className='sticker-set-dialog-item-sticker'
                    preview
                    sticker={x}
                    displaySize={STICKER_SMALL_DISPLAY_SIZE}
                    blur={false}
                />
                <div className='sticker-set-dialog-item-emoji'>{x.emoji}</div>
            </div>
        ));

        const stickerIndex = stickers.findIndex(x => x.sticker.id === stickerId);
        const sticker = stickerIndex !== -1 ? stickers[stickerIndex] : null;

        return (
            <Dialog
                className={classes.dialogRoot}
                open
                transitionDuration={0}
                onClose={this.handleClose}
                aria-labelledby='sticker-set-dialog-title-text'
                classes={{ paper: classes.paperRoot }}>
                <DialogTitle
                    id='sticker-set-dialog-title-text'
                    className={classNames(classes.dialogTitleRoot, {
                        [classes.disablePointerEvents]: Boolean(sticker)
                    })}
                    disableTypography>
                    <Typography variant='h6' className={classes.typographyRoot} noWrap>
                        {title}
                    </Typography>
                    <ShareStickerSetButton className={classes.shareButtonRoot} />
                </DialogTitle>
                <DialogContent
                    classes={{ root: classes.contentRoot }}
                    onMouseOver={this.handleMouseOver}
                    onMouseOut={this.handleMouseOut}
                    onMouseDown={this.handleMouseDown}>
                    {items}
                </DialogContent>
                <DialogActions className={classNames({ [classes.disablePointerEvents]: Boolean(sticker) })}>
                    <Button color='primary' onClick={this.handleClose}>
                        {t('Cancel')}
                    </Button>
                    <Button color='primary' onClick={this.handleDone}>
                        {is_installed ? t('Remove') : t('Add')}
                    </Button>
                </DialogActions>
                {Boolean(sticker) && <StickerPreview sticker={sticker} />}
            </Dialog>
        );
    }
}

StickerSetDialog.propTypes = {};

const enhance = compose(
    withStyles(styles),
    withTranslation()
);

export default enhance(StickerSetDialog);
