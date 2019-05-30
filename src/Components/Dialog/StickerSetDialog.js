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
import { loadStickerContent, loadStickerSetContent } from '../../Utils/File';
import { STICKER_PREVIEW_DISPLAY_SIZE, STICKER_SMALL_DISPLAY_SIZE } from '../../Constants';
import StickerStore from '../../Stores/StickerStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './StickerSetDialog.css';

const styles = theme => ({
    contentRoot: {
        width: 320,
        display: 'flex',
        flexWrap: 'wrap',
        maxHeight: 480,
        padding: '0 12px 24px',
        background: 'transparent'
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

    loadContent = stickerId => {
        const { stickerSet } = this.state;
        const { stickers } = stickerSet;
        const sticker = stickers.find(x => x.sticker.id === stickerId);
        if (!sticker) return;

        const store = FileStore.getStore();
        loadStickerContent(store, sticker, null);
    };

    handleMouseOver = event => {
        const stickerId = Number(event.target.dataset.stickerId);
        if (!stickerId) return;

        if (!this.mouseDown) return;

        this.setState({ stickerId });
        this.loadContent(stickerId);
    };

    handleMouseDown = event => {
        const stickerId = Number(event.target.dataset.stickerId);
        if (!stickerId) return;

        this.setState({ stickerId });
        this.loadContent(stickerId);

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

        const { title, stickers, emojis, is_installed } = stickerSet;

        const items = stickers.map(x => (
            <div className='sticker-set-dialog-item' key={x.sticker.id} data-sticker-id={x.sticker.id}>
                <Sticker
                    key={x.sticker.id}
                    className='sticker-set-dialog-item-sticker'
                    sticker={x}
                    displaySize={STICKER_SMALL_DISPLAY_SIZE}
                    blur={false}
                />
                <div className='sticker-set-dialog-item-emoji'>{x.emoji}</div>
            </div>
        ));

        const stickerIndex = stickers.findIndex(x => x.sticker.id === stickerId);
        const sticker = stickerIndex !== -1 ? stickers[stickerIndex] : null;
        const emoji = stickerIndex !== -1 ? emojis[stickerIndex].emojis.join(' ') : null;

        return (
            <Dialog
                className={classes.dialogRoot}
                open
                transitionDuration={0}
                onClose={this.handleClose}
                aria-labelledby='sticker-set-dialog-title-text'>
                <DialogTitle
                    id='sticker-set-dialog-title-text'
                    className={classNames(classes.dialogTitleRoot, {
                        [classes.disablePointerEvents]: Boolean(sticker)
                    })}
                    disableTypography>
                    <Typography variant='h6' className={classes.typographyRoot}>
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
                {Boolean(sticker) && (
                    <div className='sticker-set-dialog-preview'>
                        <div className='sticker-set-dialog-preview-emoji'>{emoji}</div>
                        <Sticker sticker={sticker} displaySize={STICKER_PREVIEW_DISPLAY_SIZE} />
                    </div>
                )}
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
