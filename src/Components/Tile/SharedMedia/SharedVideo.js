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
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox/';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import { PHOTO_SIZE, PHOTO_THUMBNAIL_SIZE, THUMBNAIL_BLURRED_SIZE_90 } from '../../../Constants';
import { forwardMessages, openChat } from '../../../Actions/Client';
import { getFileSize, getSrc } from '../../../Utils/File';
import { getDurationString, getSize } from '../../../Utils/Common';
import { getChatShortTitle, isPrivateChat } from '../../../Utils/Chat';
import { isBlurredThumbnail } from '../../../Utils/Media';
import FileStore from '../../../Stores/FileStore';
import MessageStore from '../../../Stores/MessageStore';
import TdLibController from '../../../Controllers/TdLibController';
import './SharedVideo.css';

const styles = theme => ({
    sharedPhotoContent: {
        // backgroundColor: theme.palette.type === 'dark' ? theme.palette.background.paper : theme.palette.background.default
    }
});

class SharedVideo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            contextMenu: false,
            left: 0,
            top: 0,
            openDeleteDialog: false,
            revoke: false
        };
    }

    componentDidMount() {
        FileStore.on('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoThumbnailBlob', this.onClientUpdateVideoThumbnailBlob);
    }

    onClientUpdateVideoThumbnailBlob = update => {
        const { thumbnail } = this.props.video;
        const { fileId } = update;

        if (!thumbnail) return;

        if (thumbnail.photo && thumbnail.photo.id === fileId) {
            this.forceUpdate();
        }
    };

    handleOpenMessage = event => {
        this.handleCloseContextMenu(event);

        const { chatId, messageId } = this.props;

        openChat(chatId, messageId);
    };

    handleForward = event => {
        this.handleCloseContextMenu(event);

        const { chatId, messageId } = this.props;

        forwardMessages(chatId, [messageId]);
    };

    handleDelete = event => {
        this.handleCloseContextMenu(event);

        const { chatId, messageId } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { can_be_deleted_for_all_users } = message;

        this.setState({
            openDeleteDialog: true,
            canBeDeletedForAllUsers: can_be_deleted_for_all_users,
            revoke: can_be_deleted_for_all_users
        });
    };

    handleContextMenu = async event => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const { contextMenu } = this.state;

        if (contextMenu) {
            this.setState({ contextMenu: false });
        } else {
            const left = event.clientX;
            const top = event.clientY;

            this.setState({
                contextMenu: true,
                left,
                top
            });
        }
    };

    handleCloseContextMenu = event => {
        if (event) {
            event.stopPropagation();
        }

        this.setState({ contextMenu: false });
    };

    handleRevokeChange = () => {
        this.setState({ revoke: !this.state.revoke });
    };

    handleCloseDelete = () => {
        this.setState({ openDeleteDialog: false });
    };

    handleDeleteContinue = () => {
        const { chatId, messageId } = this.props;
        const { revoke } = this.state;

        this.handleCloseDelete();

        TdLibController.send({
            '@type': 'deleteMessages',
            chat_id: chatId,
            message_ids: [messageId],
            revoke: revoke
        });
    };

    render() {
        const { chatId, messageId, classes, openMedia, style, showOpenMessage, t } = this.props;
        const { thumbnail, video, width, height, duration } = this.props.video;
        const { contextMenu, left, top, openDeleteDialog, revoke } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { can_be_forwarded, can_be_deleted_only_for_self, can_be_deleted_for_all_users } = message;
        const count = 1;

        const thumbSrc = getSrc(thumbnail ? thumbnail.photo : null);
        const isBlurred = isBlurredThumbnail(thumbnail, THUMBNAIL_BLURRED_SIZE_90);

        return (
            <div className='shared-photo' style={style} onClick={openMedia} onContextMenu={this.handleContextMenu}>
                <div className='shared-video-wrapper'>
                    <div
                        className={classNames('shared-video-content', { 'media-blurred': isBlurred })}
                        style={{ backgroundImage: `url(${thumbSrc})` }}
                    />
                    <div className='shared-video-meta'>{getDurationString(duration)}</div>
                </div>
                <Popover
                    open={contextMenu}
                    onClose={this.handleCloseContextMenu}
                    anchorReference='anchorPosition'
                    anchorPosition={{ top, left }}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left'
                    }}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}>
                    <MenuList classes={{ root: classes.menuListRoot }}>
                        {showOpenMessage && <MenuItem onClick={this.handleOpenMessage}>{t('GoToMessage')}</MenuItem>}
                        {can_be_forwarded && <MenuItem onClick={this.handleForward}>{t('Forward')}</MenuItem>}
                        {(can_be_deleted_only_for_self || can_be_deleted_for_all_users) && (
                            <MenuItem onClick={this.handleDelete}>{t('Delete')}</MenuItem>
                        )}
                    </MenuList>
                </Popover>
                <Dialog
                    transitionDuration={0}
                    open={openDeleteDialog}
                    onClose={this.handleCloseDelete}
                    aria-labelledby='delete-dialog-title'
                    onClick={e => e.stopPropagation()}>
                    <DialogTitle id='delete-dialog-title'>Confirm</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {count === 1
                                ? 'Are you sure you want to delete 1 message?'
                                : `Are you sure you want to delete ${count} messages?`}
                        </DialogContentText>
                        {can_be_deleted_for_all_users && (
                            <FormControlLabel
                                control={
                                    <Checkbox checked={revoke} onChange={this.handleRevokeChange} color='primary' />
                                }
                                label={
                                    isPrivateChat(chatId) ? `Delete for ${getChatShortTitle(chatId)}` : 'Delete for all'
                                }
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleCloseDelete} color='primary'>
                            Cancel
                        </Button>
                        <Button onClick={this.handleDeleteContinue} color='primary'>
                            Ok
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

SharedVideo.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    video: PropTypes.object.isRequired,
    showOpenMessage: PropTypes.bool.isRequired,
    openMedia: PropTypes.func,

    size: PropTypes.number,
    thumbnailSize: PropTypes.number,
    style: PropTypes.object
};

SharedVideo.defaultProps = {
    size: PHOTO_SIZE,
    thumbnailSize: PHOTO_THUMBNAIL_SIZE
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(SharedVideo);
