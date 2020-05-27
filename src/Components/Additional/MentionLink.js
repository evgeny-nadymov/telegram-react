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
import { isGroupChat } from '../../Utils/Chat';
import { modalManager } from '../../Utils/Modal';
import { openChat, openUser } from '../../Actions/Client';
import TdLibController from '../../Controllers/TdLibController';
import './MentionLink.css';

class MentionLink extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    static getDerivedStateFromProps(props, state) {
        const { userId, username } = props;

        if (state.prevUserId !== userId || state.prevUsername !== username) {
            return {
                prevUserId: userId,
                prevUsername: username,
                error: false
            };
        }

        return null;
    }

    handleClick = async event => {
        event.stopPropagation();
        event.preventDefault();

        const { userId, username, popup } = this.props;
        if (userId) {
            openUser(userId, popup);
        } else if (username) {
            const chat = await TdLibController.send({
                '@type': 'searchPublicChat',
                username
            }).catch(() => {
                this.setState({ error: true });
            });

            if (chat) {
                if (isGroupChat(chat.id)) {
                    openChat(chat.id, null, false);
                } else {
                    openChat(chat.id, null, popup);
                }
            }
        }
    };

    handleClose = () => {
        this.setState({ error: false });
    };

    handleDialogClick = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    render() {
        const { children, t, title, username } = this.props;
        const { error } = this.state;

        return (
            <>
                <a title={title} onClick={this.handleClick}>
                    {children}
                </a>
                {error && (
                    <Dialog
                        manager={modalManager}
                        transitionDuration={0}
                        open={true}
                        onClose={this.handleClose}
                        onClick={this.handleDialogClick}
                        aria-labelledby='confirm-dialog-title'>
                        <DialogTitle id='confirm-dialog-title'>{t('Error')}</DialogTitle>
                        <DialogContent classes={{ root: 'safe-link-content-root' }}>
                            <DialogContentText>{`Can't find username ${username}.`}</DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={this.handleClose}>{t('Ok')}</Button>
                        </DialogActions>
                    </Dialog>
                )}
            </>
        );
    }
}

MentionLink.propTypes = {
    userId: PropTypes.number,
    username: PropTypes.string,
    title: PropTypes.string,
    popup: PropTypes.bool
};

MentionLink.defaultProps = {
    popup: true
};

export default withTranslation()(MentionLink);
