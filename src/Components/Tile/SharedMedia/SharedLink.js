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
import Checkbox from '@material-ui/core/Checkbox/';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Popover from '@material-ui/core/Popover';
import Photo from '../../Message/Media/Photo';
import SafeLink from '../../Additional/SafeLink';
import { accentStyles } from '../../Theme';
import { openMedia, substring } from '../../../Utils/Message';
import { getChatShortTitle, isPrivateChat } from '../../../Utils/Chat';
import { forwardMessages, openChat } from '../../../Actions/Client';
import punycode from '../../../Utils/Punycode';
import MessageStore from '../../../Stores/MessageStore';
import TdLibController from '../../../Controllers/TdLibController';
import './SharedLink.css';

const styles = theme => ({
    ...accentStyles(theme)
});

class SharedLink extends React.Component {
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

    isValidEntityType(type) {
        if (!type) return false;

        return (
            type.type['@type'] === 'textEntityTypeUrl' ||
            type.type['@type'] === 'textEntityTypeTextUrl' ||
            type.type['@type'] === 'textEntityTypeEmailAddress'
        );
    }

    getTitleFromUrl(url) {
        try {
            url = url.startsWith('http') ? url : 'http://' + url;
            const decodedUrl = decodeURI(url);

            const hostname = new URL(decodedUrl).hostname.split('.');
            const domain = hostname.length >= 2 ? hostname[hostname.length - 2] : new URL(decodedUrl).hostname;

            console.log('getTitleFromUrl', punycode);

            return punycode.ToUnicode(domain);
        } catch (error) {
            console.error('url: ' + url + '\n' + error);
        }

        return null;
    }

    render() {
        const { chatId, classes, messageId, webPage, showOpenMessage, t } = this.props;
        const { contextMenu, left, top, openDeleteDialog, revoke } = this.state;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { can_be_forwarded, can_be_deleted_only_for_self, can_be_deleted_for_all_users } = message;
        const count = 1;

        let content = null;
        let { display_url, description, photo, title, url } = webPage || {
            title: '',
            description: '',
            photo: null,
            url: ''
        };
        if (webPage) {
            title = title || this.getTitleFromUrl(url);

            content = (
                <SafeLink className='shared-link-url' url={url}>
                    {display_url}
                </SafeLink>
            );
        } else {
            const { text } = message.content;
            if (text) {
                const { entities } = text;
                if (entities && entities.length > 0) {
                    content = entities.filter(this.isValidEntityType).map(x => {
                        const entityText = substring(text.text, x.offset, x.offset + x.length);
                        let url = entityText;
                        let mail = false;

                        switch (x.type['@type']) {
                            case 'textEntityTypeTextUrl': {
                                const { url: typeUrl } = x.type;
                                if (typeUrl) {
                                    url = typeUrl;
                                }
                                break;
                            }
                            case 'textEntityTypeUrl': {
                                break;
                            }
                            case 'textEntityTypeEmailAddress':
                                mail = true;
                                break;
                        }

                        title = title || this.getTitleFromUrl(url);

                        return (
                            <SafeLink className='shared-link-url' url={url} mail={mail}>
                                {entityText}
                            </SafeLink>
                        );
                    });
                }
            }
        }

        const tileColor = `tile_color_${(Math.abs(title.charCodeAt(0)) % 8) + 1}`;

        return (
            <div className='shared-link' onContextMenu={this.handleContextMenu}>
                <div className={classNames('shared-link-photo', tileColor)}>
                    {title.charAt(0)}
                    {photo && (
                        <Photo
                            displaySize={90}
                            chatId={chatId}
                            messageId={messageId}
                            photo={photo}
                            openMedia={openMedia}
                            showProgress={false}
                            style={{ width: 48, height: 48, position: 'absolute', top: 0, left: 0 }}
                        />
                    )}
                </div>
                <div className='shared-link-content'>
                    {title && <div className='web-page-title'>{title}</div>}
                    {description && <div className='web-page-description'>{description}</div>}
                    {content}
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
                    onMouseDown={e => e.stopPropagation()}>
                    <MenuList classes={{ root: classes.menuListRoot }} onClick={e => e.stopPropagation()}>
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
                    aria-labelledby='delete-dialog-title'>
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

SharedLink.propTypes = {
    chatId: PropTypes.number.isRequired,
    messageId: PropTypes.number.isRequired,
    webPage: PropTypes.object,

    openMedia: PropTypes.func
};

const enhance = compose(
    withStyles(styles, { withTheme: true }),
    withTranslation()
);

export default enhance(SharedLink);
