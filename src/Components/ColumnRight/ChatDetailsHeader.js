/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ArrowBackIcon from '../../Assets/Icons/Back';
import CloseIcon from '../../Assets/Icons/Close';
import { isChannelChat, isPrivateChat } from '../../Utils/Chat';
import './ChatDetailsHeader.css';

class ChatDetailsHeader extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { chatId, t, backButton, onClick, onClose } = this.props;

        let info = t('ChatInfo');
        if (isPrivateChat(chatId)) {
            info = t('Info');
        } else if (isChannelChat(chatId)) {
            info = t('ChannelInfo');
        }

        return (
            <div className='header-master'>
                {backButton && (
                    <IconButton className='header-left-button' onClick={onClose}>
                        <ArrowBackIcon />
                    </IconButton>
                )}
                <div className='header-status grow cursor-pointer' onClick={onClick}>
                    <span className='header-status-content'>{info}</span>
                </div>
                {!backButton && (
                    <IconButton className='header-right-button' onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                )}
            </div>
        );
    }
}

export default withTranslation()(ChatDetailsHeader);
