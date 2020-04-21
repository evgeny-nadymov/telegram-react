/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { copy } from '../../Utils/Text';
import { compose } from '../../Utils/HOC';
import { withTranslation } from 'react-i18next';
import { withSnackbar } from 'notistack';
import CloseIcon from '../../Assets/Icons/Close';
import LinkIcon from '@material-ui/icons/Link';
import MoreIcon from '../../Assets/Icons/More';
import IconButton from '@material-ui/core/IconButton';
import ShareIcon from '@material-ui/icons/Share';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { forward } from '../../Actions/Client';
import { NOTIFICATION_AUTO_HIDE_DURATION_MS } from '../../Constants';
import OptionStore from '../../Stores/OptionStore';
import StickerStore from '../../Stores/StickerStore';
import TdLibController from '../../Controllers/TdLibController';

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

        this.handleScheduledAction(t('LinkCopied'));
    };

    getStickersLink = stickerSet => {
        if (!stickerSet) return '';

        const { name } = stickerSet;
        if (!name) return '';

        const telegramUrlOption = OptionStore.get('t_me_url');

        return (telegramUrlOption ? telegramUrlOption.value : 'https://telegram.org/') + 'addstickers/' + name;
    };

    handleScheduledAction = message => {
        const { enqueueSnackbar, closeSnackbar } = this.props;

        const snackKey = enqueueSnackbar(message, {
            autoHideDuration: NOTIFICATION_AUTO_HIDE_DURATION_MS,
            preventDuplicate: true,
            action: [
                <IconButton
                    key='close'
                    aria-label='Close'
                    color='inherit'
                    className='notification-close-button'
                    onClick={() => closeSnackbar(snackKey)}>
                    <CloseIcon />
                </IconButton>
            ]
        });
    };

    handleShare = () => {
        this.handleClose();

        const link = this.getStickersLink(StickerStore.stickerSet);
        if (!link) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateStickerSet',
            stickerSet: null
        });

        const inputMessageContent = {
            '@type': 'inputMessageText',
            text: {
                '@type': 'formattedText',
                text: link,
                entities: null
            },
            disable_web_page_preview: false,
            clear_draft: false
        };

        forward(inputMessageContent);
    };

    render() {
        const { t, className } = this.props;
        const { anchorEl } = this.state;

        return (
            <>
                <IconButton
                    className={className}
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
    withTranslation(),
    withSnackbar
);

export default enhance(ShareStickerSetButton);
