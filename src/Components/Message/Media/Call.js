/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import IconButton from '@material-ui/core/IconButton';
import CallIcon from '@material-ui/icons/Call';
import { getCallContent } from '../../../Utils/Message';
import LStore from '../../../Stores/LocalizationStore';
import MessageStore from '../../../Stores/MessageStore';
import './Call.css';

class Call extends React.Component {
    render() {
        const { chatId, messageId, call, openMedia, title, meta } = this.props;

        const message = MessageStore.get(chatId, messageId);
        if (!message) return null;

        const { sender, content } = message;

        const callTitle = getCallContent(sender, content);
        const durationString = call.duration > 0 ? LStore.formatCallDuration(Math.floor(call.duration || 0)) : null;

        return (
            <div className={classNames('call', 'document', { 'media-title': title })}>
                <IconButton className='call-button' color='primary' aria-label='Call'>
                    <CallIcon fontSize='large' />
                </IconButton>
                <div className='document-content'>
                    <div className='document-title'>{callTitle}</div>
                    { durationString && (
                        <div className='document-action'>
                            {durationString}
                            {meta}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

Call.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    call: PropTypes.object,
    openMedia: PropTypes.func
};

export default withTranslation()(Call);
