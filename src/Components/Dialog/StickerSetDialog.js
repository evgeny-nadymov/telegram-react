/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { withStyles } from '@material-ui/core';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import ShareStickerSetButton from './ShareStickerSetButton';
import Sticker from '../Message/Media/Sticker';
import { loadStickerSetContent } from '../../Utils/File';
import { STICKER_SMALL_DISPLAY_SIZE } from '../../Constants';
import StickerStore from '../../Stores/StickerStore';
import FileStore from '../../Stores/FileStore';
import TdLibController from '../../Controllers/TdLibController';
import './StickerSetDialog.css';

const styles = theme => ({
    dialogRoot: {
        color: theme.palette.text.primary
    },
    contentRoot: {
        width: 320,
        display: 'flex',
        flexWrap: 'wrap',
        maxHeight: 480,
        padding: '0 12px 24px'
    },
    shareButtonRoot: {
        marginTop: 8
    }
});

class StickerSetDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            stickerSet: StickerStore.stickerSet
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { stickerSet } = this.state;

        return stickerSet !== nextState.stickerSet;
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

    render() {
        const { t, classes } = this.props;
        const { stickerSet } = this.state;
        if (!stickerSet) return null;

        const { title, stickers, emojis, is_installed } = stickerSet;

        const items = stickers.map(x => (
            <Sticker
                key={x.sticker.id}
                chatId={0}
                messageId={0}
                sticker={x}
                blur={false}
                displaySize={STICKER_SMALL_DISPLAY_SIZE}
                style={{ boxSizing: 'border-box', padding: 6 }}
                openMedia={() => {}}
            />
        ));

        return (
            <Dialog
                className={classes.dialogRoot}
                open
                transitionDuration={0}
                onClose={this.handleClose}
                aria-labelledby='sticker-set-dialog-title-text'>
                <div className='sticker-set-dialog-title'>
                    <DialogTitle id='sticker-set-dialog-title-text'>{title}</DialogTitle>
                    <ShareStickerSetButton className={classes.shareButtonRoot} />
                </div>
                <DialogContent classes={{ root: classes.contentRoot }}>{items}</DialogContent>
                <DialogActions>
                    <Button color='primary' onClick={this.handleClose}>
                        {t('Cancel')}
                    </Button>
                    <Button color='primary' onClick={this.handleDone}>
                        {is_installed ? t('Remove') : t('Add')}
                    </Button>
                </DialogActions>
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
