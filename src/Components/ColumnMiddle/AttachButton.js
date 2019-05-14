/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core/styles';
import AttachFileIcon from '@material-ui/icons/AttachFile';
import IconButton from '@material-ui/core/IconButton';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import PhotoIcon from '@material-ui/icons/Photo';
import PollIcon from '@material-ui/icons/Poll';
import { ANIMATION_DURATION_300MS } from '../../Constants';

const styles = {
    iconButton: {
        margin: '8px 0'
    }
};

class AttachButton extends React.Component {
    state = {
        anchorEl: null
    };

    handleMenuClick = event => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleAttachPhoto = () => {
        this.handleMenuClose();

        const { onAttachPhoto } = this.props;
        if (!onAttachPhoto) return;

        setTimeout(() => onAttachPhoto(), ANIMATION_DURATION_300MS);
    };

    handleAttachDocument = () => {
        this.handleMenuClose();

        const { onAttachDocument } = this.props;
        if (!onAttachDocument) return;

        setTimeout(() => onAttachDocument(), ANIMATION_DURATION_300MS);
    };

    handleAttachPoll = () => {
        this.handleMenuClose();

        const { onAttachPoll } = this.props;
        if (!onAttachPoll) return;

        setTimeout(() => onAttachPoll(), ANIMATION_DURATION_300MS);
    };

    render() {
        const { classes, t } = this.props;
        const { anchorEl } = this.state;

        return (
            <>
                <IconButton
                    className={classes.iconButton}
                    aria-label='Attach'
                    open={Boolean(anchorEl)}
                    onClick={this.handleMenuClick}>
                    <AttachFileIcon className='inputbox-attach-icon' />
                </IconButton>
                <Menu
                    id='attach-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    onClose={this.handleMenuClose}>
                    <MenuItem onClick={this.handleAttachPhoto}>
                        <ListItemIcon>
                            <PhotoIcon />
                        </ListItemIcon>
                        <ListItemText inset primary={t('AttachPhoto')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleAttachDocument}>
                        <ListItemIcon>
                            <InsertDriveFileIcon />
                        </ListItemIcon>
                        <ListItemText inset primary={t('AttachDocument')} />
                    </MenuItem>
                    <MenuItem onClick={this.handleAttachPoll}>
                        <ListItemIcon>
                            <PollIcon />
                        </ListItemIcon>
                        <ListItemText inset primary={t('Poll')} />
                    </MenuItem>
                </Menu>
            </>
        );
    }
}

AttachButton.propTypes = {
    onAttachDocument: PropTypes.func.isRequired,
    onAttachPhoto: PropTypes.func.isRequired,
    onAttachPoll: PropTypes.func.isRequired
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(AttachButton);
