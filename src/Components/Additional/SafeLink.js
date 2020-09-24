/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import { openChat } from '../../Actions/Client';
import { modalManager } from '../../Utils/Modal';
import { getDecodedUrl, getHref, isUrlSafe } from '../../Utils/Url';
import MessageStore from '../../Stores/MessageStore';
import OptionStore from '../../Stores/OptionStore';
import TdLibController from '../../Controllers/TdLibController';
import './SafeLink.css';

class SafeLink extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    static getDerivedStateFromProps(props, state) {
        const { displayText, mail, url } = props;

        if (state.prevUrl !== url || state.prevDisplayText !== displayText) {
            return {
                prevUrl: url,
                prevDisplayText: displayText,
                safe: isUrlSafe(displayText, url),
                decodedUrl: getDecodedUrl(url, mail),
                href: getHref(url, mail),
                confirm: false
            };
        }

        return null;
    }

    handleClick = event => {
        event.preventDefault();
        event.stopPropagation();

        this.setState({ confirm: true });
    };

    handleDialogClick = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    handleClose = () => {
        this.setState({ confirm: false });
    };

    handleDone = event => {
        this.handleClose();

        const { url, onClick } = this.props;
        if (!url) return;

        if (onClick) {
            onClick(event);
        } else {
            const newWindow = window.open();
            newWindow.opener = null;
            newWindow.location = url;
        }
    };

    isTelegramLink(url) {
        if (!url) return false;

        const lowerCaseUrl = url
            .toLowerCase()
            .replace('https://', '')
            .replace('http://', '');

        const tMeUrl = OptionStore.get('t_me_url')
            .value
            .toLowerCase()
            .replace('https://', '')
            .replace('http://', '');

        return lowerCaseUrl.startsWith('t.me/') || lowerCaseUrl.startsWith('tg://') || lowerCaseUrl.startsWith(tMeUrl);
    }

    isAddStickersLink(url) {
        if (!url) return false;

        const lowerCaseUrl = url
            .toLowerCase()
            .replace('https://', '')
            .replace('http://', '');

        const tMeUrl = OptionStore.get('t_me_url')
            .value
            .toLowerCase()
            .replace('https://', '')
            .replace('http://', '');

        return lowerCaseUrl.startsWith('t.me/addstickers/') || lowerCaseUrl.startsWith(tMeUrl + 'addstickers/');
    }

    handleSafeClick = async event => {
        event.stopPropagation();

        const { onClick, url: href } = this.props;

        if (this.isAddStickersLink(href)) {
            event.preventDefault();
            try {
                const nameIndex = href.toLowerCase().indexOf('/addstickers/') + '/addstickers/'.length;
                if (nameIndex !== -1) {
                    const name = href.substr(nameIndex);

                    const stickerSet = await TdLibController.send({
                        '@type': 'searchStickerSet',
                        name
                    });

                    TdLibController.clientUpdate({
                        '@type': 'clientUpdateStickerSet',
                        stickerSet
                    });
                }
            } catch (error) {
                console.log('[safeLink] messageLinkInfo error', error);
            }

            if (onClick) {
                onClick(event);
            }
        } else if (this.isTelegramLink(href)) {
            event.preventDefault();
            try {
                const messageLinkInfo = await TdLibController.send({
                    '@type': 'getMessageLinkInfo',
                    url: href
                });

                MessageStore.setItems([messageLinkInfo.message]);

                const { chat_id, message } = messageLinkInfo;
                if (chat_id) {
                    openChat(chat_id, message ? message.id : null);
                    return;
                }
            } catch (error) {
                console.log('[safeLink] messageLinkInfo error', error);
            }

            if (onClick) {
                onClick(event);
            }
        }

        if (onClick) {
            event.preventDefault();
            onClick(event);
        }
    };

    render() {
        const { className, children, t, url } = this.props;
        const { confirm, decodedUrl, href, safe } = this.state;

        if (!url) return null;
        if (!decodedUrl) return null;

        return (
            <>
                {safe ? (
                    <a
                        className={className}
                        href={href}
                        title={decodedUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={this.handleSafeClick}>
                        {children || url}
                    </a>
                ) : (
                    <>
                        <a className={className} title={decodedUrl} onClick={this.handleClick}>
                            {children || url}
                        </a>
                        {confirm && (
                            <Dialog
                                manager={modalManager}
                                transitionDuration={0}
                                open={confirm}
                                onClose={this.handleClose}
                                onClick={this.handleDialogClick}
                                aria-labelledby='confirm-dialog-title'>
                                <DialogTitle id='confirm-dialog-title'>{t('Confirm')}</DialogTitle>
                                <DialogContent classes={{ root: 'safe-link-content-root' }}>
                                    <DialogContentText>{`Open this link?\n\n${decodedUrl}`}</DialogContentText>
                                </DialogContent>
                                <DialogActions>
                                    <Button onClick={this.handleClose}>{t('Cancel')}</Button>
                                    <Button onClick={this.handleDone} color='primary'>
                                        {t('Open')}
                                    </Button>
                                </DialogActions>
                            </Dialog>
                        )}
                    </>
                )}
            </>
        );
    }
}

SafeLink.propTypes = {
    url: PropTypes.string.isRequired,
    displayText: PropTypes.string,
    mail: PropTypes.bool,
    onClick: PropTypes.func
};

export default withTranslation()(SafeLink);
