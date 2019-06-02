/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { compose } from 'recompose';
import withStyles from '@material-ui/core/styles/withStyles';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import './ChatDetailsHeader.css';
import { isChannelChat, isPrivateChat } from '../../Utils/Chat';

const styles = {
    leftIconButton: {
        margin: '8px -2px 8px 12px'
    },
    rightIconButton: {
        margin: '8px 12px 8px -2px'
    }
};

class ChatDetailsHeader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { classes, chatId, t, backButton, onClick, onClose } = this.props;

        let info = t('ChatInfo');
        if (isPrivateChat(chatId)) {
            info = t('Info');
        } else if (isChannelChat(chatId)) {
            info = t('ChannelInfo');
        }

        return (
            <div className='header-master'>
                {backButton && (
                    <IconButton className={classes.leftIconButton} onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <div className='header-status grow cursor-pointer' onClick={onClick}>
                    <span className='header-status-content'>{info}</span>
                </div>
                {!backButton && (
                    <IconButton className={classes.rightIconButton} onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                )}
            </div>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(ChatDetailsHeader);
