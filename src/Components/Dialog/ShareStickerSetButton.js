/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import copy from 'copy-to-clipboard';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import { withSnackbar } from 'notistack';
import withStyles from '@material-ui/core/styles/withStyles';
import CloseIcon from '@material-ui/icons/Close';
import LinkIcon from '@material-ui/icons/Link';
import MoreIcon from '@material-ui/icons/MoreVert';
import IconButton from '@material-ui/core/IconButton';
import ShareIcon from '@material-ui/icons/Share';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../Constants';
import OptionStore from '../../Stores/OptionStore';
import StickerStore from '../../Stores/StickerStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';

const styles = theme => ({
    close: {
        padding: theme.spacing.unit / 2
    }
});

class ShareStickerSetButton extends React.Component {
    state = {
        anchorEl: null
    };

    handleMenuClick = event => {
        this.handleOpen(event.currentTarget);
    };

    handleOpen = anchorEl => {
        this.setState({ anchorEl });
    };

    handleClose = () => {
        this.setState({ anchorEl: null });
    };

    handleCopyLink = () => {
        this.handleClose();

        const { t } = this.props;

        const link = this.getStickersLink(StickerStore.stickerSet);
        if (!link) return;

        copy(link);

        const key = `${link}_copy_stickers_link`;
        const message = t('LinkCopied');
        const action = null;

        this.handleScheduledAction(key, message, action);
    };

    getStickersLink = stickerSet => {
        if (!stickerSet) return '';

        const { name } = stickerSet;
        if (!name) return '';

        const telegramUrlOption = OptionStore.get('t_me_url');

        return (telegramUrlOption ? telegramUrlOption.value : 'https://telegram.org/') + 'addstickers/' + name;
    };

    handleScheduledAction = (key, message, action) => {
        if (!key) return;

        const { enqueueSnackbar, classes, t } = this.props;
        if (!enqueueSnackbar) return;

        const TRANSITION_DELAY = 150;
        if (
            ApplicationStore.addScheduledAction(key, NOTIFICATION_AUTO_HIDE_DURATION_MS + 2 * TRANSITION_DELAY, action)
        ) {
            enqueueSnackbar(message, {
                autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
                action: [
                    <IconButton
                        key='close'
                        aria-label='Close'
                        color='inherit'
                        className={classes.close}
                        onClick={() => ApplicationStore.removeScheduledAction(key)}>
                        <CloseIcon />
                    </IconButton>
                ]
            });
        }
    };

    handleShare = () => {
        this.handleClose();

        const link = this.getStickersLink(StickerStore.stickerSet);
        if (!link) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSet',
            stickerSet: null
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateForward',
            info: { link }
        });
    };

    render() {
        const { classes, t, className } = this.props;
        const { anchorEl } = this.state;

        return (
            <>
                <IconButton
                    className={classes.iconButton + ' ' + className}
                    aria-label='Share'
                    open={Boolean(anchorEl)}
                    onClick={this.handleMenuClick}>
                    <MoreIcon />
                </IconButton>
                <Menu
                    id='attach-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}
                    onClose={this.handleClose}>
                    <MenuItem onClick={this.handleCopyLink}>
                        <ListItemIcon>
                            <LinkIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('CopyLink')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleShare}>
                        <ListItemIcon>
                            <ShareIcon />
                        </ListItemIcon>
                        <ListItemText primary={t('StickersShare')} />
                    </MenuItem>
                </Menu>
            </>
        );
    }
}

ShareStickerSetButton.propTypes = {};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation(),
    withSnackbar
);

export default enhance(ShareStickerSetButton);
